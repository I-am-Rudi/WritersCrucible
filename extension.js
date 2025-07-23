// extension.js v2.4.0
// Main logic file for the Writer's Crucible extension.
// Now tracks all character input with configurable character limits per operation.

const vscode = require('vscode');

// --- Constants and Global State ---
const STATE_KEY = 'writersCrucibleState';
let statusBarItem;
let lastCharacterCount = 0;
let webviewPanel = null;
let commitTimer = null;

// --- Core Activation ---

function activate(context) {
    console.log('Writer\'s Crucible v2.4 is now active!');
    
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);
    registerCommands(context);
    registerEventListeners(context);
    updateAll(context);
    
    // Start the timer to commit pending characters periodically
    commitTimer = setInterval(() => {
        commitPendingChars(context);
    }, 5000); // Run every 5 seconds
    
    // Clean up timer on deactivation
    context.subscriptions.push({
        dispose: () => {
            if (commitTimer) {
                clearInterval(commitTimer);
                commitTimer = null;
            }
        }
    });
}

function registerCommands(context) {
    context.subscriptions.push(vscode.commands.registerCommand('writers-crucible.startChallenge', () => startChallengeCommand(context)));
    context.subscriptions.push(vscode.commands.registerCommand('writers-crucible.showStats', () => showStatsCommand(context)));
    context.subscriptions.push(vscode.commands.registerCommand('writers-crucible.visualizeStats', () => visualizeStatsCommand(context)));
    context.subscriptions.push(vscode.commands.registerCommand('writers-crucible.resetTodaysCount', () => resetTodaysCountCommand(context)));
    context.subscriptions.push(vscode.commands.registerCommand('writers-crucible.addRevisionTime', () => addRevisionTimeCommand(context)));
    context.subscriptions.push(vscode.commands.registerCommand('writers-crucible.addCitation', () => addCitationCommand(context)));
    context.subscriptions.push(vscode.commands.registerCommand('writers-crucible.resetChallenge', () => resetChallenge(context)));
    context.subscriptions.push(vscode.commands.registerCommand('writers-crucible.pauseTracking', () => pauseTrackingCommand(context)));
    context.subscriptions.push(vscode.commands.registerCommand('writers-crucible.correctCount', () => correctCountCommand(context)));
}

function registerEventListeners(context) {
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => updateAll(context)));
    
    // The text document change listener now passes the full event object
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
            handleTextChange(event, context);
        }
    }));
    
    // Listen for inline completion acceptances
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(event => {
        // Check if this might be an inline completion acceptance
        if (event.kind === vscode.TextEditorSelectionChangeKind.Command) {
            // Check if the document content changed recently without a corresponding text change event
            const currentCharCount = getCharacterCount(event.textEditor.document);
            if (currentCharCount !== lastCharacterCount) {
                const charDifference = currentCharCount - lastCharacterCount;
                
                if (charDifference > 0) {
                    // Simulate a text change event for the inline completion
                    const simulatedEvent = {
                        document: event.textEditor.document,
                        contentChanges: [{
                            text: ''.repeat(charDifference), // We don't have the actual text, but we know the length
                            textLength: charDifference,
                            rangeLength: 0,
                            range: event.selections[0], // Use current selection as approximate range
                        }],
                        reason: 'inline-completion'
                    };
                    
                    handleTextChange(simulatedEvent, context);
                }
            }
        }
    }));
    
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => updateAll(context)));
}

// --- State Management ---

function getStateManager(context) {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        return context.workspaceState;
    }
    return context.globalState;
}

function loadState(context) {
    const stateManager = getStateManager(context);
    const savedState = stateManager.get(STATE_KEY);
    const defaultState = {
        goal: 0,
        dailyCount: 0,
        lastUpdateDate: new Date().toDateString(),
        challengeName: 'No Challenge Set',
        history: [],
        pendingChars: [], // New: buffer for grace period characters
        trackingPaused: false, // New: tracking pause state
    };
    return savedState || defaultState;
}

