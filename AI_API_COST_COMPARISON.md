# AI API Comparison and Cost Planning (WAR)

## Goal
Select a low-cost AI API setup for WAR report generation (Monthly, Annual, Resume) without changing app code yet.

## Agreed Operating Limits
- Max input size (post-filter/prompt payload): **25,000 characters**
- Max output tokens:
  - Monthly: **900**
  - Annual: **1,200**
  - Resume: **1,200**
- Use cache key: `hash(template + scope + payload)`
- Add budget alert + usage logging from day one

---

## Provider Comparison Template

> Fill this table using each provider's current pricing page (prices change over time).

| Provider | Model Tier | Input Cost | Output Cost | Context Window | Best Use | Notes |
|---|---|---:|---:|---:|---|---|
| OpenAI | Mini | TBD | TBD | TBD | Default monthly/annual | Good docs + broad ecosystem |
| Anthropic | Haiku/Sonnet tier | TBD | TBD | TBD | Long-form annual/resume | Strong writing quality |
| Google | Flash tier | TBD | TBD | TBD | Cost-sensitive bulk runs | Good speed/price balance |
| Other | Budget model | TBD | TBD | TBD | Backup/failover | Verify quality before rollout |

---

## Monthly Budget Estimator

Use this quick formula:

`Estimated monthly cost = Σ(run_count_by_type × avg_cost_per_run_by_type)`

### Suggested starting assumptions
- 40 runs/month total
  - 28 Monthly
  - 10 Annual
  - 2 Resume
- Cache hit target: 30%+
- One-pass generation default (no automatic second pass)

### Run-cost worksheet

| Report Type | Runs/Month | Avg Input Size (chars) | Avg Output Tokens | Model | Est. Cost/Run | Est. Monthly |
|---|---:|---:|---:|---|---:|---:|
| Monthly | 28 | TBD | 900 | Mini | TBD | TBD |
| Annual | 10 | TBD | 1200 | Mini/Standard | TBD | TBD |
| Resume | 2 | TBD | 1200 | Mini/Standard | TBD | TBD |
| **Total** | **40** |  |  |  |  | **TBD** |

---

## Payload Safety Rules (No Code Yet)

Before API calls are added, keep these rules in the design:

1. Hard cap payload at **25,000 chars**.
2. If payload exceeds cap, stop and ask user to narrow scope.
3. Prefer scoped runs (filtered/month) over all-history by default.
4. Enforce output token caps server-side.
5. Retry at most once on transient errors.
6. Cache responses for repeated prompt/scope combinations.

---

## Security and Deployment Notes

- Never expose provider API keys in frontend JavaScript.
- Use a serverless proxy endpoint with environment variables.
- Log request size, response size, and model used.
- Set provider-side spend threshold and alerts.

---

## Decision Checklist

- [ ] Pick primary provider/model for default runs
- [ ] Pick backup provider/model
- [ ] Confirm context window supports 25,000-char payload + prompt overhead
- [ ] Set monthly spend cap
- [ ] Define cache retention (24h, 72h, or 7d)
- [ ] Define success metrics (cost/run, user satisfaction, rerun rate)

---

## Recommendation (Start Here)

1. Start with one mini-tier model and strict caps.
2. Validate output quality on 10 real monthly prompts.
3. Expand to annual/resume only after cost per run is stable.
4. Add backup provider only if reliability or quality requires it.
