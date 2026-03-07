// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — tostatus_tools.js  FIXED v2                         ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});
const sleep = ms => new Promise(r=>setTimeout(r,ms));

// Get contact JIDs for status broadcast visibility
async function getStatusJidList(sock) {
    try {
        // Method 1: from store contacts
        if (global._waContacts && global._waContacts.length > 0) return global._waContacts;
        // Method 2: from sock store
        const store = sock.store || sock._store;
        if (store?.contacts) {
            const jids = Object.keys(store.contacts).filter(j => j.endsWith('@s.whatsapp.net'));
            if (jids.length > 0) { global._waContacts = jids; return jids; }
        }
        // Method 3: try fetchBlocklist/contacts API
        try {
            const contacts = await sock.fetchContacts?.() || [];
            const jids = contacts.map(c => c.id).filter(j => j && j.endsWith('@s.whatsapp.net'));
            if (jids.length > 0) return jids;
        } catch(_) {}
        return undefined; // let WhatsApp decide
    } catch { return undefined; }
}

async function postStatus(sock, payload, jidList) {
    const opts = jidList?.length ? { statusJidList: jidList } : {};
    return sock.sendMessage('status@broadcast', payload, opts);
}

module.exports = [

// .tostatus — post text or replied media to status
{
    command: 'tostatus', category: 'tostatus', owner: true,
    execute: async (sock, m, { text, reply, isCreator }) => {
        if (!isCreator) return reply(config.message.owner);
        const q = m.quoted;
        if (!q && !text) return reply(`❗ Reply to media or provide text.\nExample: *.tostatus Hello world!*\n\n${sig()}`);
        await react(sock, m, '⏳');
        try {
            const jids = await getStatusJidList(sock);
            const mime = (q?.msg || q)?.mimetype || '';
            if (q && mime.includes('image')) {
                const buf = await sock.downloadMediaMessage(q);
                await postStatus(sock, { image: buf, caption: text || '👁️ LIAM EYES' }, jids);
            } else if (q && mime.includes('video')) {
                const buf = await sock.downloadMediaMessage(q);
                await postStatus(sock, { video: buf, caption: text || '👁️ LIAM EYES', gifPlayback: false }, jids);
            } else if (q && mime.includes('audio')) {
                const buf = await sock.downloadMediaMessage(q);
                await postStatus(sock, { audio: buf, mimetype: 'audio/mp4', ptt: true }, jids);
            } else {
                const statusText = text || q?.body || q?.text || '👁️ LIAM EYES';
                await postStatus(sock, { text: `${statusText}\n\n${sig()}` }, jids);
            }
            await react(sock, m, '✅');
            reply(`✅ *Posted to status!*\n\n${sig()}`);
        } catch(e) { await react(sock,m,'❌'); reply(`❌ Failed: ${e.message}\n\n${sig()}`); }
    }
},

// .togstatus — alias for .tostatus
{
    command: 'togstatus', category: 'tostatus', owner: true,
    execute: async (sock, m, ctx) => {
        // delegate to tostatus
        const mod = module.exports.find(p => p.command === 'tostatus');
        return mod?.execute(sock, m, ctx);
    }
},

// .textstatus — post a formatted text status
{
    command: 'textstatus', category: 'tostatus', owner: true,
    execute: async (sock, m, { text, reply, isCreator }) => {
        if (!isCreator) return reply(config.message.owner);
        if (!text) return reply(`❓ Usage: *.textstatus <your text>*\n\n${sig()}`);
        await react(sock, m, '📝');
        try {
            const jids = await getStatusJidList(sock);
            await postStatus(sock, { text: `${text}\n\n${sig()}` }, jids);
            await react(sock, m, '✅');
            reply(`✅ *Text status posted!*\n\n${sig()}`);
        } catch(e) { await react(sock,m,'❌'); reply(`❌ Failed: ${e.message}\n\n${sig()}`); }
    }
},

// .imagestatus — post replied image to status
{
    command: 'imagestatus', category: 'tostatus', owner: true,
    execute: async (sock, m, { text, reply, isCreator }) => {
        if (!isCreator) return reply(config.message.owner);
        const q = m.quoted;
        if (!q) return reply(`❗ Reply to an image first!\n\n${sig()}`);
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('image')) return reply(`❗ Reply to an *image* message!\n\n${sig()}`);
        await react(sock, m, '🖼️');
        try {
            const jids = await getStatusJidList(sock);
            const buf = await sock.downloadMediaMessage(q);
            await postStatus(sock, { image: buf, caption: text || '👁️ LIAM EYES' }, jids);
            await react(sock, m, '✅');
            reply(`✅ *Image status posted!*\n\n${sig()}`);
        } catch(e) { await react(sock,m,'❌'); reply(`❌ Failed: ${e.message}\n\n${sig()}`); }
    }
},

