// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — imageedit.js  (local image editor, no external API)   ║
// ════════════════════════════════════════════════════════════════════════════
//  Reply to a photo with:  .blur  .grey  .invert  .sepia  .flip  .flipv
//  .rotate [deg]  .pixelate [n]  .bright [%]  .contrast [%]  .sharpen
//  .enhance (also .hd)  .circle  .resize <width>  .posterize [n]  .edit
//  Everything runs inside the bot with Jimp (pure JS) so it works on any host.
'use strict';

const { Jimp } = require('jimp');
const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s, m, e) => s.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {});
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const num   = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };

const SHARPEN = [[0, -1, 0], [-1, 5, -1], [0, -1, 0]];

// effect(img, args) mutates the Jimp image
const EFFECTS = {
    blur:      { d: 'Blur',                  f: (i, a) => i.blur(clamp(Math.round(num(a[0], 5)), 1, 30)) },
    grey:      { d: 'Black & white',         f: i => i.greyscale() },
    invert:    { d: 'Invert colours',        f: i => i.invert() },
    sepia:     { d: 'Vintage sepia',         f: i => i.sepia() },
    flip:      { d: 'Mirror left/right',     f: i => i.flip({ horizontal: true, vertical: false }) },
    flipv:     { d: 'Flip upside-down',      f: i => i.flip({ horizontal: false, vertical: true }) },
    rotate:    { d: 'Rotate (default 90°)',  f: (i, a) => i.rotate(num(a[0], 90)) },
    pixelate:  { d: 'Pixelate',              f: (i, a) => i.pixelate(clamp(Math.round(num(a[0], 10)), 2, 60)) },
    bright:    { d: 'Brightness (+/- %)',    f: (i, a) => i.brightness(clamp(1 + num(a[0], 20) / 100, 0.1, 3)) },
    contrast:  { d: 'Contrast (+/- %)',      f: (i, a) => i.contrast(clamp(num(a[0], 25) / 100, -1, 1)) },
    sharpen:   { d: 'Sharpen',               f: i => i.convolute(SHARPEN) },
    posterize: { d: 'Poster look',           f: (i, a) => i.posterize(clamp(Math.round(num(a[0], 5)), 2, 20)) },
    circle:    { d: 'Round crop (PNG)',      f: i => i.circle(), png: true },
    resize:    { d: 'Resize to width',       f: (i, a) => i.resize({ w: clamp(Math.round(num(a[0], 512)), 32, 2048) }) },
    enhance:   { d: 'Enhance / upscale ×2',  f: i => {
        const w = i.bitmap.width, h = i.bitmap.height;
        const k = Math.min(2, 2048 / Math.max(w, h));
        if (k > 1.05) i.resize({ w: Math.round(w * k), h: Math.round(h * k) });
        i.normalize().contrast(0.12).convolute(SHARPEN);
    }, noDownscale: true },
};
const ALIAS = { gray: 'grey', bw: 'grey', negative: 'invert', mirror: 'flip', vflip: 'flipv', mosaic: 'pixelate',
                brighten: 'bright', hd: 'enhance', upscale: 'enhance', round: 'circle', poster: 'posterize', size: 'resize' };

async function getImage(sock, m) {
    const q = m.quoted || m;
    const mime = (q.msg || q).mimetype || '';
    if (!mime.startsWith('image/')) return { err: '❗ *Reply to a photo* with this command.' };
    if (mime === 'image/webp') return { err: '❗ Stickers (webp) can\'t be edited — send the photo itself.' };
    const buf = await sock.downloadMediaMessage(q);
    return { buf, mime };
}

async function runEffect(sock, m, name, args, reply) {
    const fx = EFFECTS[name];
    await react(sock, m, '🎨');
    try {
        const got = await getImage(sock, m);
        if (got.err) { await react(sock, m, '❌'); return reply(`${got.err}\n\n${sig()}`); }
        const img = await Jimp.read(got.buf);
        if (!fx.noDownscale && img.bitmap.width > 2000) img.resize({ w: 2000 });   // keep memory low on small hosts
        fx.f(img, args);
        const out = await img.getBuffer(fx.png ? 'image/png' : 'image/jpeg');
        await sock.sendMessage(m.chat, { image: out, caption: `🎨 *${fx.d}*\n\n${sig()}` }, { quoted: m });
        await react(sock, m, '✅');
    } catch (e) {
        await react(sock, m, '❌');
        reply(`❌ Edit failed: ${String(e.message || e).slice(0, 160)}\n\n${sig()}`);
    }
}

const cmds = [];
for (const name of Object.keys(EFFECTS)) {
    const names = [name, ...Object.keys(ALIAS).filter(a => ALIAS[a] === name)];
    for (const command of names) {
        cmds.push({
            command, category: 'image', description: EFFECTS[name].d,
            execute: async (sock, m, { args, reply }) => runEffect(sock, m, name, args || [], reply),
        });
    }
}

cmds.push({
    command: 'edit', category: 'image', description: 'Image editor menu / .edit <effect> [value]',
    execute: async (sock, m, { args, reply }) => {
        const a = (args || []).slice();
        let name = (a.shift() || '').toLowerCase();
        name = ALIAS[name] || name;
        if (EFFECTS[name]) return runEffect(sock, m, name, a, reply);
        const list = Object.keys(EFFECTS).map(k => `• *.${k}* — ${EFFECTS[k].d}`).join('\n');
        reply(`🎨 *IMAGE EDITOR*\n_Reply to a photo with any command below_\n\n${list}\n\nExample: *.blur 8* · *.rotate 180* · *.edit sepia*\n\n${sig()}`);
    },
});

// exported so .remini can fall back to the local enhancer
cmds.enhanceBuffer = async buf => {
    const img = await Jimp.read(buf);
    EFFECTS.enhance.f(img, []);
    return img.getBuffer('image/jpeg');
};

module.exports = cmds;
