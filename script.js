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
    const JOB_MODE_STORAGE_KEY = 'warSelectedJobMode';
    const JOB_MODE_FILTER_STORAGE_KEY = 'warFilterByJobMode';
    
    // --- DATA STRUCTURES ---
    let config = {};
    let aiConfig = {};

    async function loadConfig() {
        try {
            if (typeof window !== 'undefined' && window.WAR_CONFIG && typeof window.WAR_CONFIG === 'object') {
                config = window.WAR_CONFIG;
            }

            if (typeof window !== 'undefined' && window.WAR_AI_CONFIG && typeof window.WAR_AI_CONFIG === 'object') {
                aiConfig = window.WAR_AI_CONFIG;
            }

            const cacheBust = Date.now();

            if (!Object.keys(config).length) {
                const configUrl = `./config.json?cacheBust=${cacheBust}`;
                const response = await fetch(configUrl, { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} ${response.statusText} while loading ${configUrl}`);
                }
                config = await response.json();
            }

            if (!Object.keys(aiConfig).length) {
                const aiConfigUrl = `./ai_config.json?cacheBust=${cacheBust}`;
                const aiResponse = await fetch(aiConfigUrl, { cache: 'no-store' });
                if (!aiResponse.ok) {
                    throw new Error(`HTTP ${aiResponse.status} ${aiResponse.statusText} while loading ${aiConfigUrl}`);
                }
                aiConfig = await aiResponse.json();
            }
        } catch (error) {
            console.error('Error loading config files:', error);
            if (dataWarning) {
                dataWarning.innerHTML = `<strong>Config load failed:</strong> ${String(error)}<br>Load this app via <code>http://</code> (not a <code>file://</code> path), and ensure <code>config.json</code> and <code>ai_config.json</code> are reachable.`;
            }
        }
    }

    function applyControlConfig() {
        const controls = config.controls || {};
        const buttonConfig = controls.buttons || {};
        Object.entries(buttonConfig).forEach(([id, meta]) => {
            const button = document.getElementById(id);
            if (!button) return;
            if (typeof meta?.text === 'string') button.textContent = meta.text;
            if (typeof meta?.title === 'string') button.title = meta.title;
        });

        const selectConfig = controls.selects || {};
        Object.entries(selectConfig).forEach(([id, meta]) => {
            const select = document.getElementById(id);
            if (!select) return;
            const options = Array.isArray(meta?.options) ? meta.options : [];
            select.innerHTML = '';
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                select.appendChild(option);
            });
            if (typeof meta?.defaultValue === 'string') {
                select.value = meta.defaultValue;
            }
        });
    }

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
        document.getElementById('ai-report-btn'),
        document.querySelector('.header-job-mode-control')
    ].filter(Boolean);
    const logForm = document.getElementById('log-form');
    const logIdInput = document.getElementById('log-id');
    const logTypeSelector = document.getElementById('log-type-selector');
    const jobModeSelector = document.getElementById('job-mode-selector');
    const jobModeFilterToggle = document.getElementById('job-mode-filter-toggle');
    const sampleLogLoadBtn = document.getElementById('sample-log-load-btn');
    const formSections = document.querySelectorAll('.form-section');
    const logEntriesBody = document.getElementById('log-entries-body');
    const monthFilter = document.getElementById('month-filter');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const exportBtn = document.getElementById('export-btn');
    const aiReportBtn = document.getElementById('ai-report-btn');
    const resetViewBtn = document.getElementById('reset-view-btn');
    const clearMonthBtn = document.getElementById('clear-month-btn');
    const taskDateInput = document.getElementById('task-date');
    const taskCompletedDateInput = document.getElementById('task-completed-date');
    const taskCompletedDateWrapper = document.getElementById('task-completed-date-wrapper');
    const taskCategorySelect = document.getElementById('task-category');
    const projectTitleWrapper = document.getElementById('project-title-wrapper');
    const taskProjectInput = document.getElementById('task-project');
    const otherCategoryWrapper = document.getElementById('other-category-wrapper');
    const taskCategoryOtherInput = document.getElementById('task-category-other');
    const searchInput = document.getElementById('search-input');
    const searchSuggestions = document.getElementById('search-suggestions');
    const drilldownContainer = document.getElementById('drilldown-container');
    const drilldownText = document.getElementById('drilldown-text');
    const drilldownClearBtn = document.getElementById('drilldown-clear-btn');
    let categoryChart = null;
    const metricTasksEl = document.getElementById('metric-tasks');
    const metricMeetingsEl = document.getElementById('metric-meetings');
    const metricRisksEl = document.getElementById('metric-risks');
    const metricAccoladesEl = document.getElementById('metric-accolades');
    const metricRequirementsEl = document.getElementById('metric-requirements');
    const metricNotesEl = document.getElementById('metric-notes');
    const metricInProgressEl = document.getElementById('metric-in-progress');
    const metricOnHoldEl = document.getElementById('metric-on-hold');

    let activeDrilldown = {
        type: null,
        category: null,
        status: null,
    };
    let saveToastTimer = null;

    // --- DYNAMIC LOGIC ---
    function populateJobModes() {
        if (!jobModeSelector) {
            console.error('Missing required element: #job-mode-selector');
            return;
        }
        const jobModes = Object.keys(config.jobModes || {});
        jobModeSelector.innerHTML = '';
        jobModes.forEach(mode => {
            const option = document.createElement('option');
            option.value = mode;
            option.textContent = mode;
            jobModeSelector.appendChild(option);
        });

        const storedMode = localStorage.getItem(JOB_MODE_STORAGE_KEY);
        if (storedMode && jobModes.includes(storedMode)) {
            jobModeSelector.value = storedMode;
        } else if (jobModes[0]) {
            jobModeSelector.value = jobModes[0];
            localStorage.setItem(JOB_MODE_STORAGE_KEY, jobModes[0]);
        }
    }

    function updateCategoryDropdown() {
        const jobModes = config.jobModes || {};
        const selectedJob = jobModeSelector ? jobModeSelector.value : '';
        const categories = (selectedJob && jobModes[selectedJob]) ? jobModes[selectedJob] : [];
        if (selectedJob) {
            localStorage.setItem(JOB_MODE_STORAGE_KEY, selectedJob);
        }
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

    function isJobModeFilterEnabled() {
        return Boolean(jobModeFilterToggle?.checked);
    }

    function filterLogsByJobMode(logs) {
        if (!Array.isArray(logs)) return [];
        if (!isJobModeFilterEnabled()) return logs;
        const selectedJob = jobModeSelector ? jobModeSelector.value : '';
        if (!selectedJob) return logs;
        return logs.filter(log => !log || log.type !== 'task' || log.jobMode === selectedJob);
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
        const logs = filterLogsByJobMode(filterLogsByPeriod(getLogs(), monthFilter.value));
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
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                onClick: (event, elements) => {
                    if (!elements || elements.length === 0) return;
                    const elementIndex = elements[0].index;
                    const clickedCategory = chartData.labels[elementIndex];
                    if (!clickedCategory) return;
                    setDrilldown({ type: 'task', category: clickedCategory });
                    if (dashboardContainer.style.display !== 'none') toggleView();
                }
            },
        });
    }
    
    function renderKeyMetrics() {
        const allLogs = filterLogsByJobMode(filterLogsByPeriod(getLogs(), monthFilter.value));
        const counts = allLogs.reduce((acc, log) => {
            acc[log.type] = (acc[log.type] || 0) + 1;
            return acc;
        }, {});
        const inProgressCount = allLogs.filter(log => log.type === 'task' && log.status === 'In Progress').length;
        const onHoldCount = allLogs.filter(log => log.type === 'task' && log.status === 'On Hold').length;

        metricTasksEl.textContent = counts.task || 0;
        metricMeetingsEl.textContent = counts.meeting || 0;
        metricRisksEl.textContent = counts.risk || 0;
        metricAccoladesEl.textContent = counts.accolade || 0;
        metricRequirementsEl.textContent = counts.requirement || 0;
        metricNotesEl.textContent = counts.note || 0;
        if (metricInProgressEl) metricInProgressEl.textContent = inProgressCount;
        if (metricOnHoldEl) metricOnHoldEl.textContent = onHoldCount;
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

    function normalizeSearchText(value) {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function tokenizeForSearch(value) {
        return normalizeSearchText(value)
            .split(/[^\p{L}\p{N}]+/u)
            .filter(Boolean);
    }

    function getLogsForLast365Days(logs = getLogs()) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cutoff = new Date(today);
        cutoff.setDate(cutoff.getDate() - 365);

        return logs.filter(log => {
            if (!log.date) return false;
            const logDate = new Date(`${log.date}T00:00:00`);
            return logDate >= cutoff && logDate <= today;
        });
    }

    function getElapsedDays(startDateStr, endDateStr = getLocalDateString()) {
        const parseIsoDateToUtc = (value) => {
            const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
            if (!match) return null;
            const year = Number(match[1]);
            const month = Number(match[2]);
            const day = Number(match[3]);
            return Date.UTC(year, month - 1, day);
        };

        const startUtc = parseIsoDateToUtc(startDateStr);
        const endUtc = parseIsoDateToUtc(endDateStr);
        if (startUtc === null || endUtc === null) return null;
        const msPerDay = 24 * 60 * 60 * 1000;
        const days = Math.floor((endUtc - startUtc) / msPerDay);
        return Math.max(0, days);
    }

    function stripOpenMarkerFromDescription(value) {
        return String(value || '')
            .replace(/\s*\[Open:\s*\d+d\]\s*$/i, '')
            .trim();
    }

    function normalizeTaskStatus(statusValue) {
        const normalized = String(statusValue || '').trim().toLowerCase();
        if (normalized === 'in progress' || normalized === 'in-progress') return 'In Progress';
        if (normalized === 'on hold' || normalized === 'on-hold') return 'On Hold';
        return 'Completed';
    }

    function normalizeLogEntry(entry, fallbackDate = getLocalDateString()) {
        if (!entry || typeof entry !== 'object') return null;

        const normalizedEntry = {
            ...entry,
            id: String(entry.id || Date.now().toString()),
            date: (/^\d{4}-\d{2}-\d{2}$/.test(String(entry.date || '')) ? entry.date : fallbackDate),
        };

        if (normalizedEntry.type === 'task') {
            normalizedEntry.status = normalizeTaskStatus(normalizedEntry.status);
            normalizedEntry.description = stripOpenMarkerFromDescription(normalizedEntry.description);
            normalizedEntry.category = normalizedEntry.category || 'Other';
            normalizedEntry.startDate = normalizedEntry.date;

            const isOpenStatus = normalizedEntry.status === 'In Progress' || normalizedEntry.status === 'On Hold';

            if (isOpenStatus) {
                delete normalizedEntry.completedDate;
            } else {
                const completedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(normalizedEntry.completedDate || ''))
                    ? normalizedEntry.completedDate
                    : normalizedEntry.date;
                normalizedEntry.completedDate = completedDate;
            }
        }

        return normalizedEntry;
    }

    function normalizeLogs(logs) {
        if (!Array.isArray(logs)) return [];
        const today = getLocalDateString();
        return logs
            .map(log => normalizeLogEntry(log, today))
            .filter(Boolean);
    }

    function migrateStoredTaskDescriptions() {
        const logs = getLogs();
        if (!Array.isArray(logs) || logs.length === 0) return;

        let changed = false;
        const migratedLogs = logs.map(log => {
            if (!log || log.type !== 'task') return log;
            const cleanedDescription = stripOpenMarkerFromDescription(log.description);
            if (cleanedDescription !== String(log.description || '')) {
                changed = true;
                return {
                    ...log,
                    description: cleanedDescription
                };
            }
            return log;
        });

        if (changed) {
            localStorage.setItem('warSmartLog', JSON.stringify(migratedLogs));
        }
    }

    function migrateStoredLogsForLifecycle() {
        const logs = getLogs();
        if (!Array.isArray(logs) || logs.length === 0) return;

        const normalizedLogs = normalizeLogs(logs);
        if (JSON.stringify(normalizedLogs) !== JSON.stringify(logs)) {
            localStorage.setItem('warSmartLog', JSON.stringify(normalizedLogs));
        }
    }

    function filterLogsByPeriod(logs, periodSelection) {
        if (periodSelection === 'rolling365') {
            return getLogsForLast365Days(logs);
        }

        if (/^\d{4}-\d{2}$/.test(periodSelection)) {
            return logs.filter(log => log.date && log.date.startsWith(periodSelection));
        }

        if (/^\d{4}$/.test(periodSelection)) {
            return logs.filter(log => log.date && log.date.startsWith(`${periodSelection}-`));
        }

        return logs;
    }
    
    // --- FEATURE: AUTOCOMPLETE ---
    function populateAutocomplete() {
        const allLogs = getLogs();
        const selectedMonth = monthFilter.value;
        const logsForSuggestions = filterLogsByJobMode(filterLogsByPeriod(allLogs, selectedMonth));
        const wordSet = new Set();
        const commonWords = new Set(['a', 'an', 'the', 'in', 'on', 'for', 'and', 'with', 'to', 'of', 'is', 'it', 'was', 'were']);
        logsForSuggestions.forEach(log => {
            const textCorpus = [ log.description, log.project, log.category, log.subject, log.mitigation ].join(' ');
            tokenizeForSearch(textCorpus).forEach(word => {
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
        if (retainSelection && monthFilter.querySelector(`option[value="${currentSelection}"]`)) {
            monthFilter.value = currentSelection;
        } else if (logs.length > 0) {
            const logsWithDates = logs.filter(l => l && l.date);
            if (logsWithDates.length > 0) {
                const mostRecentMonth = logsWithDates
                    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
                    .date
                    .substring(0, 7);
                monthFilter.value = mostRecentMonth;
            } else {
                monthFilter.value = 'all';
            }
        } else {
            monthFilter.value = 'all';
        }
        populateAutocomplete();
        renderLogs();
        updateAiButtonContext();
        adjustLogViewHeight();
    };

    // --- HELPER: Get Local Date String ---
    function getLocalDateString(date = new Date()) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function showSaveToast(message, variant = 'success') {
        let toast = document.getElementById('save-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'save-toast';
            toast.className = 'save-toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.remove('error');
        if (variant === 'error') {
            toast.classList.add('error');
        }
        toast.classList.add('visible');

        if (saveToastTimer) {
            clearTimeout(saveToastTimer);
        }

        saveToastTimer = setTimeout(() => {
            toast.classList.remove('visible');
        }, 4000);
    }

    function showErrorToast(message) {
        showSaveToast(message, 'error');
    }

    function initializeDateInputs() {
        const today = getLocalDateString();
        ['task-date', 'meeting-date', 'risk-date', 'generic-date'].forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = today;
        });
        if (taskCompletedDateInput) taskCompletedDateInput.value = '';
    }

    function updateTaskLifecycleFieldVisibility() {
        if (!taskCompletedDateWrapper) return;
        const isTaskForm = logTypeSelector.value === 'task';
        const isCompleted = document.getElementById('task-status')?.value === 'Completed';
        taskCompletedDateWrapper.style.display = isTaskForm && isCompleted ? 'block' : 'none';

        if (isTaskForm && isCompleted && taskCompletedDateInput && !taskCompletedDateInput.value) {
            taskCompletedDateInput.value = getLocalDateString();
        }

        if (isTaskForm && !isCompleted && taskCompletedDateInput) {
            taskCompletedDateInput.value = '';
        }

        adjustLogViewHeight();
    }

    // --- INITIALIZATION ---
    async function initialize() {
        await loadConfig();
        applyControlConfig();
        populateJobModes();
        setupEventListeners();
        updateFormVisibility();
        updateCategoryDropdown();
        migrateStoredTaskDescriptions();
        migrateStoredLogsForLifecycle();
        initializeDateInputs();
        updateTaskLifecycleFieldVisibility();
        saveLogsAndRender(getLogs());
    }

    
    // --- SETUP EVENT LISTENERS ---
    function setupEventListeners() {
        toggleViewBtn.addEventListener('click', toggleView);
        logTypeSelector.addEventListener('change', updateFormVisibility);
        jobModeSelector.addEventListener('change', () => {
            updateCategoryDropdown();
            renderLogs();
            renderDrilldownChip();
            updateAiButtonContext();
            populateAutocomplete();
            if (dashboardContainer.style.display !== 'none') {
                renderDashboard();
            }
        });
        if (jobModeFilterToggle) {
            jobModeFilterToggle.addEventListener('change', () => {
                localStorage.setItem(JOB_MODE_FILTER_STORAGE_KEY, jobModeFilterToggle.checked ? '1' : '0');
                renderLogs();
                renderDrilldownChip();
                updateAiButtonContext();
                populateAutocomplete();
                if (dashboardContainer.style.display !== 'none') {
                    renderDashboard();
                }
            });
        }
        taskCategorySelect.addEventListener('change', () => {
            updateProjectFieldVisibility();
            updateOtherCategoryVisibility();
        });
        const taskStatusSelect = document.getElementById('task-status');
        if (taskStatusSelect) taskStatusSelect.addEventListener('change', updateTaskLifecycleFieldVisibility);
        logForm.addEventListener('submit', handleFormSubmit);
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', handleImport);
        if (sampleLogLoadBtn) sampleLogLoadBtn.addEventListener('click', handleLoadSampleLog);
        exportBtn.addEventListener('click', handleExport);
        if (resetViewBtn) resetViewBtn.addEventListener('click', resetCurrentView);
        clearMonthBtn.addEventListener('click', clearCurrentViewLogs);
        if (drilldownClearBtn) drilldownClearBtn.addEventListener('click', clearDrilldown);
        monthFilter.addEventListener('change', () => {
            populateAutocomplete();
            if (activeDrilldown.type || activeDrilldown.category || activeDrilldown.status) {
                clearDrilldown();
                return;
            }
            renderLogs();
            updateAiButtonContext();
            renderDrilldownChip();
        });
        if (aiReportBtn) aiReportBtn.addEventListener('click', handleGenerateAiReport);
        window.addEventListener('resize', adjustLogViewHeight);
        const handleSearchUpdate = () => {
            renderLogs();
            updateAiButtonContext();
            renderDrilldownChip();
        };
        searchInput.addEventListener('input', handleSearchUpdate);
        searchInput.addEventListener('change', handleSearchUpdate);

        const metricMap = {
            'metric-tasks': 'task',
            'metric-meetings': 'meeting',
            'metric-risks': 'risk',
            'metric-accolades': 'accolade',
            'metric-requirements': 'requirement',
            'metric-notes': 'note'
        };

        Object.entries(metricMap).forEach(([metricId, logType]) => {
            const metricEl = document.getElementById(metricId);
            if (!metricEl) return;
            const tile = metricEl.closest('.metric-item') || metricEl;
            tile.style.cursor = 'pointer';
            tile.title = `Show ${logType} entries`;
            tile.addEventListener('click', () => {
                setDrilldown({ type: logType, category: null });
                if (dashboardContainer.style.display !== 'none') toggleView();
            });
        });

        const statusMetricMap = {
            'metric-in-progress': 'In Progress',
            'metric-on-hold': 'On Hold'
        };

        Object.entries(statusMetricMap).forEach(([metricId, status]) => {
            const metricEl = document.getElementById(metricId);
            if (!metricEl) return;
            const tile = metricEl.closest('.metric-item') || metricEl;
            tile.style.cursor = 'pointer';
            tile.title = `Show ${status} tasks`;
            tile.addEventListener('click', () => {
                setDrilldown({ type: 'task', category: null, status });
                if (dashboardContainer.style.display !== 'none') toggleView();
            });
        });
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
        updateTaskLifecycleFieldVisibility();
    }

    // --- MAIN FORM SUBMIT HANDLER ---
    function handleFormSubmit(e) {
        e.preventDefault();
        const logs = getLogs();
        const type = logTypeSelector.value;
        let newEntry = { id: logIdInput.value || Date.now().toString(), type: type };
        const existingEntry = logs.find(log => log.id === newEntry.id);
        let saveMessage = existingEntry ? 'Updated entry' : 'Added entry';
        if (type === 'task') {
            newEntry.jobMode = jobModeSelector.value;
            newEntry.date = document.getElementById('task-date').value;
            newEntry.project = document.getElementById('task-project').value.trim();
            newEntry.status = document.getElementById('task-status').value;
            newEntry.description = stripOpenMarkerFromDescription(document.getElementById('task-description').value);
            const categoryValue = taskCategorySelect.value;
            if (categoryValue === 'Other') {
                newEntry.category = taskCategoryOtherInput.value.trim() || 'Other';
            } else {
                newEntry.category = categoryValue;
            }

            const isOpenStatus = newEntry.status === 'In Progress' || newEntry.status === 'On Hold';
            const wasOpenStatus = existingEntry && (existingEntry.status === 'In Progress' || existingEntry.status === 'On Hold');
            const manualCompletedDate = taskCompletedDateInput ? taskCompletedDateInput.value : '';
            newEntry.startDate = newEntry.date || getLocalDateString();

            if (newEntry.status === 'Completed') {
                newEntry.completedDate = manualCompletedDate || (wasOpenStatus ? getLocalDateString() : (newEntry.date || getLocalDateString()));
            } else {
                delete newEntry.completedDate;
            }

            if (newEntry.status === 'Completed') {
                const completedDays = getElapsedDays(newEntry.date, newEntry.completedDate || newEntry.date || getLocalDateString());
                saveMessage = `Saved: ${newEntry.category} (Completed${completedDays !== null ? ` ${completedDays}d` : ''})`;
            } else {
                saveMessage = `Saved: ${newEntry.category} (${newEntry.status})`;
            }
        } else if (type === 'meeting') {
            newEntry.date = document.getElementById('meeting-date').value;
            newEntry.subject = document.getElementById('meeting-subject').value;
            newEntry.attendees = document.getElementById('meeting-attendees').value;
            newEntry.duration = document.getElementById('meeting-duration').value;
            saveMessage = `Saved: Meeting (${newEntry.subject || 'Untitled'})`;
        } else if (type === 'risk') {
            newEntry.date = document.getElementById('risk-date').value;
            newEntry.description = document.getElementById('risk-description').value;
            newEntry.probability = document.getElementById('risk-probability').value;
            newEntry.impact = document.getElementById('risk-impact').value;
            newEntry.mitigation = document.getElementById('risk-mitigation').value;
            saveMessage = `Saved: Risk (${newEntry.impact || 'N/A'} impact)`;
        } else {
            newEntry.date = document.getElementById('generic-date').value;
            newEntry.description = document.getElementById('generic-description').value;
            saveMessage = `Saved: ${type.charAt(0).toUpperCase() + type.slice(1)} entry`;
        }
        const existingIndex = logs.findIndex(log => log.id === newEntry.id);
        if (existingIndex > -1) logs[existingIndex] = newEntry; else logs.unshift(newEntry);
        saveLogsAndRender(logs, true);
        showSaveToast(saveMessage);
        logForm.reset();
        logIdInput.value = '';
        initializeDateInputs();
        updateFormVisibility();
        updateTaskLifecycleFieldVisibility();
    }

    // --- RENDER & FILTER ---
    function getFilteredLogs() {
        const allLogs = getLogs();
        const selectedMonth = monthFilter.value;
        const searchTokens = tokenizeForSearch(searchInput.value);
        const monthFilteredLogs = filterLogsByJobMode(filterLogsByPeriod(allLogs, selectedMonth));
        const drilldownFiltered = monthFilteredLogs.filter(log => {
            if (activeDrilldown.type && log.type !== activeDrilldown.type) return false;
            if (activeDrilldown.category && log.category !== activeDrilldown.category) return false;
            if (activeDrilldown.status && log.status !== activeDrilldown.status) return false;
            return true;
        });

        if (searchTokens.length === 0) { return drilldownFiltered; }

        return drilldownFiltered.filter(log => {
            const searchableContent = [log.description, log.project, log.category, log.status, log.subject, log.attendees, log.mitigation].join(' ');
            const logTokens = new Set(tokenizeForSearch(searchableContent));
            return searchTokens.every(token => logTokens.has(token));
        });
    }

    function renderDrilldownChip() {
        if (!drilldownContainer || !drilldownText) return;
        const parts = [];
        if (activeDrilldown.type) {
            parts.push(`Type: ${activeDrilldown.type.charAt(0).toUpperCase() + activeDrilldown.type.slice(1)}`);
        }
        if (activeDrilldown.category) {
            parts.push(`Category: ${activeDrilldown.category}`);
        }
        if (activeDrilldown.status) {
            parts.push(`Status: ${activeDrilldown.status}`);
        }

        if (parts.length === 0) {
            drilldownContainer.classList.add('hidden');
            drilldownText.textContent = '';
            return;
        }

        drilldownText.textContent = `Drilldown active — ${parts.join(' • ')}`;
        drilldownContainer.classList.remove('hidden');
    }

    function setDrilldown(next) {
        activeDrilldown = {
            type: next?.type ?? null,
            category: next?.category ?? null,
            status: next?.status ?? null,
        };
        renderDrilldownChip();
        renderLogs();
        updateAiButtonContext();
    }

    function clearDrilldown() {
        setDrilldown({ type: null, category: null, status: null });
    }

    function getLogsForReport() {
        const allLogs = getLogs();
        const selectedMonth = monthFilter.value;
        return filterLogsByJobMode(filterLogsByPeriod(allLogs, selectedMonth));
    }

    function getLogsForSelectedYear() {
        const allLogs = getLogs().filter(log => log.date);
        if (allLogs.length === 0) return [];

        const selectedMonth = monthFilter.value;
        let targetYear = '';

        if (selectedMonth && selectedMonth !== 'all') {
            [targetYear] = selectedMonth.split('-');
        } else {
            const latestDate = allLogs.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
            [targetYear] = latestDate.split('-');
        }

        return filterLogsByJobMode(allLogs.filter(log => log.date && log.date.startsWith(`${targetYear}-`)));
    }

    function getLogsForAiScope(scope) {
        if (scope === 'month') return getLogsForReport();
        if (scope === 'year') return getLogsForSelectedYear();
        if (scope === 'rolling365') return filterLogsByJobMode(getLogsForLast365Days());
        return getFilteredLogs();
    }

    function detectAiModeFromView() {
        const hasSearchFilter = Boolean(searchInput.value.toLowerCase().trim());
        if (hasSearchFilter) {
            return {
                key: 'filtered',
                label: 'Filtered View',
                scope: 'filtered',
                template: 'monthly'
            };
        }

        if (monthFilter.value === 'all') {
            return {
                key: 'allmonths',
                label: 'All Months',
                scope: 'filtered',
                template: 'resume'
            };
        }

        if (/^\d{4}-\d{2}$/.test(monthFilter.value)) {
            return {
                key: 'month',
                label: 'Entire Month',
                scope: 'month',
                template: 'monthly'
            };
        }

        if (/^\d{4}$/.test(monthFilter.value)) {
            return {
                key: 'year',
                label: 'Entire Year',
                scope: 'year',
                template: 'annual'
            };
        }

        if (monthFilter.value === 'rolling365') {
            return {
                key: 'rolling365',
                label: 'Last 365 Days',
                scope: 'rolling365',
                template: 'annual'
            };
        }

        return {
            key: 'year',
            label: 'Entire Year',
            scope: 'year',
            template: 'annual'
        };
    }

    function updateAiButtonContext() {
        if (!aiReportBtn) return;
        const mode = detectAiModeFromView();
        const logs = getLogsForAiScope(mode.scope);
        const modeTextByKey = {
            filtered: 'Filtered',
            month: 'Monthly',
            year: 'Annual',
            rolling365: 'Annual',
            allmonths: 'Resume'
        };
        const modeText = modeTextByKey[mode.key] || mode.key;
        aiReportBtn.textContent = `AI Report (${modeText})`;
        aiReportBtn.title = `AI mode: ${mode.label} (${logs.length} entr${logs.length === 1 ? 'y' : 'ies'})`;
    }

    function populateMonthFilter() {
        const logs = getLogs();
        const uniqueMonths = [...new Set(logs.map(log => log.date ? log.date.substring(0, 7) : null).filter(Boolean))];
        const uniqueYears = [...new Set(uniqueMonths.map(monthStr => monthStr.substring(0, 4)))];

        uniqueYears.sort((a, b) => Number(a) - Number(b));
        uniqueMonths.sort();

        const currentSelection = monthFilter.value;
        monthFilter.innerHTML = '<option value="all">All Months</option>';
        monthFilter.add(new Option('Last 365 Days', 'rolling365'));

        uniqueYears.forEach(yearStr => {
            const option = new Option(yearStr, yearStr);
            monthFilter.add(option);
        });

        uniqueMonths.forEach(monthStr => {
            const [year, month] = monthStr.split('-');
            const date = new Date(year, month - 1);
            const option = new Option(date.toLocaleString('default', { month: 'long', year: 'numeric' }), monthStr);
            monthFilter.add(option);
        });

        const isValidSelection = currentSelection === 'all'
            || currentSelection === 'rolling365'
            || uniqueYears.includes(currentSelection)
            || uniqueMonths.includes(currentSelection);

        if (isValidSelection) {
            monthFilter.value = currentSelection;
        }
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
                    const taskIsOpen = log.status === 'In Progress' || log.status === 'On Hold';
                    const taskIsCompleted = log.status === 'Completed';
                    const startDateForOpen = log.date || log.startDate;
                    const elapsedDays = taskIsOpen ? getElapsedDays(startDateForOpen) : null;
                    const completedDays = taskIsCompleted
                        ? getElapsedDays(log.date || log.startDate, log.completedDate || log.date || getLocalDateString())
                        : null;
                    const statusWithAgeHtml = taskIsOpen && elapsedDays !== null
                        ? `<span class="${log.status === 'On Hold' ? 'status-hold' : 'status-open'}">${log.status} ${elapsedDays}d</span>`
                        : taskIsCompleted && completedDays !== null
                            ? `<span class="status-completed">${log.status} ${completedDays}d</span>`
                            : log.status;
                    const cleanedDescription = stripOpenMarkerFromDescription(log.description);
                    const projectHtml = log.project ? `<strong>Project:</strong> ${log.project}<br>` : '';
                    detailsHtml = `${projectHtml}<strong>${log.category}</strong> (${statusWithAgeHtml}): ${cleanedDescription}`;
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
                    const normalizedLogs = normalizeLogs(logsFromFile);
                    saveLogsAndRender(normalizedLogs);
                    alert(`Successfully imported ${normalizedLogs.length} log entries.`);
                } else alert('Invalid file format.');
            } catch (error) { alert('Error parsing file.'); }
        };
        reader.readAsText(file);
        importFile.value = '';
    }

    async function handleLoadSampleLog() {
        if (getLogs().length > 0 && !confirm('This will overwrite your current logs with the sample log. Continue?')) return;
        try {
            const response = await fetch(`./work_log_sample_2y_high_volume.json?cacheBust=${Date.now()}`, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }

            const logsFromSample = await response.json();
            if (!Array.isArray(logsFromSample)) {
                throw new Error('Sample file format is invalid.');
            }

            const normalizedLogs = normalizeLogs(logsFromSample);
            saveLogsAndRender(normalizedLogs);
            showSaveToast(`Loaded sample log (${normalizedLogs.length} entries)`);
        } catch (error) {
            console.error('Failed to load sample log:', error);
            showErrorToast('Could not load sample log. Check that sample JSON exists and app is served via http://.');
        }
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

    function clearCurrentViewLogs() {
        const visibleLogs = getFilteredLogs();
        if (visibleLogs.length === 0) {
            alert('There are no currently visible entries to delete.');
            return;
        }

        if (confirm(`This will delete ${visibleLogs.length} currently visible log entr${visibleLogs.length === 1 ? 'y' : 'ies'}. Are you sure?`)) {
            const visibleIds = new Set(visibleLogs.map(log => log.id));
            const remainingLogs = getLogs().filter(log => !visibleIds.has(log.id));
            saveLogsAndRender(remainingLogs, true);
        }
    }

    function resetCurrentView() {
        searchInput.value = '';
        const currentMonthValue = getLocalDateString().substring(0, 7);
        const allLogs = getLogs().filter(log => log && log.date);
        const hasCurrentMonthData = allLogs.some(log => log.date.startsWith(`${currentMonthValue}-`));

        if (hasCurrentMonthData) {
            if (!monthFilter.querySelector(`option[value="${currentMonthValue}"]`)) {
                const [year, month] = currentMonthValue.split('-');
                const dateForLabel = new Date(Number(year), Number(month) - 1, 1);
                const optionLabel = dateForLabel.toLocaleString('default', { month: 'long', year: 'numeric' });
                const currentMonthOption = new Option(optionLabel, currentMonthValue);
                monthFilter.add(currentMonthOption);
            }
            monthFilter.value = currentMonthValue;
        } else {
            const mostRecentMonthWithData = allLogs
                .map(log => log.date.substring(0, 7))
                .sort()
                .pop();
            monthFilter.value = mostRecentMonthWithData || 'all';
        }
        if (jobModeFilterToggle) {
            jobModeFilterToggle.checked = false;
            localStorage.setItem(JOB_MODE_FILTER_STORAGE_KEY, '0');
        }
        clearDrilldown();
        populateAutocomplete();
        renderLogs();
        updateAiButtonContext();
        renderDrilldownChip();
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
            if (jobModeSelector) {
                const jobModeKeys = Object.keys(config.jobModes || {});
                jobModeSelector.value = logToEdit.jobMode || jobModeKeys[0] || '';
                if (jobModeSelector.value) {
                    localStorage.setItem(JOB_MODE_STORAGE_KEY, jobModeSelector.value);
                }
            }
            updateCategoryDropdown();
            document.getElementById('task-date').value = logToEdit.date;
            document.getElementById('task-status').value = logToEdit.status;
            if (taskCompletedDateInput) taskCompletedDateInput.value = logToEdit.completedDate || '';
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
            updateTaskLifecycleFieldVisibility();
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

    function getPromptTemplate(templateType) {
        const prompts = aiConfig.prompts || {};
        const selectedPrompt = prompts[templateType];
        if (Array.isArray(selectedPrompt)) {
            return selectedPrompt.join('\n');
        }
        return typeof selectedPrompt === 'string' ? selectedPrompt : '';
    }

    function copyAiPromptToClipboard(fullTextToCopy, sourceLogsCount) {
        navigator.clipboard.writeText(fullTextToCopy).then(() => {
            const originalText = aiReportBtn.textContent;
            aiReportBtn.textContent = `Copied (${sourceLogsCount})`;
            aiReportBtn.style.backgroundColor = '#28a745';
            setTimeout(() => {
                aiReportBtn.textContent = originalText;
                aiReportBtn.style.backgroundColor = '#007bff';
            }, 2500);
        }).catch(err => {
            alert('Failed to copy summary. See console for details.');
            console.error(err);
        });
    }

    function handleGenerateAiReport() {
        const selectedMode = detectAiModeFromView();
        const scope = selectedMode.scope;
        const template = selectedMode.template;
        const logs = getLogsForAiScope(scope);

        if (logs.length === 0) {
            alert('No logs available for the selected AI scope.');
            return;
        }

        const aiPrompt = getPromptTemplate(template);
        if (!aiPrompt) {
            alert(`Missing AI prompt template for '${template}'. Check ai_config.json.`);
            return;
        }
        const formattedLogData = formatLogsForAI(logs);
        const templateLabelMap = {
            monthly: 'Monthly Summary',
            annual: 'Annual Review',
            resume: 'Resume Builder'
        };
        const templateLabel = templateLabelMap[template] || template;
        const fullTextToCopy = `AI PROMPT (${templateLabel} - ${selectedMode.label}):\n${aiPrompt}\n\n--- RAW LOG DATA ---\n${formattedLogData}`;
        copyAiPromptToClipboard(fullTextToCopy, logs.length);
    }

    // --- RUN APPLICATION ---
    if (jobModeFilterToggle) {
        jobModeFilterToggle.checked = localStorage.getItem(JOB_MODE_FILTER_STORAGE_KEY) === '1';
    }
    initialize();
});
