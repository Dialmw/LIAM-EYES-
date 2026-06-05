// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  LIAM EYES — fun_boost.js  (Fun, uptime, presence, entertainment)      ║
// ╚══════════════════════════════════════════════════════════════════════════╝
'use strict';
const axios  = require('axios');
const config = require('../settings/config');
const sig    = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react  = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

// ── Uptime formatter ──────────────────────────────────────────────────────────
const fmt = s => {
    const d=~~(s/86400), h=~~(s%86400/3600), m=~~(s%3600/60), sc=~~(s%60);
    return [d&&`${d}d`,h&&`${h}h`,m&&`${m}m`,`${sc}s`].filter(Boolean).join(' ');
};

// ── Tiny data pools ───────────────────────────────────────────────────────────
const JOKES = [
    "Why don't scientists trust atoms?\nBecause they make up everything! 😂",
    "I told my wife she was drawing her eyebrows too high.\nShe looked surprised! 😳",
    "Why do cows wear bells?\nBecause their horns don't work! 🐄",
    "What do you call a fake noodle?\nAn impasta! 🍝",
    "Why can't a bicycle stand on its own?\nIt's two-tired! 🚲",
    "What do you call cheese that isn't yours?\nNacho cheese! 🧀",
    "I'm reading a book on anti-gravity.\nIt's impossible to put down! 📚",
    "Why did the scarecrow win an award?\nHe was outstanding in his field! 🌾",
    "Why can't an egg tell a joke?\nIt would crack up! 🥚",
    "What do you call a pony with a cough?\nA little hoarse! 🐴",
];
const FACTS = [
    "🐝 Honey never spoils — archaeologists found 3000-year-old honey in Egyptian tombs!",
    "🦈 Sharks are older than trees — they've existed for ~450 million years.",
    "🌙 A day on Venus is longer than a year on Venus.",
    "🐙 Octopuses have three hearts and blue blood.",
    "🍌 Bananas are slightly radioactive due to potassium-40.",
    "🦋 Butterflies taste with their feet.",
    "⚡ Lightning strikes Earth about 100 times per second.",
    "🧠 Your brain uses about 20% of your body's energy.",
    "🌊 The Pacific Ocean is wider than the Moon.",
    "🔥 Hot water can freeze faster than cold water — the Mpemba effect.",
];
const ROASTS = [
    "You're like a cloud ☁️ — when you disappear, it's a beautiful day.",
    "I'd roast you harder but my mom said I'm not allowed to burn trash 🗑️",
    "You're proof that evolution can go in reverse 🦴",
    "I've seen better arguments in a shampoo bottle 🧴",
    "You're not stupid, you just have bad luck thinking 🧠",
];
const COMPLIMENTS = [
    "You're genuinely one of the most thoughtful people I know! 💫",
    "The world is better because you're in it 🌍✨",
    "You have the kind of energy that lights up every room 🔆",
    "Your smile could charge a solar panel ☀️",
    "You make complicated things look easy — that's a superpower 💪",
];
const QUOTES = [
    "\"The only way to do great work is to love what you do.\" — Steve Jobs",
    "\"In the middle of every difficulty lies opportunity.\" — Albert Einstein",
    "\"It does not matter how slowly you go as long as you do not stop.\" — Confucius",
    "\"Life is what happens when you're busy making other plans.\" — John Lennon",
    "\"The future belongs to those who believe in the beauty of their dreams.\" — Eleanor Roosevelt",
    "\"Success is not final, failure is not fatal: it is the courage to continue that counts.\" — Winston Churchill",
    "\"If you tell the truth, you don't have to remember anything.\" — Mark Twain",
    "\"Strive not to be a success, but rather to be of value.\" — Albert Einstein",
];
const EIGHTBALL = [
    "✅ It is certain","✅ Without a doubt","✅ Yes, definitely",
    "✅ You may rely on it","✅ As I see it, yes","✅ Most likely",
    "🟡 Reply hazy, try again","🟡 Ask again later","🟡 Cannot predict now",
    "🟡 Concentrate and ask again","❌ Don't count on it",
    "❌ Very doubtful","❌ My sources say no","❌ Outlook not so good",
];
const pick = arr => arr[~~(Math.random()*arr.length)];

