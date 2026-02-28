// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// LIAM EYES — TOSTATUS TOOLS (2 commands): togstatus, tostatus
'use strict';
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

module.exports = [
  { command:'togstatus', category:'tostatus',
    execute: async (sock,m,{reply,isCreator}) => {
      if(!isCreator) return reply(config.message.owner);
      const q = m.quoted;
      if(!q) return reply(`❗ *Reply to any media or text to post it to your status!*\n\n${sig()}`);
      await react(sock,m,'📤');
      try {
        const mime = (q.msg||q).mimetype||'';
        if(mime.includes('image')){
          const buf = await sock.downloadMediaMessage(q);
          await sock.sendMessage('status@broadcast',{image:buf,caption:q.text||'👁️ LIAM EYES',statusJidList:['status@broadcast']});
        } else if(mime.includes('video')){
          const buf = await sock.downloadMediaMessage(q);
          await sock.sendMessage('status@broadcast',{video:buf,caption:q.text||'👁️ LIAM EYES',statusJidList:['status@broadcast']});
        } else {
          const text = q.text||q.body||config.watermark;
          await sock.sendMessage('status@broadcast',{text,statusJidList:['status@broadcast']});
        }
        reply(`✅ *Posted to status!*\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch(e){await react(sock,m,'❌');reply(`❌ Failed: ${e.message}\n\n${sig()}`);}
    }
  },

  { command:'tostatus', category:'owner', owner:true,
    execute: async (sock,m,{text,reply,isCreator}) => {
      if(!isCreator) return reply(config.message.owner);
      const q = m.quoted;
      if(!q && !text) return reply(`❗ Reply to media or provide text.\n\n${sig()}`);
      await react(sock,m,'📤');
      try {
        if(text && !q){
          await sock.sendMessage('status@broadcast',{text:`${text}\n\n${sig()}`,statusJidList:['status@broadcast']});
        } else {
          const mime = (q.msg||q).mimetype||'';
          const buf = mime ? await sock.downloadMediaMessage(q) : null;
          if(mime.includes('image')) await sock.sendMessage('status@broadcast',{image:buf,caption:text||'👁️',statusJidList:['status@broadcast']});
          else if(mime.includes('video')) await sock.sendMessage('status@broadcast',{video:buf,caption:text||'👁️',statusJidList:['status@broadcast']});
          else await sock.sendMessage('status@broadcast',{text:text||sig(),statusJidList:['status@broadcast']});
        }
        reply(`✅ *Posted to status!*\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch(e){await react(sock,m,'❌');reply(`❌ Failed: ${e.message}\n\n${sig()}`);}
    }
  },
,

  // ── .togroupstatus — post to ALL group chats as a broadcast ─────────────
  { command:'togroupstatus', category:'tostatus', owner:true,
    execute: async (sock,m,{text,reply,isCreator}) => {
      if(!isCreator) return reply('⚠️ Owner only!');
      const q = m.quoted;
      if(!text && !q) return reply('❗ Reply to media or provide text to broadcast to all groups.\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒');

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
        await sleep(800); // avoid rate-limit
      }
      reply(`✅ *Broadcast done!*\n📤 Sent: ${sent}\n❌ Failed: ${failed}\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`);
      await sock.sendMessage(m.chat,{react:{text:'✅',key:m.key}}).catch(()=>{});
    }
  },

];
