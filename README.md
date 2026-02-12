# WAR (Work Activity Report) - User Guide

## Introduction

Welcome to the Work Activity Report (WAR) tool! This is a simple, powerful, and private application designed to help you quickly log and organize your daily work activities. It runs entirely in your web browser, meaning **none of your data ever leaves your computer**. This guide will walk you through its features and best practices.

## Key Features

*   **Versatile Logging:** Log everything from daily tasks and meetings to identified risks and client feedback.
*   **Dynamic View:** Instantly filter your log by month or search by any keyword.
*   **Visual Dashboard:** Switch to a dashboard view to see a high-level chart of your work categories and key metrics.
*   **Data Portability:** Easily import and export your entire log to a JSON file for backup and migration.
*   **AI-Ready Summaries:** Generate perfectly formatted prompts for AI assistants to create professional monthly or annual reports in seconds.

---

## How to Use the Application

## Running the App (Dev vs Offline)

### Option A: Run with a local server (recommended)

This app loads editable UI/config from `config.json` and `ai_config.json`, which browsers may block when opening `index.html` directly via `file://`.

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open:

- http://127.0.0.1:8000/index.html

### Option B: Build an offline `dist/` (double-click friendly)

Build a self-contained `dist/` folder that embeds `config.json` and `ai_config.json` into a generated `config.embed.js` (so it can run without fetching).

```bash
python3 tools/build_dist.py
```

Then open `dist/index.html` (or serve `dist/` the same way as Option A).

Note: browser storage behavior can vary for `file://` pages; if you want the most consistent localStorage behavior, use Option A.

### 1. Logging an Activity (The Core Workflow)

This is the primary function of the tool.

1.  **Select Log Entry Type:** Start by choosing the type of activity from the dropdown menu (e.g., "Work/Task Activity," "Meeting," "Risk"). The form below will dynamically change to show the most relevant fields.
2.  **Fill in the Details:** Complete the fields. The date will default to today, but you can change it. For tasks, be sure to select a category and status.
3.  **Add / Update Log Entry:** Click this button to save your entry. It will immediately appear at the top of the "Logged Activities" table.

### 2. Viewing and Filtering Your Log

As you add entries, the table will grow.

*   **Filter by Keyword:** Use the search box at the top right of the table to instantly filter the log. It searches across all details of your entries.
*   **Filter by Month:** Use the month dropdown next to the search box to view entries from a specific month or all time.

### 3. Using the Dashboard

1.  Click the **View Dashboard** button in the header.
2.  The main log view will be replaced by a dashboard containing:
    *   A **bar chart** visualizing your tasks by category.
    *   **Key Metrics** showing a total count for each type of log entry (tasks, meetings, risks, etc.) over all time.
3.  Click the **View Log** button to toggle back to the main logging screen.

### 4. Generating AI Summaries

This tool's most powerful feature is its ability to prepare your data for an AI assistant (like Gemini, ChatGPT, etc.).

*   **AI Report (Auto Mode):**
    1.  Click **AI Report** in the top row.
    2.  The app auto-selects mode from your current view:
        * Search keyword present → **Filtered** mode (monthly prompt)
        * Month selected, no search → **Entire Month** mode (monthly prompt)
        * All months selected, no search → **Entire Year** mode (annual prompt)
    3.  For **Entire Year**, the app uses the calendar year of your most recent log entry.
    4.  The prompt templates are editable in `ai_config.json`.

---

## 🚨 IMPORTANT: Your Data Safety

This application uses your **browser's local storage** to save your log. Please understand what this means:

*   **Your data is stored ONLY on this computer, in this specific web browser.** It is not in the cloud. You cannot see your log on another computer or in a different browser (e.g., Chrome vs. Edge) unless you transfer it.
*   **Browser data can be cleared.** If you or a system process clears your browser's cache or site data, **your log will be permanently deleted.**

### How to Keep Your Data Safe

Use the **Export to File** button regularly!

Clicking this button saves a complete backup of your entire log as a `work_log_backup.json` file to your computer. This is your permanent record. If you ever lose your browser data or move to a new computer, you can use the **Import from File** button to restore your log from this backup file.

**Best Practice:** Export your log at the end of every week.
