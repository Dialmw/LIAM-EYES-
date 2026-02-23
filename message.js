'use strict';
const config = require('./settings/config');
const fs     = require('fs');
const path   = require('path');
const chalk  = require('chalk');
const axios  = require('axios');
const { fetchWithTimeout } = require('./library/function');
const { fquoted }   = require('./library/quoted');
const Api = require('./library/Api');

const image = fs.readFileSync('./thumbnail/image.jpg');

let _jidNorm;
const loadUtils = async () => {
    if (_jidNorm) return;
    const b = await import('@whiskeysockets/baileys');
    _jidNorm = b.jidNormalizedUser;
};

// ─────────────────────────────────────────────────────────────────────────────
//  UNICODE FONT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Bold serif (𝐀𝐁𝐂 𝟏𝟐𝟑)
const bold = t => t.split('').map(c => {
    const U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', L = 'abcdefghijklmnopqrstuvwxyz', N = '0123456789';
    const uB = '𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙';
    const lB = '𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳';
    const nB = '𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗';
    const ui = U.indexOf(c); if (ui >= 0) return [...uB][ui];
    const li = L.indexOf(c); if (li >= 0) return [...lB][li];
    const ni = N.indexOf(c); if (ni >= 0) return [...nB][ni];
    return c;
}).join('');

// Bold italic (𝑨𝑩𝑪)
const boldItalic = t => t.split('').map(c => {
    const U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', L = 'abcdefghijklmnopqrstuvwxyz';
    const uI = '𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁';
    const lI = '𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛';
    const ui = U.indexOf(c.toUpperCase()); if (ui >= 0) return [...(c === c.toUpperCase() ? uI : lI)][ui];
    return c;
}).join('');

// Script/cursive (𝓐𝓑𝓒)
const script = t => t.split('').map(c => {
    const U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', L = 'abcdefghijklmnopqrstuvwxyz';
    const uS = '𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩';
    const lS = '𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃';
    const ui = U.indexOf(c); if (ui >= 0) return [...uS][ui];
    const li = L.indexOf(c); if (li >= 0) return [...lS][li];
    return c;
}).join('');

// Bold numbers only  𝟏 𝟐 𝟑...
const boldNum = n => {
    const map = ['𝟎','𝟏','𝟐','𝟑','𝟒','𝟓','𝟔','𝟕','𝟖','𝟗'];
    return String(n).split('').map(d => map[+d] || d).join('');
};

// ─────────────────────────────────────────────────────────────────────────────
//  PLUGIN LOADER
// ─────────────────────────────────────────────────────────────────────────────
class PluginLoader {
    constructor() {
        this.plugins    = new Map();
        this.categories = new Map();
        this.dir        = path.join(__dirname, 'plugins');

        this.catDef = [
            { key: 'ai',        label: 'AI',         emoji: '🤖' },
            { key: 'audio',     label: 'AUDIO',      emoji: '🎵' },
            { key: 'download',  label: 'DOWNLOAD',   emoji: '⬇️' },
            { key: 'ephoto',    label: 'EPHOTO360',  emoji: '🖼️' },
            { key: 'fun',       label: 'FUN',        emoji: '😂' },
            { key: 'games',     label: 'GAMES',      emoji: '🎮' },
            { key: 'group',     label: 'GROUP',      emoji: '👥' },
            { key: 'image',     label: 'IMAGE',      emoji: '🌄' },
            { key: 'other',     label: 'OTHER',      emoji: '📦' },
            { key: 'owner',     label: 'OWNER',      emoji: '👑' },
            { key: 'religion',  label: 'RELIGION',   emoji: '🕌' },
            { key: 'search',    label: 'SEARCH',     emoji: '🔍' },
            { key: 'settings',  label: 'SETTINGS',   emoji: '⚙️' },
            { key: 'sports',    label: 'SPORTS',     emoji: '⚽' },
            { key: 'support',   label: 'SUPPORT',    emoji: '🆘' },
            { key: 'tools',     label: 'TOOLS',      emoji: '🛠️' },
            { key: 'tostatus',  label: 'TOSTATUS',   emoji: '📤' },
            { key: 'translate', label: 'TRANSLATE',  emoji: '🌍' },
            { key: 'video',     label: 'VIDEO',      emoji: '🎬' },
            { key: 'general',   label: 'OTHERS',     emoji: '✨' },
            // legacy
            { key: 'media',     label: 'MEDIA',      emoji: '🎬' },
            { key: 'utility',   label: 'UTILITY',    emoji: '🔧' },
        ];
        this.catOrder = this.catDef.map(c => c.key);
        this.catLabel = {}; this.catEmoji = {};
        this.catDef.forEach(c => { this.catLabel[c.key] = c.label; this.catEmoji[c.key] = c.emoji; });
        this.load();
    }

