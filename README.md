# Writer's Crucible 

**Writer's Crucible** is a Visual Studio Code extension designed to help writers maintain momentum by tracking daily writing challenges directly within the editor. It's built on the principle that consistent, measurable progress is the key to completing large writing projects.

This extension lives in your status bar, providing at-a-glance feedback on your progress without interrupting your workflow.

## Main Features

* **Graphical Statistics:** A new command opens a dedicated panel to visualize your writing progress with beautiful charts, showing daily output and cumulative growth over time.
* **Per-Project Tracking:** The extension automatically tracks your progress separately for each project folder (workspace).
* **Configurable File Types:** You can tell the extension exactly which file types to track via your VS Code settings.
* **Graphical Statistics:** Pre-configured challenges. ---

## The Writer's Crucible Philosophy

This extension is built on a specific methodology designed for the realities of non-fiction writing.

### Why Characters, Not Words?

While word count is a common metric, character count offers several advantages for non-fiction authors, researchers, and technical writers:

1.  **Precision:** There's no ambiguity. "Socio-economic" is one word, but it's 15 characters of effort. "A" and "the" are words, but they represent minimal progress. Characters measure the literal volume of text you produce.
2.  **Values All Work:** Non-fiction writing isn't just prose. It involves lists, data, citations, code snippets, and structured notes. A character count values all of these tangible contributions to your final manuscript.
3.  **Encourages Conciseness:** Thinking in characters can subtly encourage more deliberate and concise language, a hallmark of strong non-fiction.

### Choosing Your Challenge

Each challenge level is designed for a specific workload and goal. Find the one that matches your current situation.

#### 1. The Micro-Sprint (500 Chars/Day)

* **Workload:** A few minutes of focused effort. Equivalent to writing 1-2 solid paragraphs or a few detailed bullet points.
* **Best For:**
    * Writers overcoming a block or building a new habit.
    * Extremely busy individuals who can only spare 15-20 minutes.
    * The "zero day" killer—a low bar to ensure you write *something* every day.
* **Expected Monthly Output:** ~15,000 characters (~2,500 words). Enough for a solid blog post or the initial draft of a short article.

#### 2. The Standard Kilo-Challenge (1,000 Chars/Day)

* **Workload:** A manageable daily session of 20-40 minutes. Equivalent to writing 3-4 paragraphs.
* **Best For:**
    * The average writer looking to make consistent, steady progress on a long-term project.
    * Balancing a day job with a writing project (e.g., a book or thesis).
* **Expected Monthly Output:** ~30,000 characters (~4,500-5,000 words). The length of a substantial book chapter, a feature article, or a detailed report section. This is the sweet spot for sustainable output.

#### 3. The Marathoner's Pace (2,000 Chars/Day)

* **Workload:** A significant, dedicated writing session of about an hour.
* **Best For:**
    * Writers who are on a deadline.
    * Academics in a dedicated "writing phase" for a paper.
    * Full-time writers or those with a clear, protected block of writing time each day.
* **Expected Monthly Output:** ~60,000 characters (~9,000-10,000 words). Enough to make serious headway on a manuscript or complete a major paper.

#### 4. The 3K Crucible (3,000 Chars/Day)

* **Workload:** A heavy-duty, professional-grade session of 1.5-2+ hours. This level also values non-prose work like revision and citation.
* **Best For:**
    * Authors in the final push to finish a book draft.
    * PhD candidates writing their dissertation against a deadline.
    * Anyone whose primary job for a set period is to produce a large volume of text.
* **Expected Monthly Output:** ~90,000+ characters (~13,500+ words). This is professional-level output that can produce a significant portion of a manuscript in a short time.

---

## Features

* **Status Bar Progress:** Your daily character count and goal are always visible.
* **Multiple Challenge Levels:** Choose the challenge that fits your schedule and goals.
* **Automatic Character Tracking:** Automatically counts characters as you type in your configured file types.
* **Daily Reset:** Your progress automatically resets to zero each day, and the previous day's work is saved to your project's history.
* **Crucible-Specific Commands:** For the "3K Crucible" challenge, add character bonuses for revision and citation work.
* **Persistent, Scoped State:** Your challenge and progress are saved independently for each project.

## How to Use

1.  **(First Time) Configure File Types (Optional):**
    * Go to `File > Preferences > Settings` (or `Code > Settings > Settings` on Mac).
    * Search for "Writer's Crucible".
    * In the "Tracked File Types" setting, add the language IDs you want to track (e.g., `latex`, `restructuredtext`). The defaults are `markdown` and `plaintext`.

2.  **Start a Challenge:**
    * Open a project folder.
    * Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and run `Writer's Crucible: Start or Change Writing Challenge`.
    * Select your desired challenge from the list. This challenge will be set *only for the current project*.

3.  **Write!**
    * Open a file of a tracked type.
    * As you type, you will see your character count increase in the status bar.

4.  **View Statistics:**
    * **For Visual Charts:** Run `Writer's Crucible: Visualize Project Statistics` from the Command Palette. A new tab will open with charts of your progress.
    * **For Text Stats:** Click the **Writer's Crucible** item in the status bar or run `Writer's Crucible: Show Project Statistics (Text)`.

5.  **Reset Your Data:**
    * To reset all data *for the current project only*, run `Writer's Crucible: Reset Project Challenge Data` from the Command Palette.