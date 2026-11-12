# KM-PoPiGo

KM-PoPiGo is a headless Python implementation of the KM-PoPiGo survival-data reconstruction workflow. It converts manually annotated Kaplan–Meier coordinates and reported constraints into reconstructed individual participant data (IPD), a recalculated Kaplan–Meier curve, optimization diagnostics, and quality checks.

The core package uses only the Python standard library. It requires Python 3.10 or later and does not require a browser, R, NumPy, a network connection, or model inference.

## Scope

Included:

- One or multiple treatment arms per call.
- Canonical data-coordinate input and legacy web-tool JSON input.
- Sample size (N), number of events (E), numbers at risk (R), and visible censoring information (C).
- Reconstructed IPD, combined CSV export, recalculated KM coordinates, summary statistics, loss components, constraint residuals, and warnings.
- Deterministic operation when the input, options, seed, and Python environment are fixed and wall-clock limits are disabled.

Not included:

- Automatic digitization of unannotated PNG or PDF images.
- Image editing, visual model training, synthetic-data generation, or training scripts.
- HR estimation, Cox regression, meta-analysis, or R plotting code.

KM-PoPiGo reconstructs data compatible with the supplied annotations and constraints. It does not uniquely recover the original patient-level observations.

## Installation

From this directory:

```bash
python -m pip install .
```

For development, use `python -m pip install -e .`. The package can also be run directly from this directory without installation.

## Python API

```python
from kmpopigo import reconstruct

result = reconstruct("examples/two_arms.json", seed=7)
ipd = result["ipd"]
quality = result["arms"][0]["quality"]
```

Each IPD row contains `arm_id`, `label`, `subject_id`, `time`, and `status`, where `status=1` denotes an event and `status=0` denotes censoring. Subject identifiers are synthetic within each arm; they are not original patient identifiers.

Use `validate(data)` to normalize and validate input without running optimization.

## Command line

Write a complete JSON result and a combined IPD CSV:

```bash
python -m kmpopigo examples/two_arms.json \
  --seed 7 \
  --output outputs/result.json \
  --csv outputs/ipd.csv
```

Read JSON from standard input and write only the result JSON to standard output:

```bash
python -m kmpopigo -
```

Validate without reconstruction:

```bash
python -m kmpopigo examples/two_arms.json --validate
```

After installation, the `kmpopigo` command provides the same interface.

Exit codes:

- `0`: completed and passed the configured engineering checks.
- `2`: invalid input or file error.
- `3`: output was generated but requires review.

Existing output files are not overwritten unless `--overwrite` is explicitly supplied.

## Canonical input

```json
{
  "arms": [
    {
      "arm_id": "treatment",
      "label": "Treatment",
      "sample_size": 10,
      "number_of_events": 4,
      "time_unit": "month",
      "time_values": [0, 2, 5],
      "survival_probabilities": [1, 0.8, 0.6],
      "end_time": 8,
      "at_risk_table": [[0, 10], [3, 8], [6, 5]],
      "censor_times": [6, 8]
    }
  ],
  "options": {
    "seed": 7,
    "max_seconds": 30,
    "restarts": 1
  }
}
```

Important conventions:

- `time_values` and `survival_probabilities` include `(0, 1)` and the post-event breakpoints. The final follow-up time is supplied separately as `end_time`.
- N is required. E may be omitted or set to `null`; in canonical input, `number_of_events=0` means a known zero-event arm.
- R entries are `[time, count]`, with the count measured immediately before events at that time (`time >= query time` in the reconstructed IPD).
- C contains visible censoring times. Minimum censoring counts can instead be supplied with `min_censoring_counts`.
- A complete two-arm example is available at [`examples/two_arms.json`](examples/two_arms.json).
- The machine-readable field definition is in [`schemas/input.schema.json`](schemas/input.schema.json). Runtime checks additionally enforce geometric and constraint consistency.

## Results and interpretation

Each entry in `result["arms"]` contains:

| Field | Content |
| --- | --- |
| `input` | Normalized coordinates, constraints, and source format |
| `allocation` | Interval censoring counts and breakpoint event counts |
| `loss` | Curve, at-risk, censoring, and total objective components |
| `optimization` | Seed, generations, stopping reason, restarts, and elapsed time |
| `km_curve` | Kaplan–Meier coordinates recalculated from the returned IPD |
| `summary` | N, events, censoring, median survival, and time unit |
| `quality` | Replot error, realized risk-table residuals, censoring deficits, and check status |
| `warnings` | Format conversion, endpoint correction, fallback, and review messages |

`status="passed"` means that the configured engineering checks passed. `status="needs_review"` means that IPD is available but at least one fit, soft-constraint, or budget check requires attention. A small objective value or optimizer convergence alone does not establish that every reported constraint is reproduced.

Default probability and count tolerances are configurable engineering diagnostics, not clinically validated accuracy thresholds.

## Reproducibility

```python
result = reconstruct(
    "examples/two_arms.json",
    seed=7,
    restarts=3,
    max_seconds=None,
    max_generations=100000,
    patience=2000,
)
```

For identical IPD, fix the data, options, seed, and Python environment and disable wall-clock limits. Restarts use `seed`, `seed + 1`, and so on. With a time limit enabled, different machines may stop at different generations.

The default `censoring_strategy="uniform"` places events at annotated breakpoints and distributes censoring times uniformly within intervals. The optional `marked_window` strategy uses the earliest and latest visible censoring marks to constrain placement where possible and records fallbacks otherwise. Neither strategy claims to recover the original censoring times uniquely.

## Tests

```bash
python -m unittest discover -s tests -v
```

See [`VALIDATION.md`](VALIDATION.md) for the release-check scope.

## License

Released under the MIT License. See [`LICENSE`](LICENSE).
