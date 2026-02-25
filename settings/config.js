// ════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — config.js (runtime config, loaded from settings.js)
//  © 2025 Liam — All Rights Reserved
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const S    = require('./settings');
const auth = require('./auth_ref');

const config = {
    // Owner — resolved via encrypted auth module
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
    pairingSite: S.pairingSite || 'https://liam-pannel.onrender.com/pair',
    github:      S.github      || 'https://github.com/Dialmw/LIAM-EYES',
    menuStyle:   S.menuStyle   || 1,
    autoBio:     S.autoBio     || false,
    autoBioText: S.autoBioText || '👁️ LIAM EYES | {time}',
};

module.exports = config;

let _f = require.resolve(__filename);
require('fs').watchFile(_f, () => { require('fs').unwatchFile(_f); delete require.cache[_f]; require(_f); });
