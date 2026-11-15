// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — diag.js  (.diag — checks downloads & image editing)   ║
// ════════════════════════════════════════════════════════════════════════════
//  Owner command. Reply to a photo/audio/video with  .diag  to also test
//  WhatsApp media download. Shows exactly which part is broken on this host.
'use strict';
const os = require('os');
const { execFile } = require('child_process');
const axios = require('axios');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

const run = (bin, args, ms = 15000) => new Promise((res, rej) =>
    execFile(bin, args, { timeout: ms }, (e, out, err) => e ? rej(e) : res((out || err || '').toString().trim().split('\n')[0])));

const t = async (fn) => {
    const t0 = Date.now();
    try { const r = await fn(); return { ok: true, info: r, ms: Date.now() - t0 }; }
    catch (e) { return { ok: false, info: String(e?.code || e?.message || e).slice(0, 90), ms: Date.now() - t0 }; }
};
const mark = r => `${r.ok ? '✅' : '❌'} ${r.info}${r.ms > 1500 ? ` _(${(r.ms / 1000).toFixed(1)}s)_` : ''}`;

const site = (name, url) => t(async () => {
    const r = await axios.get(url, { timeout: 9000, validateStatus: () => true, headers: { 'User-Agent': 'Mozilla/5.0' }, maxContentLength: 200000 });
    return `HTTP ${r.status}`;
}).then(r => `• ${name}: ${mark(r)}`);

module.exports = [{
    command: 'diag', category: 'owner', owner: true,
    execute: async (sock, m, { reply, isCreator }) => {
        if (!isCreator) return reply('❌ Owner only.');
        await sock.sendMessage(m.chat, { react: { text: '🩺', key: m.key } }).catch(() => {});
        const lines = [];
        const mem = process.memoryUsage();
        lines.push(`🖥️ Node ${process.version} · ${process.platform}/${process.arch} · RAM ${(mem.rss / 1048576) | 0}MB used, ${(os.freemem() / 1048576) | 0}MB free`);

        // tools
        const media = require('./media');
        lines.push(`🎬 ffmpeg: ${mark(await t(() => run(media.FFMPEG, ['-version'])).then(r => ({ ...r, info: r.ok ? r.info.slice(0, 40) : r.info })))}`);
        lines.push(`⬇️ yt-dlp: ${mark(await t(async () => { const b = await media.ensureYtdlp(); if (!b) throw new Error('not installed'); return 'v' + await run(b, ['--version']); }))}`);
        lines.push(`🎨 image editor (jimp): ${mark(await t(async () => {
            const { Jimp } = require('jimp');
            const i = new Jimp({ width: 64, height: 64, color: 0x3366ccff });
            i.blur(2).greyscale();
            return `${(await i.getBuffer('image/jpeg')).length} bytes OK`;
        }))}`);

        // WhatsApp media download (reply to a photo / video / audio)
        const q = m.quoted || ((m.msg && m.msg.mimetype) ? m : null);
        if (q) {
            const r = await t(async () => { const b = await sock.downloadMediaMessage(q); return `${b.length} bytes downloaded`; });
            lines.push(`📥 WhatsApp media download: ${mark(r)}`);
        } else lines.push('📥 WhatsApp media download: _reply to a photo with .diag to test_');

        // network / certificates
        const nets = await Promise.all([
            site('WhatsApp CDN', 'https://mmg.whatsapp.net'),
            site('TikTok API (tikwm)', 'https://www.tikwm.com/api/?url=https://www.tiktok.com/@a/video/1'),
            site('SoundCloud', 'https://soundcloud.com'),
            site('YouTube', 'https://www.youtube.com/oembed?url=https://youtu.be/dQw4w9WgXcQ&format=json'),
            site('GitHub', 'https://github.com'),
        ]);
        lines.push('🌐 *Network*', ...nets);

        await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
        reply(`🩺 *DIAGNOSTICS*\n\n${lines.join('\n')}\n\n_Send me this if something is still failing._\n\n${sig()}`);
    },
}];
