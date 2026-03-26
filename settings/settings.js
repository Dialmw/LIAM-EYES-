// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒  — settings.js                                             ║
// ║  © 2025 Liam — All Rights Reserved                                      ║
// ║  Unauthorized redistribution prohibited                                  ║
// ╚══════════════════════════════════════════════════════════════════════════╝
'use strict';

const { getOwner } = require('./auth_ref');

const settings = {

    // ── 🔑 SESSION ────────────────────────────────────────────────────────────
    // Paste your Session ID here (from https://liam-eyes-pair.onrender.com/pair)
    // Format:  LIAM:~<your_base64_session>
    sessionId: "LIAM:~paste_your_session_id_here",

    // ── 👑 ADMIN / OWNER ──────────────────────────────────────────────────────
    get adminNumber() { return getOwner(); },

    // ── 🛡️ SUDO USERS ────────────────────────────────────────────────────────
    sudo: [
        "254743285563",
        "254705483052",
    ],

    // ── 🔗 SESSION LIMITS ─────────────────────────────────────────────────────
    // 254743285563 and 254705483052: max 6 sessions (enforced in auth.js)
    // All other numbers:              max 3 sessions
    defaultSessionLimit: 3,
    adminSessionLimit:   6,

    // ── 🗑️ ANTI-DELETE ────────────────────────────────────────────────────────
    antiDelete:       true,
    // "owner" = send to bot owner's private DM (linked number) — DEFAULT & RECOMMENDED
    // "same"  = reply in the same chat where the delete happened
    // "private"/"group"/"both" = scope filters
    antiDeleteTarget: "owner",

    // ── 🌉 TELEGRAM BRIDGE ────────────────────────────────────────────────────
    // Generate a token in Telegram bot with /watoken then paste here.
    // Format: LIAM-BRIDGE-<random_string>
    // Leave blank to disable the bridge.
    bridgeToken: "",

    // Bridge HTTP server port (used for realtime cross-bot messaging)
    bridgePort: 3001,

    // ── ⚡ FEATURES ───────────────────────────────────────────────────────────
    features: {
        antidelete:      true,
        antideletestatus:true,
        antiedit:        false,
        antiviewonce:    false,
        autoviewstatus:  false,
        autosavestatus:  false,
        autoreactstatus: false,
        alwaysonline:    false,
        autoread:        false,
        chatbot:         false,
        antilink:        false,
        antibadword:     false,
        welcome:         true,
        autoreact:       false,
        antiflood:       false,
        autotyping:      false,
        autorecording:   false,
        grouponly:       false,
        privateonly:     false,
        autobio:         false,
        autoblock:       false,
        anticall:        false,
        antibug:         false,
    },

    // ── 🌍 MODE ───────────────────────────────────────────────────────────────
    mode: "public",

    // ── 🤖 BOT INFO ───────────────────────────────────────────────────────────
    botName:     "𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒",
    version:     "Alpha",
    prefix:      ".",
    thumbUrl:    "https://i.imgur.com/ydt68aV.jpeg",
    tagline:     "👁️ Your Eyes in the WhatsApp World",
    channel:     "https://whatsapp.com/channel/0029VbBeZTc1t90aZjks9v2S",
    pairingSite: "https://liam-scanner.onrender.com/pair",
    github:      "https://github.com/Dialmw/LIAM-EYES",

    // ── 🎨 MENU STYLE ─────────────────────────────────────────────────────────
    menuStyle: 'fancy',  // fancy=RAVEN(default) | classic | list | cursive | numbered

    // ── 😍 STATUS REACTION EMOJIS ─────────────────────────────────────────────
    statusReactEmojis: ["😍","🔥","💯","😘","🤩","❤️","👀","✨","🎯","🥰","💪","👑","🫶","💥"],

    // ── ✍️ AUTO BIO ───────────────────────────────────────────────────────────
    autoBio:     false,
    autoBioText: "👁️ LIAM EYES Bot — Online 24/7 | {time}",

    // ── 🌏 TIMEZONE ──────────────────────────────────────────────────────────
    timezone: "Africa/Nairobi",

    // ── 🚫 BAD WORDS ──────────────────────────────────────────────────────────
    badwords: ["badword1", "spam", "scam"],

    // ── 🌊 ANTI-FLOOD ─────────────────────────────────────────────────────────
    floodLimit:  8,
    floodWindow: 6000,

    // ── ⚠️ WARN LIMIT ─────────────────────────────────────────────────────────
    warnLimit: 3,

    // ── 🎵 API ────────────────────────────────────────────────────────────────
    api: {
        baseurl:     "https://hector-api.vercel.app/",
        apikey:      "hector",
        // Optional: RapidAPI key for Songstats metadata enrichment
        // Get one free at https://rapidapi.com/songstats/api/songstats
        rapidApiKey: process.env.RAPIDAPI_KEY || "",
    },

    // ── 🔐 GITHUB GATE ────────────────────────────────────────────────────────
    // REQUIRED: Set your GitHub username.
    // To deploy this bot you MUST:
    //   1. Fork  → https://github.com/Dialmw/LIAM-EYES-
    //   2. Star  → https://github.com/Dialmw/LIAM-EYES-
    // The bot will refuse to start if these requirements are not met.
    githubUsername: process.env.GITHUB_USERNAME || "",  // ← set GITHUB_USERNAME env var or paste your GitHub username here
    githubRepo:     "LIAM-EYES-",           // do not change
    githubOwner:    "Dialmw",               // do not change
    githubGate:     true,                    // set false to skip (dev only)
};

module.exports = settings;

let _f = require.resolve(__filename);
require('fs').watchFile(_f, () => { require('fs').unwatchFile(_f); delete require.cache[_f]; require(_f); });