function saveState(context, state) {
    const stateManager = getStateManager(context);
    stateManager.update(STATE_KEY, state);
}

// --- Command Implementations ---

async function startChallengeCommand(context) {
    const challengeOptions = [
        { label: 'Micro-Sprint', description: '500 characters/day', target: 500 },
        { label: 'Standard Kilo-Challenge', description: '1,000 characters/day', target: 1000 },
        { label: 'Marathoner\'s Pace', description: '2,000 characters/day', target: 2000 },
        { label: '3K Crucible', description: '3,000 characters/day', target: 3000 },
        { label: 'Custom Challenge', description: 'Set your own daily goal', target: 'custom' }
    ];
    const picked = await vscode.window.showQuickPick(challengeOptions, { placeHolder: 'Choose your daily writing challenge' });
    if (picked) {
        let state = loadState(context);
        
        if (picked.target === 'custom') {
            const customGoal = await vscode.window.showInputBox({
                prompt: 'Enter your daily character goal',
                placeHolder: 'e.g., 1500',
                validateInput: (value) => {
                    const num = parseInt(value);
                    if (isNaN(num) || num <= 0) {
                        return 'Please enter a valid positive number';
                    }
                    if (num > 50000) {
                        return 'Goal seems too high. Please enter a number under 50,000';
                    }
                    return null;
                }
            });
            
            if (customGoal === undefined) {
                return; // User cancelled
            }
            
            const goal = parseInt(customGoal);
            state.goal = goal;
            state.challengeName = `Custom Challenge (${goal.toLocaleString()} chars/day)`;
        } else {
            state.goal = picked.target;
            state.challengeName = picked.label;
        }
        
        if (state.lastUpdateDate === new Date().toDateString()) {
            state.dailyCount = 0;
        }
        saveState(context, state);
        vscode.window.showInformationMessage(`Challenge Started: ${state.challengeName}. Good luck!`);
        updateAll(context);
    }
}

async function showStatsCommand(context) {
    const state = loadState(context);
    const stats = calculateStatistics(state);
    const content = `
# Writer's Crucible Statistics

**Project:** ${vscode.workspace.name || 'Global (No Project Folder)'}
**Current Challenge:** ${state.challengeName} (${state.goal.toLocaleString()} chars/day)

---

## Lifetime Statistics
- **Total Characters Written:** ${stats.totalChars.toLocaleString()}
- **Total Writing Days:** ${stats.totalDays}
- **Longest Writing Streak:** ${stats.streak} days
- **Average Characters per Day:** ${stats.avgPerDay.toLocaleString()}

---

## Daily History
${stats.historyLog}
    `;
    const doc = await vscode.workspace.openTextDocument({ content, language: 'markdown' });
    await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
}

function visualizeStatsCommand(context) {
    const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    const state = loadState(context);

    if (webviewPanel) {
        webviewPanel.webview.html = getWebviewContent(state);
        webviewPanel.reveal(columnToShowIn);
    } else {
        webviewPanel = vscode.window.createWebviewPanel(
            'writersCrucibleStats',
            'Writer\'s Crucible Stats',
            columnToShowIn || vscode.ViewColumn.One,
            { enableScripts: true }
        );
        webviewPanel.webview.html = getWebviewContent(state);
        webviewPanel.onDidDispose(() => {
            webviewPanel = null;
        }, null, context.subscriptions);
    }
}

async function resetTodaysCountCommand(context) {
    const confirm = await vscode.window.showWarningMessage(
        "Are you sure you want to reset today's character count to zero? This cannot be undone.",
        { modal: true },
        'Yes, Reset Today'
    );

    if (confirm === 'Yes, Reset Today') {
        let state = loadState(context);
        state.dailyCount = 0;
        saveState(context, state);
        if (vscode.window.activeTextEditor) {
            lastCharacterCount = getCharacterCount(vscode.window.activeTextEditor.document);
        }
        updateStatusBar(state);
        vscode.window.showInformationMessage("Today's character count has been reset.");
    }
}


