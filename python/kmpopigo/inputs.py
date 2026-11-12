"""Strict data-coordinate inputs and adapters for both local web JSON formats."""

from __future__ import annotations

import bisect
import json
import math
from dataclasses import dataclass, field
from decimal import Decimal, localcontext, ROUND_HALF_UP
from pathlib import Path
from typing import Any


class InputError(ValueError):
    def __init__(self, message: str, field: str = "input", code: str = "invalid_input"):
        super().__init__(message)
        self.field = field
        self.code = code

    def as_dict(self):
        return {"code": self.code, "field": self.field, "message": str(self)}


def number(value, name):
    if isinstance(value, bool) or value is None:
        raise InputError("Expected a finite number.", name)
    try:
        result = float(value)
    except (TypeError, ValueError, OverflowError):
        raise InputError("Expected a finite number.", name) from None
    if not math.isfinite(result):
        raise InputError("NaN and infinity are not allowed.", name)
    return result


def integer(value, name, minimum=0):
    result = number(value, name)
    if not result.is_integer() or result < minimum:
        raise InputError(f"Expected an integer >= {minimum}.", name)
    return int(result)


def array(value, name):
    if not isinstance(value, (list, tuple)):
        raise InputError("Expected an array.", name)
    return value


def pair(value, name):
    if isinstance(value, dict):
        value = [value.get("x"), value.get("y")]
    value = array(value, name)
    if len(value) != 2:
        raise InputError("Expected two coordinates.", name)
    return [number(v, name) for v in value]


def _js_fixed(value, digits):
    """Match Number.toFixed on the underlying binary float, including ties."""
    if not math.isfinite(value):
        raise InputError("Axis mapping overflowed; check calibration.", "coordinate_origin")
    with localcontext() as ctx:
        ctx.prec = 350
        return float(Decimal.from_float(value).quantize(Decimal(1).scaleb(-digits), rounding=ROUND_HALF_UP))


@dataclass
class Arm:
    arm_id: str
    label: str
    sample_size: int
    number_of_events: int | None
    times: list[float]  # start + event breakpoints; endpoint is separate
    probabilities: list[float]
    end_time: float
    at_risk: list[tuple[float, int]]
    censor_times: list[float]
    censor_min: list[int]  # includes final censoring interval
    probability_axis_span: float = 1.0
    time_unit: str = "unspecified"
    source_format: str = "canonical"
    warnings: list[str] = field(default_factory=list)

    @property
    def m(self):
        return len(self.times) - 1

    def as_dict(self):
        return {
            "arm_id": self.arm_id, "label": self.label,
            "sample_size": self.sample_size, "number_of_events": self.number_of_events,
            "time_values": self.times, "survival_probabilities": self.probabilities,
            "end_time": self.end_time, "time_unit": self.time_unit,
            "at_risk_table": [list(x) for x in self.at_risk],
            "censor_times": self.censor_times, "min_censoring_counts": self.censor_min,
            "probability_axis_span": self.probability_axis_span,
            "source_format": self.source_format, "warnings": self.warnings,
        }


def load(data):
    if isinstance(data, (str, Path)):
        try:
            data = json.loads(Path(data).read_text(encoding="utf-8-sig"))
        except (OSError, ValueError) as exc:
            raise InputError(f"Cannot read JSON: {exc}", "input_path") from None
    if not isinstance(data, dict):
        raise InputError("Expected a JSON object or a path to a JSON file.")
    return data


