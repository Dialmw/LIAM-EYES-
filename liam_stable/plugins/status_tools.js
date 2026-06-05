// Status Tools — savestatus, autoviewstatus, autoreactstatus, autosavestatus, antidelete, antiviewonce, vv, vv2
const config = require('../settings/config');
const path = require('path');
const fs   = require('fs');

const toggle = async (feat, label, emoji, sock, m, reply) => {
    config.features[feat] = !config.features[feat];
    const on = config.features[feat];
    await sock.sendMessage(m.chat, { react: { text: on ? emoji : '❌', key: m.key } });
    reply(`${emoji} *${label}* is now *${on ? '✅ ON' : '❌ OFF'}*`);
};

const extractMedia = async (sock, m, reply) => {
    const q = m.quoted;
    if (!q) return reply('❌ Reply to a view-once or media message!');
    try {
        await sock.sendMessage(m.chat, { react: { text: '👁️', key: m.key } });
        const buf = await sock.downloadMediaMessage(q);
        const mime = (q.msg || q).mimetype || '';
        if (mime.includes('video'))
            await sock.sendMessage(m.chat, { video: buf, caption: '👁️ *View-Once Media*\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒' }, { quoted: m });
        else if (mime.includes('audio'))
            await sock.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mp4' }, { quoted: m });
        else
            await sock.sendMessage(m.chat, { image: buf, caption: '👁️ *View-Once Media*\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒' }, { quoted: m });
    } catch (e) { reply('❌ Failed: ' + e.message); }
};

module.exports = [
    {
        command: 'savestatus', description: 'Save a WhatsApp status (reply to it)', category: 'tools',
        execute: async (sock, m, { reply }) => {
            const q = m.quoted;
            if (!q) return reply('❌ Reply to a status to save it!');
            try {
                await sock.sendMessage(m.chat, { react: { text: '💾', key: m.key } });
                const buf = await sock.downloadMediaMessage(q);
                const mime = (q.msg || q).mimetype || '';
                if (mime.includes('video'))
                    await sock.sendMessage(m.chat, { video: buf, caption: '✅ *Status saved!*\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒' }, { quoted: m });
                else if (mime.includes('audio'))
                    await sock.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mp4' }, { quoted: m });
                else
                    await sock.sendMessage(m.chat, { image: buf, caption: '✅ *Status saved!*\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒' }, { quoted: m });
            } catch (e) { reply('❌ ' + e.message); }
        }
    },
{ command: 'autosavestatus',  description: 'Auto save status updates',  category: 'tools',  execute: async (s,m,{reply,isCreator}) => { if(!isCreator) return reply(config.message.owner); toggle('autosavestatus','💾 Auto Save Status','💾',s,m,reply); } },
{ command: 'vv',  description: 'Extract view-once media', category: 'tools', execute: async (s,m,{reply}) => extractMedia(s,m,reply) },
    { command: 'vv2', description: 'Extract view-once (alt)', category: 'tools', execute: async (s,m,{reply}) => extractMedia(s,m,reply) }
];
