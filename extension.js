// extension.js v2.0.0
// Main logic file for the Writer's Crucible extension.
// Now with per-project state, statistics, and configurable file types.

const vscode = require('vscode');

// --- Constants and Global State ---
const STATE_KEY = 'writersCrucibleState';
let statusBarItem;
let lastCharacterCount = 0;

// --- Core Activation ---

/**
 * Activates the extension. This is the main entry point.
 * @param {vscode.ExtensionContext} context The extension context provided by VS Code.
 */
function activate(context) {
    console.log('Writer\'s Crucible v2 is now active!');

    // Create the status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);

    // Register all commands
    registerCommands(context);

    // Register event listeners that trigger updates
    registerEventListeners(context);

    // Perform an initial update when VS Code starts
    updateAll(context);
}

/**
 * Registers all commands available through the Command Palette.
 * @param {vscode.ExtensionContext} context
 */
function registerCommands(context) {
    context.subscriptions.push(vscode.commands.registerCommand('writers-crucible.startChallenge', () => startChallengeCommand(context)));
    context.subscriptions.push(vscode.commands.registerCommand('writers-crucible.showStats', () => showStatsCommand(context)));
    context.subscriptions.push(vscode.commands.registerCommand('writers-crucible.addRevisionTime', () => addRevisionTimeCommand(context)));
    context.subscriptions.push(vscode.commands.registerCommand('writers-crucible.addCitation', () => addCitationCommand(context)));
    context.subscriptions.push(vscode.commands.registerCommand('writers-crucible.resetChallenge', () => resetChallenge(context)));
}

/**
 * Registers event listeners for file changes, window changes, etc.
 * @param {vscode.ExtensionContext} context
 */
function registerEventListeners(context) {
    // When the active text editor changes, update everything
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => updateAll(context)));

    // When the text in a document changes, update the character count
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
            handleTextChange(event.document, context);
        }
    }));

    // When workspace folders change, refresh the state
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => updateAll(context)));
}

// --- State Management ---

/**
 * Gets the appropriate state manager (workspace or global).
 * @param {vscode.ExtensionContext} context
 * @returns {vscode.Memento} The state manager for the current context.
 */
function getStateManager(context) {
    // If we are in a workspace, use workspaceState for per-project tracking.
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        return context.workspaceState;
    }
    // Otherwise, fall back to globalState for single files.
    return context.globalState;
}

/**
 * Loads the state for the current context (workspace or global).
 * @param {vscode.ExtensionContext} context
 * @returns {object} The current challenge state.
 */
function loadState(context) {
    const stateManager = getStateManager(context);
    const savedState = stateManager.get(STATE_KEY);
    
    // Default state if nothing is saved yet
    const defaultState = {
        goal: 0,
        dailyCount: 0,
        lastUpdateDate: new Date().toDateString(),
        challengeName: 'No Challenge Set',
        history: [], // { date: "YYYY-MM-DD", count: 1234 }
    };

    return savedState || defaultState;
}

/**
 * Saves the state to the current context (workspace or global).
 * @param {vscode.ExtensionContext} context
 * @param {object} state The state object to save.
 */
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
        { label: '3K Crucible', description: '3,000 characters/day', target: 3000 }
    ];

    const picked = await vscode.window.showQuickPick(challengeOptions, { placeHolder: 'Choose your daily writing challenge' });

    if (picked) {
        let state = loadState(context);
        state.goal = picked.target;
        state.challengeName = picked.label;
        // Reset daily count if starting a new challenge on the same day
        if (state.lastUpdateDate === new Date().toDateString()) {
            state.dailyCount = 0;
        }
        saveState(context, state);
        vscode.window.showInformationMessage(`Challenge Started: ${picked.label}. Good luck!`);
        updateAll(context);
    }
}