def _legacy(data):
    old = "posList" in data
    keys = {
        "points": "posList" if old else "key_point_coordinates",
        "censors": "censorPointList" if old else "censoring_time_coordinates",
        "origin": "zero" if old else "coordinate_origin",
        "limit": "maxY" if old else "axis_limit_coordinates",
        "xmax": "maxYtime" if old else "time_axis_max_scale",
        "label": "groupname" if old else "group_name",
        "n": "total" if old else "sample_size",
        "e": "events" if old else "number_of_events",
        "interval": "timeseq" if old else "at_risk_time_interval",
        "risk": "atrisk" if old else "at_risk_numbers",
    }
    origin = pair(data.get(keys["origin"]), keys["origin"])
    limit = pair(data.get(keys["limit"]), keys["limit"])
    xmax = number(data.get(keys["xmax"]), keys["xmax"])
    ymax = number(data.get("survival_axis_max_scale", 1), "survival_axis_max_scale")
    ymin = number(data.get("survival_axis_origin_value", 0), "survival_axis_origin_value")
    if ymax != 1:
        raise InputError(
            "This port requires survival S(0)=1. The local web tool also scales its initial "
            "survival by the axis maximum; such transformed curves cannot be represented "
            "as an ordinary KM IPD. Supply verified 0..1 survival data coordinates instead.",
            "survival_axis_max_scale", "unsupported_curve",
        )
    if not 0 <= ymin < ymax or xmax <= 0 or limit[0] <= origin[0] or origin[1] <= limit[1]:
        raise InputError("Invalid axis calibration.", "coordinate_origin")
    points = [pair(p, keys["points"]) for p in array(data.get(keys["points"]), keys["points"])]
    if not points:
        raise InputError("No marked curve points.", keys["points"])
    if any(b[0] < a[0] for a, b in zip(points, points[1:])):
        raise InputError("Pixel points must be ordered left to right.", keys["points"])

    def tx(x):
        # Keep JS operation order: algebraically equivalent expressions can
        # fall on opposite sides of a decimal rounding boundary.
        return _js_fixed(xmax - (limit[0] - x) * (xmax / (limit[0] - origin[0])), 2)

    def py(y):
        return _js_fixed((origin[1] - y) * ((ymax - ymin) / (origin[1] - limit[1])) + ymin, 4)

    warnings = ["legacy_pixel_rounding: time=2 decimals; survival=4 decimals"]
    use = points
    # refreshPoint merges the last segment using 2% of the displayed y span.
    if len(points) >= 2 and abs(points[-1][1] - points[-2][1]) / (origin[1] - limit[1]) < 0.02:
        use = points[:-1]
        if points[-1][1] != points[-2][1]:
            warnings.append("legacy_endpoint_aligned: final change below web 2%-axis threshold")
    events = data.get(keys["e"])
    if events in (None, "", 0, "0"):
        events = None
        warnings.append("legacy_events_missing: web 0/blank means unknown, not confirmed zero")
    risk_text = data.get(keys["risk"], "")
    risk = []
    if risk_text is not None and str(risk_text).strip():
        step = number(data.get(keys["interval"]), keys["interval"])
        if step <= 0:
            raise InputError("Risk-table interval must be positive.", keys["interval"])
        risk = [[i * step, integer(v, keys["risk"])] for i, v in enumerate(str(risk_text).split())]
    result = {
        "arm_id": data.get("arm_id", data.get(keys["label"], "arm_1")),
        "label": data.get(keys["label"], "arm_1"),
        "sample_size": data.get(keys["n"]), "number_of_events": events,
        "time_values": [0.0] + [tx(p[0]) for p in use],
        "survival_probabilities": [1.0] + [py(p[1]) for p in use],
        "end_time": tx(points[-1][0]), "at_risk_table": risk,
        "censor_times": [tx(pair(p, keys["censors"])[0]) for p in array(data.get(keys["censors"], []), keys["censors"])],
        "probability_axis_span": ymax - ymin,
        "time_unit": data.get("time_unit", "unspecified"),
    }
    return result, "legacy_v1" if old else "web_export", warnings


