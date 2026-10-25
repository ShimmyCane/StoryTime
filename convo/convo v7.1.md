StoryTime — start_project

Project folder: `03 Projects/StoryTime/` (schematic.md created from the note you shared)
AI folder: `04 AI/StoryTime/`

Clarifying questions (answer inline below each one)

1) Who is it for?
-- Kids (Felix / Athena) practicing Chinese storytelling on the iPad, following the ipad_website skill (pastel, big buttons, gear for settings)? Or an adult/parent tool?
-- Access the family supabase, will be for all family members traced accordingly

2) Where do saved stories live?
-- a) localStorage in the browser (simplest, one device only)
-- b) Supabase (like Allowances / Family Habits — syncs across devices)
-- c) claude.ai artifact key-value store (what the note says, but lives outside this repo)
-- B

3) Bilingual transcript — where does the English come from?
-- a) Child types/speaks in either language; no auto-translation
-- b) Speech-to-text (zh-CN) plus a translation service (needs an API key)
-- c) Templates carry English alongside Chinese; narration is free text
-- C

4) Chinese level for the 50 openings?
-- Simplified characters? Add pinyin? Rough reading level (e.g. same as Reader Level Test, Level L)?
-- Not sure why don't you do some research come up with multiple levels by Chinese weight level grade one upper grade 2 spring semester or lower?

5) Audio recording
-- Session-only is fine (per the note), or should recordings be downloadable / saved?
-- Recording should be shareable allows us to share by text or WhatsApp or other app

6) MVP scope
-- OK to build the first pass as a single index.html with the full flow, minimal testing, then refine via todo.md?
-- Actually, because I'm having Claude go do it I think it's actually good to break it up fully with all components so it's easier to go in and make smaller granular changes


AI follow-up (from the answers above)

Decisions recorded
- Users: every family member, picked at the top of the app; each story is tagged with who told it. Reuse the Family Habits Supabase project and its `family_members` table (Athena, Felix, Ying, Jimmy).
- Storage: Supabase. New tables prefixed `storytime_` so nothing in Family Habits is touched.
- English: each template stores Chinese + English; narration transcript is free text.
- Recording: MediaRecorder → "Share" button opens the iPad/iPhone share sheet (Messages, WhatsApp, AirDrop…) via the Web Share API, with a Download fallback.
- Code layout: split into small files (see proposal below), plus an index_summary.html map like Moment.

Research — reading levels (部编版 / 2022 课标)
- The 2022 curriculum standard asks grades 1–2 to recognize ~1,600 common characters and write ~800 by end of grade 2. Per-semester counts below are approximate; I'll check against the textbook 识字表 when writing templates.
- Proposed levels (each up to "grade 2 spring" as the ceiling):
  - L1 一年级上 (G1 fall) — ~300 known chars; 1–2 short sentences, full pinyin, very concrete words (人、山、水、大、小).
  - L2 一年级下 (G1 spring) — ~700 known; 2–3 sentences, pinyin on harder words.
  - L3 二年级上 (G2 fall) — ~1,100 known; 3–4 sentences, simple connectors (因为、所以、可是).
  - L4 二年级下 (G2 spring) — ~1,600 known; 4–5 sentences, light description and dialogue, pinyin hidden by default.
- Level is chosen per family member (default saved on their profile) and can be changed per story.
-- Research and Add Kindergarten through 6th grade.

Proposed file layout
- `index.html` — page shell only
- `css/` — base.css (pastel tokens, layout), dials.css, narrate.css, library.css
- `js/config.js` — Supabase URL/key, constants
- `js/db.js` — all Supabase calls + on-screen error reporting
- `js/state.js` — current story in progress
- `js/members.js` — family member picker
- `js/dials.js` — spin, re-spin, add/remove dials
- `js/opening.js` — template scoring + seed text by level
- `js/narrate.js` — prompt buttons, transcript, zh-CN read-aloud
- `js/recorder.js` — mic, timer, share/download
- `js/decisions.js` — binary / ternary / slider forks
- `js/keywords.js` — word frequency + tag cloud
- `js/library.js`, `js/dashboard.js` — saved stories, export JSON, cross-story keyword totals
- `data/dials.json`, `data/templates.json`, `data/stop_words.json` — the editable lists (DEFAULT_DIALS, EXTRA_DIALS, STORY_TEMPLATES, STOP_WORDS)
- `supabase/schema.sql` — storytime tables
- `index_summary.html`, `schematic.md`

Remaining questions
7) Templates: 50 openings, each written at all 4 levels (200 texts)? Or 50 total spread across levels?
-- Let's do a bell curve around Kindergarten. So not too many at 3rd+. Total 50 for now

8) Should recordings also be stored in Supabase Storage so they can be replayed from the Library later, or is sharing at the time of recording enough?
-- No. I don't know how to save stuff like that in super base.

9) Good to build the MVP with this layout?
-- Yes please do


AI follow-up 2 — MVP built

Levels K → G6 (data/levels.js). Sources: 2022 课标 (G1–2 ~1,600 recognized; G3–4 ~2,500; G5–6 ~3,000) and the 3-6岁儿童学习与发展指南 for K (listening/speaking first, no formal character target). Per-level numbers are approximate.
| Level | Chars known | Templates |
| K 幼儿园大班 | ~50, listening first | 15 |
| 1A 一年级上 | ~300 | 11 |
| 1B 一年级下 | ~700 | 8 |
| 2A 二年级上 | ~1,100 | 6 |
| 2B 二年级下 | ~1,600 | 4 |
| G3 | ~2,000 | 3 |
| G4 / G5 / G6 | ~2,500 / ~2,800 / ~3,000 | 1 each |

Recordings: not stored; Share sheet + Download only.
Pinyin is generated automatically (pinyin-pro library), on by default for K–1B.

Before first use: run `03 Projects/StoryTime/supabase/schema.sql` once in the Supabase SQL Editor (paste + Run). Until then, stories save on the iPad only and sync later.
Next steps tracked in `03 Projects/StoryTime/todo.md`.

Update: Supabase connected. StoryTime tables created on the Family project (migration `storytime_tables`); no manual SQL step needed anymore.
