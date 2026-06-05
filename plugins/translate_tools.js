// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// LIAM EYES — TRANSLATE (1 command): translate
'use strict';
const axios  = require('axios');
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

const LANGS = {sw:'Swahili',en:'English',fr:'French',es:'Spanish',de:'German',pt:'Portuguese',ar:'Arabic',zh:'Chinese',ja:'Japanese',ko:'Korean',hi:'Hindi',ru:'Russian',it:'Italian',nl:'Dutch',tr:'Turkish'};

module.exports = [
  { command:'translate', category:'translate',
    execute: async (sock,m,{args,reply,quoted}) => {
      if(!args[0]) return reply(`❓ Usage: *.translate <lang> <text>* or reply to a message\nExample: _.translate sw Hello friend_\n\n🌍 Languages: ${Object.entries(LANGS).map(([k,v])=>`\`${k}\`=${v}`).join(', ')}\n\n${sig()}`);
      const lang = args[0].toLowerCase();
      const text = args.slice(1).join(' ')||(quoted?.text||'');
      if(!text) return reply(`❗ Provide text to translate.\n\n${sig()}`);
      await react(sock,m,'🌍');
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0,500))}&langpair=autodetect|${lang}`;
        const {data} = await axios.get(url,{timeout:12000});
        if(data.responseStatus!==200) throw new Error('Translation failed');
        const result = data.responseData.translatedText;
        const detected = data.responseData.detectedLanguage||'auto';
        reply(`🌍 *Translation*\n━━━━━━━━━━━━━━━━\n📥 *Original (${detected}):*\n${text}\n\n📤 *${LANGS[lang]||lang}:*\n${result}\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch(e){await react(sock,m,'❌');reply(`❌ Translation failed: ${e.message}\n\n${sig()}`);}
    }
  },
];
