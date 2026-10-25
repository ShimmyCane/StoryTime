**StoryTime — schematic note**

Users: all family members (picked in-app; stories tagged per member). Levels K → G6 (see `data/levels.js`).

Purpose: spin a few story dials, get a Chinese story opening, then narrate and record the story aloud, logging decision points and keywords. Saved stories build a library and a dashboard of keywords used across stories.

Flow (top to bottom)
- Spin dials → Tone, Setting, Character (auto-spun on load; tweak or re-spin)
- Advanced → add dials (Time, Quest, Emotion, Weather, custom…)
- Generate opening → match dial values against 50 Chinese templates, pick best score, seed transcript
- Narrate → prompt buttons, bilingual opening (zh + en, pinyin toggle), transcript, audio recording, read-aloud (zh-CN speech synthesis)
- Decision points → binary / ternary / sliding-scale forks logged to story
- Keywords → word-frequency on transcript, pick 3–4 from tag cloud
- Save → review combo, tags, duration, transcript; persist across sessions
- Library → saved stories, open, delete, export JSON
- Dashboard → cross-story keyword totals, next-focus hints

Data per story
- id, member, level, name (auto from dials), createdAt, duration
- spinners {name: {zh, en}}, seed {id, zh, en, level}, transcript
- keywords[], tags[], decisions[{point, type, options, choice}]

Editable spots in code
- `data/dials.js` → `DEFAULT_DIALS` (3 starting dials), `EXTRA_DIALS` (Add Dial suggestions)
- `data/templates.js` → `STORY_TEMPLATES` (50 openings, zh + en + tags)
- `data/levels.js` → `LEVELS` (K → G6, pinyin default, read speed)
- `data/stop_words.js` → `STOP_WORDS`
- `js/config.js` → Supabase keys, `DEFAULT_MEMBERS`, `PROMPT_WORDS`, `MAX_KEYWORDS`

Session-only vs persisted
- Session only: audio recording (share via share sheet / download; not uploaded), mic timer, current spin state
- Persisted: everything in the Data block above — localStorage first, synced to the family Supabase (`storytime_` tables) when signed in

Files
- schematic.md — this file.
- index.html — page layout only.
- index_summary.html — code map: what each file does and common tweaks.
- css/ — base.css, dials.css, narrate.css, library.css
- js/ — config, db, state, ui, members, dials, opening, narrate, recorder, decisions, keywords, save, library, dashboard, app
- data/ — levels.js, dials.js, templates.js, stop_words.js
- supabase/schema.sql — run once in the Supabase SQL Editor.
- todo.md — refinement log.