async function addRevisionTimeCommand(context) {
    let state = loadState(context);
    if (state.goal < 3000) {
        vscode.window.showWarningMessage('This command is available for challenges with 3,000+ characters per day.');
        return;
    }
    const confirm = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Add 1,000 characters for 30 mins of revision?' });
    if (confirm === 'Yes') {
        updateDailyCount(1000, context);
        vscode.window.showInformationMessage('1,000 characters added for revision work.');
    }
}

async function addCitationCommand(context) {
    let state = loadState(context);
    if (state.goal < 2000) {
        vscode.window.showWarningMessage('This command is available for challenges with 2,000+ characters per day.');
        return;
    }
    const confirm = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Add 50 characters for one formatted citation?' });
    if (confirm === 'Yes') {
        updateDailyCount(50, context);
        vscode.window.showInformationMessage('50 characters added for a citation.');
    }
}

async function resetChallenge(context) {
    const confirm = await vscode.window.showWarningMessage('Are you sure you want to reset all challenge data for this project?', { modal: true }, 'Yes, Reset All');
    if (confirm === 'Yes, Reset All') {
        saveState(context, undefined);
        lastCharacterCount = 0;
        updateAll(context);
        vscode.window.showInformationMessage('Writer\'s Crucible data for this project has been reset.');
    }
}

async function pauseTrackingCommand(context) {
    let state = loadState(context);
    state.trackingPaused = !state.trackingPaused;
    saveState(context, state);
    
    const status = state.trackingPaused ? 'paused' : 'resumed';
    vscode.window.showInformationMessage(`Character tracking has been ${status}.`);
    updateStatusBar(state);
}

async function correctCountCommand(context) {
    let state = loadState(context);
    const currentCount = state.dailyCount || 0;
    
    const input = await vscode.window.showInputBox({
        prompt: `Enter the number of characters to subtract from today's count (Current: ${currentCount})`,
        placeHolder: 'e.g., 100',
        validateInput: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num <= 0) {
                return 'Please enter a valid positive number to subtract';
            }
            if (num > currentCount) {
                return `Cannot subtract more than current count (${currentCount})`;
            }
            return null;
        }
    });
    
    if (input !== undefined) {
        const correction = parseInt(input);
        const oldCount = state.dailyCount || 0;
        state.dailyCount = oldCount - correction;
        saveState(context, state);
        
        vscode.window.showInformationMessage(`Subtracted ${correction} characters. New count: ${state.dailyCount}`);
        updateStatusBar(state);
        
        if (webviewPanel) {
            webviewPanel.webview.html = getWebviewContent(state);
        }
    }
}

// --- Core Logic & Event Handlers ---

function updateAll(context) {
    let state = loadState(context);
    state = checkDateAndReset(state, context);
    updateStatusBar(state);
    if (vscode.window.activeTextEditor) {
        lastCharacterCount = getCharacterCount(vscode.window.activeTextEditor.document);
    } else {
        lastCharacterCount = 0;
    }
}

/**
 * *** UPDATED FOR UNIVERSAL CHARACTER TRACKING WITH CONFIGURABLE LIMIT ***
 * Handles character count changes when the user types, pastes, or deletes.
 * @param {vscode.TextDocumentChangeEvent} event The full event object from the listener.
 * @param {vscode.ExtensionContext} context
 */