def parse_arm(raw: Any, index: int) -> Arm:
    if not isinstance(raw, dict):
        raise InputError("Each arm must be an object.", f"arms[{index}]")
    source, warnings = "canonical", []
    if "posList" in raw or "key_point_coordinates" in raw:
        raw, source, warnings = _legacy(raw)
    allowed = {"arm_id", "label", "group_name", "time_unit", "sample_size", "number_of_events",
               "time_values", "survival_probabilities", "key_points", "end_time", "at_risk_table",
               "censor_times", "min_censoring_counts", "probability_axis_span", "risk_time_convention",
               "metadata", "options", "schema_version"}
    unknown = set(raw) - allowed
    if unknown:
        raise InputError(f"Unknown arm fields: {', '.join(sorted(unknown))}. Put extra information in metadata.", "input")
    for name in ("arm_id", "label", "group_name", "time_unit"):
        if name in raw and not isinstance(raw[name], str):
            raise InputError("Expected a string.", name)
    label = raw.get("label", raw.get("group_name", raw.get("arm_id", f"arm_{index + 1}")))
    arm_id = raw.get("arm_id", f"arm_{index + 1}")
    if not arm_id.strip():
        raise InputError("arm_id must not be empty.", "arm_id")
    n = integer(raw.get("sample_size"), "sample_size", 1)
    e = raw.get("number_of_events")
    e = None if e is None else integer(e, "number_of_events")
    if e is not None and e > n:
        raise InputError("Events cannot exceed sample size.", "number_of_events")
    end = raw.get("end_time")
    if "key_points" in raw:
        if "time_values" in raw or "survival_probabilities" in raw:
            raise InputError("Use key_points OR time/probability arrays, not both.", "key_points")
        values = array(raw["key_points"], "key_points")
        times, probs = [], []
        for i, item in enumerate(values):
            if isinstance(item, dict):
                t, p = number(item.get("time"), "key_points.time"), number(item.get("survival"), "key_points.survival")
                kind = item.get("type")
                if kind not in (None, "start", "breakpoint", "end"):
                    raise InputError("Unknown key point type.", "key_points.type")
                if kind == "start" and i != 0:
                    raise InputError("Start must be first.", "key_points")
                if kind == "end":
                    if i != len(values) - 1 or not probs or abs(p - probs[-1]) > 1e-10:
                        raise InputError("End must be last and equal the last plateau; include a breakpoint before a terminal drop.", "key_points")
                    if end is not None and number(end, "end_time") != t:
                        raise InputError("Conflicting endpoint times.", "end_time")
                    end = t
                    continue
            else:
                t, p = pair(item, "key_points")
            times.append(t)
            probs.append(p)
        if end is None and times:
            end = times[-1]
            warnings.append("endpoint_inferred: last supplied point is the observation end")
    else:
        times = [number(x, "time_values") for x in array(raw.get("time_values"), "time_values")]
        probs = [number(x, "survival_probabilities") for x in array(raw.get("survival_probabilities"), "survival_probabilities")]
    if not times or len(times) != len(probs):
        raise InputError("Non-empty time and survival arrays must have equal lengths.", "time_values")
    if times[0] != 0 or abs(probs[0] - 1) > 1e-10:
        raise InputError("Ordinary KM requires an explicit start at (0, 1).", "key_points", "unsupported_curve")
    if any(t < 0 for t in times) or any(not 0 <= p <= 1 for p in probs):
        raise InputError("Times must be >=0; survival must be between 0 and 1.", "key_points")
    if end is None:
        raise InputError("Supply end_time separately when using time/probability arrays.", "end_time")
    end = number(end, "end_time")
    if end <= 0 or end < times[-1]:
        raise InputError("end_time must be positive and no earlier than the last point.", "end_time")
    clean_t, clean_p = [times[0]], [probs[0]]
    for t, p, prev_t, prev_p in zip(times[1:], probs[1:], times, probs):
        if t < prev_t or p > prev_p + 1e-10:
            raise InputError("Points must have increasing time and non-increasing survival.", "key_points")
        if abs(p - prev_p) <= 1e-10:
            warnings.append("redundant_plateau_point_removed")
            continue
        if t <= clean_t[-1] or clean_p[-1] == 0:
            raise InputError("Distinct drops need strictly increasing positive times; combine tied events.", "key_points")
        clean_t.append(t)
        clean_p.append(p)
    m = len(clean_t) - 1
    if m > n or (e is not None and m > e) or (m == 0 and e not in (None, 0)):
        raise InputError("Event count/sample size is incompatible with the number of drops.", "number_of_events", "infeasible_constraints")
    if clean_p[-1] == 0 and e == 0:
        raise InputError("A zero-survival curve requires events.", "number_of_events")
    span = number(raw.get("probability_axis_span", 1), "probability_axis_span")
    if not 0 < span <= 1:
        raise InputError("probability_axis_span must be in (0,1].", "probability_axis_span")
    if raw.get("risk_time_convention", "before") != "before":
        raise InputError("Only pre-event at-risk counts are supported; unknown/other conventions need explicit conversion.", "risk_time_convention", "unsupported_convention")
    risks = []
    risk_values = raw.get("at_risk_table")
    for row in array([] if risk_values is None else risk_values, "at_risk_table"):
        row = array(row, "at_risk_table")
        if len(row) != 2:
            raise InputError("Risk rows must be [time, count].", "at_risk_table")
        t, count = number(row[0], "at_risk_table.time"), integer(row[1], "at_risk_table.count")
        if t < 0 or count > n or (t == 0 and count != n) or (t > end and count != 0):
            raise InputError("Risk count/time conflicts with N or observation end.", "at_risk_table", "infeasible_constraints")
        if risks and (t <= risks[-1][0] or count > risks[-1][1]):
            raise InputError("Risk times must increase and counts must not increase.", "at_risk_table")
        risks.append((t, count))
    censor_values = raw.get("censor_times")
    ctimes = sorted(number(t, "censor_times") for t in array([] if censor_values is None else censor_values, "censor_times"))
    if any(t < 0 or t > end for t in ctimes):
        raise InputError("Censor marks must lie in [0,end_time].", "censor_times")
    cmin = [0] * (m + 1)
    for t in ctimes:
        # Event first, then censor at exactly the same time.
        cmin[bisect.bisect_right(clean_t[1:], t)] += 1
    if "min_censoring_counts" in raw and raw["min_censoring_counts"] is not None:
        provided = [integer(v, "min_censoring_counts") for v in array(raw["min_censoring_counts"], "min_censoring_counts")]
        if len(provided) != m + 1:
            raise InputError("min_censoring_counts needs one entry per interval, including the tail.", "min_censoring_counts")
        if any(a < b for a, b in zip(provided, cmin)):
            raise InputError("Censor lower bounds cannot be smaller than supplied visible mark counts.", "min_censoring_counts")
        cmin = provided
    if sum(cmin) > n - (e if e is not None else m):
        raise InputError("Censor lower bounds exceed the available censor count.", "min_censoring_counts", "infeasible_constraints")
    if clean_p[-1] == 0 and cmin[-1] > 0:
        raise InputError("No patients can be censored after survival has reached zero.", "censor_times", "infeasible_constraints")
    if ctimes and any(t in clean_t[1:] for t in ctimes):
        warnings.append("censor_on_breakpoint: assigned after the event, unlike dropped boundary ticks in the web tool")
    return Arm(arm_id, label, n, e, clean_t, clean_p, end, risks, ctimes, cmin, span,
               raw.get("time_unit", "unspecified"), source, list(dict.fromkeys(warnings)))


def parse(data):
    data = load(data)
    if "arms" in data:
        unknown = set(data) - {"arms", "options", "metadata", "schema_version"}
        if unknown:
            raise InputError(f"Unknown batch fields: {', '.join(sorted(unknown))}", "input")
        raw_arms = array(data["arms"], "arms")
        if not raw_arms:
            raise InputError("At least one arm is required.", "arms")
    else:
        raw_arms = [data]
    arms = []
    for i, raw in enumerate(raw_arms):
        try:
            if "arms" in data and isinstance(raw, dict) and "options" in raw:
                raise InputError("Set options at the batch root, not on individual arms.", "options")
            arms.append(parse_arm(raw, i))
        except InputError as exc:
            exc.field = f"arms[{i}].{exc.field}"
            raise
    if len({a.arm_id for a in arms}) != len(arms):
        raise InputError("arm_id values must be unique.", "arms")
    return arms
