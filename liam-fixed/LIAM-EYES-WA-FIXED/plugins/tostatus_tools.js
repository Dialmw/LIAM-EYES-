'use strict';
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});
const sleep = ms => new Promise(r => setTimeout(r,ms));

async function getRecipients(sock) {
    if (global._statusRecipients && global._statusRecipients.length) return global._statusRecipients;
    try {
        const store = sock.store || sock._store;
        if (store && store.contacts) {
            const jids = Object.keys(store.contacts).filter(j => j.endsWith('@s.whatsapp.net'));
            if (jids.length) { global._statusRecipients = jids; return jids; }
        }
    } catch(e) {}
    return [];
}

async function postToStatus(sock, payload) {
    const jids = await getRecipients(sock);
    const opts = jids.length ? { statusJidList: jids } : {};
    return sock.sendMessage('status@broadcast', Object.assign({}, payload, opts));
}

module.exports = [
    { command:'tostatus', category:'tostatus', owner:true,
      execute: async (sock,m,ctx) => {
        if(!ctx.isCreator) return ctx.reply(config.message.owner);
        const q = m.quoted, text = ctx.text;
        if(!q && !text) return ctx.reply('Reply to media or send text.

' + sig());
        await react(sock,m,'📤');
        try {
            const mime = q ? ((q.msg||q).mimetype||'') : '';
            if(mime.includes('image')) { const buf = await sock.downloadMediaMessage(q); await postToStatus(sock,{image:buf,caption:text||'LIAM EYES'}); }
            else if(mime.includes('video')) { const buf = await sock.downloadMediaMessage(q); await postToStatus(sock,{video:buf,caption:text||'LIAM EYES'}); }
            else { await postToStatus(sock,{text:text||(q&&(q.body||q.text))||sig()}); }
            await react(sock,m,'✅'); ctx.reply('✅ Posted to status!

' + sig());
        } catch(e) { await react(sock,m,'❌'); ctx.reply('❌ '+e.message+'

'+sig()); }
      }
    },
    { command:'togstatus', category:'tostatus',
      execute: async (sock,m,ctx) => {
        if(!ctx.isCreator) return ctx.reply(config.message.owner);
        const q = m.quoted, text = ctx.text;
        if(!q && !text) return ctx.reply('Reply to media or send text.

' + sig());
        await react(sock,m,'📤');
        try {
            const mime = q ? ((q.msg||q).mimetype||'') : '';
            if(mime.includes('image')) { const buf = await sock.downloadMediaMessage(q); await postToStatus(sock,{image:buf,caption:text||'LIAM EYES'}); }
            else if(mime.includes('video')) { const buf = await sock.downloadMediaMessage(q); await postToStatus(sock,{video:buf,caption:text||'LIAM EYES'}); }
            else { await postToStatus(sock,{text:text||(q&&(q.body||q.text))||sig()}); }
            await react(sock,m,'✅'); ctx.reply('✅ Posted to status!

' + sig());
        } catch(e) { await react(sock,m,'❌'); ctx.reply('❌ '+e.message+'

'+sig()); }
      }
    },
    { command:'togroupstatus', category:'tostatus', owner:true,
      execute: async (sock,m,ctx) => {
        if(!ctx.isCreator) return ctx.reply(config.message.owner);
        const q = m.quoted, text = ctx.text;
        if(!text && !q) return ctx.reply('Reply to media or send text.

' + sig());
        await react(sock,m,'📢');
        let groups = [];
        try { const all = await sock.groupFetchAllParticipating(); groups = Object.keys(all); }
        catch(e) { return ctx.reply('❌ '+e.message); }
        if(!groups.length) return ctx.reply('❌ Not in any groups.

' + sig());
        await ctx.reply('📢 Broadcasting to '+groups.length+' group(s)...

' + sig());
        let sent=0, failed=0;
        const mime = q ? ((q.msg||q).mimetype||'') : '';
        for(const gid of groups) {
            try {
                if(q && mime.includes('image')) { const buf=await sock.downloadMediaMessage(q); await sock.sendMessage(gid,{image:buf,caption:text||'LIAM EYES'}); }
                else if(q && mime.includes('video')) { const buf=await sock.downloadMediaMessage(q); await sock.sendMessage(gid,{video:buf,caption:text||'LIAM EYES'}); }
                else { await sock.sendMessage(gid,{text:text||(q&&(q.text||q.body))||'LIAM EYES'}); }
                sent++;
            } catch(e) { failed++; }
            await sleep(500);
        }
        await react(sock,m,'✅');
        ctx.reply('✅ Sent: '+sent+' | ❌ Failed: '+failed+'

' + sig());
      }
    },
];
