// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — AUTO FEATURES  (18 toggle commands)
//  alwaysonline, antibug, anticall, antidelete, antideletestatus, antiedit,
//  autobio, autoblock, autoreact, autoreactstatus, autoread, autorecord,
//  autorecordtyping, autotype, autoviewstatus, chatbot, antiflood, antiviewonce
//
//  Usage: .command on | .command off | .command (flip)
//  All owner-only.
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const config = require('../settings/config');

const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

// Shared toggle engine — .cmd on | off | (no arg = show status)
const tog = async (feat, label, emoji, sock, m, ctx) => {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);
    if (!config.features) config.features = {};

    const arg = (ctx.args[0] || '').toLowerCase();
    const current = !!config.features[feat];

    // No argument = show current state, DO NOT toggle
    if (!arg) {
        await sock.sendMessage(m.chat, { react: { text: current ? emoji : '⚙️', key: m.key } }).catch(() => {});
        return ctx.reply(
            `${current ? emoji : '❌'} *${label}*\n\n` +
            `Status: *${current ? '✅ ACTIVE' : '❌ INACTIVE'}*\n\n` +
            `Use *.${ctx.args[-1]||feat} on* or *.${ctx.args[-1]||feat} off*\n\n${sig()}`
        );
    }

    let on;
    if      (arg === 'on')  on = true;
    else if (arg === 'off') on = false;
    else                    on = !current;  // flip only when explicit toggle word

    // Already in desired state
    if (on === current && (arg === 'on' || arg === 'off')) {
        await sock.sendMessage(m.chat, { react: { text: on ? '✅' : 'ℹ️', key: m.key } }).catch(() => {});
        return ctx.reply(
            `${on ? emoji : '❌'} *${label}* is already *${on ? '✅ ACTIVE' : '❌ INACTIVE'}*\n\n${sig()}`
        );
    }

    config.features[feat] = on;

    await sock.sendMessage(m.chat, { react: { text: on ? emoji : '❌', key: m.key } }).catch(() => {});
    ctx.reply(
        `${on ? emoji : '❌'} *${label}*\n\n` +
        (on
            ? `╔═══════════════════╗\n║  ✅  E N A B L E D  ║\n╚═══════════════════╝\n\n_${label} is now ACTIVE_`
            : `╔══════════════════════╗\n║  ❌  D I S A B L E D  ║\n╚══════════════════════╝\n\n_${label} is now OFF_`
        ) +
        `\n\n${sig()}`
    );
};

// Helper to build a toggle command object
const mk = (cmd, feat, label, emoji) => ({
    command: cmd, category: 'settings', owner: true,
    execute: (s, m, ctx) => tog(feat, label, emoji, s, m, ctx),
});

module.exports = [
    mk('alwaysonline',     'alwaysonline',    'Always Online',           '🟢'),
    mk('antibug',          'antibug',         'Anti Bug Protection',     '🛡️'),
    mk('anticall',         'anticall',        'Anti Call (Reject Calls)','📵'),
    mk('antidelete',       'antidelete',      'Anti Delete',             '🗑️'),
    mk('antideletestatus', 'antideletestatus','Anti Delete Status',      '📸'),
    mk('antiedit',         'antiedit',        'Anti Edit Logger',        '✏️'),
    mk('autobio',          'autobio',         'Auto Bio Update',         '📝'),
    mk('autoblock',        'autoblock',       'Auto Block Non-Contacts', '🚫'),
    mk('antiflood',        'antiflood',       'Anti Flood',              '🌊'),
    mk('antiviewonce',     'antiviewonce',    'Anti View Once',          '🔓'),
    mk('autoreact',        'autoreact',       'Auto React',              '❤️'),
    mk('autoreactstatus',  'autoreactstatus', 'Auto React to Status',    '😍'),
    mk('autoread',         'autoread',        'Auto Read Messages',      '👁️'),
    mk('autorecord',       'autorecording',   'Auto Recording',          '🎙️'),
    mk('autorecordtyping', 'autorecording',   'Auto Record + Typing',    '🎙️'),
    mk('autotype',         'autotyping',      'Auto Typing Indicator',   '⌨️'),
    mk('autoviewstatus',   'autoviewstatus',  'Auto View Status',        '👀'),
    mk('chatbot',          'chatbot',         'AI Chatbot',              '🤖'),
];
