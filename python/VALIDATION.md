# Validation

Release checked on 2026-11-12 for KM-PoPiGo Python Core 0.1.0.

## Scope

These checks cover the core reconstruction backend only: annotated coordinates and constraints as input, and reconstructed IPD, recalculated KM curves, summaries, loss components, and quality diagnostics as output. They do not evaluate automatic image recognition, visual model training, synthetic-data generation, HR estimation, or clinical accuracy.

## Automated tests

Command:

```bash
python -m unittest discover -s tests -v
```

Observed result with Python 3.12: **10 tests passed**.

Coverage includes:

- Canonical and legacy input normalization.
- Validation failures and unknown options.
- All eight N/E/R/C availability combinations used by the core tests.
- Fixed-seed repeatability and multi-arm reconstruction.
- Zero-event and censoring-window edge cases.
- Time-budget reporting and `needs_review` status.
- CLI standard input, file export, and overwrite protection.

The tests are self-contained and require no external datasets. Passing an input-compatibility or engineering check does not establish reconstruction accuracy for all published curves.

## Example smoke test

Command:

```bash
python -m kmpopigo examples/two_arms.json --seed 7 --no-time-limit \
  --output outputs/result.json --csv outputs/ipd.csv --overwrite
```

Observed result: `status="passed"`, with JSON and CSV output generated successfully.

## Package build

Command:

```bash
python -m pip wheel . --no-deps --no-build-isolation -w dist
```

Observed result: `kmpopigo-0.1.0-py3-none-any.whl` built successfully. The wheel contains the core `kmpopigo` package and license metadata; experimental modules are not included.
