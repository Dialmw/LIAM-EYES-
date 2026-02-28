// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot — message.js                              ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';

const config = require('./settings/config');
const fs     = require('fs');
const path   = require('path');
const chalk  = require('chalk');
const axios  = require('axios');
const os     = require('os');
const moment = require('moment-timezone');

const image = (() => {
    try { return fs.readFileSync('./thumbnail/image.jpg'); } catch { return Buffer.alloc(0); }
})();

let _jidNorm;
const loadUtils = async () => {
    if (_jidNorm) return;
    const b = await import('@whiskeysockets/baileys');
    _jidNorm = b.jidNormalizedUser;
};

// ─────────────────────────────────────────────────────────────────────────────
//  UNICODE FONT CONVERTERS
// ─────────────────────────────────────────────────────────────────────────────
const _map = (maps, c) => {
    for (const [src, dst] of maps) {
        const i = src.indexOf(c);
        if (i >= 0) return [...dst][i];
    }
    return c;
};
const bold = t => t.split('').map(c => _map([
    ['ABCDEFGHIJKLMNOPQRSTUVWXYZ','𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙'],
    ['abcdefghijklmnopqrstuvwxyz','𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳'],
], c)).join('');
const script = t => t.split('').map(c => _map([
    ['ABCDEFGHIJKLMNOPQRSTUVWXYZ','𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩'],
    ['abcdefghijklmnopqrstuvwxyz','𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃'],
], c)).join('');

// Digit decorator  3 → 𝟑
const D = n => String(n).split('').map(d => '𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗'[+d] ?? d).join('');

// Star border ─ exact style from user's screenshot
const STAR   = '★★★★★★★★★★★★★';
const BOX_T  = `╔${STAR}╗`;
const BOX_B  = `╚${STAR}╝`;
const sBox   = (...lines) => [BOX_T, ...lines, BOX_B].join('\n');

// Time helpers
const tz = () => config.settings?.timezone || 'Africa/Nairobi';
const fmt_time = (ts) => moment(ts ? ts * 1000 : Date.now()).tz(tz()).format('HH:mm');
const fmt_date = (ts) => moment(ts ? ts * 1000 : Date.now()).tz(tz()).format('DD/MM/YYYY');
const fmt_tz   = () => moment().tz(tz()).format('z');

// ─────────────────────────────────────────────────────────────────────────────
//  BOT STATE — kill/wake switch
// ─────────────────────────────────────────────────────────────────────────────
let BOT_PAUSED = false;
global._botPaused = () => BOT_PAUSED;
global._botKill   = () => { BOT_PAUSED = true; };
global._botWake   = () => { BOT_PAUSED = false; };

// ─────────────────────────────────────────────────────────────────────────────
//  PLUGIN LOADER
// ─────────────────────────────────────────────────────────────────────────────
class PluginLoader {
    constructor() {
        this.plugins    = new Map();
        this.categories = new Map();
        this.dir        = path.join(__dirname, 'plugins');

        // 21 primary display categories (indices 1-21)
        this.catDef = [
            { key: 'ai',           label: 'AI',           emoji: '🤖' },
            { key: 'audio',        label: 'AUDIO',        emoji: '🎵' },
            { key: 'download',     label: 'DOWNLOAD',     emoji: '⬇️' },
            { key: 'ephoto',       label: 'EPHOTO360',    emoji: '🖼️' },
            { key: 'fun',          label: 'FUN',          emoji: '😂' },
            { key: 'group',        label: 'GROUP',        emoji: '👥' },
            { key: 'image',        label: 'IMAGE',        emoji: '🌄' },
            { key: 'multisession', label: 'MULTISESSION', emoji: '🔗' },
            { key: 'other',        label: 'OTHER',        emoji: '📦' },
            { key: 'owner',        label: 'OWNER',        emoji: '👑' },
            { key: 'reaction',     label: 'REACTION',     emoji: '😍' },
            { key: 'religion',     label: 'RELIGION',     emoji: '🕌' },
            { key: 'search',       label: 'SEARCH',       emoji: '🔍' },
            { key: 'settings',     label: 'SETTINGS',     emoji: '⚙️' },
            { key: 'sports',       label: 'SPORTS',       emoji: '⚽' },
            { key: 'support',      label: 'SUPPORT',      emoji: '🆘' },
            { key: 'tools',        label: 'TOOLS',        emoji: '🛠️' },
            { key: 'video',        label: 'VIDEO',        emoji: '🎬' },
            { key: 'tostatus',     label: 'TOSTATUS',     emoji: '📤' },
            { key: 'translate',    label: 'TRANSLATE',    emoji: '🌍' },
            { key: 'menustyle',    label: 'MENUSTYLE',    emoji: '🎨' },
            // extra (loaded but not numbered in primary index)
            { key: 'games',    label: 'GAMES',    emoji: '🎮' },
            { key: 'general',  label: 'OTHERS',   emoji: '✨' },
            { key: 'media',    label: 'MEDIA',    emoji: '🎬' },
            { key: 'utility',  label: 'UTILITY',  emoji: '🔧' },
        ];
        this.catDef.forEach(c => this.categories.set(c.key, []));
        this.load();
    }

