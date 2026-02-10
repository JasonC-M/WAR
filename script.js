/******************************************************************************
 * PROJECT:        WAR (Work Activity Report)
 * FILE:           script.js
 * AUTHOR:         Jason Coster-Mullen (Original), Gemini Enterprise (Refactor)
 * VERSION:        8.1 (Save As Dialog)
 * LAST MODIFIED:  2026-02-10
 * DESCRIPTION:
 *   The central JavaScript engine for the WAR application. This version
 *   enhances the export functionality to use the File System Access API
 *   ('showSaveFilePicker') to trigger a "Save As..." dialog, providing a
 *   fallback to the legacy download method for unsupported browsers.
 ******************************************************************************/
document.addEventListener('DOMContentLoaded', () => {

    // --- DATA STRUCTURES ---
    const jobCategories = {
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
    };

    // --- DOM ELEMENTS ---
    const loggerContainer = document.getElementById('logger-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const toggleViewBtn = document.getElementById('toggle-view-btn');
    const dataWarning = document.querySelector('.data-warning');
    const formContainer = document.querySelector('.form-container');
    const logViewContainer = document.querySelector('.log-view-container');
    const actionButtons = [
        document.getElementById('import-btn'),
        document.getElementById('export-btn'),
        document.getElementById('clear-month-btn'),
        document.getElementById('clear-all-btn'),
        document.getElementById('generate-report-btn'),
        document.getElementById('generate-annual-report-btn')
    ];
    const logForm = document.getElementById('log-form');
    const logIdInput = document.getElementById('log-id');
    const logTypeSelector = document.getElementById('log-type-selector');
    const jobModeSelector = document.getElementById('job-mode-selector');
    const formSections = document.querySelectorAll('.form-section');
    const logEntriesBody = document.getElementById('log-entries-body');
    const monthFilter = document.getElementById('month-filter');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const exportBtn = document.getElementById('export-btn');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const generateAnnualReportBtn = document.getElementById('generate-annual-report-btn');
    const clearMonthBtn = document.getElementById('clear-month-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const taskCategorySelect = document.getElementById('task-category');
    const projectTitleWrapper = document.getElementById('project-title-wrapper');
    const taskProjectInput = document.getElementById('task-project');
    const otherCategoryWrapper = document.getElementById('other-category-wrapper');
    const taskCategoryOtherInput = document.getElementById('task-category-other');
    const searchInput = document.getElementById('search-input');
    const searchSuggestions = document.getElementById('search-suggestions');
    let categoryChart = null;
    const metricTasksEl = document.getElementById('metric-tasks');
    const metricMeetingsEl = document.getElementById('metric-meetings');
    const metricRisksEl = document.getElementById('metric-risks');
    const metricAccoladesEl = document.getElementById('metric-accolades');
    const metricRequirementsEl = document.getElementById('metric-requirements');
    const metricNotesEl = document.getElementById('metric-notes');

    // --- DYNAMIC LOGIC ---
    function updateCategoryDropdown() {
        const selectedJob = jobModeSelector.value;
        const categories = jobCategories[selectedJob] || [];
        taskCategorySelect.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            taskCategorySelect.appendChild(option);
        });
        updateProjectFieldVisibility();
        updateOtherCategoryVisibility();
    }

    const adjustLogViewHeight = () => {
        requestAnimationFrame(() => {
            if (formContainer && logViewContainer && formContainer.offsetHeight > 0) {
                const formHeight = formContainer.offsetHeight;
                logViewContainer.style.height = `${formHeight}px`;
            }
        });
    };
    
    // --- DASHBOARD RENDERING ---
    function renderDashboard() {
        renderCategoryChart();
        renderKeyMetrics();
    }

    function renderCategoryChart() {
        const logs = getLogs();
        const categoryCounts = logs.reduce((acc, log) => {
            if (log.type === 'task' && log.category) {
                acc[log.category] = (acc[log.category] || 0) + 1;
            }
            return acc;
        }, {});

        const chartData = {
            labels: Object.keys(categoryCounts),
            datasets: [{
                label: 'Tasks by Category',
                data: Object.values(categoryCounts),
                backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14', '#20c997', '#6c757d', '#e83e8c']
            }]
        };

        const ctx = document.getElementById('category-chart').getContext('2d');
        if (categoryChart) {
            categoryChart.destroy();
        }

        categoryChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            },
        });
    }
    
    function renderKeyMetrics() {
        const allLogs = getLogs();
        const counts = allLogs.reduce((acc, log) => {
            acc[log.type] = (acc[log.type] || 0) + 1;
            return acc;
        }, {});

        metricTasksEl.textContent = counts.task || 0;
        metricMeetingsEl.textContent = counts.meeting || 0;
        metricRisksEl.textContent = counts.risk || 0;
        metricAccoladesEl.textContent = counts.accolade || 0;
        metricRequirementsEl.textContent = counts.requirement || 0;
        metricNotesEl.textContent = counts.note || 0;
    }

    // --- FEATURE: View Toggling ---
    function toggleView() {
        const isDashboardVisible = dashboardContainer.style.display !== 'none';
        
        if (isDashboardVisible) {
            dashboardContainer.style.display = 'none';
            loggerContainer.style.display = 'grid';
            dataWarning.classList.remove('hidden');
            toggleViewBtn.textContent = 'View Dashboard';
            actionButtons.forEach(btn => btn.classList.remove('ghost'));
            adjustLogViewHeight();
        } else {
            dashboardContainer.style.display = 'block';
            loggerContainer.style.display = 'none';
            dataWarning.classList.add('hidden');
            toggleViewBtn.textContent = 'View Log';
            actionButtons.forEach(btn => btn.classList.add('ghost'));
            renderDashboard();
        }
    }

    // --- FEATURE: Conditional Field Visibility ---
    function updateProjectFieldVisibility() {
        const isProject = taskCategorySelect.value === 'Projects / New Initiatives';
        projectTitleWrapper.style.display = isProject ? 'block' : 'none';
        if (!isProject) taskProjectInput.value = '';
        adjustLogViewHeight();
    }

    function updateOtherCategoryVisibility() {
        const isOther = taskCategorySelect.value === 'Other';
        otherCategoryWrapper.style.display = isOther ? 'block' : 'none';
        if (!isOther) taskCategoryOtherInput.value = '';
        adjustLogViewHeight();
    }
    
    // --- FEATURE: AUTOCOMPLETE ---
    function populateAutocomplete() {
        const allLogs = getLogs();
        const wordSet = new Set();
        const commonWords = new Set(['a', 'an', 'the', 'in', 'on', 'for', 'and', 'with', 'to', 'of', 'is', 'it', 'was', 'were']);
        allLogs.forEach(log => {
            const textCorpus = [ log.description, log.project, log.category, log.subject, log.mitigation ].join(' ');
            textCorpus.toLowerCase().split(/[\s,.\-()\[\]/]+/).forEach(word => {
                if (word && word.length > 2 && !commonWords.has(word) && isNaN(word)) {
                    wordSet.add(word);
                }
            });
        });
        searchSuggestions.innerHTML = '';
        [...wordSet].sort().forEach(word => {
            const option = document.createElement('option');
            option.value = word;
            searchSuggestions.appendChild(option);
        });
    }

    // --- CORE DATA MODEL ---
    const getLogs = () => JSON.parse(localStorage.getItem('warSmartLog') || '[]');
    const saveLogsAndRender = (logs, retainSelection = false) => {
        localStorage.setItem('warSmartLog', JSON.stringify(logs));
        const currentSelection = monthFilter.value;
        populateMonthFilter();
        populateAutocomplete();
        if (retainSelection && monthFilter.querySelector(`option[value="${currentSelection}"]`)) {
            monthFilter.value = currentSelection;
        } else if (logs.length > 0) {
            const mostRecentMonth = logs.sort((a,b) => new Date(b.date) - new Date(a.date))[0].date.substring(0, 7);
            monthFilter.value = mostRecentMonth;
        } else {
            monthFilter.value = 'all';
        }
        renderLogs();
        adjustLogViewHeight();
    };

    // --- HELPER: Get Local Date String ---
    function getLocalDateString(date = new Date()) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // --- INITIALIZATION ---
    function initialize() {
        setupEventListeners();
        updateFormVisibility();
        updateCategoryDropdown();
        document.querySelectorAll('input[type="date"]').forEach(input => input.value = getLocalDateString());
        saveLogsAndRender(getLogs());
    }

    // --- SETUP EVENT LISTENERS ---
    function setupEventListeners() {
        toggleViewBtn.addEventListener('click', toggleView);
        logTypeSelector.addEventListener('change', updateFormVisibility);
        jobModeSelector.addEventListener('change', updateCategoryDropdown);
        taskCategorySelect.addEventListener('change', () => {
            updateProjectFieldVisibility();
            updateOtherCategoryVisibility();
        });
        logForm.addEventListener('submit', handleFormSubmit);
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', handleImport);
        exportBtn.addEventListener('click', handleExport);
        clearAllBtn.addEventListener('click', clearAllLogs);
        clearMonthBtn.addEventListener('click', clearMonthLogs);
        monthFilter.addEventListener('change', renderLogs);
        generateReportBtn.addEventListener('click', handleGenerateReport);
        generateAnnualReportBtn.addEventListener('click', handleGenerateAnnualReport);
        window.addEventListener('resize', adjustLogViewHeight);
        searchInput.addEventListener('input', renderLogs);
    }

    // --- DYNAMIC FORM VISIBILITY ---
    function updateFormVisibility() {
        const selectedType = logTypeSelector.value;
        let activeSectionId = 'form-section-generic';
        if (selectedType === 'task') activeSectionId = 'form-section-task';
        else if (selectedType === 'meeting') activeSectionId = 'form-section-meeting';
        else if (selectedType === 'risk') activeSectionId = 'form-section-risk';
        formSections.forEach(section => section.classList.toggle('active', section.id === activeSectionId));
        updateProjectFieldVisibility();
        updateOtherCategoryVisibility();
    }

    // --- MAIN FORM SUBMIT HANDLER ---
    function handleFormSubmit(e) {
        e.preventDefault();
        const logs = getLogs();
        const type = logTypeSelector.value;
        let newEntry = { id: logIdInput.value || Date.now().toString(), type: type };
        if (type === 'task') {
            newEntry.jobMode = jobModeSelector.value;
            newEntry.date = document.getElementById('task-date').value;
            newEntry.project = document.getElementById('task-project').value.trim();
            newEntry.status = document.getElementById('task-status').value;
            newEntry.description = document.getElementById('task-description').value;
            const categoryValue = taskCategorySelect.value;
            if (categoryValue === 'Other') {
                newEntry.category = taskCategoryOtherInput.value.trim() || 'Other';
            } else {
                newEntry.category = categoryValue;
            }
        } else if (type === 'meeting') {
            newEntry.date = document.getElementById('meeting-date').value;
            newEntry.subject = document.getElementById('meeting-subject').value;
            newEntry.attendees = document.getElementById('meeting-attendees').value;
            newEntry.duration = document.getElementById('meeting-duration').value;
        } else if (type === 'risk') {
            newEntry.date = document.getElementById('risk-date').value;
            newEntry.description = document.getElementById('risk-description').value;
            newEntry.probability = document.getElementById('risk-probability').value;
            newEntry.impact = document.getElementById('risk-impact').value;
            newEntry.mitigation = document.getElementById('risk-mitigation').value;
        } else {
            newEntry.date = document.getElementById('generic-date').value;
            newEntry.description = document.getElementById('generic-description').value;
        }
        const existingIndex = logs.findIndex(log => log.id === newEntry.id);
        if (existingIndex > -1) logs[existingIndex] = newEntry; else logs.unshift(newEntry);
        saveLogsAndRender(logs);
        logForm.reset();
        logIdInput.value = '';
        updateFormVisibility();
        document.querySelectorAll('input[type="date"]').forEach(input => input.value = getLocalDateString());
    }

    // --- RENDER & FILTER ---
    function getFilteredLogs() {
        const allLogs = getLogs();
        const selectedMonth = monthFilter.value;
        const searchTerm = searchInput.value.toLowerCase().trim();
        const monthFilteredLogs = (selectedMonth && selectedMonth !== 'all') ? allLogs.filter(log => log.date && log.date.startsWith(selectedMonth)) : allLogs;
        if (!searchTerm) { return monthFilteredLogs; }
        return monthFilteredLogs.filter(log => {
            const searchableContent = [ log.description, log.project, log.category, log.status, log.subject, log.attendees, log.mitigation ].join(' ').toLowerCase();
            return searchableContent.includes(searchTerm);
        });
    }

    function getLogsForReport() {
        const allLogs = getLogs();
        const selectedMonth = monthFilter.value;
        return (selectedMonth && selectedMonth !== 'all') ? allLogs.filter(log => log.date && log.date.startsWith(selectedMonth)) : allLogs;
    }

    function populateMonthFilter() {
        const logs = getLogs();
        const uniqueMonths = [...new Set(logs.map(log => log.date ? log.date.substring(0, 7) : null).filter(Boolean))];
        uniqueMonths.sort().reverse();
        const currentSelection = monthFilter.value;
        monthFilter.innerHTML = '<option value="all">All Months</option>';
        uniqueMonths.forEach(monthStr => {
            const [year, month] = monthStr.split('-');
            const date = new Date(year, month - 1);
            const option = new Option(date.toLocaleString('default', { month: 'long', year: 'numeric' }), monthStr);
            monthFilter.add(option);
        });
        if(uniqueMonths.includes(currentSelection)) monthFilter.value = currentSelection;
    }
    
    function renderLogs() {
        const logs = getFilteredLogs();
        logEntriesBody.innerHTML = '';
        if (logs.length === 0) {
            const row = logEntriesBody.insertRow();
            row.insertCell().colSpan = 4;
            row.cells[0].textContent = 'No matching log entries found.';
            row.cells[0].style.textAlign = 'center';
            return;
        }
        logs.forEach(log => {
            const row = logEntriesBody.insertRow();
            let detailsHtml = '';
            switch(log.type) {
                case 'task':
                    const projectHtml = log.project ? `<strong>Project:</strong> ${log.project}<br>` : '';
                    detailsHtml = `${projectHtml}<strong>${log.category} (${log.status}):</strong> ${log.description}`;
                    break;
                case 'meeting':
                    detailsHtml = `<strong>Meeting:</strong> ${log.subject}<br><strong>Attendees:</strong> ${log.attendees} (${log.duration})`;
                    break;
                case 'risk':
                    detailsHtml = `<strong>Risk:</strong> ${log.description}<br><strong>Impact:</strong> ${log.impact}, <strong>Prob:</strong> ${log.probability}<br><strong>Mitigation:</strong> ${log.mitigation}`;
                    break;
                default:
                    detailsHtml = `<strong>${log.type.charAt(0).toUpperCase() + log.type.slice(1)}:</strong> ${log.description}`;
            }
            row.insertCell().textContent = log.date ? new Date(log.date.replace(/-/g, '/')).toLocaleDateString() : 'N/A';
            row.insertCell().textContent = log.type.charAt(0).toUpperCase() + log.type.slice(1);
            row.insertCell().innerHTML = detailsHtml;
            row.insertCell().innerHTML = `<button class="action-btn edit-btn" onclick="editLog('${log.id}')">✎</button><button class="action-btn delete-btn" onclick="deleteLog('${log.id}')">❌</button>`;
        });
    }

    // --- DATA MANAGEMENT FUNCTIONS ---
    function handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (getLogs().length > 0 && !confirm('This will overwrite your current logs. Are you sure?')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const logsFromFile = JSON.parse(e.target.result);
                if (Array.isArray(logsFromFile)) {
                    saveLogsAndRender(logsFromFile);
                    alert(`Successfully imported ${logsFromFile.length} log entries.`);
                } else alert('Invalid file format.');
            } catch (error) { alert('Error parsing file.'); }
        };
        reader.readAsText(file);
        importFile.value = '';
    }

    // MODIFICATION: Rewritten to use the modern File System Access API with a fallback
    async function handleExport() {
        const logs = getLogs();
        if (logs.length === 0) {
            return alert('No logs to export.');
        }
        const dataStr = JSON.stringify(logs, null, 2);
        const suggestedName = `work_log_backup_${getLocalDateString()}.json`;

        // Modern Method: "Save As" Dialog
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: suggestedName,
                    types: [{
                        description: 'JSON files',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(dataStr);
                await writable.close();
                return; // Exit function after successful save
            } catch (err) {
                // Silently ignore errors from user cancelling the save dialog
                if (err.name === 'AbortError') {
                    return;
                }
            }
        }

        // Fallback Method: Direct Download
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggestedName;
        a.click();
        URL.revokeObjectURL(url);
    }

    function clearAllLogs() { if (confirm('DANGER: This will delete the entire log. Are you absolutely sure?')) saveLogsAndRender([]); }
    function clearMonthLogs() {
        const selectedMonth = monthFilter.value;
        if (!selectedMonth || selectedMonth === 'all') return alert("Please select a specific month to clear.");
        if (confirm(`This will delete all log entries for the selected month. Are you sure?`)) {
            const otherLogs = getLogs().filter(log => !log.date || !log.date.startsWith(selectedMonth));
            saveLogsAndRender(otherLogs, false);
        }
    }
    
    // --- EDIT & DELETE (Global Scope) ---
    window.editLog = (id) => {
        const logToEdit = getLogs().find(log => log.id === id);
        if (!logToEdit) return;
        if (dashboardContainer.style.display !== 'none') toggleView();
        logTypeSelector.value = logToEdit.type;
        updateFormVisibility();
        logIdInput.value = logToEdit.id;
        if (logToEdit.type === 'task') {
            jobModeSelector.value = logToEdit.jobMode || 'System Administrator';
            updateCategoryDropdown();
            document.getElementById('task-date').value = logToEdit.date;
            document.getElementById('task-status').value = logToEdit.status;
            document.getElementById('task-project').value = logToEdit.project || '';
            document.getElementById('task-description').value = logToEdit.description;
            const standardCategories = Array.from(taskCategorySelect.options).map(opt => opt.value);
            if (standardCategories.includes(logToEdit.category)) {
                taskCategorySelect.value = logToEdit.category;
                taskCategoryOtherInput.value = '';
            } else {
                taskCategorySelect.value = 'Other';
                taskCategoryOtherInput.value = logToEdit.category;
            }
            updateProjectFieldVisibility();
            updateOtherCategoryVisibility();
        } else if (logToEdit.type === 'meeting') {
            document.getElementById('meeting-date').value = logToEdit.date;
            document.getElementById('meeting-subject').value = logToEdit.subject;
            document.getElementById('meeting-attendees').value = logToEdit.attendees;
            document.getElementById('meeting-duration').value = logToEdit.duration;
        } else if (logToEdit.type === 'risk') {
            document.getElementById('risk-date').value = logToEdit.date;
            document.getElementById('risk-description').value = logToEdit.description;
            document.getElementById('risk-probability').value = logToEdit.probability;
            document.getElementById('risk-impact').value = logToEdit.impact;
            document.getElementById('risk-mitigation').value = logToEdit.mitigation;
        } else {
            document.getElementById('generic-date').value = logToEdit.date;
            document.getElementById('generic-description').value = logToEdit.description;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.deleteLog = (id) => { if (confirm('Delete this entry?')) saveLogsAndRender(getLogs().filter(log => log.id !== id), true); };

    // --- AI PROMPT GENERATORS ---
    function formatLogsForAI(logs) {
        return logs.map(log => {
            let details = '';
            switch(log.type) {
                case 'task':
                    const projectInfo = log.project ? `Project: ${log.project}, ` : '';
                    details = `${projectInfo}Type: Task, Category: ${log.category}, Status: ${log.status}, Description: ${log.description}`;
                    break;
                case 'meeting':
                    details = `Type: Meeting, Subject: ${log.subject}, Attendees: ${log.attendees}, Duration: ${log.duration}`;
                    break;
                case 'risk':
                    details = `Type: Risk, Description: ${log.description}, Probability: ${log.probability}, Impact: ${log.impact}, Mitigation: ${log.mitigation}`;
                    break;
                default: details = `Type: ${log.type}, Description: ${log.description}`; break;
            }
            return `Date: ${log.date}, ${details}`;
        }).join('\n');
    }

    function handleGenerateReport() {
        const logs = getLogsForReport();
        if (logs.length === 0) {
            alert("No logs for the selected month to generate a summary.");
            return;
        }
        const aiPrompt = `
You are an expert AI assistant tasked with drafting a professional monthly work report for a supervisor. Your primary function is to analyze the provided raw log data, identify the most significant accomplishments, and distinguish them from routine tasks.

Analyze the log data and generate a summary formatted EXACTLY according to the structure below. Follow these critical instructions:

1.  **Prioritize Accomplishments:** From the "WORK COMPLETED" section, identify the 3-5 most significant achievements based on their described impact, scope, and the action verbs used. Give each of these major achievements its own clear, concise bullet point.

2.  **Summarize Routine Tasks:** Group all other less significant or routine tasks (e.g., closing multiple low-level tickets) into a single, summary bullet point. For example, "Completed numerous routine administrative tasks, including resolving 15 support tickets and performing daily system health checks."

3.  **Synthesize, Don't List:** Do not simply list the raw log entries. Synthesize and rephrase them in a professional tone.

### WORK PLANNED FOR THE MONTH:
(Summarize any 'planning' entries relevant to this month.)

### WORK COMPLETED DURING THE MONTH:
(Apply the prioritization and summarization rules described above.)

### WORK NOT COMPLETED DURING THE MONTH:
(List all 'In Progress' or 'On Hold' tasks and their current status.)

### WORK PLANNED FOR NEXT MONTH:
(Summarize any 'planning' entries relevant to next month.)

### CONTRACT MEETINGS:
(List all 'meeting' entries in a clear, bulleted format.)

### CLIENT ACCOLADES:
(List all 'accolade' entries.)

### POTENTIAL EMERGING REQUIREMENTS:
(List all 'requirement' entries.)

### ISSUES/QUESTIONS/RECOMMENDATIONS:
(List all 'note' or 'issue' entries.)

### RISKS:
(List all 'risk' entries, including their probability, impact, and mitigation.)
`;
        const formattedLogData = formatLogsForAI(logs);
        const fullTextToCopy = `AI PROMPT:\n${aiPrompt}\n\n--- RAW LOG DATA ---\n${formattedLogData}`;
        navigator.clipboard.writeText(fullTextToCopy).then(() => {
            const originalText = generateReportBtn.textContent;
            generateReportBtn.textContent = 'Copied to Clipboard!';
            generateReportBtn.style.backgroundColor = '#28a745';
            setTimeout(() => {
                generateReportBtn.textContent = originalText;
                generateReportBtn.style.backgroundColor = '#007bff';
            }, 2500);
        }).catch(err => {
            alert('Failed to copy summary. See console for details.');
            console.error(err);
        });
    }

    function handleGenerateAnnualReport() {
        const logs = getLogs();
        if (logs.length === 0) {
            alert("There are no logs to generate an annual report from.");
            return;
        }
        const aiPrompt = `
You are an expert AI assistant tasked with drafting a high-level professional annual review. Your primary function is to analyze the provided raw log data, identify distinct projects or initiatives, and summarize them into the specific format below.

Analyze the entire set of log data and follow these critical instructions:

1.  **Identify & Group Projects:** Scan all log entries and group them into logical projects based on recurring keywords or themes in their descriptions (e.g., group all tasks related to 'onboarding', 'inventory script', 'server decommission', etc., together).

2.  **Create One Report Block Per Project:** For each project group you identify, create a complete report block using the "Summary, Timeline, Lead..." format.

3.  **Synthesize, Don't List:** Do not simply list the raw log entries. Synthesize the information from multiple entries into a coherent narrative, especially for the "Notable Achievements" and "Impact" sections.

4.  **Infer Timelines:** For each project, determine the start and end dates by finding the earliest and latest log entry dates within that group.

5.  **Use Placeholders for Missing Data:** Since the log data does not contain information on project leads or collaborators, you MUST insert the placeholders '[Specify Lead]' and '[List Collaborators]' in the appropriate fields for the user to fill in manually.

6.  **Attempt to Infer Impact:** For the "Impact" section, analyze the task descriptions for keywords related to outcomes, results, or benefits (e.g., "improved," "resolved," "reduced," "enabled"). If no impact is stated, write '[Describe the impact or benefit of this project]'.

---

**EXAMPLE OUTPUT STRUCTURE (Repeat for each identified project):**

**Project Name:** [AI-identified Project Title]

**Summary:** [Create a 1-2 sentence executive summary of the project's goal and outcome.]

**Timeline:** [Earliest Date in Group] - [Latest Date in Group]

**Lead:** [Specify Lead]

**Collaborated With:** [List Collaborators]

**Notable Achievements:**

* [Synthesize related task descriptions into a detailed, narrative bullet point explaining what was done and why.]
* [Create another bullet point for other major achievements within this project.]

**Impact:**

* [Synthesize descriptions that mention outcomes or benefits into a narrative explaining the positive results of this project. Use the placeholder if no impact is found.]

---
`;
        const formattedLogData = formatLogsForAI(logs);
        const fullTextToCopy = `AI PROMPT (Annual Review):\n${aiPrompt}\n\n--- RAW LOG DATA (All Entries) ---\n${formattedLogData}`;
        navigator.clipboard.writeText(fullTextToCopy).then(() => {
            const originalText = generateAnnualReportBtn.textContent;
            generateAnnualReportBtn.textContent = 'Copied!';
            generateAnnualReportBtn.style.backgroundColor = '#28a745';
            setTimeout(() => {
                generateAnnualReportBtn.textContent = originalText;
                generateAnnualReportBtn.style.backgroundColor = '#17a2b8';
            }, 2500);
        }).catch(err => {
            alert('Failed to copy annual summary. See console for details.');
            console.error(err);
        });
    }

    // --- RUN APPLICATION ---
    initialize();
});
