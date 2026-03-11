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

// ── Menu thumbnail ONLY for .menu — no image on regular replies ──────────────
const menuImage = (() => {
    try { return fs.readFileSync('./thumbnail/logo.jpg'); } catch {
        try { return fs.readFileSync('./thumbnail/image.jpg'); } catch { return null; }
    }
})();

let _jidNorm;
const loadUtils = async () => {
    if (_jidNorm) return;
    const b = await import('@whiskeysockets/baileys');
    _jidNorm = b.jidNormalizedUser;
};

const _map = (maps, c) => {
    for (const [src, dst] of maps) { const i = src.indexOf(c); if (i >= 0) return [...dst][i]; }
    return c;
};
const script = t => t.split('').map(c => _map([
    ['ABCDEFGHIJKLMNOPQRSTUVWXYZ','𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩'],
    ['abcdefghijklmnopqrstuvwxyz','𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃'],
], c)).join('');

// ── Bold font map (matches LITE style) ──────────────────────────────────────
const B = s => s.split('').map(ch=>({'A':'𝗔','B':'𝗕','C':'𝗖','D':'𝗗','E':'𝗘','F':'𝗙','G':'𝗚','H':'𝗛','I':'𝗜','J':'𝗝','K':'𝗞','L':'𝗟','M':'𝗠','N':'𝗡','O':'𝗢','P':'𝗣','Q':'𝗤','R':'𝗥','S':'𝗦','T':'𝗧','U':'𝗨','V':'𝗩','W':'𝗪','X':'𝗫','Y':'𝗬','Z':'𝗭','a':'𝗮','b':'𝗯','c':'𝗰','d':'𝗱','e':'𝗲','f':'𝗳','g':'𝗴','h':'𝗵','i':'𝗶','j':'𝗷','k':'𝗸','l':'𝗹','m':'𝗺','n':'𝗻','o':'𝗼','p':'𝗽','q':'𝗾','r':'𝗿','s':'𝘀','t':'𝘁','u':'𝘂','v':'𝘃','w':'𝘄','x':'𝘅','y':'𝘆','z':'𝘇','0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵',' ':' '}[ch]||ch)).join('');
const DENY = () => '𝙈𝙢𝙢𝙢 𝙪𝙣𝙖𝙪𝙩𝙝𝙤𝙧𝙞𝙯𝙚𝙙 ✋🚫 𝙮𝙤𝙪 𝙘𝙖𝙣\'𝙩 𝙪𝙨𝙚 𝙩𝙝𝙖𝙩';

const STAR  = '★★★★★★★★★';
const BOX_T = `╔${STAR}╗`;
const BOX_B = `╚${STAR}╝`;
const sBox  = (...lines) => [BOX_T, ...lines, BOX_B].join('\n');
const tz    = () => config.settings?.timezone || 'Africa/Nairobi';
const fmt_tz = () => moment().tz(tz()).format('z');

// ── Host Detection ────────────────────────────────────────────────────────────
const detectHost = () => {
    if (process.env.HEROKU_APP_NAME || process.env.DYNO)                          return '🟣 Heroku';
    if (process.env.RENDER || process.env.RENDER_SERVICE_NAME)                     return '🟦 Render';
    if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID)         return '🚂 Railway';
    if (process.env.CYCLIC_URL)                                                    return '🟢 Cyclic';
    if (process.env.TERMUX_VERSION || (process.env.PREFIX||'').includes('termux')) return '📱 Termux';
    if (process.env.KOYEB_INSTANCE_ID)                                             return '🟠 Koyeb';
    if (process.env.FLY_APP_NAME)                                                  return '🪁 Fly.io';
    if (process.env.VERCEL)                                                        return '▲ Vercel';
    if (process.env.AWS_REGION)                                                    return '🟡 AWS';
    return '🖥️ VPS/Local';
};
global._hostName = detectHost();

// ── Bot State ─────────────────────────────────────────────────────────────────
let BOT_PAUSED = false;
global._botPaused = () => BOT_PAUSED;
global._botKill   = () => { BOT_PAUSED = true; };
global._botWake   = () => { BOT_PAUSED = false; };

