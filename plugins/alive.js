'use strict';
const config = require('../settings/config');
const os     = require('os');

function runtime(s) {
    s = Number(s);
    const d=Math.floor(s/86400), h=Math.floor((s%86400)/3600),
          m=Math.floor((s%3600)/60), sc=Math.floor(s%60);
    if (d) return `${d}d ${h}h ${m}m`;
    if (h) return `${h}h ${m}m`;
    return m ? `${m}m ${sc}s` : `${sc}s`;
}

const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

module.exports = {
    command: 'alive', category: 'general',
    execute: async (sock, m, { reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '⚡', key: m.key } }).catch(()=>{});
        const ping = Math.max(0, Date.now() - m.messageTimestamp * 1000);
        const up   = runtime(process.uptime());
        const ram  = (process.memoryUsage().heapUsed/1024/1024).toFixed(1);
        const msg  =
`👁️ *𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — Status*
━━━━━━━━━━━━━━━━━━━━━
👤 *User:* ${m.pushName||'User'}
⏱️ *been up for* *${up}*, cool huh 😎
📶 *Ping:* ${ping}ms
💾 *RAM:* ${ram}MB
🖥️ *Host:* ${global._hostName||'VPS/Local'}
👑 *Creator:* Liam
━━━━━━━━━━━━━━━━━━━━━
${sig()}`;
        try {
            await sock.sendMessage(m.chat, { image: { url: config.thumbUrl||'' }, caption: msg }, { quoted: m });
        } catch {
            await reply(msg);
        }
        await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(()=>{});
    }
};
