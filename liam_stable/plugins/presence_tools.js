// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  LIAM EYES — presence_tools.js  (online mode, bio, typing, read)       ║
// ╚══════════════════════════════════════════════════════════════════════════╝
'use strict';
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

module.exports = [

// ── .online — force presence to always-online ─────────────────────────────

// ── .setbio — change bot's WhatsApp status bio ───────────────────────────────

// ── .setname — change bot's display name ─────────────────────────────────────
{
    command:'setname', category:'owner', description:'Change bot profile name', owner:true,
    execute: async (sock,m,{text,isCreator,reply,prefix}) => {
        if (!isCreator) return reply(config.message?.owner);
        if (!text) return reply(`👤 *Usage:* ${prefix}setname <new name>\n\n${sig()}`);
        await react(sock,m,'👤');
        try {
            await sock.updateProfileName(text);
            reply(`✅ *Name updated!* → ${text}\n\n${sig()}`);
        } catch(e) {
            reply(`❌ Name update failed: ${e.message}\n\n${sig()}`);
        }
    }
},

// ── .autoread — toggle auto-read all messages ─────────────────────────────────

// ── .autotyping — toggle auto composing indicator ────────────────────────────
{
    command:'autotyping', category:'owner', description:'Toggle auto typing indicator', owner:true,
    execute: async (sock,m,{isCreator,reply}) => {
        if (!isCreator) return reply(config.message?.owner);
        config.features = config.features || {};
        config.features.autotyping = !config.features.autotyping;
        const on = config.features.autotyping;
        await react(sock,m,on?'⌨️':'⚫');
        reply(`${on?'⌨️':'⚫'} *Auto Typing:* ${on?'ON':'OFF'}\n\n${sig()}`);
    }
},

// ── .status — show all feature toggles ───────────────────────────────────────
{
    command:'status2', category:'owner', description:'Show all bot feature toggles', owner:true,
    execute: async (sock,m,{isCreator,reply,prefix}) => {
        if (!isCreator) return reply(config.message?.owner);
        const f = config.features || {};
        const T = k => f[k] ? '✅' : '❌';
        reply(
            `⚙️ *LIAM EYES — Feature Status*\n\n` +
            `${T('antidelete')} Anti-Delete\n` +
            `${T('alwaysonline')} Always Online\n` +
            `${T('autoread')} Auto Read\n` +
            `${T('autotyping')} Auto Typing\n` +
            `${T('chatbot')} Chatbot\n` +
            `${T('antilink')} Anti-Link\n` +
            `${T('welcome')} Welcome/Goodbye\n` +
            `${T('autoviewstatus')} Auto View Status\n` +
            `${T('autoreactstatus')} Auto React Status\n` +
            `${T('keepalive')} Keepalive Heartbeat\n` +
            `${T('autosavestatus')} Auto Save Status\n\n` +
            `_Toggle any with: ${prefix}<feature name>_\n\n` +
            sig()
        );
    }
},

];
