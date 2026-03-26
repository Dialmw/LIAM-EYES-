// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  LIAM EYES — keepalive.js  (always online, anti-idle, health beats)    ║
// ╚══════════════════════════════════════════════════════════════════════════╝
'use strict';
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

// ── Global keep-alive engine (starts once, shared across restarts) ────────────
// Presence: always online — sends presenceUpdate every 2 min so WhatsApp
// never marks bot as "last seen" and disconnects drop-idle logic
let _kaStarted = false;

const startKeepalive = sock => {
    if (_kaStarted) return;
    _kaStarted = true;

    // ── Presence ping every 2 min ─────────────────────────────────────────
    const presencePing = setInterval(() => {
        try { sock.sendPresenceUpdate('available').catch(() => {}); } catch(_) {}
    }, 2 * 60 * 1000);

    // ── Self-DM heartbeat every 30 min (keeps session alive on hosting platforms)
    const heartbeat = setInterval(async () => {
        try {
            const f = (config.features || {});
            if (!f.keepalive) return;
            const linked = (sock.user?.id||'').split(':')[0].replace('@s.whatsapp.net','');
            if (!linked) return;
            const jid = linked + '@s.whatsapp.net';
            await sock.sendMessage(jid, { delete: (
                // Send and immediately delete so inbox stays clean
                await sock.sendMessage(jid, { text: '🤖 _[LIAM EYES heartbeat]_' }).catch(()=>null)
            )?.key }).catch(()=>{});
        } catch(_) {}
    }, 30 * 60 * 1000);

    // Cleanup on process exit
    process.once('SIGINT', () => { clearInterval(presencePing); clearInterval(heartbeat); });
    process.once('SIGTERM',() => { clearInterval(presencePing); clearInterval(heartbeat); });
};

// Auto-start when module is first loaded (sock injected via global)
setImmediate(() => { if (global._waSocket) startKeepalive(global._waSocket); });

module.exports = [
// ── .ping (enhanced with keepalive status) ───────────────────────────────────
{
    command:'ping2', category:'general', description:'Ping + keepalive status',
    execute: async (sock,m,{reply}) => {
        startKeepalive(sock); // ensure started
        const start = Date.now();
        await sock.sendMessage(m.chat, { react: { text: '🏓', key: m.key } });
        const lat = Date.now() - start;
        const up  = process.uptime();
        const d=~~(up/86400),h=~~(up%86400/3600),mn=~~(up%3600/60),s=~~(up%60);
        reply(
            `🏓 *Pong!*\n\n` +
            `⚡ *Latency:*  ${lat}ms\n` +
            `⏱️ *Uptime:*   ${d}d ${h}h ${mn}m ${s}s\n` +
            `🔋 *Keepalive:* ${_kaStarted ? '✅ Active' : '❌ Stopped'}\n` +
            `🌐 *Presence:*  ${sock.user ? '✅ Online' : '❌ Off'}\n\n` +
            sig()
        );
    }
},
// ── .ka ─ toggle keepalive ────────────────────────────────────────────────────
{
    command:'ka', category:'owner', description:'Toggle keepalive heartbeat (owner)', owner:true,
    execute: async (sock,m,{isCreator,reply}) => {
        if (!isCreator) return reply(config.message?.owner || '⚠️ Owner only!');
        config.features = config.features || {};
        config.features.keepalive = !config.features.keepalive;
        const on = config.features.keepalive;
        if (on) startKeepalive(sock);
        await sock.sendMessage(m.chat, { react: { text: on?'💚':'🔴', key: m.key } });
        reply(`${on?'💚':'🔴'} *Keepalive heartbeat:* ${on?'ON ✅':'OFF ❌'}\n\n${sig()}`);
    }
},
];
