// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — OTHER TOOLS  (category: other)
//  Commands here: pair, share  (ping/runtime/time/botstatus/repo in others_extended)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

module.exports = [

{
    command: 'share', category: 'other',
    execute: async (sock, m, { reply }) => {
        const site = config.pairingSite || 'https://liam-pannel.onrender.com/pair';
        reply(
            `📤 *Share LIAM EYES*\n\n` +
            `🔗 Pairing Site: ${site}\n` +
            `📦 GitHub: ${config.github}\n` +
            `📡 Channel: ${config.channel}\n\n` +
            `_Share with friends who want a WhatsApp bot!_\n\n${sig()}`
        );
    }
},

{
    command: 'changelog', category: 'other',
    execute: async (sock, m, { reply }) => {
        reply(
            `📋 *LIAM EYES Changelog*\n\n` +
            `*v14 — Latest*\n` +
            `✅ 325+ commands\n` +
            `✅ 4 menu styles (numbered dropdown, classic, cursive, grid)\n` +
            `✅ Bilingual AI chatbot (Swahili + English)\n` +
            `✅ Customizable status react emojis\n` +
            `✅ Session ID backup & recovery\n` +
            `✅ Anti-delete → DM forwarding\n` +
            `✅ Status view → DM forwarding\n` +
            `✅ Sports: 9 leagues + wrestling\n` +
            `✅ Encrypted admin credentials\n\n` +
            `*v13* — Menu styles, chatbot\n` +
            `*v12* — .pair split-message flow\n` +
            `*v11* — Pairing site optimization\n` +
            `*v10* — .pair, .share, 3 menu styles\n\n` +
            `${sig()}`
        );
    }
},

{
    command: 'features', category: 'other',
    execute: async (sock, m, { reply }) => {
        reply(
            `⚡ *LIAM EYES Features*\n\n` +
            `🤖 AI Tools — GPT, Gemini, Blackbox, DALL-E\n` +
            `🎵 Audio — MP3, pitch, effects, TTS\n` +
            `⬇️ Downloads — TikTok, Instagram, YouTube, Spotify\n` +
            `🖼️ Ephoto360 — 34 text effects\n` +
            `😂 Fun — Facts, jokes, memes, trivia\n` +
            `🎮 Games — Truth or dare, riddles\n` +
            `👥 Groups — Full admin toolkit (55+ commands)\n` +
            `🌄 Image — Remini enhance, wallpapers\n` +
            `👑 Owner — Full control panel\n` +
            `🕌 Religion — Quran & Bible\n` +
            `🔍 Search — Define, IMDB, lyrics, weather\n` +
            `⚙️ Settings — 60+ customization options\n` +
            `⚽ Sports — 9 leagues + wrestling\n` +
            `🛠️ Tools — 35+ utilities\n` +
            `📤 Status — Post to status\n` +
            `🌍 Translate — 100+ languages\n` +
            `🎬 Video — Convert, extract audio\n\n` +
            `_Total: 325+ commands_\n\n${sig()}`
        );
    }
},

{
    command: 'help2', category: 'other',
    execute: async (sock, m, { prefix, reply }) => {
        reply(
            `❓ *Quick Help Guide*\n\n` +
            `*Menu:*\n${prefix}menu — Show all categories\n` +
            `${prefix}menu 5 — Open category 5 directly\n` +
            `_Reply with a number_ → See commands\n\n` +
            `*Session:*\n${prefix}session — Show bot session ID\n` +
            `${prefix}pair — Pair a new number\n\n` +
            `*Settings:*\n${prefix}chatbot on — Enable AI chat\n` +
            `${prefix}mode public/private\n` +
            `${prefix}setmenu 1/2/3/4 — Change menu style\n\n` +
            `*Owner:*\n${prefix}restart — Restart bot\n` +
            `${prefix}reload — Reload plugins\n\n` +
            `${sig()}`
        );
    }
},

{
    command: 'about', category: 'other',
    execute: async (sock, m, { reply }) => {
        reply(
            `👁️ *About LIAM EYES*\n\n` +
            `LIAM EYES is a powerful, open-source WhatsApp bot built with Baileys.\n\n` +
            `🔹 Version: Alpha\n` +
            `🔹 Commands: 325+\n` +
            `🔹 Language: Node.js\n` +
            `🔹 Framework: @whiskeysockets/baileys\n` +
            `🔹 AI: Pollinations.ai (free)\n` +
            `🔹 Platform: Cross-platform\n\n` +
            `_👁️ Your Eyes in the WhatsApp World_\n\n` +
            `${sig()}`
        );
    }
},

];