    load() {
        this.plugins.clear();
        this.catDef.forEach(c => this.categories.set(c.key, []));
        if (!fs.existsSync(this.dir)) return;

        for (const file of fs.readdirSync(this.dir).filter(f => f.endsWith('.js') && !f.startsWith('_'))) {
            try {
                const fp = path.join(this.dir, file);
                delete require.cache[require.resolve(fp)];
                for (const p of [].concat(require(fp))) {
                    if (!p?.command || typeof p.execute !== 'function') continue;
                    const cat = p.category || 'general';
                    if (!this.categories.has(cat)) this.categories.set(cat, []);
                    if (!this.plugins.has(p.command)) this.plugins.set(p.command, p);
                    this.categories.get(cat).push(p.command);
                }
            } catch (e) { console.log(chalk.red(`  [PLUG] ${file}: ${e.message}`)); }
        }

        // ── Plugin load summary ──────────────────────────────────────────
        console.log('');
        console.log(chalk.hex('#00d4ff').bold('  ┌─ 👁️  LIAM EYES — COMMANDS ─────────────────────'));
        let total = 0;
        for (const c of this.catDef) {
            const n = (this.categories.get(c.key) || []).length;
            if (n) {
                console.log(chalk.hex('#a29bfe')(`  │  ${c.emoji} ${c.label.padEnd(14)} `) + chalk.white(String(n)));
                total += n;
            }
        }
        console.log(chalk.hex('#00b894').bold(`  └─ ✔ ${total} commands loaded\n`));
    }

    async run(cmd, sock, m, ctx) {
        const p = this.plugins.get(cmd);
        if (!p) return false;
        try {
            if (p.owner && !ctx.isCreator)                               { await ctx.reply(config.message.owner); return true; }
            if (p.group && !m.isGroup)                                   { await ctx.reply(config.message.group); return true; }
            if (p.admin && m.isGroup && !ctx.isAdmins && !ctx.isCreator) { await ctx.reply(config.message.admin); return true; }
            await p.execute(sock, m, ctx);
        } catch (e) { console.log(chalk.red(`  [CMD:${cmd}] ${e.message}`)); }
        return true;
    }

    // First 21 catDef entries are primary (numbered in menu)
    primaryCats() { return this.catDef.slice(0, 21).filter(c => (this.categories.get(c.key) || []).length > 0); }
    catByNum(n)   { return this.primaryCats()[n - 1] || null; }
    count()       { return this.plugins.size; }
    reload()      { this.load(); }
    getCmds(key)  { return (this.categories.get(key) || []).sort(); }

    // ═══ STYLE 1 — NUMBERED (default) ════════════════════════════════════════
    //  Index: star-bordered numbered list
    //  Reply with number → single-column command list (no crowding)
    style1_index() {
        const cats = this.primaryCats();
        return cats.map((c, i) => `_${i+1}._ ${c.emoji} _${c.label}_`).join('\n');
    }

