// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒  — settings.js                                             ║
// ║  © 2025 Liam — All Rights Reserved                                      ║
// ║  Unauthorized redistribution prohibited                                  ║
// ╚══════════════════════════════════════════════════════════════════════════╝
'use strict';

const { getOwner } = require('./auth_ref');

const settings = {

    // ── 🔑 SESSION ────────────────────────────────────────────────────────────
    // Paste your Session ID here (from https://liam-pannel.onrender.com/pair)
    // Format:  LIAM~<your_base64_session>
    sessionId: "LIAM~paste_your_session_id_here",

    // ── 👑 ADMIN / OWNER ──────────────────────────────────────────────────────
    // Set via auth module — see library/auth.js
    // To change owner, use: .setownernumber <new_number>  (owner command)
    get adminNumber() { return getOwner(); },

    // ── 🛡️ SUDO USERS ────────────────────────────────────────────────────────
    // Numbers that get near-owner privileges
    // Add as strings with country code: "254712345678"
    sudo: [
        "254743285563",   // helper 1
        "254705483052",   // creator / helper 2
    ],

    // ── 🔗 SESSION LIMITS ─────────────────────────────────────────────────────
    defaultSessionLimit: 3,
    adminSessionLimit:   6,

    // ── 🗑️ ANTI-DELETE ────────────────────────────────────────────────────────
    antiDelete:       true,
    antiDeleteTarget: "owner",   // "owner" = send to your DM  |  "same" = same chat

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
    // "public" = everyone can use  |  "private" = owner/sudo only
    mode: "public",

    // ── 🤖 BOT INFO ───────────────────────────────────────────────────────────
    botName:     "𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒",
    version:     "Alpha",
    prefix:      ".",
    thumbUrl:    "https://i.imgur.com/ydt68aV.jpeg",
    tagline:     "👁️ Your Eyes in the WhatsApp World",
    channel:     "https://whatsapp.com/channel/0029VbBeZTc1t90aZjks9v2S",
    pairingSite: "https://liam-pannel.onrender.com/pair",
    github:      "https://github.com/Dialmw/LIAM-EYES",

    // ── 🎨 MENU STYLE ─────────────────────────────────────────────────────────
    // Change with commands: .numbered  .list  .classic  .cursive
    // 1 = Numbered (reply with number to open category — RECOMMENDED)
    // 2 = List (all commands listed at once)
    // 3 = Classic (╭──『box headers』 — matches sample)
    // 4 = Cursive (flower/script font)
    menuStyle: 3,

    // ── 😍 STATUS REACTION EMOJIS ─────────────────────────────────────────────
    // Bot picks randomly from this list when auto-reacting to statuses
    // Change with: .setstatusemoji ❤️ 🔥 😍
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
        baseurl: "https://hector-api.vercel.app/",
        apikey:  "hector",
    },
};

module.exports = settings;

let _f = require.resolve(__filename);
require('fs').watchFile(_f, () => { require('fs').unwatchFile(_f); delete require.cache[_f]; require(_f); });
