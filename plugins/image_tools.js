// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// LIAM EYES — IMAGE TOOLS (2 commands): remini, wallpaper
'use strict';
const axios  = require('axios');
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

module.exports = [
  { command:'remini', category:'image',
    execute: async (sock,m,{reply}) => {
      const q = m.quoted||m;
      const mime = (q.msg||q).mimetype||'';
      if(!mime.includes('image')) return reply(`❗ *Reply to an image to enhance it!*\n\n${sig()}`);
      await react(sock,m,'✨');
      try {
        const buf = await sock.downloadMediaMessage(q);
        const FormData = require('form-data');
        const form = new FormData();
        form.append('image', buf, {filename:'photo.jpg',contentType:'image/jpeg'});
        const {data} = await axios.post('https://inferenceengine.vyro.ai/enhance',form,
          {headers:{...form.getHeaders(),'User-Agent':'okhttp/4.9.3'},timeout:30000,responseType:'arraybuffer'});
        await sock.sendMessage(m.chat,{
          image:Buffer.from(data),caption:`✨ *Image Enhanced (Remini)*\n\n${sig()}`
        },{quoted:m});
        await react(sock,m,'✅');
      } catch(e){await react(sock,m,'❌');reply(`❌ Enhance failed: ${e.message}\n\n${sig()}`);}
    }
  },

  { command:'wallpaper', category:'image',
    execute: async (sock,m,{text,reply}) => {
      const q = text||'abstract nature 4k';
      await react(sock,m,'🖼️');
      try {
        const queries = q.split(',').map(s=>s.trim()).slice(0,3);
        const results = [];
        for(const qr of queries){
          const url = `https://loremflickr.com/1920/1080/${encodeURIComponent(qr)}&${Date.now()}`;
          results.push({url,label:qr});
        }
        for(const r of results){
          await sock.sendMessage(m.chat,{
            image:{url:r.url},caption:`🖼️ *Wallpaper: ${r.label}*\n📐 1920×1080\n\n${sig()}`
          },{quoted:m});
          await new Promise(r2=>setTimeout(r2,500));
        }
        await react(sock,m,'✅');
      } catch(e){await react(sock,m,'❌');reply(`❌ Wallpaper failed: ${e.message}\n\n${sig()}`);}
    }
  },
];
