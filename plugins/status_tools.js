// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — status_tools.js  FIXED v2                           ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

const toggle = async (feat, label, emoji, sock, m, reply) => {
    if (!config.features) config.features = {};
    config.features[feat] = !config.features[feat];
    const on = config.features[feat];
    await sock.sendMessage(m.chat, { react: { text: on ? emoji : '❌', key: m.key } }).catch(()=>{});
    reply(`${on ? emoji : '❌'} *${label}* — ${on ? '✅ ON' : '❌ OFF'}\n\n${sig()}`);
};

const extractMedia = async (sock, m, reply) => {
    const q = m.quoted;
    if (!q) return reply('❌ Reply to a view-once or media message!\n\n' + sig());
    try {
        await sock.sendMessage(m.chat, { react: { text: '👁️', key: m.key } }).catch(()=>{});
        const buf = await sock.downloadMediaMessage(q);
        const mime = (q.msg || q).mimetype || '';
        if (mime.includes('video'))
            await sock.sendMessage(m.chat, { video: buf, caption: `👁️ *View-Once Media*\n${sig()}` }, { quoted: m });
        else if (mime.includes('audio'))
            await sock.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mp4' }, { quoted: m });
        else
            await sock.sendMessage(m.chat, { image: buf, caption: `👁️ *View-Once Media*\n${sig()}` }, { quoted: m });
        await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(()=>{});
    } catch (e) { reply('❌ Failed: ' + e.message + '\n\n' + sig()); }
};

module.exports = [
    {
        command: 'savestatus', description: 'Save a WhatsApp status (reply to it)', category: 'tools',
        execute: async (sock, m, { reply }) => {
            const q = m.quoted;
            if (!q) return reply('❌ Reply to a status to save it!\n\n' + sig());
            try {
                await sock.sendMessage(m.chat, { react: { text: '💾', key: m.key } }).catch(()=>{});
                const buf = await sock.downloadMediaMessage(q);
                const mime = (q.msg || q).mimetype || '';
                if (mime.includes('video'))
                    await sock.sendMessage(m.chat, { video: buf, caption: '✅ *Status saved!*\n' + sig() }, { quoted: m });
                else if (mime.includes('audio'))
                    await sock.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mp4' }, { quoted: m });
                else
                    await sock.sendMessage(m.chat, { image: buf, caption: '✅ *Status saved!*\n' + sig() }, { quoted: m });
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(()=>{});
            } catch (e) { reply('❌ ' + e.message + '\n\n' + sig()); }
        }
    },
    {
        command: 'statusreact', description: 'React to a status (reply with emoji)', category: 'tools',
        execute: async (sock, m, { text, reply }) => {
            const q = m.quoted;
            if (!q) return reply('❌ Reply to a status message with an emoji!\nExample: *.statusreact* (as reply to status)\n\n' + sig());
            const emoji = text?.trim() || '❤️';
            try {
                await sock.sendMessage('status@broadcast', {
                    react: { text: emoji, key: q.key }
                }, { statusJidList: [q.key?.participant || q.sender] });
                await sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } }).catch(()=>{});
                reply(`${emoji} *Reacted to status!*\n\n${sig()}`);
            } catch(e) { reply('❌ Reaction failed: ' + e.message + '\n\n' + sig()); }
        }
    },
    {
        command: 'viewstatus', description: 'Mark a status as viewed', category: 'tools',
        execute: async (sock, m, { reply }) => {
            const q = m.quoted;
            if (!q) return reply('❌ Reply to a status message!\n\n' + sig());
            try {
                await sock.readMessages([q.key]);
                await sock.sendMessage(m.chat, { react: { text: '👁️', key: m.key } }).catch(()=>{});
                reply(`👁️ *Status viewed!*\n\n${sig()}`);
            } catch(e) { reply('❌ Failed: ' + e.message + '\n\n' + sig()); }
        }
    },
    { command: 'autoviewstatus',  category: 'tools', execute: async (s,m,{reply,isCreator}) => { if(!isCreator) return reply(config.message.owner); toggle('autoviewstatus','Auto View Status','👁️',s,m,reply); } },
    { command: 'autoreactstatus', category: 'tools', execute: async (s,m,{reply,isCreator}) => { if(!isCreator) return reply(config.message.owner); toggle('autoreactstatus','Auto React Status','😍',s,m,reply); } },
    { command: 'autosavestatus',  category: 'tools', execute: async (s,m,{reply,isCreator}) => { if(!isCreator) return reply(config.message.owner); toggle('autosavestatus','Auto Save Status','💾',s,m,reply); } },
    { command: 'antidelete',      category: 'tools', execute: async (s,m,{reply,isCreator}) => { if(!isCreator) return reply(config.message.owner); toggle('antidelete','Anti-Delete','🗑️',s,m,reply); } },
    { command: 'antiviewonce',    category: 'tools', execute: async (s,m,{reply,isCreator}) => { if(!isCreator) return reply(config.message.owner); toggle('antiviewonce','Anti View-Once','👁️',s,m,reply); } },
    { command: 'vv',  category: 'tools', execute: async (s,m,{reply}) => extractMedia(s,m,reply) },
    { command: 'vv2', category: 'tools', execute: async (s,m,{reply}) => extractMedia(s,m,reply) },
];
