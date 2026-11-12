"""JSON stdin/stdout CLI suitable for an agent subprocess."""

import argparse
import csv
import io
import json
import os
from pathlib import Path
import sys
import tempfile

from .api import reconstruct, validate
from .inputs import InputError


def _write(path, content, overwrite):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and not overwrite:
        raise InputError("Output already exists; use --overwrite to replace it.", str(path), "output_exists")
    if not overwrite:
        # Exclusive creation prevents accidental overwrites, including races.
        with path.open("x", encoding="utf-8", newline="") as f:
            f.write(content)
        return
    fd, temporary = tempfile.mkstemp(prefix=".kmscribe-", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as f:
            f.write(content)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def main(argv=None):
    # UTF-8 is important for arm names under Windows shells.
    for stream in (sys.stdin, sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="KM-PoPiGo annotations → reconstructed IPD (no image recognition).")
    parser.add_argument("input", help="Input JSON path, or - for JSON on stdin")
    parser.add_argument("--output", help="Result JSON path; default: stdout")
    parser.add_argument("--csv", help="Also export combined IPD CSV")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--validate", action="store_true", help="Validate/normalize only")
    parser.add_argument("--seed", type=int)
    parser.add_argument("--population-size", type=int)
    parser.add_argument("--patience", type=int)
    parser.add_argument("--max-generations", type=int)
    parser.add_argument("--max-seconds", type=float)
    parser.add_argument("--no-time-limit", action="store_true", help="Use iteration limits for reproducible runs")
    parser.add_argument("--restarts", type=int)
    parser.add_argument("--censoring-strategy", choices=("uniform", "marked_window"))
    parser.add_argument("--loss-style", choices=("local", "paper"))
    args = parser.parse_args(argv)
    try:
        if args.validate and args.csv:
            raise InputError("--csv is not available with --validate.", "--csv")
        outputs = [Path(p).resolve() for p in (args.output, args.csv) if p]
        if len(outputs) != len(set(outputs)):
            raise InputError("JSON and CSV outputs must use different paths.", "output")
        if args.input != "-" and Path(args.input).resolve() in outputs:
            raise InputError("An output must not overwrite the input file.", "output")
        for p in outputs:
            if p.exists() and not args.overwrite:
                raise InputError("Output already exists; use --overwrite.", str(p), "output_exists")
        data = json.loads(sys.stdin.read()) if args.input == "-" else args.input
        options = {k: v for k, v in vars(args).items() if k in {
            "seed", "population_size", "patience", "max_generations", "max_seconds", "restarts", "censoring_strategy", "loss_style"
        } and v is not None}
        if args.no_time_limit:
            options["max_seconds"] = None
        result = validate(data, **options) if args.validate else reconstruct(data, **options)
        if args.csv:
            content = io.StringIO(newline="")
            writer = csv.DictWriter(content, fieldnames=["arm_id", "label", "subject_id", "time", "status"])
            writer.writeheader()
            writer.writerows(result["ipd"])
            _write(args.csv, content.getvalue(), args.overwrite)
        encoded = json.dumps(result, ensure_ascii=False, allow_nan=False, indent=2) + "\n"
        if args.output:
            _write(args.output, encoded, args.overwrite)
            print(json.dumps({"status": result["status"], "output": str(Path(args.output).resolve()),
                              "csv": str(Path(args.csv).resolve()) if args.csv else None}, ensure_ascii=False))
        else:
            sys.stdout.write(encoded)
        # 0 = complete & passed, 2 = invalid request, 3 = completed but review needed.
        return 3 if result["status"] == "needs_review" else 0
    except (InputError, OSError, ValueError) as exc:
        detail = exc.as_dict() if isinstance(exc, InputError) else {
            "code": "io_or_json_error", "field": "input/output", "message": str(exc)}
        print(json.dumps({"status": "error", "error": detail}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