    style1_cat(prefix, catKey) {
        const cmds = this.getCmds(catKey);
        const c    = this.catDef.find(x => x.key === catKey) || { label: catKey.toUpperCase(), emoji: '📦' };
        if (!cmds.length) return null;
        return [
            BOX_T,
            `  ${c.emoji} *${c.label} MENU*`,
            BOX_B,
            ...cmds.map(cmd => `│ ${prefix}${cmd}`),
            '└─────────────────────',
        ].join('\n');
    }

    // ═══ STYLE 2 — LIST (all categories with commands) ═══════════════════════
    style2(prefix) {
        const lines = [];
        for (const c of this.catDef) {
            const cmds = this.getCmds(c.key);
            if (!cmds.length) continue;
            lines.push(`\n${c.emoji} *${c.label} MENU*`);
            lines.push('─────────────────────────');
            cmds.forEach(cmd => lines.push(`│ ${prefix}${cmd}`));
        }
        return lines.join('\n');
    }

    // ═══ STYLE 3 — CLASSIC (box headers — matches sample image) ═══════════════
    style3(prefix) {
        const lines = [];
        for (const c of this.catDef) {
            const cmds = this.getCmds(c.key);
            if (!cmds.length) continue;
            lines.push(`\n╭──『 *${c.emoji} ${c.label}* 』`);
            cmds.forEach(cmd => lines.push(`│  ✦ ${prefix}${cmd}`));
            lines.push('╰' + '─'.repeat(28));
        }
        return lines.join('\n');
    }

    // ═══ STYLE 4 — CURSIVE (script headers + flower bullets) ═════════════════
    style4(prefix) {
        const bullets = ['✿','❀','✾','❁','✸','✺'];
        const lines   = [];
        let bi = 0;
        for (const c of this.catDef) {
            const cmds = this.getCmds(c.key);
            if (!cmds.length) continue;
            lines.push(`\n≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋`);
            lines.push(`  ${c.emoji} *${script(c.label)}*`);
            lines.push(`≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋`);
            cmds.forEach(cmd => lines.push(`  ${bullets[bi++ % bullets.length]} _${prefix}${cmd}_`));
        }
        return lines.join('\n');
    }
}

const PL = new PluginLoader();

// ─────────────────────────────────────────────────────────────────────────────
//  CHATBOT — Bilingual AI with humor + vibe detection
// ─────────────────────────────────────────────────────────────────────────────
const chatHistory = new Map();
global._chatHistory = chatHistory;

const SYSTEM_PROMPT = `You are LIAM EYES 👁️ — a witty WhatsApp AI by Liam.
RULES:
- Reply in SAME LANGUAGE as the user. Swahili→Swahili. English→English.
- Match their VIBE: chill→relaxed, excited→hype, sad→warm, playful→playful.
- Natural humor and light sarcasm when they fit. Never forced.
- SHORT for casual (1-3 sentences). Detailed only when actually helping.
- NEVER mention OpenAI, ChatGPT, Claude, or Anthropic. You are LIAM EYES by Liam.
- Use natural Swahili slang for Swahili users (maze, sawa, vipi, niko, bora, pole).`;

const getChatHist = jid => {
    if (!chatHistory.has(jid)) chatHistory.set(jid, []);
    const h = chatHistory.get(jid);
    if (h.length > 20) chatHistory.set(jid, h.slice(-20));
    return chatHistory.get(jid);
};

