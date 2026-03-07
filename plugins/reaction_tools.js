// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('../settings/config');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

// ── GIF/Image reaction via tenor API (free, no key needed) ───────────────
const tenorGif = async (search) => {
    try {
        const url = `https://api.tenor.com/v1/search?q=${encodeURIComponent(search)}&limit=15&media_filter=basic&client_key=liam_eyes`;
        const { data } = await axios.get(url, { timeout: 8000 });
        const results  = data?.results || [];
        if (!results.length) throw new Error('No results');
        const pick = results[Math.floor(Math.random() * results.length)];
        return pick?.media?.[0]?.gif?.url || pick?.media?.[0]?.mp4?.url;
    } catch {
        // Fallback: waifu.pics anime reaction GIFs
        const endpoints = {
            hug:   'https://api.waifu.pics/sfw/hug',
            kiss:  'https://api.waifu.pics/sfw/kiss',
            slap:  'https://api.waifu.pics/sfw/slap',
            pat:   'https://api.waifu.pics/sfw/pat',
            wave:  'https://api.waifu.pics/sfw/wave',
            smile: 'https://api.waifu.pics/sfw/smile',
            happy: 'https://api.waifu.pics/sfw/happy',
            default: 'https://api.waifu.pics/sfw/hug',
        };
        const ep = endpoints[search.toLowerCase()] || endpoints.default;
        try {
            const { data } = await axios.get(ep, { timeout: 8000 });
            return data?.url;
        } catch { return null; }
    }
};

const sendGif = async (sock, m, ctx, term, caption) => {
    await react(sock, m, '⏳');
    try {
        const url = await tenorGif(term);
        if (url) {
            const isGif = url.includes('.gif');
            await sock.sendMessage(m.chat, {
                [isGif ? 'video' : 'video']: { url },
                caption,
                gifPlayback: true
            }, { quoted: m });
        } else {
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
            : ctx.text ? ctx.text.replace('@','') : 'everyone';
        const caption = `${emoji} *${ctx.pushname}* ${action} *${target}*\n\n${sig()}`;
        await sendGif(sock, m, ctx, term, caption);
    }
});

module.exports = [
    makeReaction('hug',        'anime hug',        '🤗', 'hugs'),
    makeReaction('kiss',       'anime kiss',        '😘', 'kisses'),
    makeReaction('slap',       'anime slap',        '👋', 'slaps'),
    makeReaction('pat',        'anime pat head',    '🥰', 'pats'),
    makeReaction('cuddle',     'anime cuddle',      '💕', 'cuddles with'),
    makeReaction('poke',       'anime poke',        '👉', 'pokes'),
    makeReaction('wave',       'anime wave',        '👋', 'waves at'),
    makeReaction('highfive',   'anime high five',   '🙌', 'high fives'),
    makeReaction('punch',      'anime punch',       '👊', 'punches'),
    makeReaction('bite',       'anime bite',        '😈', 'bites'),
    makeReaction('lick',       'anime lick',        '👅', 'licks'),
    makeReaction('blush',      'anime blush',       '😳', 'makes blush'),
    makeReaction('cry',        'anime cry sad',     '😢', 'makes cry'),
    makeReaction('laugh',      'anime laugh',       '😂', 'laughs with'),
    makeReaction('smile',      'anime smile',       '😊', 'smiles at'),
    makeReaction('happy',      'anime happy',       '😄', 'is happy with'),
    makeReaction('dance',      'anime dance',       '💃', 'dances with'),
    makeReaction('stare',      'anime stare',       '👀', 'stares at'),
    makeReaction('pout',       'anime pout',        '😤', 'pouts at'),
    makeReaction('wink',       'anime wink',        '😉', 'winks at'),

    // ── Text-only reactions (no GIF needed) ──────────────────────────────
    {
        command: 'ship', category: 'reaction',
        execute: async (sock, m, ctx) => {
            const names = ctx.text.split(/\s*[&,x×+]\s*|and/i).map(s => s.trim()).filter(Boolean);
            const a = names[0] || ctx.pushname;
            const b = names[1] || 'Mystery Person';
            const pct = Math.floor(Math.random() * 101);
            const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
            ctx.reply(
                `💘 *Ship Meter*\n\n` +
                `💑 *${a}* + *${b}*\n\n` +
                `[${bar}] ${pct}%\n\n` +
                `${pct >= 80 ? '🔥 *Perfect match!* 😍' : pct >= 60 ? '💕 *Looking good!*' : pct >= 40 ? '🤔 *Could work with effort*' : '💔 *Probably not...*'}\n\n${sig()}`
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
                'Change your profile picture for 1 hour 😜',
                'Text your crush something nice 💌',
                'Send a 30-second video of you dancing 💃',
                'Confess something to the group 😳',
            ];
            ctx.reply(`🔥 *DARE!*\n\n${dares[~~(Math.random() * dares.length)]}\n\n${sig()}`);
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
                'What is the worst thing you have ever done? 😬',
                'Who in this group do you find most attractive? 👀',
                'Have you ever read someone\'s messages without permission? 🙊',
                'What is a bad habit you have never told anyone? 😅',
                'What is your most searched thing on Google? 🔍',
            ];
            ctx.reply(`💬 *TRUTH!*\n\n${truths[~~(Math.random() * truths.length)]}\n\n${sig()}`);
        }
    },
];