// ── Plugin Loader ─────────────────────────────────────────────────────────────
class PluginLoader {
    constructor() {
        this.plugins    = new Map();
        this.categories = new Map();
        this.dir        = path.join(__dirname, 'plugins');
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
            { key: 'games',        label: 'GAMES',        emoji: '🎮' },
            { key: 'general',      label: 'OTHERS',       emoji: '✨' },
            { key: 'media',        label: 'MEDIA',        emoji: '🎬' },
            { key: 'utility',      label: 'UTILITY',      emoji: '🔧' },
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
        console.log('');
        console.log(chalk.hex('#00d4ff').bold('  ┌─ 👁️  LIAM EYES — COMMANDS ─────────────────────'));
        let total = 0;
        for (const c of this.catDef) {
            const n = (this.categories.get(c.key) || []).length;
            if (n) { console.log(chalk.hex('#a29bfe')(`  │  ${c.emoji} ${c.label.padEnd(14)} `) + chalk.white(String(n))); total += n; }
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
    primaryCats() { return this.catDef.slice(0, 21).filter(c => (this.categories.get(c.key) || []).length > 0); }
    catByNum(n)   { return this.primaryCats()[n - 1] || null; }
    count()       { return this.plugins.size; }
    reload()      { this.load(); }
    getCmds(key)  { return (this.categories.get(key) || []).sort(); }
    style1_index() { return this.primaryCats().map((c, i) => `_${i+1}._ ${c.emoji} _${c.label}_`).join('\n'); }
    style1_cat(prefix, catKey) {
        const cmds = this.getCmds(catKey);
        const c = this.catDef.find(x => x.key === catKey) || { label: catKey.toUpperCase(), emoji: '📦' };
        if (!cmds.length) return null;
        return [`*${c.emoji} ${c.label}*`, ...cmds.map(cmd => `  ${prefix}${cmd}`), ''].join('\n');
    }
    style2(prefix) {
        const lines = [];
        for (const c of this.catDef) {
            const cmds = this.getCmds(c.key); if (!cmds.length) continue;
            lines.push(`\n${c.emoji} *${c.label} MENU*`); lines.push('─────────────────────────');
            cmds.forEach(cmd => lines.push(`│ ${prefix}${cmd}`));
        }
        return lines.join('\n');
    }
    style3(prefix) {
        const lines = [];
        for (const c of this.catDef) {
            const cmds = this.getCmds(c.key); if (!cmds.length) continue;
            lines.push(`\n╭──『 *${c.emoji} ${c.label}* 』`);
            cmds.forEach(cmd => lines.push(`│  ✦ ${prefix}${cmd}`));
            lines.push('╰' + '─'.repeat(22));
        }
        return lines.join('\n');
    }
    style4(prefix) {
        const bullets = ['✿','❀','✾','❁','✸','✺']; const lines = []; let bi = 0;
        for (const c of this.catDef) {
            const cmds = this.getCmds(c.key); if (!cmds.length) continue;
            lines.push(`\n≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋`); lines.push(`  ${c.emoji} *${script(c.label)}*`); lines.push(`≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋`);
            cmds.forEach(cmd => lines.push(`  ${bullets[bi++ % bullets.length]} _${prefix}${cmd}_`));
        }
        return lines.join('\n');
    }
}
const PL = new PluginLoader();

// ── Chatbot ───────────────────────────────────────────────────────────────────
const chatHistory = new Map();
global._chatHistory = chatHistory;
const SYSTEM_PROMPT = `You are LIAM EYES 👁️ — a witty WhatsApp AI by Liam.
RULES:
- Reply in SAME LANGUAGE as the user. Swahili→Swahili. English→English.
- Match their VIBE: chill→relaxed, excited→hype, sad→warm, playful→playful.
- SHORT for casual (1-3 sentences). Detailed only when actually helping.
- NEVER mention OpenAI, ChatGPT, Claude, or Anthropic. You are LIAM EYES by Liam.`;
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
            `https://text.pollinations.ai/${encodeURIComponent(SYSTEM_PROMPT + '\n\n' + ctx + '\nLIAM:')}`,
            { timeout: 12000, headers: { 'User-Agent': 'LIAM-EYES/2.0' } }
        );
        reply = (data?.toString() || '').trim();
    } catch (_) {}
    if (!reply || reply.length < 2) reply = '😅 Brain buffered! Try again.';
    hist.push({ role: 'assistant', content: reply });
    return reply;
};

