# DROPi — GitHub Planning Materialization: Optimization Report

> **Branch:** `copilot/create-github-planning-materialization`
> **Date:** 2026-08-02
> **Scope:** `scripts/materialize_github_planning.py` performance analysis and optimization

---

## 1. Observed Symptom

APPLY #2 (idempotency run) with ~228 existing GitHub issues consumed more than 20 minutes of CPU
and never completed.  APPLY #1 (initial creation) had succeeded.

---

## 2. Root-Cause Analysis

Three compounding bugs created an **O(N²)** cascade of GitHub API calls where N = number of plan
issues.

### Bug A — Body Comparison Ignores Managed-Links Section (Critical)

**Location:** `GitHubClient.ensure_issue_state`, former line 522.

```python
# BEFORE (broken)
if current_body != body:
    payload["body"] = body
```

After APPLY #1 every issue body stored on GitHub equals:

```
<base content>

<!-- dropi-materialization-links:start -->
## GitHub Materialization Links
- REF-001 → #123
…
<!-- dropi-materialization-links:end -->
```

The `body` argument passed into `ensure_issue_state` is always the **stripped** base content
(managed-links section removed).  Because `current_body ≠ body`, every single issue appeared to
need an update on APPLY #2, even when nothing had changed.

**Effect on APPLY #2:**
- 228 spurious `update_issue` calls (one per issue)
- Each call triggered `self.refresh()`, clearing all caches
- The subsequent `get_issues_by_stable_id()` call re-fetched all 228 issues from GitHub (3 API
  pages at 100/page)
- Then the link-update loop detected that all managed-links sections had just been stripped and
  re-applied them — another 228 `update_issue` calls, each again triggering `self.refresh()` and a
  full re-fetch

**Fix:**

```python
# AFTER (correct)
if strip_managed_links(current_body) != body:
    payload["body"] = body
```

### Bug B — `refresh()` After Every Write Clears All Caches

**Location:** `GitHubClient.create_issue`, `update_issue`, `create_or_update_label`,
`create_or_update_milestone`.

Each write operation called `self.refresh()`, which sets all five caches to `None`.  Any
subsequent read (even for a different issue) was forced to re-fetch the entire issues list from
GitHub.

**Effect:** Even with Bug A fixed, a genuine update to a single issue would still trigger a full
re-fetch of all issues before processing the next one.

**Fix:** Replace `self.refresh()` with targeted in-place cache updates:

| Write operation | Old behaviour | New behaviour |
|---|---|---|
| `create_issue` | full refresh | `_add_issue_to_caches(created)` — O(1) append |
| `update_issue` | full refresh | `_update_cached_issue(api_response)` — O(N) linear scan of cache list (single pass, no network) |
| `create_or_update_label` | full refresh | update `_label_cache[name]` entry directly |
| `create_or_update_milestone` | full refresh | update `_milestone_cache[title]` entry directly |

### Bug C — Per-Issue `refresh()` + Full Re-Fetch in Link-Update Loop

**Location:** `materialize_issues`, former lines 722–724.

```python
# BEFORE (broken)
client.update_issue(remote_issue["number"], {"body": desired_body})
client.refresh()                                          # ← clears all caches
refreshed = client.get_issues_by_stable_id()[stable_id]  # ← full re-fetch!
entries_by_id[stable_id]["issue_number"] = refreshed["number"]
```

The `issue_number` cannot change from a body-only PATCH, so the re-fetch was purely wasteful.
With Bug B fixed, `update_issue` now returns the API response and patches the cache; the
`refresh()` + re-fetch were removed entirely.

**Fix:**

```python
# AFTER (correct)
client.update_issue(remote_issue["number"], {"body": desired_body})
entries_by_id[stable_id]["issue_number"] = remote_issue["number"]  # number unchanged
```

---

## 3. Complexity Analysis

### 3.1 Issue Lookup

| Operation | Before | After |
|---|---|---|
| Find issue by stable_id | O(1) via `_issue_map_cache` dict | O(1) — unchanged |
| First population of cache | O(N/100) paginated API calls | O(N/100) — unchanged (only once) |
| Cache invalidation on write | O(N/100) full re-fetch per write | O(N) in-memory linear scan (no network) |

### 3.2 Label Lookup

| Operation | Before | After |
|---|---|---|
| `get_labels().get(name)` | O(1) after first fetch | O(1) — unchanged |
| Cache after write | full re-fetch (network) | direct dict entry update (O(1)) |

### 3.3 Milestone Lookup

| Operation | Before | After |
|---|---|---|
| `get_milestones().get(title)` | O(1) after first fetch | O(1) — unchanged |
| Cache after write | full re-fetch (network) | direct dict entry update (O(1)) |

### 3.4 Duplicate Detection

| Operation | Before | After |
|---|---|---|
| `get_duplicate_stable_ids()` | derived from `_issue_map_cache` build — O(N) once | same — unchanged |
| Invalidation on write | full rebuild via re-fetch | `_duplicate_stable_ids_cache = None`; re-derived on next call (O(N) without network) |

### 3.5 Relationship / Link Resolution (`build_issue_body_with_links`)

| Operation | Before | After |
|---|---|---|
| Build per-issue link body | O(M) where M = referenced IDs | O(M) — unchanged |
| `issue_number_by_id` map | rebuilt after each link update (from re-fetch) | built once at Phase 2 start, never rebuilt |

---

## 4. API Call Count — Before vs After

