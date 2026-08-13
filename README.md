<div align="center"> 
<strong>👁️ 𝕃𝕀𝔸𝕄 𝔼𝕐𝔼𝕊</strong>
    <br>
  <a href="https://git.io/typing-svg"> 
    <img src="https://readme-typing-svg.demolab.com?font=Orbitron&size=50&pause=1000&color=00AAFF&center=true&width=910&height=100&lines=LIAM+EYES;See+Everything;Know+Everything;Created+by+Liam" alt="Typing SVG" style="font-size: 50px;"/>
  </a> 
</div>

<div align="center">
  <h1 style="color: #00aaff;">
    <br>
    <span style="font-size: 42px;">
      <b>👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒</b>
    </span>
    <br>
    <i><sub>• By Liam •</sub></i>
  </h1>
</div>

<p align="center" style="color: #00aaff;">
  <i>"See Everything. Know Everything."</i>
</p>

<div align="center">

[![Version](https://img.shields.io/badge/Version-Alpha-00aaff?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/Dialmw/LIAM-EYES-)
[![Node.js](https://img.shields.io/badge/Node.js-18+-0055cc?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Baileys](https://img.shields.io/badge/Baileys-Latest-003399?style=for-the-badge)](https://github.com/whiskeysockets/baileys)

</div>

<br>

<p align="center">
  <a href="https://whatsapp.com/channel/0029VbBeZTc1t90aZjks9v2S">📡 Join Channel</a> ·
  <a href="https://liam-scanner.onrender.com/pair">🔗 Pair Your Bot</a>
</p>

---

## 📁 Project structure

This is a single-file bot — everything that used to live in `plugins/` and
`library/` is bundled directly inside `index.js`. The project is intentionally flat:

| File | Purpose |
|---|---|
| `start.js` | **Run this.** Supervisor that launches `index.js` and auto-restarts it if it ever crashes or exits. |
| `index.js` | The bot itself — connection handling, message router, and all ~100 commands, bundled in one file. |
| `settings.js` | All configuration lives here: session ID, sudo list, features, API keys. Edit this to configure your bot. |
| `package.json` | Dependencies + npm scripts. |
| `app.json` | Heroku one-click deploy descriptor. |
| `cx-platform.json` | Generic hosting-panel descriptor (Pterodactyl / bot-hosting-style panels). |
| `Procfile` | Process type for Heroku/Railway-style platforms. |
| `Resources/` | Bot assets (menu thumbnail, images) and small runtime data files (store.json, dominate.json, sticker park) — created automatically as needed. |

## 🚀 Quick start

```bash
npm install
npm start          # runs start.js, which supervises index.js
```

## 🔑 Setting your session

Pick one:

1. **Environment variable (recommended for panels):** set `SESSION_ID` to your `LIAM:~...` code.
2. **Edit `settings.js`:** paste your session ID into the `sessionId` field near the top.
3. **Pair by phone number:** set the `PAIR_NUMBER` env var to your number (no `+`, no spaces) and the bot will print a pairing code on boot.

Get a session ID / pairing code at: https://liam-scanner.onrender.com/pair

## ⚙️ Configuring features

Open `settings.js` — the `features` object near the top toggles things like
anti-delete, welcome messages, status auto-react, chatbot mode, and more.
Editing `settings.js` while the bot is running hot-reloads it — no restart needed.

## 🛡️ Uptime

`start.js` is a small supervisor: if `index.js` ever crashes, throws an
unhandled error, or is killed, it gets relaunched automatically with a
short backoff. Deploy `start.js` (not `index.js` directly) so this protection
is active.

<br>

<p align="center" style="color: #00aaff;">
  <strong>Created with ❤️ by Liam</strong>
</p>