function handleTextChange(event, context) {
    const doc = event.document;
    
    let state = loadState(context);
    
    // If tracking is paused, still update the character count for UI but don't track changes
    if (state.trackingPaused) {
        lastCharacterCount = getCharacterCount(doc);
        return;
    }
    
    // Get configurable values
    const gracePeriod = vscode.workspace.getConfiguration('writers-crucible').get('undoGracePeriod', 30) * 1000; // Convert to ms
    const maxTrackedChars = vscode.workspace.getConfiguration('writers-crucible').get('maxTrackedChars', 50);

    let trackedCharCount = 0;

    // Analyze all the changes that happened in this event
    for (const change of event.contentChanges) {
        if (change.text.length > 0 && change.rangeLength === 0) {
            // --- This is an ADDITION ---
            // Track up to maxTrackedChars characters from this input
            const charsToTrack = Math.min(change.text.length, maxTrackedChars);
            
            if (!state.pendingChars) {
                state.pendingChars = [];
            }
            state.pendingChars.push({
                count: charsToTrack,
                timestamp: Date.now()
            });
            trackedCharCount += charsToTrack;
        } else if (change.text.length === 0 && change.rangeLength > 0) {
            // --- This is a DELETION ---
            let charsToDelete = change.rangeLength;
            
            if (!state.pendingChars) {
                state.pendingChars = [];
            }
            
            // Go through the buffer from newest to oldest and remove recent additions
            while (charsToDelete > 0 && state.pendingChars.length > 0) {
                let lastAddition = state.pendingChars[state.pendingChars.length - 1];
                
                if (Date.now() - lastAddition.timestamp < gracePeriod) {
                    if (lastAddition.count > charsToDelete) {
                        lastAddition.count -= charsToDelete;
                        charsToDelete = 0;
                    } else {
                        charsToDelete -= lastAddition.count;
                        state.pendingChars.pop(); // Remove the entry entirely
                    }
                } else {
                    // Stop if we reach an entry that is too old to be undone
                    break;
                }
            }
        } else if (change.text.length > 0 && change.rangeLength > 0) {
            // --- This is a REPLACEMENT ---
            // For replacements, we track the net addition (if any)
            const netAddition = change.text.length - change.rangeLength;
            if (netAddition > 0) {
                const charsToTrack = Math.min(netAddition, maxTrackedChars);
                
                if (!state.pendingChars) {
                    state.pendingChars = [];
                }
                state.pendingChars.push({
                    count: charsToTrack,
                    timestamp: Date.now()
                });
                trackedCharCount += charsToTrack;
            }
        }
    }

    // Save state and update UI
    saveState(context, state);
    updateStatusBar(state);
    
    // The overall character count needs to be updated regardless,
    // so that subsequent deletions are calculated from the correct total.
    lastCharacterCount = getCharacterCount(doc);
    
    // Update webview if it's open
    if (webviewPanel) {
        webviewPanel.webview.html = getWebviewContent(state);
    }
}


function checkDateAndReset(state, context) {
    const today = new Date().toDateString();
    if (state.lastUpdateDate !== today) {
        if (state.dailyCount > 0) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yyyy_mm_dd = yesterday.toISOString().split('T')[0];
            const existingEntryIndex = state.history.findIndex(h => h.date === yyyy_mm_dd);
            if (existingEntryIndex > -1) {
                state.history[existingEntryIndex].count = state.dailyCount;
            } else {
                state.history.push({ date: yyyy_mm_dd, count: state.dailyCount });
            }
        }
        state.dailyCount = 0;
        state.lastUpdateDate = today;
        saveState(context, state);
        vscode.window.showInformationMessage('A new day has begun! Your character count has been reset.');
    }
    return state;
}

function updateDailyCount(amount, context) {
    let state = loadState(context);
    const oldCount = state.dailyCount || 0;
    state = checkDateAndReset(state, context);
    state.dailyCount = (state.dailyCount || 0) + amount;

    if (state.goal > 0 && oldCount < state.goal && state.dailyCount >= state.goal) {
        vscode.window.showInformationMessage(`🎉 Goal Complete! You've written ${state.dailyCount.toLocaleString()} characters today. Well done!`);
    }

    saveState(context, state);
    updateStatusBar(state);

    if (webviewPanel) {
        webviewPanel.webview.html = getWebviewContent(state);
    }
}


