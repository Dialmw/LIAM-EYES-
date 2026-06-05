// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — OTHERS / EXTRA COMMANDS  (~25 commands)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('../settings/config');
const os     = require('os');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});
const sleep = ms => new Promise(r => setTimeout(r,ms));

// In-memory AFK store
const afkStore = new Map(); // jid → { reason, ts }

module.exports = [

// ─────────────────────────────────────────────────────────────────────────────
//  .botstatus — detailed bot status
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'botstatus', category: 'other',
    execute: async (sock, m, { reply }) => {
        const up    = process.uptime();
        const upStr = `${~~(up/86400)}d ${~~(up%86400/3600)}h ${~~(up%3600/60)}m ${~~(up%60)}s`;
        const mem   = process.memoryUsage();
        const cpu   = os.loadavg();
        reply(
            `👁️ *LIAM EYES Bot Status*\n\n` +
            `╔═══════════════════════════╗\n` +
            `║  ${sock.public ? '🌍 PUBLIC MODE' : '🔒 PRIVATE MODE'}          ║\n` +
            `╚═══════════════════════════╝\n\n` +
            `⚡ *Uptime:*    ${upStr}\n` +
            `💾 *RAM Used:* ${(mem.heapUsed/1024/1024).toFixed(1)} MB / ${(mem.heapTotal/1024/1024).toFixed(1)} MB\n` +
            `🖥️ *CPU Load:*  ${cpu[0].toFixed(2)} (1m avg)\n` +
            `🔧 *Node:*     ${process.version}\n` +
            `🌐 *Platform:* ${os.platform()} ${os.arch()}\n\n` +
            `*Active Features:*\n${Object.entries(config.features||{}).filter(([,v])=>v).map(([k])=>`✅ ${k}`).join('\n')||'_(none)_'}\n\n${sig()}`
        );
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .ping / .ping2
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  .runtime — uptime info
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'runtime', category: 'other',
    execute: async (sock, m, { reply }) => {
        const up = process.uptime();
        reply(`⏱️ *Bot Runtime*\n\n⚡ ${~~(up/86400)}d ${~~(up%86400/3600)}h ${~~(up%3600/60)}m ${~~(up%60)}s\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .time — show current time for timezone
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  .repo — show GitHub repo
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'repo', category: 'other',
    execute: async (sock, m, { reply }) => {
        reply(`📦 *LIAM EYES Repository*\n\n🔗 ${config.github || 'https://github.com/Dialmw/LIAM-EYES'}\n\n⭐ Star us on GitHub!\n📡 Subscribe: ${config.channel}\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .afk — set AFK mode
// ─────────────────────────────────────────────────────────────────────────────

{
    command: 'unafk', category: 'general',
    execute: async (sock, m, { reply, sender, pushname }) => {
        const data = afkStore.get(sender);
        if (!data) return reply(`❗ You weren't AFK.\n\n${sig()}`);
        const away = Math.round((Date.now() - data.ts) / 60000);
        afkStore.delete(sender);
        await react(sock, m, '👋');
        reply(`✅ *${pushname} is back!*\n\nWas AFK for ${away} minute(s)\nReason was: _${data.reason}_\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .note / .notes / .deletenote — quick notes
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'note', category: 'general',
    execute: async (sock, m, { text, reply, sender }) => {
        if (!text) return reply(`❗ Usage: *.note <text>*\n\n${sig()}`);
        if (!config._notes) config._notes = new Map();
        if (!config._notes.has(sender)) config._notes.set(sender, []);
        config._notes.get(sender).push({ text, ts: Date.now() });
        await react(sock, m, '📝');
        reply(`📝 *Note saved!*\n\n_"${text}"_\n\nView with *.notes*\n\n${sig()}`);
    }
},
{
    command: 'notes', category: 'general',
    execute: async (sock, m, { reply, sender }) => {
        const list = config._notes?.get(sender) || [];
        if (!list.length) return reply(`📝 *No notes* — use *.note <text>* to add one\n\n${sig()}`);
        const out = list.map((n,i) => `${i+1}. ${n.text}`).join('\n');
        reply(`📝 *Your Notes (${list.length})*\n\n${out}\n\nDelete: *.deletenote <number>*\n\n${sig()}`);
    }
},
{
    command: 'deletenote', category: 'general',
    execute: async (sock, m, { args, reply, sender }) => {
        const i = parseInt(args[0]) - 1;
        const list = config._notes?.get(sender) || [];
        if (!list.length) return reply(`❗ No notes to delete.\n\n${sig()}`);
        if (isNaN(i) || i < 0 || i >= list.length) return reply(`❗ Valid number: 1-${list.length}\n\n${sig()}`);
        const [removed] = list.splice(i, 1);
        await react(sock, m, '🗑️');
        reply(`🗑️ *Deleted note ${i+1}*\n\n_"${removed.text}"_\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .pm — send private message (bot to user DM)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'pm', category: 'general', owner: true,
    execute: async (sock, m, { args, text, isCreator, reply }) => {
        if (!isCreator) return reply('👑 Owner only!\n\n' + sig());
        const num = args[0]?.replace(/\D/g,'');
        const msg = args.slice(1).join(' ');
        if (!num || !msg) return reply(`❗ Usage: *.pm <number> <message>*\n\n${sig()}`);
        const jid = num + '@s.whatsapp.net';
        try {
            await sock.sendMessage(jid, { text: `👁️ *Message from LIAM EYES Owner*\n\n${msg}\n\n${sig()}` });
            await react(sock, m, '✅');
            reply(`✅ *Message sent to +${num}*\n\n${sig()}`);
        } catch(e){ reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .color — show color information for hex code
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'color', category: 'general',
    execute: async (sock, m, { args, reply }) => {
        const hex = (args[0] || '').replace('#','');
        if (!hex || !/^[0-9a-fA-F]{3,6}$/.test(hex)) return reply(`❗ Usage: *.color <hex>*\nExample: _.color ff5733_\n\n${sig()}`);
        const full = hex.length === 3 ? hex.split('').map(c=>c+c).join('') : hex.padEnd(6,'0');
        const r=parseInt(full.slice(0,2),16), g=parseInt(full.slice(2,4),16), b=parseInt(full.slice(4,6),16);
        const img = `https://singlecolorimage.com/get/${full}/200x100`;
        try {
            await sock.sendMessage(m.chat,{image:{url:img},caption:
                `🎨 *Color #${full.toUpperCase()}*\n\n🔴 R: ${r} · 🟢 G: ${g} · 🔵 B: ${b}\n💡 Hex: #${full.toUpperCase()}\n\n${sig()}`
            },{quoted:m});
        } catch(e){ reply(`🎨 Color #${full.toUpperCase()}\nR:${r} G:${g} B:${b}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .speedtest — internet speed estimate
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'speedtest', category: 'other',
    execute: async (sock, m, { reply }) => {
        await react(sock, m, '⚡');
        const start = Date.now();
        try {
            await axios.get('https://httpbin.org/bytes/512000', { timeout: 12000, responseType: 'arraybuffer' });
            const ms   = Date.now() - start;
            const mbps = ((0.512 * 8) / (ms / 1000)).toFixed(1);
            reply(`⚡ *Speed Test*\n\n📥 Download: ~${mbps} Mbps\n⏱️ Latency: ${ms}ms\n\n_Note: This is an estimate based on bot server speed_\n\n${sig()}`);
        } catch(e){ reply(`❌ Speed test failed: ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .weather2 — detailed weather (second provider)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'weather2', category: 'search',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.weather2 <city>*\n\n${sig()}`);
        await react(sock, m, '🌤️');
        try {
            const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(text)}?format=4`, { timeout: 8000 });
            reply(`🌤️ *Weather*\n\n${data}\n\n${sig()}`);
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .horoscope — daily horoscope
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'horoscope', category: 'fun',
    execute: async (sock, m, { args, reply }) => {
        const signs = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
        const sign  = (args[0] || '').toLowerCase();
        if (!signs.includes(sign))
            return reply(`❗ Usage: *.horoscope <sign>*\nSigns: ${signs.join(', ')}\n\n${sig()}`);
        await react(sock, m, '🔮');
        try {
            const { data } = await axios.post(`https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=${sign}&day=TODAY`, {}, { timeout: 8000 });
            const h = data?.data;
            reply(`🔮 *${sign.charAt(0).toUpperCase()+sign.slice(1)} Horoscope*\n\n${h?.horoscope_data || 'The stars are aligning... try again.'}\n\n${sig()}`);
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .meme2 — fetch meme with search (alternative)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'meme2', category: 'fun',
    execute: async (sock, m, { args, reply }) => {
        await react(sock, m, '😂');
        try {
            const sub = args.length ? args.join('+') : 'funny';
            const { data } = await axios.get(`https://meme-api.com/gimme/${sub}`, { timeout: 10000 });
            if (!data?.url) throw new Error('No meme found');
            await sock.sendMessage(m.chat,{
                image:{url:data.url},
                caption:`😂 *${data.title||'Meme'}*\n👆 r/${data.subreddit||'memes'}\n\n${sig()}`
            },{quoted:m});
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .riddle — random riddle
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'riddle', category: 'fun',
    execute: async (sock, m, { reply }) => {
        const riddles = [
            { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?", a: "An echo" },
            { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps" },
            { q: "What has hands but can't clap?", a: "A clock" },
            { q: "What gets wetter the more it dries?", a: "A towel" },
            { q: "What can travel around the world while staying in one corner?", a: "A stamp" },
            { q: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?", a: "A map" },
            { q: "The more you have of it, the less you see. What is it?", a: "Darkness" },
        ];
        const r = riddles[Math.floor(Math.random()*riddles.length)];
        await react(sock, m, '🧩');
        await reply(`🧩 *Riddle*\n\n_${r.q}_\n\n||Answer: ${r.a}||  ← swipe/tap to reveal\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .wouldyou — would you rather
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'wouldyou', category: 'games',
    execute: async (sock, m, { reply }) => {
        const questions = [
            "Would you rather be invisible or be able to fly?",
            "Would you rather always speak your mind or never speak at all?",
            "Would you rather live in the past or the future?",
            "Would you rather be famous but broke or unknown but rich?",
            "Would you rather lose all your memories or never create new ones?",
            "Would you rather have unlimited money or unlimited time?",
            "Would you rather be able to talk to animals or speak every language?",
        ];
        const q = questions[Math.floor(Math.random()*questions.length)];
        reply(`🤔 *Would You Rather?*\n\n${q}\n\nReply with A or B!\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .compliment — send a random compliment
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  .roast — playful roast
// ─────────────────────────────────────────────────────────────────────────────

];