// ── Console Log ───────────────────────────────────────────────────────────────
const LOG_COLORS = ['#00ff88','#00d4ff','#ff6b9d','#ffd93d','#a29bfe','#fd79a8'];
let _logColorIdx = 0;
const logMsg = (m, body, pushname, senderNum, isGroup, chatId, mtype) => {
    const color = LOG_COLORS[_logColorIdx++ % LOG_COLORS.length];
    const tz_   = fmt_tz();
    const time  = moment().tz(tz()).format('HH:mm:ss');
    const sep   = chalk.hex(color)('─'.repeat(16) + ' 『 ') + chalk.white.bold('LIAM EYES') + chalk.hex(color)(' 』 ' + '─'.repeat(16));
    const row   = (label, val) => chalk.hex(color)('» ') + chalk.hex('#888')(label.padEnd(14)) + chalk.white(val);
    console.log(''); console.log(sep);
    console.log(row('Sent Time:', `${time} ${tz_}`));
    console.log(row('Message Type:', mtype || 'textMessage'));
    console.log(row('Sender:', senderNum));
    console.log(row('Name:', pushname || 'Unknown'));
    console.log(row('Chat ID:', isGroup ? chatId : 'DM'));
    console.log(row('Message:', (body || 'N/A').slice(0, 80)));
    console.log(chalk.hex(color)('─'.repeat(44)));
};