function updateStatusBar(state) {
    // Calculate display count including both committed and pending characters
    const pendingTotal = (state.pendingChars || []).reduce((sum, entry) => sum + entry.count, 0);
    const displayCount = (state.dailyCount || 0) + pendingTotal;
    
    const pausedIndicator = state.trackingPaused ? ' $(debug-pause)' : '';
    
    if (!state.goal || state.goal === 0) {
        statusBarItem.text = `$(book) Writer's Crucible${pausedIndicator}`;
        statusBarItem.tooltip = 'No writing challenge is active for this project. Click to start one.';
        statusBarItem.command = 'writers-crucible.startChallenge';
        statusBarItem.backgroundColor = undefined;
    } else {
        const { goal } = state;
        const percentage = goal > 0 ? Math.min(Math.floor((displayCount / goal) * 100), 100) : 0;
        const pendingNote = pendingTotal > 0 ? ` (${pendingTotal} pending)` : '';
        const pausedNote = state.trackingPaused ? ' - PAUSED' : '';
        statusBarItem.text = `$(pencil) ${displayCount.toLocaleString()} / ${goal.toLocaleString()} (${percentage}%)${pausedIndicator}`;
        statusBarItem.tooltip = `Project: ${vscode.workspace.name || 'Global'}\nCommitted: ${(state.dailyCount || 0).toLocaleString()}${pendingNote}${pausedNote}\nClick to see text stats.`;
        statusBarItem.command = 'writers-crucible.showStats';
        statusBarItem.backgroundColor = displayCount >= goal ? new vscode.ThemeColor('statusBarItem.prominentBackground') : undefined;
    }
    statusBarItem.show();
}

function getCharacterCount(doc) {
    if (!doc) return 0;
    const trackedFileTypes = vscode.workspace.getConfiguration('writers-crucible').get('trackedFileTypes', ['markdown', 'plaintext']);
    if (trackedFileTypes.includes(doc.languageId)) {
        return doc.getText().length;
    }
    return 0;
}

function calculateStatistics(state) {
    const history = state.history || [];
    const tempHistory = [...history];
    if (state.dailyCount > 0) {
        tempHistory.push({ date: new Date().toISOString().split('T')[0], count: state.dailyCount });
    }
    tempHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    const totalChars = tempHistory.reduce((sum, day) => sum + day.count, 0);
    const totalDays = tempHistory.length;
    const avgPerDay = totalDays > 0 ? Math.round(totalChars / totalDays) : 0;
    let currentStreak = 0, longestStreak = 0;
    if (tempHistory.length > 0) {
        longestStreak = 1; currentStreak = 1;
        for (let i = 1; i < tempHistory.length; i++) {
            const day1 = new Date(tempHistory[i-1].date);
            const day2 = new Date(tempHistory[i].date);
            const diffDays = Math.round((day2 - day1) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) { currentStreak++; } else { currentStreak = 1; }
            if (currentStreak > longestStreak) { longestStreak = currentStreak; }
        }
    }
    const historyLog = [...tempHistory].reverse().map(day => `- **${day.date}:** ${day.count.toLocaleString()} characters`).join('\n');
    return { totalChars, totalDays, streak: longestStreak, avgPerDay, historyLog };
}

// --- Grace Period Management ---