All numbers are for **APPLY #2 (idempotency run)** with N = 228 plan issues, 3 API pages per
full issues fetch (100/page).

| Phase | Before (API calls) | After (API calls) |
|---|---|---|
| Phase 1 — ensure issue state | 228 (spurious updates) × 1 PATCH + 228 × 3 pages post-refresh = **912** | **0** (all issues already correct) |
| Phase 2 — link updates | 228 (spurious link adds) × 1 PATCH + 228 × 3 pages post-refresh = **912** | **0** (managed-links already present) |
| Phase 2 start — single refresh | 3 pages | 3 pages |
| **Total** | **≈ 1827** | **≈ 3** |

**Speedup factor: ≈ 600×**

---

## 5. Measured Execution Time

The `elapsed_s` and `api_calls` fields are now recorded in the result JSON under
`first_apply.labels`, `first_apply.milestones`, `first_apply.issues.phase_timings`, and
`first_apply.timing`.

Estimated wall-clock times (assuming 1.5 s per GitHub API page, 228 issues, 3 pages/fetch):

| Scenario | Before | After |
|---|---|---|
| APPLY #1 (initial creation, 228 issues) | ~10–15 min | ~10–15 min (unchanged — creates are network-bound) |
| APPLY #2 (idempotency, 228 issues) | **> 20 min** (observed) | **< 15 s** (3 API pages × 1.5 s + in-memory work) |
| APPLY #2 (idempotency, 500 issues) | **> 60 min** (extrapolated O(N²)) | **< 30 s** (O(1) network, O(N) in-memory) |

---

## 6. Expected Runtime on Repositories with > 500 Issues

With the old code, APPLY #2 over 500 issues would require approximately:

```
500 spurious updates × 3 pages × 1.5 s/page  ×  2 phases  ≈  135 minutes
```

With the optimized code:

```
1 initial fetch × 3 pages × 1.5 s/page  +  O(N) in-memory work  ≈  5–10 s
```

The optimization is **asymptotically critical**: the old code was O(N²) in the number of API
calls; the new code is O(1) API calls on a pure-idempotency run.

---

## 7. Changes Summary

### `scripts/materialize_github_planning.py`

| Change | Lines affected |
|---|---|
| Added `import time` | top of file |
| Added `_api_call_count: int = 0` to `__init__` | `GitHubClient.__init__` |
| Added `self._api_call_count += 1` to `_gh()` | `_gh` |
| Added `_add_issue_to_caches()` method | new |
| Added `_update_cached_issue()` method | new |
| Fixed `create_or_update_label` — replace `refresh()` with cache patch | `create_or_update_label` |
| Fixed `create_or_update_milestone` — replace `refresh()` with cache patch, removed re-fetch for number | `create_or_update_milestone` |
| Fixed `create_issue` — replace `refresh()` with `_add_issue_to_caches()` | `create_issue` |
| Fixed `update_issue` — replace `refresh()` with `_update_cached_issue()`, return dict | `update_issue` |
| **Fixed `ensure_issue_state` — compare `strip_managed_links(current_body)` with `body`** | `ensure_issue_state` |
| Fixed `ensure_issue_state` — use `update_issue` return value, remove re-fetch | `ensure_issue_state` |
| Fixed `materialize_issues` Phase 2 — removed per-issue `refresh()` + re-fetch | `materialize_issues` |
| Added `elapsed_s` + `api_calls` to `materialize_labels` result | `materialize_labels` |
| Added `elapsed_s` + `api_calls` to `materialize_milestones` result | `materialize_milestones` |
| Added `phase_timings` + `api_calls` to `materialize_issues` result | `materialize_issues` |
| Added `timing` + `api_calls_total` to `materialize_plan_once` result | `materialize_plan_once` |

### `tests/test_materialize_github_planning.py`

Added `TestOptimization` class (7 new tests):

| Test | What it proves |
|---|---|
| `test_ensure_issue_state_existing_when_body_has_managed_links` | Fix A: body comparison ignores managed links |
| `test_full_idempotency_all_issues_return_existing` | Regression: all 228 issues return "existing" on second run |
| `test_update_issue_patches_cache_without_full_refresh` | Fix B: update_issue does exactly 1 API call |
| `test_create_issue_adds_to_cache_without_full_refresh` | Fix B: create_issue does exactly 1 API call |
| `test_api_call_count_is_bounded_on_idempotency_run` | Benchmark: 0 API calls for N issues when all cached |
| `test_timing_fields_present_in_materialize_plan_once_result` | timing/api_calls_total fields present |
| `test_byte_identical_issue_bodies_across_runs` | Determinism: build_issue_body_with_links is stable |

---

## 8. Idempotency Preservation

The optimized code preserves full idempotency:

- A pure idempotency run (no changes needed) produces **zero writes** to GitHub.
- A run where actual content changed (plan update) still detects and applies the minimum set of
  changes.
- Managed-links sections are handled exclusively by Phase 2; Phase 1 never strips them.
- The single `client.refresh()` at the start of Phase 2 guarantees that issue numbers used for
  cross-reference links are authoritative (fetched fresh from GitHub after all Phase 1 creates).

---

## 9. Determinism Preservation

All hash maps are keyed by stable identifiers (stable_id, label name, milestone title) and built
from lists with deterministic sort orders.  The `materialize_issues` sort key is identical before
and after the optimization.  `build_issue_body_with_links` is a pure function; regression test
`test_byte_identical_issue_bodies_across_runs` verifies its output is stable across repeated
calls with the same inputs.
