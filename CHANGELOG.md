# Changelog

All notable changes to the Writer's Crucible extension will be documented in this file.


## [Unreleased]

### Added
- **Configurable Character Limit**: New `maxTrackedChars` setting
  - Set maximum characters tracked per input operation (default: 50)
  - Prevents large paste operations from inflating counts
  - Allows customization based on writing style and AI usage preferences
  - Accessible via VS Code settings under "Writer's Crucible"
- Pause/Resume tracking functionality - users can temporarily stop character counting
- Character count correction command - allows manual adjustment by subtracting characters
- Visual pause indicator in status bar with pause icon
- Input validation for correction command
- Custom challenge option - users can set their own daily character goals
- Enhanced validation for custom goals (1-50,000 characters)

### Changed
- **Universal Character Tracking**: Complete rewrite of input detection system
  - Now tracks all text input methods with configurable limits per operation
  - Improved event handling for better reliability
  - Enhanced detection of inline completions vs. manual input
  - Default character limit reduced from 100 to 50 for more conservative tracking
- Status bar now shows pause state in both icon and tooltip
- Tracking respects pause state - no character changes are recorded when paused
- Correction command now shows current count and prevents over-subtraction
- Improved validation messages for correction command
- Citation command now works for any challenge with 2,000+ characters per day (including custom challenges)
- Revision command now works for any challenge with 3,000+ characters per day (including custom challenges)

### Improved
- Better user feedback for custom challenge setup
- More descriptive challenge names for custom goals
- Bonus commands (citation/revision) now work dynamically based on goal thresholds rather than specific challenge names
- Cleaner console output (removed debug logging)
- More robust text change event handling
- Enhanced configuration options with better descriptions and validation

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
- `writers-crucible.maxTrackedChars`: Maximum characters tracked per input operation (1-1000, default: 50)
