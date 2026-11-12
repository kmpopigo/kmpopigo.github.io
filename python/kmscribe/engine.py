"""Port of gatool's normalized loss and constraint-preserving evolution.

Population layout is (c_0,...,c_m,e_0,...,e_(m-1)); all entries are integers.
The objective follows the *local application*, not the paper's different loss.
"""

from __future__ import annotations

import bisect
import math
import random
import time
from dataclasses import dataclass, asdict
from functools import lru_cache

from .inputs import Arm, InputError, integer, number


@dataclass(frozen=True)
class Options:
    seed: int = 0
    population_size: int = 100
    patience: int = 2000
    max_generations: int = 100000
    max_seconds: float | None = 30.0  # per arm, shared across restarts
    restarts: int = 1
    probability_tolerance: float = 0.01
    count_tolerance: float = 0.02
    censoring_strategy: str = "uniform"
    loss_style: str = "local"  # "local": normalized application loss (default); "paper": manuscript equations (1), (4), (7), (8)

    @classmethod
    def build(cls, options):
        unknown = set(options) - set(cls.__dataclass_fields__)
        if unknown:
            raise InputError(f"Unknown options: {', '.join(sorted(unknown))}", "options")
        vals = asdict(cls())
        vals.update(options)
        for key in ("seed", "population_size", "patience", "max_generations", "restarts"):
            vals[key] = integer(vals[key], f"options.{key}", 0 if key == "seed" else 1)
        if vals["population_size"] < 4 or vals["population_size"] % 2:
            raise InputError("population_size must be even and >=4.", "options.population_size")
        for key in ("probability_tolerance", "count_tolerance", "max_seconds"):
            if key == "max_seconds" and vals[key] is None:
                continue
            vals[key] = number(vals[key], f"options.{key}")
            if vals[key] <= 0:
                raise InputError("Must be positive.", f"options.{key}")
        if vals["censoring_strategy"] not in ("uniform", "marked_window"):
            raise InputError("Choose uniform or marked_window.", "options.censoring_strategy")
        if vals["loss_style"] not in ("local", "paper"):
            raise InputError("Choose local or paper.", "options.loss_style")
        return cls(**vals)


def curve_probabilities(candidate, m):
    c, e = candidate[:m + 1], candidate[m + 1:]
    risk = sum(candidate)
    probabilities = [1.0]
    for i in range(m):
        risk -= c[i] + (e[i - 1] if i else 0)
        if risk <= 0 or e[i] < 1 or e[i] > risk:
            raise ValueError("Invalid candidate risk set.")
        probabilities.append(probabilities[-1] * (risk - e[i]) / risk)
    return probabilities