    load() {
        this.plugins.clear();
        this.categories.clear();
        this.catOrder.forEach(c => this.categories.set(c, []));
        if (!fs.existsSync(this.dir)) return;

        for (const file of fs.readdirSync(this.dir).filter(f => f.endsWith('.js') && !f.startsWith('_'))) {
            try {
                const fp = path.join(this.dir, file);
                delete require.cache[require.resolve(fp)];
                const list = [].concat(require(fp));
                for (const p of list) {
                    if (!p?.command || typeof p.execute !== 'function') continue;
                    const cat = p.category || 'general';
                    if (!this.categories.has(cat)) this.categories.set(cat, []);
                    this.plugins.set(p.command, p);
                    this.categories.get(cat).push(p.command);
                }
            } catch (e) { console.log(chalk.red(`  [PLUG] ${file}: ${e.message}`)); }
        }

        console.log('');
        console.log(chalk.hex('#00d4ff').bold('  ┌─ PLUGIN SYSTEM ──────────────────────────────'));
        for (const c of this.catDef) {
            const n = (this.categories.get(c.key) || []).length;
            if (n) console.log(chalk.hex('#a29bfe')(`  │  ${c.emoji} ${c.label.padEnd(12)} ${n} commands`));
        }
        console.log(chalk.hex('#00b894').bold(`  └─ Total: ${this.plugins.size} commands ✔`));
        console.log('');
    }

    async run(cmd, sock, m, ctx) {
        const p = this.plugins.get(cmd);
        if (!p) return false;
        try {
            if (p.owner && !ctx.isCreator)   { await ctx.reply(config.message.owner); return true; }
            if (p.group && !m.isGroup)        { await ctx.reply(config.message.group); return true; }
            if (p.admin && m.isGroup && !ctx.isAdmins && !ctx.isCreator) { await ctx.reply(config.message.admin); return true; }
            await p.execute(sock, m, ctx);
        } catch (e) { console.log(chalk.red(`  [CMD] ${cmd}: ${e.message}`)); }
        return true;
    }

    activeCats() { return this.catDef.filter(c => (this.categories.get(c.key) || []).length > 0); }
    catByIndex(n) { return this.activeCats()[n - 1] || null; }
    count() { return this.plugins.size; }
    reload() { this.load(); }

    // ════════════════════════════════════════════════════════════════════════
    //  STYLE 1 — Numbered index  (user replies with number → category drops)
    //  Numbers: bold unicode  𝟏 𝟐 𝟑...
    //  Labels:  bold serif    𝐀𝐈 𝐌𝐄𝐍𝐔
    // ════════════════════════════════════════════════════════════════════════
    _s1_index(prefix) {
        const cats = this.activeCats();
        const lines = [];
        cats.forEach((c, i) => {
            lines.push(`${boldNum(i + 1)} ${bold(c.label + ' MENU')}`);
        });
        return lines.join('\n');
    }