// .videostatus — post replied video to status
{
    command: 'videostatus', category: 'tostatus', owner: true,
    execute: async (sock, m, { text, reply, isCreator }) => {
        if (!isCreator) return reply(config.message.owner);
        const q = m.quoted;
        if (!q) return reply(`❗ Reply to a video first!\n\n${sig()}`);
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('video')) return reply(`❗ Reply to a *video* message!\n\n${sig()}`);
        await react(sock, m, '🎬');
        try {
            const jids = await getStatusJidList(sock);
            const buf = await sock.downloadMediaMessage(q);
            await postStatus(sock, { video: buf, caption: text || '👁️ LIAM EYES' }, jids);
            await react(sock, m, '✅');
            reply(`✅ *Video status posted!*\n\n${sig()}`);
        } catch(e) { await react(sock,m,'❌'); reply(`❌ Failed: ${e.message}\n\n${sig()}`); }
    }
},

// .statusview — show status view count info
{
    command: 'statusview', category: 'tostatus', owner: true,
    execute: async (sock, m, { reply, isCreator }) => {
        if (!isCreator) return reply(config.message.owner);
        reply(
            `👁️ *Status View Info*\n\n` +
            `WhatsApp does not provide a public API for reading status view counts.\n\n` +
            `*What LIAM EYES tracks:*\n` +
            `✅ Status views → forwarded to your DM\n` +
            `✅ Auto-react to statuses\n` +
            `✅ Auto-save statuses\n\n` +
            `*Commands:*\n` +
            `• *.autoviewstatus* — auto view all statuses\n` +
            `• *.autoreactstatus* — auto react to statuses\n` +
            `• *.autosavestatus* — forward statuses to your DM\n\n` +
            `${sig()}`
        );
    }
},

// .togroupstatus — broadcast to all groups
{
    command: 'togroupstatus', category: 'tostatus', owner: true,
    execute: async (sock, m, { text, reply, isCreator }) => {
        if (!isCreator) return reply(config.message.owner);
        const q = m.quoted;
        if (!text && !q) return reply(`❗ Reply to media or provide text.\n\n${sig()}`);
        await react(sock, m, '📢');
        let groups = [];
        try {
            const all = await sock.groupFetchAllParticipating();
            groups = Object.keys(all);
        } catch(e) { return reply(`❌ Could not fetch groups: ${e.message}`); }
        if (!groups.length) return reply('❌ Bot is not in any groups.');
        await reply(`📢 *Broadcasting to ${groups.length} group(s)…*\n\n${sig()}`);
        let sent = 0, failed = 0;
        const mime = (q?.msg || q)?.mimetype || '';
        for (const gid of groups) {
            try {
                if (q && mime.includes('image')) {
                    const buf = await sock.downloadMediaMessage(q);
                    await sock.sendMessage(gid, { image: buf, caption: text || '👁️ LIAM EYES' });
                } else if (q && mime.includes('video')) {
                    const buf = await sock.downloadMediaMessage(q);
                    await sock.sendMessage(gid, { video: buf, caption: text || '👁️ LIAM EYES' });
                } else {
                    await sock.sendMessage(gid, { text: text || q?.body || q?.text || '👁️ LIAM EYES' });
                }
                sent++;
            } catch { failed++; }
            await sleep(700);
        }
        reply(`✅ *Broadcast done!*\n📤 Sent: ${sent}\n❌ Failed: ${failed}\n\n${sig()}`);
        await react(sock, m, '✅');
    }
},

];