class Objective:
    def __init__(self, arm: Arm, options: Options):
        self.arm, self.options = arm, options
        self.backward, self.forward = [], []
        risk_times = [r[0] for r in arm.at_risk]
        risk_dict = dict(arm.at_risk)
        # Precompute the original JS nearest-risk-table comparisons.
        current_back = None
        for t in reversed(arm.times[1:]):
            for rt in risk_times:
                if t < rt:
                    break
                current_back = rt
            self.backward.append(risk_dict.get(current_back))
        current_forward = 0
        for t in arm.times[1:]:
            for rt in risk_times[1:]:
                if t < rt:
                    current_forward = rt
                    break
            if t > current_forward:
                break
            self.forward.append(arm.sample_size - risk_dict[current_forward] if current_forward in risk_dict else None)
        self.score = lru_cache(maxsize=8192)(self._score)

    def components(self, candidate):
        if self.options.loss_style == "paper":
            return self._components_paper(candidate)
        a, opt, m = self.arm, self.options, self.arm.m
        ps = curve_probabilities(candidate, m)
        errors = [abs(x - y) for x, y in zip(a.probabilities, ps)]
        probability = (sum(errors) / len(errors) + max(errors)) / (opt.probability_tolerance * a.probability_axis_span)
        risk_penalties = []
        total_back = candidate[m]
        for k, i in enumerate(range(m - 1, -1, -1)):
            total_back += candidate[m + 1 + i]
            bound = self.backward[k]
            if bound is not None and total_back > bound:
                risk_penalties.append(total_back - bound)
            total_back += candidate[i]
        used = 0
        for i, bound in enumerate(self.forward):
            used += candidate[i] + candidate[m + 1 + i]
            if bound is not None and used > bound:
                risk_penalties.append(used - bound)
        risk_loss = (sum(risk_penalties) / len(risk_penalties) / a.sample_size / opt.count_tolerance) if risk_penalties else 0.0
        censor_penalties = [minimum - count for minimum, count in zip(a.censor_min, candidate[:m + 1]) if minimum > count]
        censor_loss = (sum(censor_penalties) / len(censor_penalties) / a.sample_size / opt.count_tolerance) if censor_penalties else 0.0
        return {"curve": probability, "at_risk": risk_loss, "censor": censor_loss,
                "total": probability + risk_loss + censor_loss}

    def _components_paper(self, candidate):
        """Manuscript equations (1), (4), (7), and (8): f = Lcurve + LC/M + LR/(M*J).

        Index mapping: M = m+1; c'_i = candidate[i-1] for i=1..M;
        e'_j = candidate[m+j] for j=1..M-1=m. Lcurve sums breakpoints
        t_1..t_m; the error at t_0 is |1-1|=0, so indexing from 1 is equivalent.
        """
        a, m = self.arm, self.arm.m
        M = m + 1
        ps = curve_probabilities(candidate, m)
        curve = sum(abs(x - y) for x, y in zip(a.probabilities, ps))
        c, e = candidate[:m + 1], candidate[m + 1:]
        lc_raw = sum(max(lo - ci, 0) for lo, ci in zip(a.censor_min, c))
        lc = lc_raw / M if a.censor_min else 0.0
        lr = 0.0
        J = len(a.at_risk)
        if J:
            n = a.sample_size
            # Prefix sums: cump_ce[b] = sum_{l=0}^{b-1}(c[l]+e[l]); cumulative removals before breakpoint t_b.
            cump_ce = [0] * (m + 1)
            cump_c = [0] * (m + 2)
            cump_e = [0] * (m + 1)
            for l in range(m):
                cump_ce[l + 1] = cump_ce[l] + c[l] + e[l]
                cump_c[l + 1] = cump_c[l] + c[l]
                cump_e[l + 1] = cump_e[l] + e[l]
            cump_c[m + 1] = cump_c[m] + c[m]
            c_tot, e_tot = cump_c[m + 1], cump_e[m]
            for tt, nn in a.at_risk:
                for b in range(1, m + 1):
                    if a.times[b] < tt:
                        v = cump_ce[b] - (n - nn)
                        if v > 0:
                            lr += v
                    else:
                        # sum_{l=b}^{m} c[l] + sum_{l=b-1}^{m-1} e[l]
                        rem_from = (c_tot - cump_c[b]) + (e_tot - cump_e[b - 1])
                        v = rem_from - nn
                        if v > 0:
                            lr += v
            lr /= M * J
        return {"curve": curve, "at_risk": lr, "censor": lc,
                "total": curve + lr + lc}

    def _score(self, candidate):
        return self.components(candidate)["total"]


def initialize(arm, rng):
    m, n, e = arm.m, arm.sample_size, arm.number_of_events
    values = [0] * (m + 1) + [1] * m
    if m == 0:
        return (n,)
    if e is not None:
        for _ in range(e - m):
            values[rng.randrange(m + 1, 2 * m + 1)] += 1
        for _ in range(n - e):
            values[rng.randrange(m + 1)] += 1
    else:
        for _ in range(n - m):
            values[rng.randrange(len(values))] += 1
    return tuple(values)


