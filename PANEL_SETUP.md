# 🚀 LIAM EYES — Panel / Bot-Hosting.net Setup Guide

## The #1 Issue: "Cannot Complete / Freezes on startup"

The bot needs a Session ID to connect. On panels, you **cannot type** into the console,
so you must configure it BEFORE starting.

---

## ✅ METHOD 1 — Environment Variable (RECOMMENDED for panels)

In your panel → **Startup** or **Environment** tab, add:

```
SESSION_ID = LIAM~your_session_id_here
```

Then click **Start**. The bot will auto-connect using that session.

**Where to get a Session ID:**
→ Visit https://liam-pannel.onrender.com/pair
→ Enter your phone number
→ Copy the LIAM~ code you receive on WhatsApp

---

## ✅ METHOD 2 — Edit settings.js (via Files tab)

1. In your panel, go to **Files** tab
2. Open `settings/settings.js`
3. Find this line:
   ```js
   sessionId: "LIAM~paste_your_session_id_here",
   ```
4. Replace with your actual Session ID:
   ```js
   sessionId: "LIAM~yourActualSessionIdHere",
   ```
5. Save the file
6. Click **Start** / **Restart**

---

## ✅ METHOD 3 — Pair from panel using phone number

Set this environment variable in your panel:
```
PAIR_NUMBER = 254712345678
```
(your number with country code, no + or spaces)

The bot will start, request a pairing code, and display it in the console.
You'll see something like:  `🔑  CODE  ›  ABCD-EFGH`
Enter that code in WhatsApp → Linked Devices → Link with Phone Number.

---

## 📋 Summary: What each error means

| Console shows | Cause | Fix |
|---|---|---|
| Freezes after "Connecting to WhatsApp…" | No session set, panel has no keyboard | Use Method 1 or 2 above |
| "NO SESSION CONFIGURED" warning | No session or env var found | Use any method above |
| "Session restored from SESSION_ID env var" | ✅ Working correctly | — |
| "Session restored from settings.js" | ✅ Working correctly | — |
| "LIAM EYES IS NOW ONLINE" | ✅ Bot is running | — |

---

## 🔑 Getting a Session ID on Bot-Hosting.net

1. Go to **Files** tab in your panel
2. Check if `sessions/main/creds.json` exists (if yes → bot already has a session)
3. If not → visit https://liam-pannel.onrender.com/pair and pair your number
4. Copy the LIAM~ session ID sent to your WhatsApp
5. Set it as `SESSION_ID` env var OR paste into `settings.js`

---

## ⚡ Quick Steps for New Install

```
1. Upload bot files to panel
2. Run: npm install
3. Set SESSION_ID env var to your LIAM~ session
4. Click Start
```

That's it! The bot will connect automatically.