// ── TRIVIA pool ───────────────────────────────────────────────────────────────
const TRIVIA = [
    { q:"What planet is closest to the Sun?",         a:"Mercury",          hint:"It has no moons" },
    { q:"How many sides does a hexagon have?",         a:"6",                hint:"Think honeycomb" },
    { q:"What is the chemical symbol for gold?",       a:"Au",               hint:"From Latin 'Aurum'" },
    { q:"Which country invented pizza?",               a:"Italy",            hint:"Think of Rome" },
    { q:"What is the longest river in the world?",     a:"Nile",             hint:"It's in Africa" },
    { q:"How many bones are in the adult human body?", a:"206",              hint:"More than 200" },
    { q:"What gas do plants absorb from the air?",     a:"Carbon dioxide",   hint:"CO₂" },
    { q:"Who painted the Mona Lisa?",                  a:"Leonardo da Vinci",hint:"Italian renaissance" },
];
const triviaActive = new Map(); // chat → { q, a, hint, asked }

module.exports = [

// ── .uptime ──────────────────────────────────────────────────────────────────
{
    command:'uptime', category:'general', description:'Show bot uptime & system info',
    execute: async (sock,m,{reply}) => {
        const up  = process.uptime();
        const mem = (process.memoryUsage().heapUsed/1024/1024).toFixed(1);
        const rss = (process.memoryUsage().rss/1024/1024).toFixed(1);
        await react(sock,m,'⚡');
        reply(
            `⚡ *LIAM EYES — System Status*\n\n` +
            `⏱️ *Uptime:*    ${fmt(up)}\n` +
            `💾 *Heap RAM:*  ${mem}MB\n` +
            `🧠 *Total RAM:* ${rss}MB\n` +
            `🔢 *Node:*      ${process.version}\n` +
            `📅 *Started:*   ${new Date(Date.now()-up*1000).toLocaleString('en-KE',{timeZone:'Africa/Nairobi'})}\n\n` +
            sig()
        );
    }
},

// ── .joke ─────────────────────────────────────────────────────────────────────

// ── .fact ─────────────────────────────────────────────────────────────────────

// ── .quote ────────────────────────────────────────────────────────────────────

// ── .roast ────────────────────────────────────────────────────────────────────
{
    command:'roast', category:'fun', description:'Get roasted 🔥',
    execute: async (sock,m,{reply,pushname}) => {
        await react(sock,m,'🔥');
        reply(`🔥 *Roasting ${pushname}*\n\n${pick(ROASTS)}\n\n_No cap, all love 💚_\n\n${sig()}`);
    }
},

// ── .compliment ───────────────────────────────────────────────────────────────
{
    command:'compliment', category:'fun', description:'Get a compliment 💫',
    execute: async (sock,m,{reply,pushname}) => {
        await react(sock,m,'💝');
        reply(`💝 *Hey ${pushname}!*\n\n${pick(COMPLIMENTS)}\n\n${sig()}`);
    }
},

// ── .8ball ────────────────────────────────────────────────────────────────────
{
    command:'8ball', category:'fun', description:'Ask the magic 8ball a yes/no question',
    execute: async (sock,m,{text,reply,prefix}) => {
        if (!text) return reply(`🎱 *Usage:* ${prefix}8ball <your question>\n\nExample: ${prefix}8ball Will I be rich?\n\n${sig()}`);
        await react(sock,m,'🎱');
        reply(`🎱 *Magic 8-Ball*\n\n❓ _${text}_\n\n${pick(EIGHTBALL)}\n\n${sig()}`);
    }
},

// ── .trivia ───────────────────────────────────────────────────────────────────
{
    command:'trivia', category:'fun', description:'Answer a trivia question',
    execute: async (sock,m,{text,reply,prefix}) => {
        const existing = triviaActive.get(m.chat);
        // .trivia answer <text>
        if (text?.toLowerCase().startsWith('answer ') || text?.toLowerCase().startsWith('ans ')) {
            if (!existing) return reply(`❓ No active trivia! Start one with ${prefix}trivia\n\n${sig()}`);
            const guess = text.replace(/^(answer|ans)\s+/i,'').trim().toLowerCase();
            if (existing.a.toLowerCase().includes(guess) || guess.includes(existing.a.toLowerCase())) {
                triviaActive.delete(m.chat);
                await react(sock,m,'🏆');
                reply(`🏆 *CORRECT!* 🎉\n\n✅ Answer: *${existing.a}*\n\n${sig()}`);
            } else {
                reply(`❌ *Wrong!* Try again or type *${prefix}trivia hint*\n\n${sig()}`);
            }
            return;
        }
        if (text?.toLowerCase() === 'hint') {
            if (!existing) return reply(`❓ No active trivia!\n\n${sig()}`);
            reply(`💡 *Hint:* ${existing.hint}\n\n${sig()}`);
            return;
        }
        if (text?.toLowerCase() === 'skip' || text?.toLowerCase() === 'give up') {
            if (!existing) return reply(`❓ No active trivia!\n\n${sig()}`);
            triviaActive.delete(m.chat);
            reply(`🏳️ *Skipped!* The answer was: *${existing.a}*\n\n${sig()}`);
            return;
        }
        // Start new trivia
        const q = pick(TRIVIA);
        triviaActive.set(m.chat, q);
        reply(
            `🧩 *TRIVIA TIME!*\n\n` +
            `❓ ${q.q}\n\n` +
            `📝 Reply: *${prefix}trivia answer <your answer>*\n` +
            `💡 Hint: *${prefix}trivia hint*\n` +
            `🏳️ Give up: *${prefix}trivia skip*\n\n` +
            sig()
        );
    }
},

// ── .wyr ─ Would You Rather ──────────────────────────────────────────────────
{
    command:'wyr', category:'fun', description:'Would you rather?',
    execute: async (sock,m,{reply}) => {
        const pairs = [
            ['fly but only 1 metre off the ground ✈️','run at 100km/h 🏃'],
            ['speak every language 🌍','play every instrument 🎸'],
            ['know the future 🔮','change the past ⏪'],
            ['never be cold 🌞','never be hot ❄️'],
            ['always be 10 min early ⏰','always be 20 min late 😬'],
            ['live with no internet for 1 year 📵','live with no music for 1 year 🔇'],
            ['be invisible 👻','read minds 🧠'],
            ['win $1M today 💰','earn $10K/month forever 📈'],
        ];
        const [a,b] = pick(pairs);
        await react(sock,m,'🤔');
        reply(`🤔 *Would You Rather?*\n\n🅰️ ${a}\n\n              OR\n\n🅱️ ${b}\n\n_Reply A or B!\n\n${sig()}`);
    }
},

// ── .coinflip ─────────────────────────────────────────────────────────────────
{
    command:'coinflip', category:'fun', description:'Flip a coin',
    execute: async (sock,m,{reply}) => {
        await react(sock,m,'🪙');
        const res = Math.random() < 0.5 ? '🪙 *HEADS!*' : '🪙 *TAILS!*';
        reply(`${res}\n\n_The coin has spoken._\n\n${sig()}`);
    }
},

// ── .dice ─────────────────────────────────────────────────────────────────────
{
    command:'dice', category:'fun', description:'Roll dice',
    execute: async (sock,m,{text,reply}) => {
        await react(sock,m,'🎲');
        const sides  = Math.min(100, Math.max(2, parseInt(text) || 6));
        const result = ~~(Math.random()*sides)+1;
        const faces  = {1:'⚀',2:'⚁',3:'⚂',4:'⚃',5:'⚄',6:'⚅'};
        reply(`🎲 *Rolled a ${sides}-sided die!*\n\n${faces[result]||''} *${result}*\n\n${sig()}`);
    }
},

// ── .choose ───────────────────────────────────────────────────────────────────
{
    command:'choose', category:'fun', description:'Let the bot decide for you',
    execute: async (sock,m,{text,prefix,reply}) => {
        if (!text || !text.includes(',')) return reply(`❓ *Usage:* ${prefix}choose <option1>, <option2>, ...\n\nExample: ${prefix}choose Pizza, Burger, Sushi\n\n${sig()}`);
        await react(sock,m,'🎯');
        const opts = text.split(',').map(o=>o.trim()).filter(Boolean);
        const chosen = pick(opts);
        reply(`🎯 *Decision Made!*\n\nOptions: _${opts.join(' | ')}_\n\n✅ I choose: *${chosen}*\n\n${sig()}`);
    }
},

// ── .moodring ─────────────────────────────────────────────────────────────────
{
    command:'moodring', category:'fun', description:'Read your mood by your name vibration',
    execute: async (sock,m,{pushname,reply}) => {
        const moods = [
            '🔴 Passionate & intense — you\'re on fire today!',
            '🟠 Creative & energetic — big ideas incoming!',
            '🟡 Happy & optimistic — sunshine vibes ☀️',
            '🟢 Calm & balanced — zen mode activated 🧘',
            '🔵 Thoughtful & focused — deep thinker alert!',
            '🟣 Mysterious & intuitive — psychic energy today!',
            '⚪ Neutral & adaptable — chameleon energy!',
            '🩷 Loving & caring — your heart is huge today!',
        ];
        const hash = [...(pushname||'User')].reduce((a,c)=>a+c.charCodeAt(0),0);
        await react(sock,m,'💍');
        reply(`💍 *Mood Ring — ${pushname}*\n\n${moods[hash%moods.length]}\n\n_Based on your name's cosmic vibration 🌌_\n\n${sig()}`);
    }
},

// ── .ship ─────────────────────────────────────────────────────────────────────
{
    command:'ship', category:'fun', description:'Ship two names together for compatibility %',
    execute: async (sock,m,{text,prefix,reply}) => {
        if (!text || !text.includes(',')) return reply(`💑 *Usage:* ${prefix}ship <name1>, <name2>\n\n${sig()}`);
        const [a,b] = text.split(',').map(s=>s.trim());
        const score = ((a+b).split('').reduce((x,c)=>x+c.charCodeAt(0),0))%101;
        const bar   = '❤️'.repeat(~~(score/20))+'🖤'.repeat(5-~~(score/20));
        const msg   = score >= 80 ? 'SOULMATES! 💍' : score >= 60 ? 'Strong match! 🔥' : score >= 40 ? 'Good friends... for now 😏' : score >= 20 ? 'It\'s complicated 😅' : 'Just friends 🤝';
        await react(sock,m,'💘');
        reply(`💘 *Compatibility*\n\n💑 ${a} + ${b}\n\n${bar}\n\n*${score}%* — ${msg}\n\n${sig()}`);
    }
},

// ── .afk ─────────────────────────────────────────────────────────────────────
{
    command:'afk', category:'general', description:'Set AFK status — bot replies on your behalf',
    execute: async (sock,m,{text,reply,sender}) => {
        global._afkUsers = global._afkUsers || new Map();
        global._afkUsers.set(sender, { reason: text || 'Away from keyboard', since: Date.now() });
        await react(sock,m,'💤');
        reply(`💤 *AFK mode on!*\n\n_Reason: ${text||'AFK'}_\n\nI'll let people know you're away.\nType anything to come back.\n\n${sig()}`);
    }
},

];
