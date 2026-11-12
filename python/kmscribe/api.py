"""One call from validated annotations to multi-arm IPD and diagnostics."""

from dataclasses import asdict

from .engine import Options, optimize, to_ipd, km_curve, quality
from .inputs import load, parse, InputError


ENGINE = {
    "name": "kmscribe-kmpopigo", "version": "0.1.0",
    "objective": "gatool-normalized-tolerance",
    "source": "local gatool/js/single/evaluateFun.js",
    "risk_time_convention": "before events at t; time >= t",
    "ties": "events before censoring",
}


def validate(data, **options):
    """Normalize canonical or web-export input, without running optimization."""
    data = load(data)
    if "options" in data:
        if not isinstance(data["options"], dict):
            raise InputError("options must be an object.", "options")
        options = {**data["options"], **options}
    opt = Options.build(options)
    arms = parse(data)
    return {"status": "valid", "arm_count": len(arms), "arms": [a.as_dict() for a in arms],
            "options": asdict(opt)}


def reconstruct(data, **options):
    """Return JSON-compatible results. Accept an object or a JSON file path.

    Options are explicit keyword arguments; unknown names raise InputError.
    No browser, model calls, network, plotting libraries, or global RNG needed.
    All arms are validated before any optimization begins.
    """
    source = load(data)
    if "options" in source:
        if not isinstance(source["options"], dict):
            raise InputError("options must be an object.", "options")
        options = {**source["options"], **options}
    opt = Options.build(options)
    arms = parse(source)
    results, all_ipd = [], []
    for arm in arms:
        candidate, loss, run = optimize(arm, opt)
        ipd, warnings = to_ipd(arm, candidate, opt.censoring_strategy)
        curve = km_curve(ipd)
        report = quality(arm, candidate, ipd, curve, loss, opt, run)
        median = next((r["time"] for r in curve if r["survival"] <= 0.5), None)
        result = {
            "arm_id": arm.arm_id, "label": arm.label, "status": report["status"],
            "input": arm.as_dict(), "warnings": arm.warnings + warnings,
            "allocation": {"censor_counts": list(candidate[:arm.m + 1]),
                           "event_counts": list(candidate[arm.m + 1:])},
            "loss": loss, "optimization": run, "quality": report,
            "km_curve": curve,
            "summary": {"sample_size": len(ipd), "events": sum(r["status"] for r in ipd),
                        "censored": sum(1 - r["status"] for r in ipd),
                        "median_survival": median, "median_reached": median is not None,
                        "time_unit": arm.time_unit},
        }
        results.append(result)
        all_ipd.extend(ipd)
    return {
        "schema_version": "1.0", "engine": dict(ENGINE), "options": asdict(opt),
        "status": "passed" if all(r["status"] == "passed" for r in results) else "needs_review",
        "arm_count": len(results), "arms": results, "ipd": all_ipd,
        "data_kind": "reconstructed_ipd",
    }