def mutate(candidate, arm, rng):
    m = arm.m
    values = list(candidate)
    index = rng.randrange(len(values))
    limit = values[index] - (1 if index > m else 0)
    if limit <= 0:
        return candidate
    away = 1 if rng.random() < 0.5 else rng.randint(1, limit)
    values[index] -= away
    if arm.number_of_events is not None:
        lo, hi = (0, m + 1) if index <= m else (m + 1, 2 * m + 1)
    else:
        lo, hi = 0, len(values)
    for _ in range(away):
        values[rng.randrange(lo, hi)] += 1
    return tuple(values)


def optimize(arm: Arm, options: Options):
    started = time.monotonic()
    deadline = math.inf if options.max_seconds is None else started + options.max_seconds
    objective = Objective(arm, options)
    best, best_score = None, math.inf
    runs = []
    for restart in range(options.restarts):
        if restart and time.monotonic() >= deadline:
            break
        rng = random.Random(options.seed + restart)
        population = []
        # Always create at least one candidate, then respect the arm time budget.
        for _ in range(options.population_size):
            item = initialize(arm, rng)
            score = objective.score(item)
            population.append((score, item))
            if score < best_score:
                best, best_score = item, score
            if time.monotonic() >= deadline:
                break
        local_score = min(s for s, _ in population)
        stagnant, generations = 0, 0
        reason = "max_generations"
        if local_score == 0:
            reason = "zero_loss"
        elif len(population) < options.population_size or time.monotonic() >= deadline:
            reason = "time_limit"
        elif arm.m == 0:
            reason = "no_event_breakpoints"
        else:
            half = options.population_size // 2
            for generation in range(1, options.max_generations + 1):
                if time.monotonic() >= deadline:
                    reason = "time_limit"
                    break
                record_before = best_score
                parents = rng.sample(population, half)
                children = []
                for _, candidate in parents:
                    child = mutate(candidate, arm, rng)
                    score = objective.score(child)
                    children.append((score, child))
                    if score < best_score:
                        best, best_score = child, score
                population = sorted(population, key=lambda x: x[0])[:half] + children
                new_score = min(s for s, _ in population)
                generations = generation
                if options.loss_style == "paper":
                    # Manuscript convention: stop when the global best is unchanged for patience generations.
                    stagnant = 0 if best_score < record_before else stagnant + 1
                    local_score = best_score
                elif new_score < local_score:
                    local_score, stagnant = new_score, 0
                else:
                    stagnant += 1
                if local_score == 0:
                    reason = "zero_loss"
                    break
                if stagnant >= options.patience:
                    reason = "patience"
                    break
        runs.append({"seed": options.seed + restart, "generations": generations,
                     "stagnant_generations": stagnant, "stop_reason": reason,
                     "best_loss": local_score})
        if best_score == 0:
            break
    return best, objective.components(best), {
        "runs": runs, "elapsed_seconds": time.monotonic() - started,
        "restarts_completed": len(runs), "restarts_requested": options.restarts,
        "evaluations": objective.score.cache_info().misses,
    }


def to_ipd(arm, candidate, strategy="uniform"):
    m = arm.m
    records, warnings = [], []
    for i, count in enumerate(candidate[m + 1:]):
        records.extend({"time": arm.times[i + 1], "status": 1} for _ in range(count))
    windows = [[] for _ in range(m + 1)]
    for t in arm.censor_times:
        windows[bisect.bisect_right(arm.times[1:], t)].append(t)
    for i, count in enumerate(candidate[:m + 1]):
        if not count:
            continue
        lo = arm.times[i]
        hi = arm.times[i + 1] if i < m else arm.end_time
        marked = windows[i]
        if strategy == "marked_window" and marked:
            # Marks at an event time belong after that event. The next event
            # cannot be in this interval; the endpoint is closed for the tail.
            lo, hi = min(marked), max(marked)
            assigned = [(lo + hi) / 2] if count == 1 else [lo + (hi - lo) * j / (count - 1) for j in range(count)]
        else:
            if strategy == "marked_window":
                warnings.append(f"interval_{i}: no visible censor window; uniform fallback")
            denominator = count + 1 if i < m else count
            assigned = [lo + (hi - lo) * (j + 1) / denominator for j in range(count)]
        for t in assigned:
            if i < m and not arm.times[i] <= t < arm.times[i + 1]:
                raise InputError("Time interval is too narrow for floating-point censor assignment.", "time_values", "precision_limit")
            records.append({"time": t, "status": 0})
    records.sort(key=lambda r: (r["time"], -r["status"]))
    return [dict(arm_id=arm.arm_id, label=arm.label, subject_id=i + 1, **r) for i, r in enumerate(records)], warnings


