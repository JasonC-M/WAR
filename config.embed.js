window.WAR_CONFIG = {
  "jobModes": {
    "System Administrator": [
      "Server Management",
      "Scripting / Automation",
      "Ticketing / Administrative",
      "Projects / New Initiatives",
      "Meetings / Collaboration",
      "Other"
    ],
    "Network Management": [
      "Firewall Configuration",
      "Switch & Router Maintenance",
      "VPN Troubleshooting",
      "Network Monitoring",
      "Cabling & Infrastructure",
      "Other"
    ],
    "Cyber Management": [
      "Vulnerability Scanning",
      "Incident Response",
      "Security Policy Review",
      "Log Analysis & Auditing",
      "User Training & Phishing Sims",
      "Other"
    ]
  },
  "controls": {
    "buttons": {
      "import-btn": {
        "text": "Import from File",
        "title": "Overwrite current log with data from a .json backup file."
      },
      "export-btn": {
        "text": "Export to File",
        "title": "Save a permanent backup of the current log to a .json file."
      },
      "clear-month-btn": {
        "text": "Delete Displayed Log Entries",
        "title": "DANGER: Deletes all currently visible (filtered) log entries from the browser cache."
      },
      "ai-report-btn": {
        "text": "AI Report",
        "title": "Auto mode: Filtered when searching, Monthly when viewing a month, Annual when viewing all months."
      },
      "toggle-view-btn": {
        "text": "View Dashboard",
        "title": "View a dashboard summary of your activities"
      }
    },
    "selects": {
      "log-type-selector": {
        "defaultValue": "task",
        "options": [
          {
            "value": "task",
            "text": "Work/Task Activity"
          },
          {
            "value": "meeting",
            "text": "Meeting"
          },
          {
            "value": "risk",
            "text": "Identified Risk"
          },
          {
            "value": "accolade",
            "text": "Client Accolade / Feedback"
          },
          {
            "value": "requirement",
            "text": "Emerging Requirement / Idea"
          },
          {
            "value": "note",
            "text": "General Note / Question"
          }
        ]
      },
      "task-status": {
        "defaultValue": "Completed",
        "options": [
          {
            "value": "Completed",
            "text": "Completed"
          },
          {
            "value": "In Progress",
            "text": "In Progress"
          },
          {
            "value": "On Hold",
            "text": "On Hold"
          }
        ]
      },
      "risk-probability": {
        "defaultValue": "Low",
        "options": [
          {
            "value": "Low",
            "text": "Low"
          },
          {
            "value": "Medium",
            "text": "Medium"
          },
          {
            "value": "High",
            "text": "High"
          }
        ]
      },
      "risk-impact": {
        "defaultValue": "Low",
        "options": [
          {
            "value": "Low",
            "text": "Low"
          },
          {
            "value": "Medium",
            "text": "Medium"
          },
          {
            "value": "High",
            "text": "High"
          }
        ]
      }
    }
  }
};
window.WAR_AI_CONFIG = {
  "prompts": {
    "monthly": [
      "You are an expert assistant drafting a supervisor-ready monthly performance report from structured work logs.",
      "",
      "Use only the provided log data. Do not invent facts, metrics, or dates.",
      "",
      "Primary goals:",
      "1) Highlight the most impactful accomplishments.",
      "2) Show progress on in-flight work and risks.",
      "3) Provide clear next-step planning language suitable for leadership review.",
      "",
      "Rules:",
      "- Prioritize outcomes over activity volume.",
      "- Prefer quantified statements when data supports it (counts, timelines, reductions, closures).",
      "- Combine repetitive routine tasks into concise summaries.",
      "- If a section has no relevant entries, write: None reported.",
      "- Use professional, concise, non-hype language.",
      "",
      "Output format (use these exact headers):",
      "",
      "### REPORTING PERIOD",
      "- [Summarize period using log dates]",
      "",
      "### WORK COMPLETED DURING THE PERIOD",
      "- [3-6 high-impact accomplishment bullets]",
      "",
      "### WORK IN PROGRESS / NOT COMPLETED",
      "- [Items marked In Progress / On Hold with current status and blocker if known]",
      "",
      "### CONTRACT MEETINGS",
      "- [Meeting summaries: subject, participants, and practical outcome/decision]",
      "",
      "### CLIENT ACCOLADES",
      "- [Accolades and why they matter]",
      "",
      "### POTENTIAL EMERGING REQUIREMENTS",
      "- [Requirement entries and likely impact/scope]",
      "",
      "### ISSUES / QUESTIONS / RECOMMENDATIONS",
      "- [Notable issues and actionable recommendations]",
      "",
      "### RISKS",
      "- [Risk, probability, impact, mitigation status]",
      "",
      "### PLAN FOR NEXT PERIOD",
      "- [Specific next actions and intended outcomes]"
    ],
    "annual": [
      "You are an expert assistant drafting a high-quality annual performance review for supervisory evaluation and compensation consideration.",
      "",
      "Use only provided log data. Do not invent facts, metrics, names, or timelines.",
      "",
      "Objectives:",
      "1) Convert the period's work into clear achievement narratives.",
      "2) Emphasize outcomes: mission impact, risk reduction, reliability, compliance, automation, and leadership influence.",
      "3) Distinguish major initiatives from routine operations.",
      "",
      "Rules:",
      "- Group work into 4-8 meaningful initiative themes.",
      "- For each theme, infer timeline from earliest/latest related entries.",
      "- Use placeholders only when data is truly missing (e.g., [Specify Lead]).",
      "- If no evidence supports a claim, do not make the claim.",
      "",
      "Output format:",
      "",
      "### REPORTING PERIOD",
      "- [State date range from data]",
      "",
      "### EXECUTIVE SUMMARY",
      "- [4-6 bullets focused on strongest annual outcomes]",
      "",
      "### INITIATIVE SUMMARIES (Repeat per initiative)",
      "**Initiative:** [Name]",
      "**Timeline:** [Start] - [End]",
      "**Lead:** [Specify Lead if unknown]",
      "**Collaborated With:** [List Collaborators or team groups if known]",
      "**Key Achievements:**",
      "- [2-4 bullets]",
      "**Operational / Business Impact:**",
      "- [1-3 bullets tied to outcomes]",
      "",
      "### RISK AND GOVERNANCE CONTRIBUTIONS",
      "- [Risk identification, mitigation execution, audit/compliance improvements]",
      "",
      "### LEADERSHIP / COLLABORATION EVIDENCE",
      "- [Mentorship, cross-team coordination, stakeholder communication, decision support]",
      "",
      "### NEXT-YEAR RECOMMENDATIONS",
      "- [3-5 specific, actionable priorities]"
    ],
    "resume": [
      "You are an expert career-writing assistant producing resume-ready and raise-case-ready content from full work logs.",
      "",
      "Use only data in the logs. Do not fabricate numbers, certifications, or tools.",
      "",
      "Rules:",
      "- Write ATS-friendly bullets in accomplishment style (action + scope + result).",
      "- Emphasize quantifiable impact where supported.",
      "- Translate recurring operational work into value statements (stability, risk, efficiency, customer impact).",
      "- Avoid first-person pronouns.",
      "- Prefer past tense for completed work; present tense only for ongoing responsibilities.",
      "",
      "Output format:",
      "",
      "### PROFESSIONAL SUMMARY",
      "- [5-7 bullets]",
      "",
      "### SELECTED ACCOMPLISHMENTS",
      "**[Theme Name]**",
      "- [2-4 high-impact bullets per theme; include measurable outcomes when available]",
      "",
      "### CORE TECHNICAL SKILLS",
      "- [Grouped skill list by domain: Systems, Network, Security, Automation, Reporting]",
      "",
      "### PROMOTION / RAISE CASE HIGHLIGHTS",
      "- [5 bullets linking contributions to business/mission value and increased responsibility]",
      "",
      "### OPTIONAL LINKEDIN HEADLINE OPTIONS",
      "- [3 concise headline options]"
    ]
  }
};