const chatbotReply = async (jid, userText) => {
    const hist = getChatHist(jid);
    hist.push({ role: 'user', content: userText });
    const ctx = hist.slice(-8).map(h => (h.role === 'user' ? 'User: ' : 'LIAM: ') + h.content).join('\n');
    let reply = '';
    try {
        const { data } = await axios.get(
            `https://text.pollinations.ai/${encodeURIComponent(SYSTEM_PROMPT + '\n\n--- Chat ---\n' + ctx + '\nLIAM:')}`,
            { timeout: 15000, headers: { 'User-Agent': 'LIAM-EYES/2.0' } }
        );
        reply = (data?.toString() || '').trim();
    } catch (_) {}
    if (!reply || reply.length < 2) {
        const sw = /\b(habari|sawa|maze|vipi|bora|pole|karibu|ndio|hapana|niko|rafiki|jambo)\b/i.test(userText);
        const fb = sw
            ? ['😅 Samahani, nilikata! Niulize tena.', '🤔 Mtandao wangu ulichoka. Jaribu tena.']
            : ["😅 Brain buffered! Try again.", "🤔 I glitched — retry!"];
        reply = fb[~~(Math.random() * fb.length)];
    }
    hist.push({ role: 'assistant', content: reply });
    return reply;
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONSOLE LOG — CYPHER-X style (Image 3)
//  ──────────── 『 LIAM EYES 』 ──────────
//  » Sent Time: Tuesday, 22:18 EAT
//  » Message Type: imageMessage
//  » Sender: 254712345678
//  » Name: Boss Lady
//  » Chat ID: group@g.us
//  » Message: hello world
// ─────────────────────────────────────────────────────────────────────────────
const LOG_COLORS = ['#00ff88','#00d4ff','#ff6b9d','#ffd93d','#a29bfe','#fd79a8'];
let _logColorIdx = 0;

const logMsg = (m, body, pushname, senderNum, isGroup, chatId, mtype) => {
    const color  = LOG_COLORS[_logColorIdx++ % LOG_COLORS.length];
    const tz_    = fmt_tz();
    const day    = moment().tz(tz()).format('dddd');
    const time   = moment().tz(tz()).format('HH:mm:ss');
    const msgTime= `${day}, ${time} ${tz_}`;
    // Estimate a fake delay for display like CYPHER-X
    const delayMs = Math.random() * 2 + 0.2;
    const delayLbl = delayMs < 1 ? 'FAST' : delayMs < 2 ? 'MODERATE' : 'SLOW';

    // ──────── 『 LIAM EYES 』 ────────
    const sepLine  = chalk.hex(color)('─'.repeat(8) + '─') + chalk.white.bold(' 『 LIAM EYES 』 ') + chalk.hex(color)('─'.repeat(8));
    const row      = (label, val) => chalk.hex(color)('» ') + chalk.hex(color)(label) + chalk.white(val);

    console.log('');
    console.log(sepLine);
    console.log(row('Message Type: ',   mtype || 'textMessage'));
    console.log(row('Message Time: ',   msgTime));
    console.log(row('Delay: ',          delayMs.toFixed(2) + 's [ ' + delayLbl + ' ]'));
    console.log(row('Sender: ',         senderNum));
    console.log(row('Name: ',           pushname || 'N/A'));
    console.log(row('Chat ID: ',        isGroup ? chatId : senderNum));
    console.log(row('Message: ',        (body || 'N/A').slice(0, 120)));
    console.log(chalk.hex(color)('─'.repeat(44)));
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN MESSAGE HANDLER
// ─────────────────────────────────────────────────────────────────────────────
module.exports = async (sock, m, chatUpdate, store) => {
    try {
        await loadUtils();

        const mtype = m.mtype || Object.keys(m.message || {})[0] || 'unknown';
        // Use m.body set by serialize (covers all message types including quoted replies)
        // Fallback chain ensures we never miss a plain "3" or any text
        const body  = (
            m.body ||
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            m.message?.buttonsResponseMessage?.selectedButtonId ||
            m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
            ''
        ).toString().trim();

        const botId     = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net';
        const sender    = m.key.fromMe ? botId : (m.key.participant || m.key.remoteJid);
        const senderNum = sender.split('@')[0];
        const pushname  = m.pushName || 'User';

        const prefixMatch = body.match(/^[.!#$]/);
        const prefix  = prefixMatch ? prefixMatch[0] : (config.prefix || '.');
        const isCmd   = !!prefixMatch;
        const command = isCmd ? body.slice(1).trim().split(/\s+/)[0].toLowerCase() : '';
        const args    = isCmd ? body.trim().split(/\s+/).slice(1) : [];
        const text    = args.join(' ');

        const quoted = m.quoted || m;
        const mime   = (quoted.msg || quoted).mimetype || '';
        const isMedia = /image|video|sticker|audio/.test(mime);

        const isCreator = (() => {
            try {
                const n1 = (sender || '').split('@')[0].replace(/:\d+/, '');
                const n2 = (config.owner || '').replace(/[^0-9]/g, '');
                return n1 === n2 || (_jidNorm?.(sender) === _jidNorm?.(botId));
            } catch { return false; }
        })();
        const isSudo = isCreator || (config.sudo || []).map(s => s.replace(/\D/, '')).includes(senderNum);

        let groupMetadata = {}, groupName = '', participants = [],
            groupAdmins = [], isBotAdmins = false, isAdmins = false,
            groupOwner = '', isGroupOwner = false;

        if (m.isGroup) {
            groupMetadata = await sock.groupMetadata(m.chat).catch(() => ({}));
            groupName     = groupMetadata.subject || '';
            participants  = (groupMetadata.participants || []).map(p => ({
                id: p.id, admin: p.admin === 'superadmin' ? 'superadmin' : p.admin === 'admin' ? 'admin' : null
            }));
            groupAdmins  = participants.filter(p => p.admin).map(p => p.id);
            isBotAdmins  = groupAdmins.includes(botId);
            isAdmins     = groupAdmins.includes(sender);
            groupOwner   = groupMetadata.owner || '';
            isGroupOwner = groupOwner === sender;
        }

        // ── Console log every message ────────────────────────────────────────
        logMsg(m, body, pushname, senderNum, m.isGroup, m.chat, mtype);

        // ── Bot paused? Only owner .wake can unfreeze ────────────────────────
        if (BOT_PAUSED && !isCreator) return;
        if (BOT_PAUSED && isCmd && command !== 'wake') return;

        // reply WITH thumbnail image (list/classic/cursive styles + commands)
        const reply = async txt => {
            const thumbUrl = config.thumbUrl || 'https://i.imgur.com/ydt68aV.jpeg';
            try {
                await sock.sendMessage(m.chat, {
                    image: { url: thumbUrl },
                    caption: txt,
                }, { quoted: m });
            } catch (_) {
                // Fallback to plain text if image fails
                await sock.sendMessage(m.chat, { text: txt }, { quoted: m });
            }
        };
        // reply WITHOUT thumbnail (numbered menu style — clean look)
        const replyPlain = txt => sock.sendMessage(m.chat, { text: txt }, { quoted: m });

        const ctx = {
            args, text, q: text, quoted, mime, isMedia,
            groupMetadata, groupName, participants, groupOwner,
            groupAdmins, isBotAdmins, isAdmins, isGroupOwner,
            isCreator, isSudo, prefix, reply, config, sender, pushname, senderNum, m,
        };

        // ── Auto-features ────────────────────────────────────────────────────
        const feat = config.features || {};
        if (feat.autoread      && !m.key.fromMe) sock.readMessages([m.key]).catch(() => {});
        if (feat.autotyping    && !m.key.fromMe) sock.sendPresenceUpdate('composing', m.chat).catch(() => {});
        if (feat.autorecording && !m.key.fromMe) sock.sendPresenceUpdate('recording', m.chat).catch(() => {});
        if (feat.autoreact     && !m.key.fromMe) {
            const pool = config.statusReactEmojis || ['❤️','😂','🔥','👍','😍'];
            sock.sendMessage(m.chat, { react: { text: pool[~~(Math.random() * pool.length)], key: m.key } }).catch(() => {});
        }
        if (feat.antilink && m.isGroup && !isAdmins && !isCreator) {
            if (/(https?:\/\/|wa\.me\/|whatsapp\.com\/)/i.test(body)) {
                sock.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                return reply(`⚠️ @${senderNum} Links are not allowed here!`);
            }
        }
        if (feat.antibadword && m.isGroup && !isAdmins && !isCreator) {
            if ((config.badwords || []).some(w => body.toLowerCase().includes(w.toLowerCase()))) {
                sock.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                return reply(`⚠️ @${senderNum} Watch your language!`);
            }
        }
        if (feat.grouponly   && !m.isGroup) return;
        if (feat.privateonly &&  m.isGroup) return;

        // ════════════════════════════════════════════════════════════════════
        //  NUMERIC REPLY HANDLER
        //  Works in ANY style — if user sends 1-21, show that category
        //  In numbered style → replyPlain (no thumbnail image)
        //  In other styles  → reply (with thumbnail)
        // ════════════════════════════════════════════════════════════════════
        if (!m.key.fromMe && !isCmd) {
            // Strip ALL whitespace characters to handle mobile newlines/spaces
            const trimmed = (body || '').replace(/\s+/g, '');
            if (/^\d{1,2}$/.test(trimmed)) {
                const n = parseInt(trimmed, 10);
                if (n >= 1 && n <= 21) {
                    const cat = PL.catByNum(n);
                    if (cat) {
                        const st      = parseInt(config.menuStyle) || 1;
                        const content = PL.style1_cat(prefix, cat.key);
                        console.log(chalk.hex('#fdcb6e')(`  [MENU] "${trimmed}" → ${cat.label} (style=${st})`));
                        if (content) {
                            // No thumbnail in numbered style — clean list only
                            if (st === 1) { await replyPlain(content); }
                            else          { await reply(content); }
                            return;
                        }
                    }
                    // Number in range but no matching cat — swallow silently
                    return;
                }
            }
        }

        // ── Auto-reply when anyone mentions "bot" ────────────────────────────
        if (!m.key.fromMe && !isCmd && /\bbot\b/i.test(body)) {
            const ph = config.pairingSite || 'https://liam-pannel.onrender.com/pair';
            const gh = config.github      || 'https://github.com/Dialmw/LIAM-EYES-';
            const ownerNum = config.owner || '254705483052';
            const thumbUrl = config.thumbUrl || 'https://i.imgur.com/ydt68aV.jpeg';
            const botTxt =
                `👁️ *LIAM EYES Bot*\n\n` +
                `Hey ${pushname}! 👋 Looking for a bot?\n\n` +
                `🔗 *Get Session ID:* ${ph}\n` +
                `📦 *Source / Download:* ${gh}\n` +
                `📞 *Contact owner:* wa.me/${ownerNum}\n\n` +
                `_Type *${prefix}menu* after connecting to see all commands_\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`;
            try {
                await sock.sendMessage(m.chat, { image: { url: thumbUrl }, caption: botTxt }, { quoted: m });
            } catch (_) {
                await sock.sendMessage(m.chat, { text: botTxt }, { quoted: m }).catch(() => {});
            }
            // Don't return — allow chatbot to also respond if enabled
        }

        // ── Chatbot (non-command messages — works in DM and groups) ────────
        if (feat.chatbot && !m.key.fromMe && !isCmd && body.trim().length > 0) {
            try {
                // In groups: only respond when bot is mentioned or message starts with bot's name
                if (m.isGroup) {
                    const botNum = (sock.user?.id || '').split(':')[0];
                    const mentioned = (m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []).includes(botNum + '@s.whatsapp.net');
                    const atBot = body.toLowerCase().includes('liam') || mentioned;
                    if (!atBot) { /* skip group messages that don't mention bot */ }
                    else {
                        sock.sendPresenceUpdate('composing', m.chat).catch(() => {});
                        const botReply = await chatbotReply(m.chat, body.trim());
                        sock.sendPresenceUpdate('paused', m.chat).catch(() => {});
                        await reply(botReply);
                    }
                } else {
                    // In DM: always respond
                    sock.sendPresenceUpdate('composing', m.chat).catch(() => {});
                    const botReply = await chatbotReply(m.chat, body.trim());
                    sock.sendPresenceUpdate('paused', m.chat).catch(() => {});
                    await reply(botReply);
                }
                return;
            } catch (_) { return await reply('😅 Hiccup! Try again.'); }
        }

        if (!isCmd) return;

        // ── Plugin dispatch ──────────────────────────────────────────────────
        if (await PL.run(command, sock, m, ctx)) return;

        // ════════════════════════════════════════════════════════════════════
        //  BUILT-IN: .menu / .help
        // ════════════════════════════════════════════════════════════════════
        if (command === 'menu' || command === 'help') {
            const style  = parseInt(config.menuStyle) || 1;
            const numArg = parseInt(args[0]);

            // .menu 5 or .menu ai → jump directly to category (style 1 only)
            if (style === 1) {
                if (numArg >= 1 && numArg <= 21) {
                    const cat = PL.catByNum(numArg);
                    if (cat) { const c = PL.style1_cat(prefix, cat.key); if (c) { await reply(c); return; } }
                }
                if (args[0] && isNaN(args[0])) {
                    const key = args[0].toLowerCase();
                    if (PL.categories.has(key)) { const c = PL.style1_cat(prefix, key); if (c) { await reply(c); return; } }
                }
            }

            // ── Build header ─────────────────────────────────────────────────
            const mem    = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0) + 'MB';
            const ramTot = (os.totalmem() / 1024 / 1024 / 1024).toFixed(0) + 'GB';
            const up     = process.uptime();
            const upStr  = `${~~(up/86400)}d ${~~(up%86400/3600)}h ${~~(up%3600/60)}m`;
            const ping   = Math.max(0, Date.now() - (m.messageTimestamp || 0) * 1000);
            const total  = PL.count();
            const cats   = PL.primaryCats();
            const utype  = isCreator ? 'Owner' : isSudo ? 'Sudo/Admin' : isAdmins ? 'Admin' : 'User';
            const botName = config.settings?.title || '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
            const styleIcons = { 1:'🔢 Numbered', 2:'📋 List', 3:'🗂️ Classic', 4:'✒️ Cursive' };

            const styleIcons_ = { 1:'🔢 Numbered', 2:'📋 List', 3:'🗂️ Classic', 4:'✒️ Cursive' };
            const curStyle   = parseInt(config.menuStyle) || 1;
            const curStyleNm = styleIcons_[curStyle] || 'Numbered';

            // Classic header (sample image format)
            const classicHdr =
                `╔${'═'.repeat(36)}╗\n` +
                `║   👁️  *${botName}*  ✦  Alpha Bot   ║\n` +
                `╚${'═'.repeat(36)}╝\n` +
                `_👁️ Your Eyes in the WhatsApp World_\n\n` +
                `  ⚡ *Ping*   › ${ping}ms\n` +
                `  ⏱️ *Uptime* › ${upStr}\n` +
                `  💾 *RAM*    › ${mem}\n` +
                `  📦 *Cmds*   › ${total}\n` +
                `  🌍 *Mode*   › ${sock.public ? 'Public' : 'Private'}\n` +
                `  🎨 *Style*  › ${curStyleNm}\n` +
                `  🔰 *Prefix* › ${prefix}\n`;

            // Star box header for other styles
            const header = sBox(`          *${botName}*`) + '\n\n' +
                sBox(
                    `➤ *ᴏᴡɴᴇʀ*     : ${config.settings?.author || 'Liam'}`,
                    `➤ *ᴘʀᴇғɪx*    : [ ${prefix} ]`,
                    `➤ *ʜᴏsᴛ*      : Panel`,
                    `➤ *ᴍᴏᴅᴇ*      : ${sock.public ? 'Public' : 'Private'}`,
                    `➤ *ᴠᴇʀsɪᴏɴ*   : ${config.settings?.version || 'Alpha'}`,
                    `➤ *ᴜᴘᴛɪᴍᴇ*    : ${upStr}`,
                    `➤ *ᴘɪɴɢ*      : ${ping}ms`,
                    `➤ *ᴄᴏᴍᴍᴀɴᴅs*  : ${total}`,
                    `➤ *ᴜsᴇʀ ᴛʏᴘᴇ* : ${utype}`,
                    `➤ *ʀᴀᴍ*       : ${mem} / ${ramTot}`,
                ) + '\n\n' + sBox(`📂 *AVAILABLE CATEGORIES*`) + '\n\n';

            const styleHint = `\n\n_Change style: *.numbered* | *.list* | *.classic* | *.cursive*_`;

            // ── STYLE 1 — numbered, NO thumbnail image in menu ───────────────
            if (style === 1) {
                const compactHdr =
                    `╔${'═'.repeat(28)}╗\n` +
                    `║  👁️ _${botName}_  ║\n` +
                    `╚${'═'.repeat(28)}╝\n` +
                    `_⚡ ${ping}ms  ⏱️ ${upStr}  💾 ${mem}  📦 ${total} cmds_\n\n`;
                const txt = compactHdr + PL.style1_index() +
                    `\n\n_Reply 1–${cats.length} to open · ${prefix}menu 5 to jump_`;
                await replyPlain(txt);  // no image for numbered style
                return;
            }

            // ── STYLE 2 — all commands, list format ──────────────────────────
            if (style === 2) {
                await reply(header + PL.style2(prefix) + styleHint);
                return;
            }

            // ── STYLE 3 — classic box (matches sample image) ─────────────────
            if (style === 3) {
                await reply(classicHdr + PL.style3(prefix) + styleHint);
                return;
            }

            // ── STYLE 4 — cursive flower ─────────────────────────────────────
            if (style === 4) {
                await reply(header + PL.style4(prefix) + styleHint);
                return;
            }
        }

        // ── .kill / .wake (built-in, owner only) ────────────────────────────
        if (command === 'kill') {
            if (!isCreator) { return reply(config.message.owner); }
            BOT_PAUSED = true;
            return reply(`🔴 *Bot Paused*\n\nI'm no longer responding to anyone.\nUse *${prefix}wake* to resume.\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
        if (command === 'wake') {
            if (!isCreator) { return reply(config.message.owner); }
            BOT_PAUSED = false;
            return reply(`🟢 *Bot Active*\n\nI'm back online!\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }

        // ── Menu style — .numbered .list .classic .cursive .menustyle ──────
        const _sW = { numbered:1, list:2, classic:3, cursive:4 };
        const _sI = { 1:'🔢 Numbered', 2:'📋 List', 3:'🗂️ Classic', 4:'✒️ Cursive' };
        const _sAll = ['menustyle','setmenustyle','numbered','list','classic','cursive'];

        if (_sAll.includes(command)) {
            if (!isCreator && !isSudo) return reply(config.message.owner);

            // Word shortcut: .numbered / .list / .classic / .cursive
            if (_sW[command] !== undefined) {
                config.menuStyle = _sW[command];
                return reply(
                    `✅ *Menu style → ${_sI[_sW[command]]}*\n\n` +
                    `Type *${prefix}menu* to see it.\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            }

            // .menustyle / .setmenustyle — show or set
            const curSt = parseInt(config.menuStyle) || 1;
            const argN  = parseInt(args[0]) || _sW[(args[0]||'').toLowerCase()];
            if (argN >= 1 && argN <= 4) {
                config.menuStyle = argN;
                return reply(
                    `✅ *Menu style → ${_sI[argN]}*\n\n` +
                    `Type *${prefix}menu* to see it.\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            }

            return reply(
                `🎨 *Menu Style*\n\n` +
                `*Current:* Style ${curSt} — ${_sI[curSt]}\n\n` +
                `*Styles:*\n` +
                `│ *1* — Numbered _(reply with number)_\n` +
                `│ *2* — List _(all commands visible)_\n` +
                `│ *3* — Classic _(box headers)_\n` +
                `│ *4* — Cursive _(flower/script)_\n\n` +
                `*Usage:*\n` +
                `  *.numbered*   *.list*   *.classic*   *.cursive*\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
        // ── .reload ──────────────────────────────────────────────────────────
        if (command === 'reload') {
            if (!isCreator) return reply(config.message.owner);
            PL.reload();
            return reply(`✅ *Reloaded* — ${PL.count()} commands\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }

    } catch (e) { console.log(chalk.red('[MSG ERR] ' + (e.message || e))); }
};

let _f = require.resolve(__filename);
require('fs').watchFile(_f, () => { require('fs').unwatchFile(_f); delete require.cache[_f]; require(_f); });
