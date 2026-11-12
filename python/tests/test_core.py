import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from kmpopigo import reconstruct, validate, InputError
from kmpopigo.inputs import parse
from kmpopigo.engine import to_ipd, km_curve

ROOT = Path(__file__).resolve().parents[1]


def basic(**changes):
    data = {
        "sample_size": 10,
        "number_of_events": 4,
        "time_values": [0, 2, 5],
        "survival_probabilities": [1, 0.8, 0.6],
        "end_time": 8,
    }
    data.update(changes)
    return data


class CoreTests(unittest.TestCase):
    def test_known_ipd_without_censoring(self):
        data = {
            "sample_size": 4,
            "number_of_events": 4,
            "time_values": [0, 1, 2, 3, 4],
            "survival_probabilities": [1, 0.75, 0.5, 0.25, 0],
            "end_time": 4,
        }
        result = reconstruct(data, max_seconds=None)
        self.assertEqual(result["status"], "passed")
        self.assertEqual(
            [(row["time"], row["status"]) for row in result["ipd"]],
            [(1, 1), (2, 1), (3, 1), (4, 1)],
        )

    def test_seed_repeatability_and_multiple_arms(self):
        options = dict(seed=5, population_size=20, patience=100,
                       max_generations=2000, max_seconds=None)
        one = reconstruct(ROOT / "examples/two_arms.json", **options)
        two = reconstruct(ROOT / "examples/two_arms.json", **options)
        self.assertEqual(one["ipd"], two["ipd"])
        self.assertEqual(len(one["ipd"]), 20)
        self.assertEqual(one["arm_count"], 2)
        self.assertEqual(one["status"], "passed")

    def test_zero_event_plateau(self):
        result = reconstruct(
            {"sample_size": 5, "number_of_events": 0, "time_values": [0],
             "survival_probabilities": [1], "end_time": 10},
            max_seconds=None,
        )
        self.assertEqual(result["status"], "passed")
        self.assertEqual(sum(row["status"] for row in result["ipd"]), 0)
        self.assertIsNone(result["arms"][0]["summary"]["median_survival"])

    def test_missing_events_eight_constraint_combinations(self):
        for events in (None, 4):
            for at_risk in ([], [[0, 10], [3, 8]]):
                for censor_times in ([], [6, 7]):
                    with self.subTest(events=events, at_risk=at_risk,
                                      censor_times=censor_times):
                        result = reconstruct(
                            basic(number_of_events=events, at_risk_table=at_risk,
                                  censor_times=censor_times),
                            population_size=10, max_generations=30,
                            patience=10, max_seconds=None,
                        )
                        self.assertEqual(len(result["ipd"]), 10)
                        json.dumps(result, allow_nan=False)

    def test_invalid_inputs_and_options(self):
        for data in (
            basic(sample_size=0),
            basic(number_of_events=11),
            basic(time_values=[0, 5, 2]),
            basic(survival_probabilities=[1, 0.6, 0.8]),
            basic(at_risk_table=0),
        ):
            with self.subTest(data=data):
                with self.assertRaises(InputError):
                    validate(data)
        with self.assertRaises(InputError):
            reconstruct(basic(), nonexistent_option=1)

    def test_budget_is_reported(self):
        result = reconstruct(basic(), max_seconds=1e-12)
        run = result["arms"][0]["optimization"]["runs"][0]
        self.assertEqual(run["stop_reason"], "time_limit")
        self.assertEqual(result["status"], "needs_review")
        self.assertEqual(len(result["ipd"]), 10)

    def test_marked_window_ties_and_fallback(self):
        arm = parse(basic(censor_times=[2, 4, 8]))[0]
        records, warnings = to_ipd(arm, (1, 3, 2, 2, 2), "marked_window")
        self.assertTrue(warnings)
        self.assertEqual(
            [row["time"] for row in records if row["status"] == 0],
            [1, 2, 3, 4, 8, 8],
        )
        for row in km_curve(records):
            self.assertGreaterEqual(row["survival"], 0)

    def test_soft_risk_objective_requires_output_review(self):
        result = reconstruct(
            {"sample_size": 5, "number_of_events": 0, "time_values": [0],
             "survival_probabilities": [1], "end_time": 10,
             "at_risk_table": [[0, 5], [5, 5]]},
            max_seconds=None,
        )
        self.assertEqual(result["arms"][0]["loss"]["at_risk"], 0)
        self.assertEqual(result["status"], "needs_review")

    def test_legacy_web_input(self):
        record = {
            "posList": [[20, 20], [50, 40], [80, 40]],
            "zero": {"x": 0, "y": 100}, "maxY": {"x": 100, "y": 0},
            "maxYtime": "10", "total": "10", "events": "4",
            "censorPointList": [[60, 40], [80, 40]], "groupname": "Legacy",
            "timeseq": "3", "atrisk": "10 8 6",
        }
        arm = parse(record)[0]
        self.assertEqual(arm.times, [0, 2, 5])
        self.assertEqual(arm.probabilities, [1, 0.8, 0.6])
        self.assertEqual(arm.censor_min, [0, 0, 2])

    def test_cli_stdin_output_and_overwrite_guard(self):
        def call(*args, payload=None):
            return subprocess.run(
                [sys.executable, "-m", "kmpopigo", *args],
                input=json.dumps(payload) if payload is not None else None,
                capture_output=True, text=True, encoding="utf-8", cwd=ROOT,
            )

        valid = call("-", "--validate", payload=basic())
        self.assertEqual(valid.returncode, 0, valid.stderr)
        self.assertEqual(json.loads(valid.stdout)["status"], "valid")
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "result.json"
            first = call("-", "--output", str(output), payload=basic())
            self.assertEqual(first.returncode, 0, first.stderr)
            second = call("-", "--output", str(output), payload=basic())
            self.assertEqual(second.returncode, 2)
            error = json.loads(second.stderr)["error"]
            self.assertEqual(error["code"], "output_exists")


if __name__ == "__main__":
    unittest.main()
