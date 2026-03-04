// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — tostatus_tools.js  (FIXED)                           ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

// ── Helper: build statusJidList from cached contacts ───────────────────────
async function getStatusRecipients(sock) {
    // Priority 1: global contact cache built by autoviewstatus
    if (global._waContacts && global._waContacts.length > 0) {
        return global._waContacts.filter(j => j.endsWith('@s.whatsapp.net'));
    }
    // Priority 2: sock store
    try {
        const store = sock.store || sock._store;
        if (store?.contacts) {
            const jids = Object.keys(store.contacts).filter(j => j.endsWith('@s.whatsapp.net') && !j.includes('status'));
            if (jids.length > 0) return jids;
        }
    } catch (_) {}
    // Priority 3: try fetchStatus contacts (may not be available)
    try {
        const contacts = await sock.getContacts?.() || [];
        const jids = contacts.map(c => c.id || c.jid).filter(j => j?.endsWith('@s.whatsapp.net'));
        if (jids.length) return jids;
    } catch(_) {}
    return [];
}

// ── Send status with retry logic ───────────────────────────────────────────
async function sendStatus(sock, payload, recipients) {
    const opts = recipients.length ? { statusJidList: recipients } : {};
    // Try with statusJidList first
    try {
        await sock.sendMessage('status@broadcast', payload, opts);
        return true;
    } catch(e1) {
        // Fallback: try without statusJidList
        try {
            await sock.sendMessage('status@broadcast', payload);
            return true;
        } catch(e2) {
            throw e2;
        }
    }
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
            const mime     = (q.msg||q)?.mimetype || '';
            const msgType  = Object.keys(q.message||{})[0] || '';
            const text     = q.text||q.body||'👁️ LIAM EYES';
            const recipients = await getStatusRecipients(sock);

            if(mime.includes('image') || msgType==='imageMessage'){
                const buf = await sock.downloadMediaMessage(q);
                if(!buf) throw new Error('Could not download image');
                await sendStatus(sock, {image:buf, caption:text}, recipients);
            } else if(mime.includes('video') || msgType==='videoMessage'){
                const buf = await sock.downloadMediaMessage(q);
                if(!buf) throw new Error('Could not download video');
                await sendStatus(sock, {video:buf, caption:text}, recipients);
            } else {
                await sendStatus(sock, {text:text||sig()}, recipients);
            }
            reply(`✅ *Posted to status!*\n\n${sig()}`);
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ Failed: ${e.message}\n\n${sig()}`); }
      }
    },

    // ── .tostatus — post text or replied media to status (FIXED) ──────────
    { command:'tostatus', category:'tostatus', owner:true,
      execute: async (sock,m,{text,reply,isCreator}) => {
        if(!isCreator) return reply(config.message.owner);
        const q = m.quoted;
        if(!q && !text) return reply(`❗ Reply to media or provide text.\n\nExamples:\n  \`.tostatus Hello world\`\n  Reply to image + \`.tostatus\`\n\n${sig()}`);
        await react(sock,m,'📤');
        try {
            const recipients = await getStatusRecipients(sock);
            const caption    = text || '👁️ LIAM EYES';

            if(!q) {
                // Text-only status
                await sendStatus(sock, {text:`${caption}\n\n${sig()}`}, recipients);
            } else {
                const mime    = (q.msg||q)?.mimetype || '';
                const msgType = Object.keys(q.message||{})[0] || '';

                if(mime.includes('image') || msgType==='imageMessage'){
                    const buf = await sock.downloadMediaMessage(q).catch(()=>null);
                    if(!buf) throw new Error('Could not download image');
                    await sendStatus(sock, {image:buf, caption}, recipients);
                } else if(mime.includes('video') || msgType==='videoMessage'){
                    const buf = await sock.downloadMediaMessage(q).catch(()=>null);
                    if(!buf) throw new Error('Could not download video');
                    await sendStatus(sock, {video:buf, caption}, recipients);
                } else if(mime.includes('audio') || msgType==='audioMessage'){
                    const buf = await sock.downloadMediaMessage(q).catch(()=>null);
                    if(!buf) throw new Error('Could not download audio');
                    await sendStatus(sock, {audio:buf, mimetype:'audio/mp4', ptt:false}, recipients);
                } else {
                    const statusText = q.text||q.body||caption;
                    await sendStatus(sock, {text:`${statusText}\n\n${sig()}`}, recipients);
                }
            }
            reply(`✅ *Posted to status!*\n\n${sig()}`);
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ Failed: ${e.message}\n\n${sig()}`); }
      }
    },

    // ── .togroupstatus — broadcast to all groups ───────────────────────────
    { command:'togroupstatus', category:'tostatus', owner:true,
      execute: async (sock,m,{text,reply,isCreator}) => {
        if(!isCreator) return reply('⚠️ Owner only!');
        const q = m.quoted;
        if(!text && !q) return reply(`❗ Reply to media or provide text.\n\n${sig()}`);

        await sock.sendMessage(m.chat,{react:{text:'📢',key:m.key}}).catch(()=>{});
        let groups = [];
        try {
            const all = await sock.groupFetchAllParticipating();
            groups = Object.keys(all);
        } catch(e) { return reply(`❌ Could not fetch groups: ${e.message}`); }

        if(!groups.length) return reply('❌ Bot is not in any groups.');
        await reply(`📢 *Broadcasting to ${groups.length} group(s)…*\n\n${sig()}`);

        const sleep  = ms => new Promise(r=>setTimeout(r,ms));
        const mime   = (q?.msg||q)?.mimetype || '';
        const msgType = Object.keys(q?.message||{})[0] || '';
        let sent=0, failed=0;

        for(const gid of groups) {
            try {
                if(q && (mime.includes('image')||msgType==='imageMessage')) {
                    const buf = await sock.downloadMediaMessage(q);
                    await sock.sendMessage(gid,{image:buf,caption:text||'👁️ LIAM EYES'});
                } else if(q && (mime.includes('video')||msgType==='videoMessage')) {
                    const buf = await sock.downloadMediaMessage(q);
                    await sock.sendMessage(gid,{video:buf,caption:text||'👁️ LIAM EYES'});
                } else {
                    await sock.sendMessage(gid,{text:text||q?.text||'👁️ LIAM EYES'});
                }
                sent++;
            } catch { failed++; }
            await sleep(800);
        }
        reply(`✅ *Broadcast done!*\n📤 Sent: ${sent}\n❌ Failed: ${failed}\n\n${sig()}`);
        await sock.sendMessage(m.chat,{react:{text:'✅',key:m.key}}).catch(()=>{});
      }
    },
];
