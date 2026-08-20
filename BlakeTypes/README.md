# Blake Breacher Teaches Typing v0.12

A browser typing tutor and typing-game suite inspired by the feel of late-1990s / early-2000s educational software.

## v0.12 — Smart Typing Content & Adaptive Vocabulary

v0.12 keeps the 14-lesson curriculum and eight expanded arcade games intact, but substantially upgrades how lesson-style typing material is selected.

### Smart Practice Lab
Eight optional Smart Practice drills now appear above the curriculum:
- Short-Word Burst
- Long-Word Control
- Left-Hand Isolation
- Right-Hand Isolation
- Hand Alternation
- Same-Finger Clinic
- Row-Hop Control
- Trouble-Pair Clinic

These are recorded as **Practice** sessions, not curriculum lessons, so they do not change the existing 14-lesson course-completion requirement.

### Keyboard-aware vocabulary analysis
The suite now analyzes shipped vocabulary using QWERTY keyboard geometry. Each alphabetic word can be classified by:
- word length
- left-hand/right-hand usage
- left-right alternation rate
- keyboard-row changes
- conventional touch-typing finger assignments
- same-finger consecutive transitions
- contained two-letter pairs

The selected General, Office, or Technical vocabulary family still influences Smart Practice generation.

### Adaptive key-pair tracking
Lesson-style typing now records first-attempt accuracy for adjacent alphabetic key pairs in addition to the existing per-key statistics.

Once enough observations exist, the active profile can identify troublesome transitions such as `TH`, `ER`, or `JU`. Trouble-Pair Clinic then preferentially generates words containing the learner's own weakest transitions.

Pair statistics are:
- profile-specific
- included in local profile persistence and JSON backups
- cleared by Reset Adaptive Profile
- visible on the Lessons adaptive summary
- visible in Progress under Troublesome Key Pairs
- included in the Typing Assessment Report

### Smarter Weak-Key Workshop
Weak-Key Workshop now uses the same keyboard-aware word selector for alphabetic weak keys instead of repeatedly drawing random words until one happens to contain the target. It can combine weak-key weighting with troublesome pair weighting while retaining numbers, capitalization, and punctuation handling from earlier releases.

### Progress and scoreboard changes
- Smart Practice sessions have their own **Practice** type in Scoreboard history.
- Lessons vs. Games comparison now includes a separate Smart Practice column.
- Recent Activity and detailed reports distinguish Practice from curriculum Lessons.
- General speed/practice-time achievements can still recognize meaningful Smart Practice sessions, while curriculum achievements remain tied only to the 14 formal lessons.

## Existing suite
- 14-lesson full-keyboard curriculum
- Eight Smart Practice drills
- Adaptive Weak-Key Workshop
- Eight expanded arcade modes
- Blake's Random Challenge + Typing Tournaments
- Six difficulty levels
- General / Office / Technical vocabulary families
- Multiple local profiles + Guest mode
- 63 achievements
- WPM / accuracy statistics and graphs
- Keyboard heatmap + weak-key and key-pair analysis
- JSON backup / restore
- Printable certificates and learner reports
- Blake & HyperSoft personality layer
- Five interface themes
- Pacific-time score history

## Modular edition

This edition keeps ES modules separate for development. Serve the folder over HTTP:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.