function commitPendingChars(context) {
    let state = loadState(context);
    if (!state.pendingChars || state.pendingChars.length === 0) {
        return; // Nothing to do
    }

    const gracePeriod = vscode.workspace.getConfiguration('writers-crucible').get('undoGracePeriod', 30) * 1000; // Convert to ms
    const now = Date.now();
    let committedCount = 0;

    // Find all entries older than the grace period
    const stillPending = [];
    for (const entry of state.pendingChars) {
        if (now - entry.timestamp > gracePeriod) {
            // This entry is "safe" to commit
            committedCount += entry.count;
        } else {
            // This entry is still within the grace period
            stillPending.push(entry);
        }
    }

    if (committedCount > 0) {
        const oldCount = state.dailyCount || 0;
        state.dailyCount = (state.dailyCount || 0) + committedCount;
        state.pendingChars = stillPending;
        
        // Check if we just reached the goal
        if (state.goal > 0 && oldCount < state.goal && state.dailyCount >= state.goal) {
            vscode.window.showInformationMessage(`🎉 Goal Complete! You've written ${state.dailyCount.toLocaleString()} characters today. Well done!`);
        }
        
        saveState(context, state);
        updateStatusBar(state); // Update the UI with the new committed count
        
        // Update webview if it's open
        if (webviewPanel) {
            webviewPanel.webview.html = getWebviewContent(state);
        }
    }
}

// --- Webview and Charting ---

function getWebviewContent(state) {
    const history = state.history || [];
    const tempHistory = [...history];
    if (state.dailyCount > 0) {
        tempHistory.push({ date: new Date().toISOString().split('T')[0], count: state.dailyCount });
    }
    tempHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

    const last30Days = tempHistory.slice(-30);
    const labels = last30Days.map(d => d.date);
    const data = last30Days.map(d => d.count);
    
    let cumulativeTotal = 0;
    const cumulativeData = tempHistory.map(d => {
        cumulativeTotal += d.count;
        return { x: d.date, y: cumulativeTotal };
    });

    const stats = calculateStatistics(state);

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Writer's Crucible Stats</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                padding: 20px; 
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
            }
            h1, h2 { border-bottom: 1px solid var(--vscode-editor-foreground); padding-bottom: 5px; }
            .chart-container { margin-top: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .stat-card { background-color: var(--vscode-sideBar-background); padding: 15px; border-radius: 5px; }
            .stat-card h3 { margin-top: 0; }
            .stat-card p { font-size: 2em; margin-bottom: 0; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>Writer's Crucible Statistics</h1>
        <h2>${vscode.workspace.name || 'Global (No Project Folder)'}</h2>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Characters</h3>
                <p>${stats.totalChars.toLocaleString()}</p>
            </div>
            <div class="stat-card">
                <h3>Longest Streak</h3>
                <p>${stats.streak} days</p>
            </div>
            <div class="stat-card">
                <h3>Avg. Chars / Day</h3>
                <p>${stats.avgPerDay.toLocaleString()}</p>
            </div>
        </div>

        <div class="chart-container">
            <h2>Daily Output (Last 30 Writing Days)</h2>
            <canvas id="dailyChart"></canvas>
        </div>
        <div class="chart-container">
            <h2>Total Progress Over Time</h2>
            <canvas id="cumulativeChart"></canvas>
        </div>

        <script>
            const dailyCtx = document.getElementById('dailyChart').getContext('2d');
            new Chart(dailyCtx, {
                type: 'bar',
                data: {
                    labels: ${JSON.stringify(labels)},
                    datasets: [{
                        label: 'Characters Written',
                        data: ${JSON.stringify(data)},
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: { scales: { y: { beginAtZero: true } } }
            });

            const cumulativeCtx = document.getElementById('cumulativeChart').getContext('2d');
            new Chart(cumulativeCtx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Total Characters',
                        data: ${JSON.stringify(cumulativeData)},
                        fill: true,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        tension: 0.1
                    }]
                },
                options: {
                    scales: {
                        x: { type: 'time', time: { unit: 'day' } },
                        y: { beginAtZero: true }
                    }
                }
            });
        </script>
    </body>
    </html>`;
}

function deactivate() {
    if (statusBarItem) statusBarItem.dispose();
    if (webviewPanel) webviewPanel.dispose();
    if (commitTimer) {
        clearInterval(commitTimer);
        commitTimer = null;
    }
}

module.exports = { activate, deactivate };

