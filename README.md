# 👁️ LIAM EYES — Full Feature WhatsApp Bot v2

> Your Eyes in the WhatsApp World

## What's Fixed in v2
- ✅ `.tostatus` — Now posts to status correctly
- ✅ `.tostatus`, `.togstatus`, `.imagestatus`, `.videostatus`, `.textstatus` — All working
- ✅ `.statusview`, `.viewstatus`, `.statusreact` — Status tools fixed
- ✅ Reaction GIFs — Multi-source fallback (nekos.best → waifu.pics → nekos.life)
- ✅ **Bot image REMOVED** from all responses (only .menu has image)
- ✅ "bot" keyword response — Groups only, NOT in DMs
- ✅ Bot name is "LIAM EYES" (not "LIAM EYES Bot")
- ✅ Multi-session limit reduced to **4** (admin and user)
- ✅ URL/YTS search — Now uses Invidious API (3x faster, no stopping)
- ✅ APK download — `.apk <app name>` sends actual APK file or download link
- ✅ Fast URL search — `.urlsearch` uses DuckDuckGo instant answers
- ✅ Host detection — Shows Heroku/Render/Railway/Termux/VPS in menu

## Commands Added
- `.apk <app>` — Download APK (sends file or link)
- `.urlsearch <query>` — Fast DuckDuckGo search
- `.urlinfo <url>` — URL metadata
- `.textstatus <text>` — Post text to status
- `.imagestatus` — Post image to status
- `.videostatus` — Post video to status
- `.viewstatus` — Mark status as viewed
- `.statusreact` — React to a status

## Quick Start
```bash
npm install
node index.js
```

## Session Setup
Paste Session ID in `settings/settings.js` or set `SESSION_ID` env var.

Get Session ID: https://liam-scanner.onrender.com/pair

## Host Support
- 🟣 Heroku
- 🟦 Render  
- 🚂 Railway
- 📱 Termux
- 🖥️ VPS/Local
- 🟢 Cyclic
- 🟠 Koyeb
- 🪁 Fly.io

*By Liam — © 2025*
