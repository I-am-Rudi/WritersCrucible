# Changelog

All notable changes to the Writer's Crucible extension will be documented in this file.


## [Unreleased]

## [Released]

### [1.0.2] - 2025-07-21

- Citation command now works for both "Marathoner's Pace" (2,000 characters) and "3K Crucible" (3,000 characters) challenges

### [1.0.1] - 2025-07-21

#### Added
- Writer's Crucible VS Code extension
- Daily writing challenge tracking with multiple difficulty levels:
  - Micro-Sprint: 500 characters/day
  - Standard Kilo-Challenge: 1,000 characters/day
  - Marathoner's Pace: 2,000 characters/day
  - 3K Crucible: 3,000 characters/day
- Paste detection to ignore non-typed content
- Grace period for character deletions (configurable, default 30 seconds)
- Status bar integration showing progress
- Statistics visualization with charts
- Commands for:
  - Starting/changing writing challenges
  - Viewing text-based statistics
  - Visualizing statistics with charts
  - Resetting daily counts
  - Adding revision time bonus (3K Crucible only)
  - Adding citation bonus (3K Crucible only)
  - Resetting all challenge data
- Configurable file type tracking (markdown, plaintext, latex by default)
- Project-specific and global state management
- Daily streak tracking
- Automatic daily reset functionality

#### Features
- Real-time character counting with paste detection
- Visual progress indicators in status bar
- Interactive charts for daily output and cumulative progress
- Workspace-specific challenge tracking
- Undo grace period to prevent accidental count inflation
- Bonus points system for academic writing tasks

#### Configuration Options
- `writers-crucible.trackedFileTypes`: Array of file types to track
- `writers-crucible.undoGracePeriod`: Time window for undo protection (5-300 seconds)