def km_curve(records):
    grouped = {}
    for record in records:
        counts = grouped.setdefault(record["time"], [0, 0])
        counts[0 if record["status"] else 1] += 1
    risk, survival = len(records), 1.0
    result = [{"time": 0.0, "survival": 1.0, "n_at_risk": risk, "events": 0, "censored": 0}]
    for t in sorted(grouped):
        events, censored = grouped[t]
        survival *= (risk - events) / risk
        result.append({"time": t, "survival": survival, "n_at_risk": risk,
                       "events": events, "censored": censored})
        risk -= events + censored
    return result


def quality(arm, candidate, records, curve, loss, options, run):
    curve_times = [r["time"] for r in curve]
    predicted = [curve[max(0, bisect.bisect_right(curve_times, t) - 1)]["survival"] for t in arm.times]
    errors = [abs(p - q) for p, q in zip(predicted, arm.probabilities)]
    rows = []
    record_times = sorted(r["time"] for r in records)
    for t, target in arm.at_risk:
        actual = len(records) - bisect.bisect_left(record_times, t)
        rows.append({"time": t, "reported": target, "reconstructed": actual, "error": actual - target})
    max_risk = max((abs(r["error"]) for r in rows), default=0)
    deficits = [max(0, lower - actual) for lower, actual in zip(arm.censor_min, candidate[:arm.m + 1])]
    candidate_p = curve_probabilities(candidate, arm.m)
    roundtrip = max(abs(a - b) for a, b in zip(candidate_p, predicted))
    event_count = sum(r["status"] for r in records)
    checks = {
        "sample_size_matches": len(records) == arm.sample_size,
        "event_count_matches": arm.number_of_events is None or event_count == arm.number_of_events,
        "curve_within_tolerance": (sum(errors) / len(errors) + max(errors)) <= options.probability_tolerance * arm.probability_axis_span + 1e-12,
        "risk_counts_within_tolerance": max_risk / arm.sample_size <= options.count_tolerance,
        "censor_lower_bounds_satisfied": sum(deficits) == 0,
        "candidate_ipd_roundtrip_matches": roundtrip <= 1e-10,
    }
    flags = ["failed:" + name for name, ok in checks.items() if not ok]
    if run["runs"] and run["runs"][-1]["stop_reason"] in ("time_limit", "max_generations"):
        flags.append("optimization_budget_exhausted")
    if run["restarts_completed"] < run["restarts_requested"] and loss["total"] != 0:
        flags.append("incomplete_restarts")
    return {
        "status": "passed" if not flags else "needs_review", "flags": flags, "checks": checks,
        "metrics": {"curve_mean_absolute_error": sum(errors) / len(errors),
                    "curve_max_absolute_error": max(errors),
                    "candidate_ipd_max_error": roundtrip,
                    "risk_max_absolute_count_error": max_risk,
                    "censor_total_shortfall": sum(deficits)},
        "risk_table_comparison": rows, "censor_shortfalls": deficits,
        "point_comparison": [{"time": t, "target": p, "reconstructed": q}
                             for t, p, q in zip(arm.times, arm.probabilities, predicted)],
        "interpretation": "Engineering diagnostics only; passed does not prove unique recovery or statistical validity.",
    }