async function showStatsCommand(context) {
    const state = loadState(context);
    const stats = calculateStatistics(state);

    const content = `
# Writer's Crucible Statistics

**Project:** ${vscode.workspace.name || 'Global (No Project Folder)'}
**Current Challenge:** ${state.challengeName} (${state.goal} chars/day)

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

async function addRevisionTimeCommand(context) {
    let state = loadState(context);
    if (state.goal !== 3000) {
        vscode.window.showWarningMessage('This command is intended for the "3K Crucible" challenge.');
    }
    const confirm = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Add 1,000 characters for 30 mins of revision?' });
    if (confirm === 'Yes') {
        updateDailyCount(1000, context);
        vscode.window.showInformationMessage('1,000 characters added for revision work.');
    }
}

async function addCitationCommand(context) {
    let state = loadState(context);
    if (state.goal !== 3000) {
        vscode.window.showWarningMessage('This command is intended for the "3K Crucible" challenge.');
    }
    const confirm = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Add 50 characters for one citation?' });
    if (confirm === 'Yes') {
        updateDailyCount(50, context);
        vscode.window.showInformationMessage('50 characters added for a citation.');
    }
}

async function resetChallenge(context) {
    const confirm = await vscode.window.showWarningMessage('Are you sure you want to reset all challenge data for this project?', { modal: true }, 'Yes, Reset');
    if (confirm === 'Yes, Reset') {
        // Pass an empty object to effectively delete the state
        saveState(context, undefined); 
        lastCharacterCount = 0;
        updateAll(context);
        vscode.window.showInformationMessage('Writer\'s Crucible data for this project has been reset.');
    }
}

// --- Core Logic & Event Handlers ---

/**
 * The main update function, called on activation and various events.
 * @param {vscode.ExtensionContext} context
 */
function updateAll(context) {
    let state = loadState(context);
    state = checkDateAndReset(state, context); // Check if the day has rolled over
    updateStatusBar(state);
    
    // Update the last known character count for the current file
    if (vscode.window.activeTextEditor) {
        lastCharacterCount = getCharacterCount(vscode.window.activeTextEditor.document);
    } else {
        lastCharacterCount = 0;
    }
}

/**
 * Handles character count changes when the user types.
 * @param {vscode.TextDocument} doc The document that changed.
 * @param {vscode.ExtensionContext} context
 */
function handleTextChange(doc, context) {
    const newCharacterCount = getCharacterCount(doc);
    const diff = newCharacterCount - lastCharacterCount;

    if (diff > 0) { // Only count additions
        updateDailyCount(diff, context);
    }
    lastCharacterCount = newCharacterCount;
}

/**
 * Checks if the day has changed. If so, saves yesterday's progress and resets the count.
 * @param {object} state The current state.
 * @param {vscode.ExtensionContext} context
 * @returns {object} The potentially modified state.
 */
function checkDateAndReset(state, context) {
    const today = new Date().toDateString();
    if (state.lastUpdateDate !== today) {
        // Save yesterday's count to history if it was a writing day
        if (state.dailyCount > 0) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yyyy_mm_dd = yesterday.toISOString().split('T')[0];
            
            // Avoid duplicate entries for the same day
            const existingEntryIndex = state.history.findIndex(h => h.date === yyyy_mm_dd);
            if (existingEntryIndex > -1) {
                state.history[existingEntryIndex].count = state.dailyCount;
            } else {
                state.history.push({ date: yyyy_mm_dd, count: state.dailyCount });
            }
        }

        // Reset for the new day
        state.dailyCount = 0;
        state.lastUpdateDate = today;
        saveState(context, state);
        vscode.window.showInformationMessage('A new day has begun! Your character count has been reset.');
    }
    return state;
}

/**
 * Updates the daily character count and saves the state.
 * @param {number} amount The amount to add.
 * @param {vscode.ExtensionContext} context
 */
function updateDailyCount(amount, context) {
    let state = loadState(context);
    state = checkDateAndReset(state, context); // Ensure we're on the right day
    state.dailyCount = (state.dailyCount || 0) + amount;
    saveState(context, state);
    updateStatusBar(state);
}

/**
 * Updates the visual status bar item.
 * @param {object} state The current state.
 */
function updateStatusBar(state) {
    if (!state.goal || state.goal === 0) {
        statusBarItem.text = `$(book) Writer's Crucible`;
        statusBarItem.tooltip = 'No writing challenge is active for this project. Click to start one.';
        statusBarItem.command = 'writers-crucible.startChallenge';
        statusBarItem.backgroundColor = undefined;
    } else {
        const { dailyCount, goal } = state;
        const percentage = goal > 0 ? Math.min(Math.floor((dailyCount / goal) * 100), 100) : 0;
        
        statusBarItem.text = `$(pencil) ${dailyCount.toLocaleString()} / ${goal.toLocaleString()} (${percentage}%)`;
        statusBarItem.tooltip = `Project: ${vscode.workspace.name || 'Global'}\nToday's Progress: ${dailyCount.toLocaleString()} / ${goal.toLocaleString()}`;
        statusBarItem.command = 'writers-crucible.showStats'; // Click to see stats

        statusBarItem.backgroundColor = dailyCount >= goal
            ? new vscode.ThemeColor('statusBarItem.prominentBackground')
            : undefined;
    }
    statusBarItem.show();
}

/**
 * Gets character count, respecting user-configured file types.
 * @param {vscode.TextDocument} doc The document to analyze.
 * @returns {number} The character count.
 */
function getCharacterCount(doc) {
    if (!doc) return 0;
    
    // Get tracked file types from settings
    const trackedFileTypes = vscode.workspace.getConfiguration('writers-crucible').get('trackedFileTypes', ['markdown', 'plaintext']);

    if (trackedFileTypes.includes(doc.languageId)) {
        return doc.getText().length;
    }
    return 0; // Don't count if the file type isn't tracked
}

/**
 * Calculates all statistics from the state's history.
 * @param {object} state The state object.
 * @returns {object} An object containing calculated stats.
 */
function calculateStatistics(state) {
    const history = state.history || [];
    if (!history.length && state.dailyCount === 0) {
        return { totalChars: 0, totalDays: 0, streak: 0, avgPerDay: 0, historyLog: "No writing history yet." };
    }

    // Add today's progress to a temporary history for calculation
    const tempHistory = [...history];
    if (state.dailyCount > 0) {
        tempHistory.push({ date: new Date().toISOString().split('T')[0], count: state.dailyCount });
    }
    
    // Sort history by date
    tempHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalChars = tempHistory.reduce((sum, day) => sum + day.count, 0);
    const totalDays = tempHistory.length;
    const avgPerDay = totalDays > 0 ? Math.round(totalChars / totalDays) : 0;

    // Calculate streak
    let currentStreak = 0;
    let longestStreak = 0;
    if (tempHistory.length > 0) {
        longestStreak = 1;
        currentStreak = 1;
        for (let i = 1; i < tempHistory.length; i++) {
            const day1 = new Date(tempHistory[i-1].date);
            const day2 = new Date(tempHistory[i].date);
            const diffTime = day2 - day1;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
        }
    }
    
    const historyLog = [...tempHistory].reverse().map(day => `- **${day.date}:** ${day.count.toLocaleString()} characters`).join('\n');

    return { totalChars, totalDays, streak: longestStreak, avgPerDay, historyLog };
}

// --- Deactivation ---
function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}

module.exports = {
    activate,
    deactivate
};

