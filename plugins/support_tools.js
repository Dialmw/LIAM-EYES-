// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// LIAM EYES — SUPPORT TOOLS (2 commands): feedback, helpers
'use strict';
const axios  = require('axios');
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

module.exports = [
  { command:'feedback', category:'support',
    execute: async (sock,m,{text,reply,pushname,sender}) => {
      if(!text) return reply(`❓ Usage: *.feedback <your message>*\n\n${sig()}`);
      await sock.sendMessage(m.chat,{react:{text:'📩',key:m.key}}).catch(()=>{});
      // Forward feedback to owner
      try {
        const ownerJid = config.owner+'@s.whatsapp.net';
        await sock.sendMessage(ownerJid,{
          text:`📩 *New Feedback from ${pushname}* (+${sender.split('@')[0]})\n\n${text}\n\n${sig()}`
        });
      } catch{}
      reply(`📩 *Feedback Sent!*\n\nThank you ${pushname}! Your message has been forwarded to the bot owner.\n\n_We read every message!_ 💙\n\n${sig()}`);
    }
  },

  { command:'helpers', category:'support',
    execute: async (sock,m,{reply}) => {
      reply(`🆘 *LIAM EYES — Help Center*\n━━━━━━━━━━━━━━━━━━━━\n\n📚 *Getting Started:*\n• Type *.menu* to see all commands\n• Reply with a number to open that category\n• Use prefix \`${config.settings?.title||'.'}\` before commands\n\n🛠️ *Common Commands:*\n• *.ping* — Check if bot is online\n• *.botstatus* — Bot system info\n• *.chatbot on* — Enable AI assistant\n• *.pair* — Get session ID\n\n🐛 *Issues?*\n• *.feedback <message>* — Report bugs\n• GitHub: ${config.github}\n• Channel: ${config.autoJoinChannel}\n\n👑 *Owner Only:*\n• *.restart* — Restart bot\n• *.reload* — Reload plugins\n• *.mode public/private* — Change mode\n\n${sig()}`);
    }
  },
];
