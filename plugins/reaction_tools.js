// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — reaction_tools.js  FIXED v2                         ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('../settings/config');
const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

// Multi-source GIF fetcher — tries multiple free APIs with timeout
const fetchGif = async (search) => {
    const encodedSearch = encodeURIComponent(search);

    // Source 1: nekos.best (anime GIFs — very reliable, no key needed)
    const nekoMap = {
        hug:'hug', kiss:'kiss', slap:'slap', pat:'pat', cuddle:'cuddle',
        poke:'poke', wave:'wave', punch:'punch', bite:'bite', blush:'blush',
        cry:'cry', laugh:'laugh', smile:'smile', happy:'happy', dance:'dance',
        stare:'stare', wink:'wink', bored:'bored', thumbsup:'thumbsup',
        highfive:'highfive', pout:'pout',
    };
    const nekoKey = Object.keys(nekoMap).find(k => search.toLowerCase().includes(k));
    if (nekoKey) {
        try {
            const { data } = await axios.get(`https://nekos.best/api/v2/${nekoMap[nekoKey]}`, { timeout: 7000 });
            const url = data?.results?.[0]?.url;
            if (url) return { url, isGif: false }; // nekos.best returns webm/gif
        } catch(_) {}
    }

    // Source 2: waifu.pics
    const waifuMap = {
        hug:'hug', kiss:'kiss', slap:'slap', pat:'pat', wave:'wave',
        smile:'smile', happy:'happy', blush:'blush', cry:'cry',
    };
    const waifuKey = Object.keys(waifuMap).find(k => search.toLowerCase().includes(k));
    if (waifuKey) {
        try {
            const { data } = await axios.get(`https://api.waifu.pics/sfw/${waifuMap[waifuKey]}`, { timeout: 7000 });
            if (data?.url) return { url: data.url, isGif: true };
        } catch(_) {}
    }

    // Source 3: nekos.life
    const nekoLife = ['hug','kiss','slap','pat','cuddle','poke'];
    const nekoLifeKey = nekoLife.find(k => search.toLowerCase().includes(k));
    if (nekoLifeKey) {
        try {
            const { data } = await axios.get(`https://nekos.life/api/v2/img/${nekoLifeKey}`, { timeout: 7000 });
            if (data?.url) return { url: data.url, isGif: true };
        } catch(_) {}
    }

    return null;
};

const sendGif = async (sock, m, ctx, term, caption) => {
    await react(sock, m, '⏳');
    try {
        const result = await fetchGif(term);
        if (result?.url) {
            const { url, isGif } = result;
            // Try sending as GIF video first
            try {
                await sock.sendMessage(m.chat, {
                    video: { url },
                    caption,
                    gifPlayback: true,
                }, { quoted: m });
            } catch(_) {
                // Fallback: send as image
                await sock.sendMessage(m.chat, { image: { url }, caption }, { quoted: m });
            }
        } else {
            // Text fallback
            ctx.reply(`${caption}\n\n${sig()}`);
        }
        await react(sock, m, '✅');
    } catch(e) {
        await react(sock, m, '❌');
        ctx.reply(`❌ Reaction failed: ${e.message}\n\n${sig()}`);
    }
};

const makeReaction = (command, term, emoji, action) => ({
    command, category: 'reaction',
    execute: async (sock, m, ctx) => {
        const target = ctx.quoted?.sender
            ? '@' + ctx.quoted.sender.split('@')[0]
            : ctx.text ? ctx.text : 'everyone';
        const caption = `${emoji} *${ctx.pushname}* ${action} *${target}*\n\n${sig()}`;
        await sendGif(sock, m, ctx, term, caption);
    }
});

module.exports = [
    makeReaction('hug',      'hug',    '🤗', 'hugs'),
    makeReaction('kiss',     'kiss',   '😘', 'kisses'),
    makeReaction('slap',     'slap',   '👋', 'slaps'),
    makeReaction('pat',      'pat',    '🥰', 'pats'),
    makeReaction('cuddle',   'cuddle', '💕', 'cuddles with'),
    makeReaction('poke',     'poke',   '👉', 'pokes'),
    makeReaction('wave',     'wave',   '👋', 'waves at'),
    makeReaction('punch',    'punch',  '👊', 'punches'),
    makeReaction('bite',     'bite',   '😈', 'bites'),
    makeReaction('blush',    'blush',  '😳', 'blushes at'),
    makeReaction('cry',      'cry',    '😢', 'cries with'),
    makeReaction('laugh',    'laugh',  '😂', 'laughs with'),
    makeReaction('smile',    'smile',  '😊', 'smiles at'),
    makeReaction('happy',    'happy',  '😄', 'is happy with'),
    makeReaction('dance',    'dance',  '💃', 'dances with'),
    makeReaction('stare',    'stare',  '👀', 'stares at'),
    makeReaction('pout',     'pout',   '😤', 'pouts at'),
    makeReaction('wink',     'wink',   '😉', 'winks at'),
    makeReaction('highfive', 'highfive','🙌','high fives'),

    // Text-only reactions
    {
        command: 'ship', category: 'reaction',
        execute: async (sock, m, ctx) => {
            const names = ctx.text.split(/\s*[&,x×+]\s*|and/i).map(s => s.trim()).filter(Boolean);
            const a = names[0] || ctx.pushname;
            const b = names[1] || 'Mystery Person';
            const pct = Math.floor(Math.random() * 101);
            const bar = '█'.repeat(Math.floor(pct/10)) + '░'.repeat(10-Math.floor(pct/10));
            ctx.reply(
                `💘 *Ship Meter*\n\n💑 *${a}* + *${b}*\n\n[${bar}] ${pct}%\n\n` +
                `${pct>=80?'🔥 *Perfect match!*':pct>=60?'💕 *Looking good!*':pct>=40?'🤔 *Could work*':'💔 *Probably not...*'}\n\n${sig()}`
            );
        }
    },
    {
        command: 'dare2', category: 'reaction',
        execute: async (sock, m, ctx) => {
            const dares = [
                'Send a voice note singing your favourite song 🎵',
                'Change your WhatsApp bio for 1 hour 😂',
                'Send the last 5 photos in your gallery 📸',
                'Call someone randomly and say "I love you" ❤️',
                'Post an embarrassing story on your status for 1hr 😬',
                'Do 20 push-ups RIGHT NOW 💪',
                'Text your crush something nice 💌',
                'Confess something to the group 😳',
            ];
            ctx.reply(`🔥 *DARE!*\n\n${dares[~~(Math.random()*dares.length)]}\n\n${sig()}`);
        }
    },
    {
        command: 'truth2', category: 'reaction',
        execute: async (sock, m, ctx) => {
            const truths = [
                'What is your biggest secret? 🤫',
                'Who was your first crush? 😍',
                'What is your most embarrassing moment? 😂',
                'Have you ever lied to get out of trouble? 🤥',
                'What do you really think of the person who sent this? 🤔',
                'Who in this group do you find most attractive? 👀',
                'What is your most searched thing on Google? 🔍',
            ];
            ctx.reply(`💬 *TRUTH!*\n\n${truths[~~(Math.random()*truths.length)]}\n\n${sig()}`);
        }
    },
];
