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
    try {
        const store = sock.store || sock._store;
        if (store?.contacts) {
            const jids = Object.keys(store.contacts)
                .filter(j => j.endsWith('@s.whatsapp.net') && !j.includes('status'));
            if (jids.length > 0) return jids;
        }
        if (global._waContacts && global._waContacts.length > 0) {
            return global._waContacts;
        }
        return [];
    } catch {
        return [];
    }
}

// ── Build proper status send options ──────────────────────────────────────
// statusJidList is NOT needed for posting — it's only for reactions/reads
async function statusOpts(sock, extra = {}) {
    return { ...extra };
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
        if(!isCreator) return reply('𝙈𝙢𝙢 𝙣𝙤𝙩 𝙖𝙡𝙡𝙤𝙬𝙚𝙙 🫵, 𝙖𝙨𝙠 𝙢𝙮 𝙢𝙖𝙨𝙩𝙚𝙧 👁️');
        const q = m.quoted;
        if(!q && !text) return reply(`❗ Reply to media or provide text.\n\n${sig()}`);
        await react(sock,m,'📤');
        try {
            // Must include owner JID so they see their own status post
            const ownerJid = (sock.user?.id||'').split(':')[0]+'@s.whatsapp.net';
            const opts = { statusJidList: [ownerJid] };
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

    ,{ command:'toarchives', category:'tools', owner:true,
      execute: async (sock,m,{text,reply,isCreator}) => {
        if(!isCreator) return reply('𝙈𝙢𝙢 𝙣𝙤𝙩 𝙖𝙡𝙡𝙤𝙬𝙚𝙙, 𝙖𝙨𝙠 𝙢𝙮 𝙢𝙖𝙨𝙩𝙚𝙧 👁️');
        const token = require('../settings/config').telegramBotToken;
        const chatId = require('../settings/config').telegramChannelId;
        if(!token||!chatId) return reply('❌ Set TG_BOT_TOKEN + TG_CHANNEL_ID in settings\n\n'+sig());
        const q = m.quoted;
        await react(sock,m,'📤');
        try {
            const axios = require('axios');
            const base = `https://api.telegram.org/bot${token}`;
            const caption = (text||'') + '\n\n👁️ LIAM EYES';
            if(q){
                const mime = (q.msg||q).mimetype||'';
                const buf  = await sock.downloadMediaMessage(q);
                const FormData = require('form-data');
                const fd = new FormData();
                fd.append('chat_id', chatId);
                fd.append('caption', caption);
                let ep = `${base}/sendDocument`;
                if(mime.includes('image'))      { fd.append('photo',    buf,'media.jpg'); ep=`${base}/sendPhoto`; }
                else if(mime.includes('video')) { fd.append('video',    buf,'media.mp4'); ep=`${base}/sendVideo`; }
                else if(mime.includes('audio')) { fd.append('audio',    buf,'media.mp3'); ep=`${base}/sendAudio`; }
                else                             { fd.append('document', buf,'media.bin'); }
                await axios.post(ep, fd, { headers:fd.getHeaders(), timeout:30000 });
            } else if(text){
                await axios.post(`${base}/sendMessage`,{chat_id:chatId,text:caption},{timeout:10000});
            } else { return reply('❗ Reply to media or add text\n\n'+sig()); }
            await react(sock,m,'✅');
            reply('✅ *Archived to Telegram!*\n\n'+sig());
        } catch(e){ await react(sock,m,'❌'); reply('❌ '+e.message+'\n\n'+sig()); }
      }
    }

];