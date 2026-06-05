// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒  — settings.js  (20-session edition)                       ║
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
    // Hard cap: 20 simultaneous .run sessions (enforced in bridge_run.js + auth.js)
    defaultSessionLimit: 20,
    adminSessionLimit:   20,

    // ── 🗑️ ANTI-DELETE ────────────────────────────────────────────────────────
    antiDelete:       true,
    // "owner" = send to bot owner's private DM  (RECOMMENDED)
    // "same"  = reply in the same chat
    // "private" / "group" / "both" = scope filters
    antiDeleteTarget: "owner",

    // ── 🌉 TELEGRAM BRIDGE ────────────────────────────────────────────────────
    bridgeToken: "",
    bridgePort:  3001,

    // ── 🔄 AUTO-UPDATE ────────────────────────────────────────────────────────
    // true  = silently auto-pull from GitHub every 48 h
    // false = disable (still works via .update command)
    autoUpdate:         true,
    autoUpdateInterval: 48,   // hours between silent checks

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
        keepalive:       true,
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
    autoJoinChannel: "https://whatsapp.com/channel/0029VbBeZTc1t90aZjks9v2S",
    pairingSite: "https://liam-scanner.onrender.com/pair",
    github:      "https://github.com/Dialmw/LIAM-EYES",

    // ── 🎨 MENU STYLE ─────────────────────────────────────────────────────────
    menuStyle: 'fancy',

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
        rapidApiKey: process.env.RAPIDAPI_KEY || "",
    },

    // ── 🔐 GITHUB GATE ────────────────────────────────────────────────────────
    githubUsername: process.env.GITHUB_USERNAME || "",
    githubRepo:     "LIAM-EYES-",
    githubOwner:    "Dialmw",
    githubGate:     true,
};

module.exports = settings;

// Hot-reload settings on file change (dev mode)
let _f = require.resolve(__filename);
require('fs').watchFile(_f, () => { require('fs').unwatchFile(_f); delete require.cache[_f]; require(_f); });
