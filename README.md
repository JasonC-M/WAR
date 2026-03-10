# WAR (Work Activity Report)

WAR is a browser-first work logging app for tracking tasks, meetings, risks, accolades, requirements, and notes.

It runs locally in your browser and stores data in localStorage unless you explicitly import/export JSON files.

## Current Highlights

- Global **Job Mode** selector with dynamic task categories.
- Optional **Job Mode Filter** toggle for view-level filtering.
- One-click **Load Sample Log Data** button.
- Safer control layout with:
	- **Reset View** (non-destructive)
	- **Delete Displayed Log Entries** (destructive, separated area)
- Dashboard with category chart, key metrics, and drilldown.
- AI prompt generator for monthly/annual/resume workflows.
- Toast feedback for save/load success and error events.

---

## Run Locally

From project root:

```bash
python3 -m http.server 8000
```

Open:

- http://localhost:8000
- http://localhost:8000/index.html

---

## Primary Workflow

1. **Set Job Mode** in the header.
2. **Create entries** using the form on the left.
3. **Filter logs** by keyword + month selector.
4. Use **Reset View** to clear search/drilldown and reset to a practical month target.
5. Use **Delete Displayed Log Entries** only when you intentionally want to delete visible rows.
6. Click **View Dashboard** for chart/metrics and drilldown interactions.
7. Click **AI Report** to copy report prompt text for the active scope.

---

## Sample Data

- The project includes a varied high-volume sample file:
	- `work_log_sample_2y_high_volume.json`
- Use **Load Sample Log Data** for one-click import into browser storage.

---

## Data Storage Keys

- `warSmartLog` - all log entries
- `warSelectedJobMode` - selected job mode
- `warFilterByJobMode` - job mode filter toggle state

---

## AI Cost Planning Files

- `AI_API_COST_COMPARISON.md` - provider comparison and planning checklist
- `AI_API_COST_WORKED_EXAMPLE.md` - worked monthly cost example template
- `ai_cost_calculator.html` - browser calculator for quick pricing estimates

---

## Project Files

- `index.html` - app structure
- `style.css` - UI styles
- `script.js` - app logic, state, filtering, import/export, AI prompt copy
- `config.json` - runtime control text and options
- `config.embed.js` - embedded config fallback
- `ai_config.json` - AI prompt templates
- `chart.js` - chart library
- `work_log_sample_2y_high_volume.json` - sample dataset