    _s1_category(prefix, catKey) {
        const cmds = (this.categories.get(catKey) || []).sort();
        const c    = this.catDef.find(x => x.key === catKey) || { label: catKey.toUpperCase(), emoji: '📦' };
        if (!cmds.length) return null;
        const lines = [`┏▣ ◈ *${c.emoji} ${c.label} MENU* ◈`];
        cmds.forEach(cmd => lines.push(`│➽ ${prefix}${cmd}`));
        lines.push('┗▣');
        return lines.join('\n');
    }

    // ════════════════════════════════════════════════════════════════════════
    //  STYLE 2 — Classic boxed  ╭──『 CAT 』 │ cmd ╰──
    // ════════════════════════════════════════════════════════════════════════
    _s2(prefix) {
        const lines = [];
        for (const c of this.catDef) {
            const cmds = this.categories.get(c.key);
            if (!cmds?.length) continue;
            lines.push(`\n╭──『 *${c.emoji} ${c.label}* 』`);
            [...cmds].sort().forEach(cmd => lines.push(`│  ✦ ${prefix}${cmd}`));
            lines.push('╰' + '─'.repeat(30));
        }
        return lines.join('\n');
    }

    // ════════════════════════════════════════════════════════════════════════
    //  STYLE 3 — Cursive script fade  𝓐𝓑𝓒 headers, flower bullets
    // ════════════════════════════════════════════════════════════════════════
    _s3(prefix) {
        const bullets = ['✿','❀','✾','❁','✸','✺','✻','✼','❋','✤'];
        const lines = [];
        let bi = 0;
        for (const c of this.catDef) {
            const cmds = this.categories.get(c.key);
            if (!cmds?.length) continue;
            lines.push(`\n〔 ${c.emoji} *${script(c.label)}* 〕`);
            [...cmds].sort().forEach(cmd => {
                lines.push(`  ${bullets[bi % bullets.length]} _${prefix}${cmd}_`);
                bi++;
            });
        }
        return lines.join('\n');
    }

    // ════════════════════════════════════════════════════════════════════════
    //  STYLE 4 — Bold-italic headers, diamond two-column grid
    // ════════════════════════════════════════════════════════════════════════
    _s4(prefix) {
        const lines = [];
        for (const c of this.catDef) {
            const cmds = this.categories.get(c.key);
            if (!cmds?.length) continue;
            lines.push(`\n◈◈◈ ${c.emoji} *${boldItalic(c.label)}* ◈◈◈`);
            const sorted = [...cmds].sort();
            for (let i = 0; i < sorted.length; i += 2) {
                const a = `⟡ ${prefix}${sorted[i]}`;
                const b = sorted[i + 1] ? `   ⟡ ${prefix}${sorted[i + 1]}` : '';
                lines.push(a + b);
            }
        }
        return lines.join('\n');
    }

    buildMenu(prefix, style, catKey) {
        if (style === 1) return catKey ? this._s1_category(prefix, catKey) : this._s1_index(prefix);
        if (style === 2) return this._s2(prefix);
        if (style === 3) return this._s3(prefix);
        if (style === 4) return this._s4(prefix);
        return this._s1_index(prefix);
    }
}

const PL = new PluginLoader();

// ─────────────────────────────────────────────────────────────────────────────
//  CHATBOT — bilingual AI with humor (Swahili + English)
// ─────────────────────────────────────────────────────────────────────────────
const chatHistory = new Map(); // jid → [{role,content}]
global._chatHistory = chatHistory; // exposed for .clearchat command

const SYSTEM_PROMPT =
`You are LIAM EYES 👁️, a witty WhatsApp assistant made by Liam.
Rules:
- Detect the user's language from their message and REPLY IN THE SAME LANGUAGE.
  If they write Swahili → respond Swahili. English → English. Mix → mirror that mix.
- Match their VIBE: chill = chill, excited = hype, curious = informative+fun, sad = empathetic.
- Add natural humor — a quick joke or witty observation when it fits. Don't force it.
- Keep casual replies SHORT (1-3 sentences). Be detailed only when genuinely helping.
- If asked who you are: you're LIAM EYES, a WhatsApp AI assistant — nothing else.
- Use emojis sparingly and purposefully.
- Never break character or mention OpenAI, ChatGPT, or Anthropic.`;

