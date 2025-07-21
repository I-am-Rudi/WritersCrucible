Writer's Crucible v2 - README
Overview

Writer's Crucible is a Visual Studio Code extension designed to help non-fiction writers maintain momentum by tracking daily writing challenges directly within the editor. Version 2 introduces powerful new features for serious writers.

The extension lives in your status bar, providing at-a-glance feedback on your progress without interrupting your workflow.
What's New in Version 2.0

    Per-Project Tracking: The extension now automatically tracks your progress separately for each project folder (workspace) you open. If you open a single file without a folder, it will track it under a "Global" context.

    Statistics Tracking: View detailed statistics for your current project, including total characters written, writing streak, and daily average.

    Configurable File Types: You can now tell the extension exactly which file types to track via your VS Code settings.

    Smarter UI: The status bar now shows more information and clicking it takes you directly to your project stats.

Features

    Status Bar Progress: Your daily character count and goal are always visible.

    Multiple Challenge Levels: Choose from Micro-Sprint (500), Kilo-Challenge (1,000), Marathoner's Pace (2,000), or the 3K Crucible (3,000).

    Automatic Character Tracking: Automatically counts characters as you type in your configured file types.

    Daily Reset: Your progress automatically resets to zero each day, and the previous day's work is saved to your project's history.

    Crucible-Specific Commands: For the "3K Crucible" challenge, add character bonuses for revision and citation work.

    Persistent, Scoped State: Your challenge and progress are saved independently for each project.

How to Use

    (First Time) Configure File Types (Optional):

        Go to File > Preferences > Settings (or Code > Settings > Settings on Mac).

        Search for "Writer's Crucible".

        In the "Tracked File Types" setting, add the language IDs you want to track (e.g., latex, restructuredtext). The defaults are markdown and plaintext.

    Start a Challenge:

        Open a project folder.

        Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P) and run Writer's Crucible: Start or Change Writing Challenge.

        Select your desired challenge from the list. This challenge will be set only for the current project.

    Write!

        Open a file of a tracked type.

        As you type, you will see your character count increase in the status bar.

    View Statistics:

        Click the Writer's Crucible item in the status bar.

        Alternatively, run Writer's Crucible: Show Project Statistics from the Command Palette.

        A new tab will open with a Markdown-formatted report of your project's history and stats.

    Reset Your Data:

        To reset all data for the current project only, run Writer's Crucible: Reset Project Challenge Data from the Command Palette.

Installation (Local Development)

    Create a new folder on your computer (e.g., writers-crucible-v2).

    Inside that folder, save the three files provided: package.json, extension.js, and README.md.

    Open the writers-crucible-v2 folder in Visual Studio Code.

    Press F5 on your keyboard. This will compile and run the extension in a new "Extension Development Host" window.

    Use the extension in the new window as described above.

Good luck with your writing!
