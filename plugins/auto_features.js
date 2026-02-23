// ─────────────────────────────────────────────────────────────────
//  auto_features.js — every toggle supports:
//    .command on      → enable
//    .command off     → disable
//    .command         → flip current state
//  All owner-only. Shows a clean ON/OFF card in reply.
// ─────────────────────────────────────────────────────────────────
const config = require('../settings/config');

// ── Shared toggle engine ─────────────────────────────────────────
const toggle = async (feat, label, emoji, sock, m, ctx) => {
    const { args, reply } = ctx;
    if (!config.features) config.features = {};

    const arg = (args[0] || '').toLowerCase().trim();
    let on;
    if      (arg === 'on')  on = true;
    else if (arg === 'off') on = false;
    else                    on = !config.features[feat];   // flip

    config.features[feat] = on;

    await sock.sendMessage(m.chat, {
        react: { text: on ? emoji : '❌', key: m.key }
    }).catch(() => {});

    await reply(
        `${on ? emoji : '❌'} *${label}*\n\n` +
        `${on
            ? '╔═══════════════════╗\n║  ✅  E N A B L E D  ║\n╚═══════════════════╝'
            : '╔════════════════════╗\n║  ❌  D I S A B L E D  ║\n╚════════════════════╝'
        }\n\n` +
        `> 💡 *.${feat} on* · *.${feat} off* · *.${feat}* (flip)\n\n` +
        `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
    );
};

// ── Guard helper — owner only ────────────────────────────────────
const ow = fn => async (s, m, c) => {
    if (!c.isCreator) return c.reply(require('../settings/config').message.owner);
    return fn(s, m, c);
};

module.exports = [

    // ── 🛠️ TOOLS ─────────────────────────────────────────────────
    {
        command: 'autoread', category: 'tools', owner: true,
        execute: ow((s,m,c) => toggle('autoread', 'Auto Read', '📖', s, m, c))
    },
    {
        command: 'autoreact', category: 'tools', owner: true,
        execute: ow((s,m,c) => toggle('autoreact', 'Auto React', '⚡', s, m, c))
    },
    {
        command: 'autotyping', category: 'tools', owner: true,
        execute: ow((s,m,c) => toggle('autotyping', 'Auto Typing', '⌨️', s, m, c))
    },
    {
        command: 'autorecording', category: 'tools', owner: true,
        execute: ow((s,m,c) => toggle('autorecording', 'Auto Recording', '🎤', s, m, c))
    },
    {
        command: 'alwaysonline', category: 'tools', owner: true,
        execute: ow((s,m,c) => toggle('alwaysonline', 'Always Online', '🟢', s, m, c))
    },
    {
        command: 'antidelete', category: 'tools', owner: true,
        execute: ow((s,m,c) => toggle('antidelete', 'Anti Delete', '🗑️', s, m, c))
    },
    {
        command: 'antiviewonce', category: 'tools', owner: true,
        execute: ow((s,m,c) => toggle('antiviewonce', 'Anti View-Once', '👁️', s, m, c))
    },
    {
        command: 'autoviewstatus', category: 'tools', owner: true,
        execute: ow((s,m,c) => toggle('autoviewstatus', 'Auto View Status', '👁️', s, m, c))
    },
    {
        command: 'autoreactstatus', category: 'tools', owner: true,
        execute: ow((s,m,c) => toggle('autoreactstatus', 'Auto React Status', '❤️', s, m, c))
    },
    {
        command: 'autosavestatus', category: 'tools', owner: true,
        execute: ow((s,m,c) => toggle('autosavestatus', 'Auto Save Status', '💾', s, m, c))
    },

    // ── 🤖 AI ────────────────────────────────────────────────────
    {
        command: 'chatbot', category: 'ai', owner: true,
        execute: ow((s,m,c) => toggle('chatbot', 'AI Chatbot', '🤖', s, m, c))
    },

    // ── 👥 GROUP ─────────────────────────────────────────────────
    {
        command: 'antilink', category: 'group', owner: true,
        execute: ow((s,m,c) => toggle('antilink', 'Anti Link', '🔗', s, m, c))
    },
    {
        command: 'antibadword', category: 'group', owner: true,
        execute: ow((s,m,c) => toggle('antibadword', 'Anti Bad Word', '🤬', s, m, c))
    },
    {
        command: 'welcome', category: 'group', owner: true,
        execute: ow((s,m,c) => toggle('welcome', 'Welcome Message', '👋', s, m, c))
    },
    {
        command: 'antiflood', category: 'group', owner: true,
        execute: ow((s,m,c) => toggle('antiflood', 'Anti Flood', '🌊', s, m, c))
    },
    {
        command: 'chatbot', category: 'settings', owner: true,
        execute: ow((s,m,c) => toggle('chatbot', 'AI Chatbot', '🤖', s, m, c))
    },
    {
        command: 'clearchat', category: 'settings', owner: true,
        execute: ow(async (s, m, c) => {
            // Clear chatbot conversation history for this chat
            const { reply } = c;
            // Signal message.js to clear (we export a global map accessor)
            if (global._chatHistory) global._chatHistory.delete(m.chat);
            await s.sendMessage(m.chat, { react: { text: '🗑️', key: m.key } }).catch(() => {});
            reply('🗑️ *Chat history cleared!*\n\n_AI assistant will start fresh in this chat._\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️');
        })
    },

];
