// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// LIAM EYES — RELIGION TOOLS (2 commands): bible, quran
'use strict';
const axios = require('axios');
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

module.exports = [
  { command:'bible', category:'religion',
    execute: async (sock,m,{text,reply}) => {
      await react(sock,m,'✝️');
      try {
        let verse;
        if(text && /\d/.test(text)){
          const [ref] = text.split(' ');
          const {data} = await axios.get(`https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`,{timeout:10000});
          verse = `📖 *${data.reference}*\n━━━━━━━━━━━━━━━━\n${data.text.trim()}\n\n_KJV Translation_`;
        } else {
          const {data} = await axios.get('https://bible-api.com/data/kjv/verses.json',{timeout:10000}).catch(()=>({data:null}));
          const {data:r} = await axios.get('https://beta.ourmanna.com/api/v1/get?format=json&order=random',{timeout:10000});
          const v = r?.verse?.details;
          verse = v ? `📖 *${v.reference}*\n━━━━━━━━━━━━━━━━\n${v.text.trim()}\n\n_Daily Bible Verse_` : `📖 *John 3:16*\n━━━━━━━━━━━━━━━━\nFor God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.\n\n_KJV_`;
        }
        reply(`✝️ ${verse}\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch{
        reply(`✝️ *Bible Verse*\n━━━━━━━━━━━━━━━━\n"Trust in the LORD with all your heart and lean not on your own understanding."\n\n📖 Proverbs 3:5\n\n${sig()}`);
      }
    }
  },

  { command:'quran', category:'religion',
    execute: async (sock,m,{text,reply}) => {
      await react(sock,m,'☪️');
      try {
        const [surah,ayah] = (text||'2:255').split(':').map(Number);
        const s = surah||2, a = ayah||255;
        const {data} = await axios.get(`https://api.alquran.cloud/v1/ayah/${s}:${a}/editions/quran-simple,en.sahih`,{timeout:10000});
        if(data.status!=='OK') throw new Error('Invalid reference');
        const arabic = data.data[0];
        const english = data.data[1];
        reply(`☪️ *Surah ${arabic.surah.englishName} (${arabic.surah.name})*\n*Verse ${arabic.numberInSurah}*\n━━━━━━━━━━━━━━━━\n🕌 *Arabic:*\n${arabic.text}\n\n📖 *English (Sahih):*\n${english.text}\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch{
        reply(`☪️ *Quran — Ayat al-Kursi*\n(2:255)\n━━━━━━━━━━━━━━━━\nAllah — there is no deity except Him, the Ever-Living, the Self-Sustaining. Neither drowsiness overtakes Him nor sleep...\n\n${sig()}`);
      }
    }
  },
];
