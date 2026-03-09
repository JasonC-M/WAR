# WAR (Work Activity Report) - User Guide

## Introduction

Welcome to the Work Activity Report (WAR) tool. This is a simple, private browser app designed to help you quickly log and organize day-to-day work activities.

WAR runs entirely in your browser, and your log data stays local to your machine unless you export it.

## What's New (February 2026)

- **Global Job Mode:** Job Mode now lives in the top header (to the **left** of **Import from File**).
- **Single-mode behavior:** The selected Job Mode applies consistently across the page, including Dashboard ↔ Log view switching.
- **Persistence:** Job Mode is saved in browser storage and restored automatically on reload.
- **Dynamic categories:** Task category choices are always driven by the currently selected Job Mode.

## Key Features

- **Versatile logging:** Track tasks, meetings, risks, accolades, requirements, and notes.
- **Dynamic filtering:** Filter by keyword, month, year, or rolling 365-day window.
- **Visual dashboard:** View category charts and key metrics with drilldown support.
- **Data portability:** Import/export your full log as JSON.
- **AI-ready summaries:** Build scoped prompt text (filtered/monthly/annual/resume context) from the current view.

---

## How to Use the Application

### 1) Set Job Mode (Global)

Use the **Job Mode** selector in the top header to choose your working context.

- This setting controls available Task categories.
- It persists between sessions in local storage.

### 2) Log an Activity

1. Select a **Log Entry Type**.
2. Fill in the form fields.
3. Click **Add / Update Log Entry**.

### 3) View and Filter

- Use the search box for keyword filtering.
- Use the date filter for month/year/all/rolling-365 views.
- Use dashboard tiles/charts for drilldown into matching entries.

### 4) Use the Dashboard

1. Click **View Dashboard**.
2. Review category chart + key metrics.
3. Click **View Log** to return.

### 5) Generate AI Report Prompt

Click **AI Report**. The app automatically selects scope/template based on the active view/filter state and copies a complete prompt + source log details to your clipboard.

---

## Run Locally

From the project folder:

```bash
python3 -m http.server 8000
```

Then open:

- http://localhost:8000
- http://localhost:8000/index.html

---

## Important: Data Safety

WAR uses browser local storage.

- Logs are stored under `warSmartLog`.
- Global Job Mode is stored under `warSelectedJobMode`.

Because browser data can be cleared, export backups regularly with **Export to File**.

Best practice: export at least weekly (or after major updates).

---

## Project File Overview

- `index.html` - app layout and structure
- `style.css` - visual styling
- `script.js` - behavior, state, filtering, rendering
- `config.json` and `config.embed.js` - UI text and job mode/category configuration
- `ai_config.json` - AI prompt templates
- `chart.js` - charting library
