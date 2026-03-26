// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  tostatus_tools.js — FIXED: real statusJidList from contacts           ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

// ── Helper: fetch real contact JIDs for statusJidList ──────────────────────
// WhatsApp REQUIRES a list of contact JIDs for status to be visible to them.
// Without this, the status posts but nobody sees it.
async function getStatusRecipients(sock) {
    // Must include the LINKED NUMBER (sock.user.id) for status to be visible
    const linked = (sock.user?.id || '').split(':')[0].replace('@s.whatsapp.net','');
    const jids   = new Set();
    if (linked) jids.add(linked + '@s.whatsapp.net');

    // Also add cfg().owner as a target
    const cfg = require('../settings/config');
    const ownerNum = (cfg.owner || cfg.adminNumber || '').replace(/[^0-9]/g,'');
    if (ownerNum) jids.add(ownerNum + '@s.whatsapp.net');

    // Try contacts cache
    try {
        const store = sock.store || sock._store;
        if (store?.contacts) {
            Object.keys(store.contacts)
                .filter(j => j.endsWith('@s.whatsapp.net') && !j.includes('status'))
                .slice(0, 200)
                .forEach(j => jids.add(j));
        }
    } catch(_) {}

    if (global._waContacts?.length) global._waContacts.slice(0,200).forEach(j => jids.add(j));

    // Minimum: at least the linked number
    return [...jids].filter(Boolean);
}

// ── Build proper status send options ──────────────────────────────────────
async function statusOpts(sock, extra = {}) {
    const recipients = await getStatusRecipients(sock);
    return { statusJidList: recipients, ...extra };
}

module.exports = [
    // ── .togstatus — post replied media/text to status ─────────────────────
    { command:'togstatus', category:'tostatus',
      execute: async (sock,m,{reply,isCreator}) => {
        if(!isCreator) return reply(config.message.owner);
        const q = m.quoted;
        if(!q) return reply(`❗ *Reply to any media or text to post it to your status!*\n\n${sig()}`);
        await react(sock,m,'📤');
        try {
            const mime = (q.msg||q).mimetype||'';
            const opts = await statusOpts(sock);
            if(mime.includes('image')){
                const buf = await sock.downloadMediaMessage(q);
                await sock.sendMessage('status@broadcast',{image:buf,caption:q.text||q.body||'👁️ LIAM EYES',...opts});
            } else if(mime.includes('video')){
                const buf = await sock.downloadMediaMessage(q);
                await sock.sendMessage('status@broadcast',{video:buf,caption:q.text||q.body||'👁️ LIAM EYES',...opts});
            } else {
                const text = q.text||q.body||config.watermark||'👁️ LIAM EYES';
                await sock.sendMessage('status@broadcast',{text,...opts});
            }
            reply(`✅ *Posted to status!*\n\n${sig()}`);
            await react(sock,m,'✅');
        } catch(e){await react(sock,m,'❌');reply(`❌ Failed: ${e.message}\n\n${sig()}`);}
      }
    },

    // ── .tostatus — post text or replied media to status ──────────────────
    { command:'tostatus', category:'tostatus', owner:true,
      execute: async (sock,m,{text,reply,isCreator}) => {
        if(!isCreator) return reply(config.message.owner);
        const q = m.quoted;
        if(!q && !text) return reply(`❗ Reply to media or provide text.\n\n${sig()}`);
        await react(sock,m,'📤');
        try {
            const opts = await statusOpts(sock);
            if(text && !q){
                await sock.sendMessage('status@broadcast',{text:`${text}\n\n${sig()}`,...opts});
            } else {
                const mime = (q?.msg||q)?.mimetype||'';
                const buf  = mime ? await sock.downloadMediaMessage(q).catch(()=>null) : null;
                if(mime.includes('image') && buf)
                    await sock.sendMessage('status@broadcast',{image:buf,caption:text||'👁️ LIAM EYES',...opts});
                else if(mime.includes('video') && buf)
                    await sock.sendMessage('status@broadcast',{video:buf,caption:text||'👁️ LIAM EYES',...opts});
                else
                    await sock.sendMessage('status@broadcast',{text:text||sig(),...opts});
            }
            reply(`✅ *Posted to status!*\n\n${sig()}`);
            await react(sock,m,'✅');
        } catch(e){await react(sock,m,'❌');reply(`❌ Failed: ${e.message}\n\n${sig()}`);}
      }
    },

    // ── .togroupstatus — broadcast to all groups ───────────────────────────
    { command:'togroupstatus', category:'tostatus', owner:true,
      execute: async (sock,m,{text,reply,isCreator}) => {
        if(!isCreator) return reply('⚠️ Owner only!');
        const q = m.quoted;
        if(!text && !q) return reply('❗ Reply to media or provide text.\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒');

        await sock.sendMessage(m.chat,{react:{text:'📢',key:m.key}}).catch(()=>{});
        let groups = [];
        try {
            const all = await sock.groupFetchAllParticipating();
            groups = Object.keys(all);
        } catch(e) { return reply(`❌ Could not fetch groups: ${e.message}`); }

        if(!groups.length) return reply('❌ Bot is not in any groups.');
        await reply(`📢 *Broadcasting to ${groups.length} group(s)…*\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`);

        let sent = 0, failed = 0;
        const sleep = ms => new Promise(r => setTimeout(r,ms));
        const mime = (q?.msg||q)?.mimetype || '';

        for(const gid of groups) {
            try {
                if(q && mime.includes('image')) {
                    const buf = await sock.downloadMediaMessage(q);
                    await sock.sendMessage(gid,{image:buf,caption:text||'👁️ LIAM EYES'});
                } else if(q && mime.includes('video')) {
                    const buf = await sock.downloadMediaMessage(q);
                    await sock.sendMessage(gid,{video:buf,caption:text||'👁️ LIAM EYES'});
                } else {
                    await sock.sendMessage(gid,{text:text||q?.text||'👁️ LIAM EYES'});
                }
                sent++;
            } catch { failed++; }
            await sleep(800);
        }
        reply(`✅ *Broadcast done!*\n📤 Sent: ${sent}\n❌ Failed: ${failed}\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`);
        await sock.sendMessage(m.chat,{react:{text:'✅',key:m.key}}).catch(()=>{});
      }
    },
];
