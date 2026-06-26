# 🎤 Sing That Song

A party game web app: two teams pass a **word** back and forth, each team
singing a line of a *different* song that contains that word, until one team
runs out of time. The team that can't sing in time gives the point to the other
team — and the winner sings first on the next word.

It's a single static page (`index.html` + `words.js`). **No install, no server,
no internet needed.** Open it in any browser, including your phone.

---

## ▶️ Run it on your phone (pick one)

**Easiest — AirDrop / email / cloud the files to your phone:**
1. Get `index.html` and `words.js` onto your phone (same folder).
2. Open `index.html` in your mobile browser.
3. Tap the share icon → **Add to Home Screen** so it launches full-screen like an app.

**Serve from your computer (phone on same Wi-Fi):**
```bash
cd SingThatSong
python3 -m http.server 8000
# then on your phone, visit  http://<your-computer-ip>:8000
```

**GitHub Pages:** push this repo and enable Pages → open the URL on your phone.

Scores, settings, team names, and word logs are saved in the browser
(`localStorage`), so they survive a refresh.

---

## 🎮 How to play

1. A word appears with the current team's color filling the screen
   (Team 1 = red, Team 2 = blue).
2. Give everyone a second to read it, then tap **▶ Start Timer** — the clock does
   **not** start on its own.
3. The singing team must sing a song line containing the word before time runs out:
   - **✓ Got It! (pass)** — they did it. This counts one *back-and-forth* and hands
     the **same word** to the other team.
   - **⏸ Pause / ▶ Resume**, **+5s** (bump time back), **↺ Reset** (full time, same team).
4. When the clock hits zero you get a **buzzer + "TIME'S UP!"**. Then:
   - **+4s grace** — give them a few more seconds, or
   - **Point → other team** — the team that couldn't sing loses; the other team
     scores, the word is logged, and a fresh word appears.
5. **The winning team sings first** on the next word. Score is kept up top.

### Settings (⚙)
- Turn length (default **30s**), bump amount (+5s), grace amount (+4s), buzzer on/off.
- Rename teams.
- **Manual correction:** adjust either score, or **switch which team is singing**
  if it ever gets out of sync.
- **New game:** reset scores and begin a new log run.

---

## 📊 Word back-and-forth logs (for training the list)

Every finished word records how many times it went back and forth, who won, who
started, and which run it was in. In **Settings** you'll see a live summary
bucketed by your training rules:

- **drop ≤1** — too easy / dead words (never get going)
- **good 2–7** — the keepers
- **drop ≥8** — these drag on too long

Export everything as **JSON** or **CSV** to feed back into the word list later.

---

## 📝 The word list

`words.js` holds ~3,000 base-form words common in popular songs of the last ~40
years. Connector/stop words (the, and, or, in…) are removed, overly-generic
words are skipped, and inflections are collapsed to one base form
(*close/closely → close*, *own/owned → own*, *babies → baby*).

To regenerate or extend it, edit the curated seed in
`tools/generate_words.js` and run:

```bash
node tools/generate_words.js
```

Once you've collected enough back-and-forth logs, prune the words that score ≤1
or ≥8 from the seed and regenerate.

---

## 🔧 Dev

```bash
node tools/generate_words.js   # rebuild words.js
node tools/smoke.js            # headless playthrough test (needs playwright-core)
```