const getHistory = jid => {
    if (!chatHistory.has(jid)) chatHistory.set(jid, []);
    const h = chatHistory.get(jid);
    if (h.length > 16) chatHistory.set(jid, h.slice(-16));
    return chatHistory.get(jid);
};

const chatbotReply = async (jid, userText) => {
    const history = getHistory(jid);
    history.push({ role: 'user', content: userText });

    // Build conversational context
    const context = history.slice(-6).map(h =>
        (h.role === 'user' ? 'User' : 'LIAM') + ': ' + h.content
    ).join('\n');

    const fullPrompt = SYSTEM_PROMPT +
        '\n\n--- Conversation so far ---\n' + context +
        '\n\nLIAM:';

    let reply = '';
    try {
        const { data } = await axios.get(
            `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`,
            { timeout: 14000, headers: { 'User-Agent': 'LIAM-EYES/2.0' } }
        );
        reply = (data?.toString() || '').trim();
    } catch (_) {}

    // Fallback if pollinations fails
    if (!reply || reply.length < 2) {
        const sw = /habari|niko|sijui|asante|sawa|wewe|mimi|ni|ya|na|wa|kwa|hii|hiyo|lakini|pia|bado/i.test(userText);
        const fallbacks = sw
            ? ['😅 Samahani, nilikata kidogo! Niulize tena.', '🤔 Hilo ni gumu! Mtandao wangu ulichoka. Jaribu tena.', '😂 Ah pole, nilikosea! Sema tena bwana.']
            : ["😅 I glitched a bit! Ask me again.", "🤔 Good one — my brain buffered. Try again!", "😂 Oops, short-circuit! Hit me again."];
        reply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    history.push({ role: 'assistant', content: reply });
    return reply;
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN MESSAGE HANDLER
// ─────────────────────────────────────────────────────────────────────────────
module.exports = async (sock, m, chatUpdate, store) => {
    try {
        await loadUtils();

        const body = (
            m.mtype === 'conversation'           ? m.message.conversation :
            m.mtype === 'imageMessage'           ? m.message.imageMessage?.caption :
            m.mtype === 'videoMessage'           ? m.message.videoMessage?.caption :
            m.mtype === 'extendedTextMessage'    ? m.message.extendedTextMessage?.text :
            m.mtype === 'buttonsResponseMessage' ? m.message.buttonsResponseMessage?.selectedButtonId :
            m.mtype === 'listResponseMessage'    ? m.message.listResponseMessage?.singleSelectReply?.selectedRowId :
            ''
        ) || '';

        const botId     = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net';
        const sender    = m.key.fromMe ? botId : (m.key.participant || m.key.remoteJid);
        const senderNum = sender.split('@')[0];

        const prefixMatch = body.match(/^[.!#$]/);
        const prefix  = prefixMatch ? prefixMatch[0] : '.';
        const isCmd   = !!prefixMatch;
        const command = isCmd ? body.slice(1).trim().split(/\s+/)[0].toLowerCase() : '';
        const args    = body.trim().split(/\s+/).slice(1);
        const text = q = args.join(' ');

        const pushname = m.pushName || 'User';
        const quoted   = m.quoted || m;
        const mime     = (quoted.msg || quoted).mimetype || '';
        const isMedia  = /image|video|sticker|audio/.test(mime);

        const isCreator = _jidNorm(sender) === _jidNorm(botId);

        let groupMetadata = {}, groupName = '', participants = [], groupAdmins = [],
            isBotAdmins = false, isAdmins = false, groupOwner = '', isGroupOwner = false;
        if (m.isGroup) {
            groupMetadata = await sock.groupMetadata(m.chat).catch(() => ({}));
            groupName     = groupMetadata.subject || '';
            participants  = (groupMetadata.participants || []).map(p => ({
                id: p.id, admin: p.admin === 'superadmin' ? 'superadmin' : p.admin === 'admin' ? 'admin' : null,
            }));
            groupAdmins  = participants.filter(p => p.admin).map(p => p.id);
            isBotAdmins  = groupAdmins.includes(botId);
            isAdmins     = groupAdmins.includes(sender);
            groupOwner   = groupMetadata.owner || '';
            isGroupOwner = groupOwner === sender;
        }

        if (isCmd) {
            const ts  = new Date().toLocaleTimeString('en-US', { hour12: false });
            const loc = m.isGroup ? chalk.hex('#00b894')('[GRP] ') : chalk.hex('#74b9ff')('[DM]  ');
            console.log(
                chalk.hex('#636e72')(`  [${ts}] `) + loc +
                chalk.hex('#6c5ce7').bold(' ▶ ') +
                chalk.hex('#fdcb6e').bold((prefix + command).padEnd(18)) +
                chalk.hex('#a29bfe')('👤 ') + chalk.white((pushname || 'User').slice(0, 14).padEnd(15)) +
                chalk.hex('#636e72')('+' + senderNum)
            );
        }

        const reply = txt => sock.sendMessage(m.chat, {
            text: txt,
            contextInfo: { externalAdReply: {
                title: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒',
                body: '👁️ Your Eyes in the WhatsApp World',
                thumbnailUrl: config.thumbUrl,
                sourceUrl: 'https://whatsapp.com/channel/0029VbBeZTc1t90aZjks9v2S',
                renderLargerThumbnail: false,
            }}
        }, { quoted: m });

        const ctx = {
            args, text, q, quoted, mime, isMedia,
            groupMetadata, groupName, participants, groupOwner,
            groupAdmins, isBotAdmins, isAdmins, isGroupOwner,
            isCreator, prefix, reply, config, sender, pushname, senderNum, m,
        };

        // ── Auto features ────────────────────────────────────────────────────
        const feat = config.features || {};
        if (feat.autoread && !m.key.fromMe)
            sock.readMessages([m.key]).catch(() => {});
        if (feat.autotyping && !m.key.fromMe)
            sock.sendPresenceUpdate('composing', m.chat).catch(() => {});
        if (feat.autorecording && !m.key.fromMe)
            sock.sendPresenceUpdate('recording', m.chat).catch(() => {});
        if (feat.autoreact && !m.key.fromMe) {
            const pool = ['❤️','😂','🔥','👍','😍','🤩','💯','⚡','🎯','✨'];
            sock.sendMessage(m.chat, { react: { text: pool[~~(Math.random() * pool.length)], key: m.key } }).catch(() => {});
        }
        if (feat.antilink && m.isGroup && !isAdmins && !isCreator) {
            if (/(https?:\/\/|wa\.me\/|whatsapp\.com\/)/i.test(body)) {
                sock.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                reply(`⚠️ @${senderNum} Links are not allowed here!`);
                return;
            }
        }
        if (feat.antibadword && m.isGroup && !isAdmins && !isCreator) {
            if ((config.badwords || []).some(w => body.toLowerCase().includes(w.toLowerCase()))) {
                sock.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                reply(`⚠️ @${senderNum} Watch your language!`);
                return;
            }
        }

        // ── Chatbot (non-command messages) ───────────────────────────────────
        if (feat.chatbot && !m.key.fromMe && !isCmd && body.trim()) {
            try {
                await sock.sendPresenceUpdate('composing', m.chat).catch(() => {});
                const botReply = await chatbotReply(m.chat, body.trim());
                await sock.sendPresenceUpdate('paused', m.chat).catch(() => {});
                await reply(botReply);
            } catch (_) {
                await reply('😅 Hiccup! Try again.');
            }
            return;
        }

        // ── Style-1: user replies with a number to drill into a category ────
        if (!isCmd && !m.key.fromMe && /^\s*\d+\s*$/.test(body)) {
            const style = config.menuStyle || 1;
            if (style === 1) {
                const cat = PL.catByIndex(parseInt(body.trim()));
                if (cat) {
                    const content = PL.buildMenu(prefix, 1, cat.key);
                    if (content) { await reply(content); return; }
                }
            }
        }

        if (!isCmd) return;

        // ── Plugin dispatch ──────────────────────────────────────────────────
        if (await PL.run(command, sock, m, ctx)) return;

        // ── Built-in commands ────────────────────────────────────────────────
        switch (command) {

            case 'menu':
            case 'help': {
                const style  = config.menuStyle || 1;
                const numArg = parseInt(args[0]);

                // .menu 7 → show category 7 directly (style 1 only)
                if (style === 1 && numArg > 0) {
                    const cat = PL.catByIndex(numArg);
                    if (cat) {
                        const content = PL.buildMenu(prefix, 1, cat.key);
                        if (content) { await reply(content); break; }
                    }
                }

                const mem   = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
                const up    = process.uptime();
                const upStr = `${~~(up / 86400)}d ${~~(up % 86400 / 3600)}h ${~~(up % 3600 / 60)}m`;
                const ping  = Math.max(0, Date.now() - (m.messageTimestamp || 0) * 1000);
                const total = PL.count();
                const slabel = {1: '📋 Numbered', 2: '🗂️ Classic', 3: '🌸 Cursive', 4: '💎 Grid'}[style] || '📋 Numbered';
                const cats  = PL.activeCats();

                const header =
`╔══════════════════════════════════════╗
║   👁️  *𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒*  ✦  Alpha Bot    ║
╚══════════════════════════════════════╝
_👁️ Your Eyes in the WhatsApp World_

  ⚡ *Ping*   › ${ping}ms
  ⏱️ *Uptime* › ${upStr}
  💾 *RAM*    › ${mem}MB
  📦 *Cmds*   › ${total}
  🌍 *Mode*   › ${sock.public ? 'Public' : 'Private'}
  🎨 *Style*  › ${slabel}
  🔰 *Prefix* › ${prefix}`;

                let menuBody;
                if (style === 1) {
                    // Show numbered index — user replies with number
                    menuBody = header + '\n\n' + PL.buildMenu(prefix, 1) +
                        `\n\n_Reply with a number to view commands_\n_Or type *${prefix}menu 5* to open a section_`;
                } else {
                    menuBody = header + '\n' + PL.buildMenu(prefix, style) +
                        `\n\n_Change style: *${prefix}menustyle 1/2/3/4*_`;
                }

                menuBody += '\n\n> _𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 Alpha — by Liam_';

                const logoPath = path.join(__dirname, 'thumbnail', 'logo.jpg');
                const imgBuf   = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : image;

                await sock.sendMessage(m.chat, {
                    image: imgBuf,
                    caption: menuBody,
                    contextInfo: { externalAdReply: {
                        title: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — Menu',
                        body: '👁️ Your Eyes in the WhatsApp World',
                        thumbnailUrl: config.thumbUrl,
                        sourceUrl: config.pairingSite || 'https://liam-pannel.onrender.com/pair',
                        mediaType: 1,
                    }}
                }, { quoted: m });
                break;
            }

            case 'reload': {
                if (!isCreator) { await reply(config.message.owner); break; }
                PL.reload();
                reply(`✅ *Reloaded* — ${PL.count()} commands active\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
                break;
            }
        }

    } catch (e) { console.log(chalk.red('[MSG] ' + (e.message || e))); }
};

let _f = require.resolve(__filename);
require('fs').watchFile(_f, () => { require('fs').unwatchFile(_f); delete require.cache[_f]; require(_f); });