// ── Main Handler ──────────────────────────────────────────────────────────────
module.exports = async (sock, m, chatUpdate, store) => {
    try {
        await loadUtils();
        const mtype = m.mtype || Object.keys(m.message || {})[0] || 'unknown';
        const body = (
            m.body || m.message?.conversation || m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption || m.message?.videoMessage?.caption ||
            m.message?.buttonsResponseMessage?.selectedButtonId ||
            m.message?.listResponseMessage?.singleSelectReply?.selectedRowId || ''
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
        const quoted  = m.quoted || m;
        const mime    = (quoted.msg || quoted).mimetype || '';
        const isMedia = /image|video|sticker|audio/.test(mime);

        const isCreator = (() => {
            try {
                const n1 = (sender || '').split('@')[0].replace(/:\d+/, '');
                const n2 = (config.owner || '').replace(/[^0-9]/g, '');
                return n1 === n2 || (_jidNorm?.(sender) === _jidNorm?.(botId));
            } catch { return false; }
        })();
        const _store    = require('./library/store');
        const isSudo    = isCreator || _store.isSudo(senderNum);
        const isBotAdm  = isSudo  || _store.isBotAdmin(senderNum);

        let groupMetadata = {}, groupName = '', participants = [],
            groupAdmins = [], isBotAdmins = false, isAdmins = false,
            groupOwner = '', isGroupOwner = false;
        if (m.isGroup) {
            groupMetadata = await sock.groupMetadata(m.chat).catch(() => ({}));
            groupName     = groupMetadata.subject || '';
            participants  = (groupMetadata.participants || []).map(p => ({ id: p.id, admin: p.admin === 'superadmin' ? 'superadmin' : p.admin === 'admin' ? 'admin' : null }));
            groupAdmins   = participants.filter(p => p.admin).map(p => p.id);
            isBotAdmins   = groupAdmins.includes(botId);
            isAdmins      = groupAdmins.includes(sender);
            groupOwner    = groupMetadata.owner || '';
            isGroupOwner  = groupOwner === sender;
        }

        logMsg(m, body, pushname, senderNum, m.isGroup, m.chat, mtype);

        if (BOT_PAUSED && !isCreator) return;
        if (BOT_PAUSED && isCmd && command !== 'wake') return;

        // ── reply = PLAIN TEXT only, no image ────────────────────────────────
        const reply = txt => sock.sendMessage(m.chat, { text: txt }, { quoted: m }).catch(() => {});
        // ── replyMenu = with image, ONLY used by .menu ────────────────────────
        const replyMenu = async txt => {
            if (menuImage && menuImage.length > 0) {
                await sock.sendMessage(m.chat, { image: menuImage, caption: txt }, { quoted: m }).catch(() => {});
            } else {
                await sock.sendMessage(m.chat, { text: txt }, { quoted: m }).catch(() => {});
            }
        };

        const ctx = {
            args, text, q: text, quoted, mime, isMedia,
            groupMetadata, groupName, participants, groupOwner,
            groupAdmins, isBotAdmins, isAdmins, isGroupOwner,
            isCreator, isSudo, prefix, reply, config, sender, pushname, senderNum, m,
        };

        // ── Auto-features ─────────────────────────────────────────────────────
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

        // ── Numeric menu reply 1-21 ───────────────────────────────────────────
        if (!m.key.fromMe && !isCmd) {
            const trimmed = (body || '').replace(/\s+/g, '');
            if (/^\d{1,2}$/.test(trimmed)) {
                const n = parseInt(trimmed, 10);
                if (n >= 1 && n <= 21) {
                    const cat = PL.catByNum(n);
                    if (cat) { const content = PL.style1_cat(prefix, cat.key); if (content) { await reply(content); return; } }
                    return;
                }
            }
        }

        // ── "bot" keyword — GROUPS ONLY, never in DMs ────────────────────────
        if (!m.key.fromMe && !isCmd && m.isGroup && /\bbot\b/i.test(body)) {
            const ph = config.pairingSite || 'https://liam-scanner.onrender.com/pair';
            const gh = config.github      || 'https://github.com/Dialmw/LIAM-EYES';
            const ownerNum = (config.owner || '254705483052').replace(/[^0-9]/g, '');
            await reply(
                `👁️ *LIAM EYES*\n\nHey ${pushname}! 👋 Looking for a bot?\n\n` +
                `🔗 *Get Session ID:* ${ph}\n` +
                `📦 *Source:* ${gh}\n` +
                `📞 *Contact owner:* wa.me/${ownerNum}\n\n` +
                `_Type *${prefix}menu* to see all commands_\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }

        // ── Chatbot ───────────────────────────────────────────────────────────
        if (feat.chatbot && !m.key.fromMe && !isCmd && body.trim().length > 0) {
            try {
                sock.sendPresenceUpdate('composing', m.chat).catch(() => {});
                const botReply = await chatbotReply(m.chat, body.trim());
                sock.sendPresenceUpdate('paused', m.chat).catch(() => {});
                return await reply(botReply);
            } catch (_) { return await reply('😅 Hiccup! Try again.'); }
        }
        if (!isCmd) return;

        // ── Plugin dispatch ───────────────────────────────────────────────────
        if (await PL.run(command, sock, m, ctx)) return;

        // ── .menu / .help — WITH image thumbnail ─────────────────────────────
        if (command === 'menu' || command === 'help') {
            const style  = parseInt(config.menuStyle) || 1;
            const numArg = parseInt(args[0]);
            if (style === 1) {
                if (numArg >= 1 && numArg <= 21) {
                    const cat = PL.catByNum(numArg);
                    if (cat) { const c = PL.style1_cat(prefix, cat.key); if (c) { await replyMenu(c); return; } }
                }
                if (args[0] && isNaN(args[0])) {
                    const key = args[0].toLowerCase();
                    if (PL.categories.has(key)) { const c = PL.style1_cat(prefix, key); if (c) { await replyMenu(c); return; } }
                }
            }
            const mem     = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0) + 'MB';
            const ramTot  = (os.totalmem() / 1024 / 1024 / 1024).toFixed(0) + 'GB';
            const up      = process.uptime();
            const upStr   = `${~~(up/86400)}d ${~~(up%86400/3600)}h ${~~(up%3600/60)}m`;
            const ping    = Math.max(0, Date.now() - (m.messageTimestamp || 0) * 1000);
            const total   = PL.count();
            const cats    = PL.primaryCats();
            const utype   = isCreator ? 'Owner' : isSudo ? 'Sudo' : isAdmins ? 'Admin' : 'User';
            const botName = config.settings?.title || '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
            const styleIcons = { 1:'🔢 Numbered', 2:'📋 List', 3:'🗂️ Classic', 4:'✒️ Cursive' };
            const curStyle   = parseInt(config.menuStyle) || 1;
            const curStyleNm = styleIcons[curStyle] || 'Numbered';
            const host       = global._hostName || '🖥️ VPS/Local';
            const styleHint  = `\n\n_Change style: *.numbered* | *.list* | *.classic* | *.cursive*_`;
            // ── Original EYES compact header ──────────────────────────
            const ramPct = Math.min(100,Math.round(process.memoryUsage().heapUsed/require('os').totalmem()*100));
            const ramBarStr = '■'.repeat(Math.round(ramPct/25))+'□'.repeat(4-Math.round(ramPct/25))+' '+ramPct+'%';
            // Style 1 header — original compact single-line (what user had first)
            const s1Hdr =
                `*👁️ ${B('LIAM EYES')}*  ·  ${total} cmds  ·  ${upStr}  ·  ${mem}\n` +
                `⚡ ${ping}ms  ·  ${sock.public?'🌍 Public':'🔒 Private'}  ·  ${host}\n\n`;
            // Styles 2-4 — vertical LITE-style header
            const liteHdr =
                `╔═══〚 👁️ ${B('LIAM  EYES')} 〛═══╗\n` +
                `║✫╭─╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍\n` +
                `║✫┃ ${B('User')}   : ${B((pushname||'User').slice(0,16))}\n` +
                `║✫┃ ${B('Prefix')} : ${B(prefix)}\n` +
                `║✫┃ ${B('Mode')}   : ${B(sock.public?'Public':'Private')}\n` +
                `║✫┃ ${B('Host')}   : ${B(host.replace(/[🟣🟦🚂📱🟠🪁🟢🖥️]/g,'').trim())}\n` +
                `║✫┃ ${B('RAM')}    : ${ramBarStr}\n` +
                `║✫┃ ${B('Cmds')}  : ${B(String(total)+'⁺')}\n` +
                `║✫┃ ${B('Ping')}  : ${B(ping+'ms')}\n` +
                `║✫┃ ${B('Uptime')}: ${B(upStr)}\n` +
                `║✫┃═════════════════════\n` +
                `║✫┃ █■█■█■█■█■█■█■█■█■█\n` +
                `║✫┃═════════════════════\n` +
                `╚════════════════════════╝\n`;

            const compactHdr2 = liteHdr;
            const classicHdr  = liteHdr;
            const header       = liteHdr;

            if (style === 1) {
                const txt = s1Hdr + PL.style1_index() + `\n\n_Reply 1–${cats.length} to open_`;
                await replyMenu(txt); return;
            }
            if (style === 2) { await replyMenu(compactHdr2 + PL.style2(prefix) + styleHint); return; }
            if (style === 3) { await replyMenu(compactHdr2 + PL.style3(prefix) + styleHint); return; }
            if (style === 4) { await replyMenu(compactHdr2 + PL.style4(prefix) + styleHint); return; }
        }

        if (command === 'kill') {
            if (!isCreator) return reply(DENY());
            BOT_PAUSED = true;
            return reply(`🔴 *Bot Paused*\n\nUse *${prefix}wake* to resume.\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
        if (command === 'wake') {
            if (!isCreator) return reply(DENY());
            BOT_PAUSED = false;
            return reply(`🟢 *Bot Active*\n\nI'm back online!\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }

        const _sW = { numbered:1, list:2, classic:3, cursive:4 };
        const _sI = { 1:'🔢 Numbered', 2:'📋 List', 3:'🗂️ Classic', 4:'✒️ Cursive' };
        if (['menustyle','setmenustyle','numbered','list','classic','cursive'].includes(command)) {
            if (!isCreator && !isSudo) return reply(DENY());
            if (_sW[command] !== undefined) { config.menuStyle = _sW[command]; return reply(`✅ *Menu style → ${_sI[_sW[command]]}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`); }
            const curSt = parseInt(config.menuStyle) || 1;
            const argN = parseInt(args[0]) || _sW[(args[0]||'').toLowerCase()];
            if (argN >= 1 && argN <= 4) { config.menuStyle = argN; return reply(`✅ *Menu style → ${_sI[argN]}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`); }
            return reply(`🎨 *Menu Style — Current:* ${curSt} (${_sI[curSt]})\n\nUse *.numbered* *.list* *.classic* *.cursive*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
        if (command === 'reload') {
            if (!isCreator) return reply(DENY());
            PL.reload();
            return reply(`✅ *Reloaded* — ${PL.count()} commands\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    } catch (e) { console.log(chalk.red('[MSG ERR] ' + (e.message || e))); }
};

let _f = require.resolve(__filename);
require('fs').watchFile(_f, () => { require('fs').unwatchFile(_f); delete require.cache[_f]; require(_f); });
