// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — EPHOTO360 TOOLS  (34 commands)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('../settings/config');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (sock, m, e) => sock.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {});

// ── Ephoto360 API wrapper ─────────────────────────────────────────────────
const ephoto = async (endpoint, text) => {
    const { data } = await axios.get(`https://api.ephoto360.com/${endpoint}?text=${encodeURIComponent(text)}`,
        { timeout: 25000, headers: { 'User-Agent': 'LIAM-EYES/2.0' } });
    return data?.imageUrl || data?.result || data?.url || data?.image;
};

// ── AI image-text generator (pollinations-based) ─────────────────────────
const genTextEffect = async (style, text) => {
    const prompt = `${style} text effect design with the text "${text}", high quality, digital art`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=400&nologo=true&seed=${Date.now()}`;
};

// ── Send result image ─────────────────────────────────────────────────────
const sendResult = async (sock, m, reply, url, label, text) => {
    if (!url) throw new Error('No image URL returned');
    await sock.sendMessage(m.chat, {
        image: { url },
        caption: `✨ *${label}*\n📝 Text: _${text}_\n\n${sig()}`,
        contextInfo: { externalAdReply: {
            title: `𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — ${label}`, body: '👁️ EPhoto360 Effect',
            thumbnailUrl: config.thumbUrl, sourceUrl: config.pairingSite, mediaType: 1,
        }},
    }, { quoted: m });
};

// ── Build a command for each EPhoto style ────────────────────────────────
const makeCmd = (command, category, label, style, apiPath) => ({
    command, category,
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❓ Usage: *.${command} <text>*\nExample: _.${command} LIAM EYES_\n\n${sig()}`);
        await react(sock, m, '🎨');
        try {
            let url;
            if (apiPath) {
                try { url = await ephoto(apiPath, text); } catch (_) {}
            }
            if (!url) url = await genTextEffect(style, text);
            await sendResult(sock, m, reply, url, label, text);
            await react(sock, m, '✅');
        } catch (e) {
            await react(sock, m, '❌');
            reply(`❌ *${label} failed:* ${e.message}\n\n${sig()}`);
        }
    }
});

module.exports = [
    makeCmd('1917style',       'ephoto', '1917 Style',           '1917 movie cinematic vintage sepia',       '1917-text-effect'),
    makeCmd('advancedglow',    'ephoto', 'Advanced Glow',        'advanced neon glow electric blue',         'advanced-glow-text'),
    makeCmd('blackpinklogo',   'ephoto', 'Blackpink Logo',       'BLACKPINK K-pop logo pink black diamond',  'blackpink-logo'),
    makeCmd('blackpinkstyle',  'ephoto', 'Blackpink Style',      'BLACKPINK K-pop style pink glitter',       'blackpink-text'),
    makeCmd('cartoonstyle',    'ephoto', 'Cartoon Style',        'cartoon comic book pop art bold outline',   'cartoon-text'),
    makeCmd('deletingtext',    'ephoto', 'Deleting Text',        'text being deleted pixel glitch erase',    'deleting-text'),
    makeCmd('dragonball',      'ephoto', 'Dragon Ball',          'Dragon Ball Z golden energy flames saiyan','dragonball-text'),
    makeCmd('effectclouds',    'ephoto', 'Effect Clouds',        'clouds sky heavenly white fluffy text',    'clouds-text'),
    makeCmd('flag3dtext',      'ephoto', '3D Flag Text',         '3D waving flag country colors realistic',  'flag-3d-text'),
    makeCmd('flagtext',        'ephoto', 'Flag Text',            'flag colors patriotic country text',       'flag-text'),
    makeCmd('freecreate',      'ephoto', 'Free Create',          'creative artistic custom digital design',  'free-create'),
    makeCmd('galaxystyle',     'ephoto', 'Galaxy Style',         'galaxy space stars nebula cosmic purple',  'galaxy-text'),
    makeCmd('galaxywallpaper', 'ephoto', 'Galaxy Wallpaper',     'galaxy wallpaper milky way stars universe','galaxy-wallpaper'),
    makeCmd('glitchtext',      'ephoto', 'Glitch Text',          'digital glitch RGB split error VHS',       'glitch-text'),
    makeCmd('glowingtext',     'ephoto', 'Glowing Text',         'bright glowing neon light halo white',     'glowing-text'),
    makeCmd('gradienttext',    'ephoto', 'Gradient Text',        'beautiful gradient rainbow color fade',    'gradient-text'),
    makeCmd('graffiti',        'ephoto', 'Graffiti',             'street graffiti spray paint urban wall',   'graffiti-text'),
    makeCmd('incandescent',    'ephoto', 'Incandescent',         'incandescent hot metal burning ember glow','incandescent-text'),
    makeCmd('lighteffects',    'ephoto', 'Light Effects',        'light rays bokeh golden particles shine',  'light-effects-text'),
    makeCmd('logomaker',       'ephoto', 'Logo Maker',           'professional clean modern logo design',    'logo-maker'),
    makeCmd('luxurygold',      'ephoto', 'Luxury Gold',          'luxury gold metallic premium elegant',     'luxury-gold-text'),
    makeCmd('makingneon',      'ephoto', 'Making Neon',          'making neon sign workshop realistic',      'neon-making'),
    makeCmd('matrix',          'ephoto', 'Matrix',               'Matrix green code digital rain falling',   'matrix-text'),
    makeCmd('multicoloredneon','ephoto', 'Multicolored Neon',    'multicolor neon sign vibrant rainbow glow','multicolor-neon'),
    makeCmd('neonglitch',      'ephoto', 'Neon Glitch',          'neon glitch cyberpunk RGB split glow',     'neon-glitch'),
    makeCmd('papercutstyle',   'ephoto', 'Paper Cut Style',      'paper cut shadow layered craft art',       'paper-cut-text'),
    makeCmd('pixelglitch',     'ephoto', 'Pixel Glitch',         'pixel art glitch 8-bit retro game error',  'pixel-glitch'),
    makeCmd('royaltext',       'ephoto', 'Royal Text',           'royal crown gold medieval regal ornate',   'royal-text'),
    makeCmd('sand',            'ephoto', 'Sand Text',            'sand beach letters carved sun desert',     'sand-text'),
    makeCmd('summerbeach',     'ephoto', 'Summer Beach',         'summer beach tropical sunny ocean waves',  'summer-beach-text'),
    makeCmd('topography',      'ephoto', 'Topography',           'topographic map lines contour terrain',    'topography-text'),
    makeCmd('typography',      'ephoto', 'Typography',           'beautiful typography font art design',     'typography-art'),
    makeCmd('watercolortext',  'ephoto', 'Watercolor Text',      'watercolor paint brush artistic soft',     'watercolor-text'),
    makeCmd('writetext',       'ephoto', 'Write Text',           'handwriting pen ink signature cursive',    'write-text'),
];
