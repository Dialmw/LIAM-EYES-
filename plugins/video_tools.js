// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — VIDEO TOOLS
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const execP  = promisify(exec);
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const config = require('../settings/config');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

const getTmp = ext => path.join(os.tmpdir(), `liam_${Date.now()}${ext}`);

// ── ffmpeg audio extraction ────────────────────────────────────────────────
const ffmpegAudio = (input, output, speed = 1) => {
    const atempo = speed !== 1 ? `,atempo=${speed}` : '';
    return new Promise((res, rej) => {
        const cmd = `ffmpeg -y -i "${input}" -vn -ar 44100 -ac 2 -b:a 192k${atempo ? ` -filter:a "atempo=${speed}"` : ''} "${output}" 2>&1`;
        exec(cmd, (err, stdout, stderr) => {
            if (err && !fs.existsSync(output)) rej(new Error('ffmpeg failed: ' + (stderr || err.message).slice(0,200)));
            else res(output);
        });
    });
};

const ffmpegConvert = (input, output, extra = '') => new Promise((res, rej) => {
    exec(`ffmpeg -y -i "${input}" ${extra} "${output}" 2>&1`, (err, _, stderr) => {
        if (err && !fs.existsSync(output)) rej(new Error(stderr.slice(0,200)));
        else res(output);
    });
});

module.exports = [

// ─────────────────────────────────────────────────────────────────────────────
//  .toaudio — extract audio from video
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'toaudio', category: 'video',
    execute: async (sock, m, { reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('video') && !mime.includes('audio'))
            return reply(`❓ *Usage:* Reply to a video message with *.toaudio*\n\n${sig()}`);

        await react(sock, m, '🎵');
        const tmp = getTmp('.mp4'), out = getTmp('.mp3');
        try {
            const buf = await sock.downloadMediaMessage(q.msg || q);
            fs.writeFileSync(tmp, buf);
            await ffmpegAudio(tmp, out);
            const audio = fs.readFileSync(out);
            await sock.sendMessage(m.chat, {
                audio, mimetype: 'audio/mpeg', fileName: 'audio.mp3',
                contextInfo: { externalAdReply: {
                    title: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — Audio Extracted',
                    body: '🎵 Converted from video',
                    thumbnailUrl: config.thumbUrl, sourceUrl: config.pairingSite, mediaType: 1,
                }}
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch (e) {
            await react(sock, m, '❌');
            reply(`❌ Conversion failed: ${e.message}\n\n${sig()}`);
        } finally {
            [tmp, out].forEach(f => { try { fs.unlinkSync(f); } catch(_){} });
        }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .tovideo — convert audio to video (black bg) / convert doc to video
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'tovideo', category: 'video',
    execute: async (sock, m, { reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('audio') && !mime.includes('video'))
            return reply(`❓ *Usage:* Reply to an audio/video with *.tovideo*\n\n${sig()}`);

        await react(sock, m, '🎬');
        const tmp = getTmp(mime.includes('video') ? '.mp4' : '.mp3');
        const out = getTmp('.mp4');
        try {
            const buf = await sock.downloadMediaMessage(q.msg || q);
            fs.writeFileSync(tmp, buf);
            const extra = mime.includes('video')
                ? '-vf scale=1280:720 -c:v libx264 -preset fast -crf 22'
                : '-f lavfi -i color=black:s=640x360 -c:v libx264 -c:a aac -shortest';
            if (mime.includes('audio')) {
                await new Promise((res, rej) => exec(
                    `ffmpeg -y -f lavfi -i color=black:s=640x360:rate=24 -i "${tmp}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest "${out}"`,
                    (err, _, stderr) => err && !fs.existsSync(out) ? rej(new Error(stderr.slice(0,200))) : res()
                ));
            } else {
                await ffmpegConvert(tmp, out, extra);
            }
            const vid = fs.readFileSync(out);
            await sock.sendMessage(m.chat, {
                video: vid, caption: `🎬 *Converted!*\n\n${sig()}`,
                contextInfo: { externalAdReply: {
                    title: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — Video', body: '🎬 Converted',
                    thumbnailUrl: config.thumbUrl, sourceUrl: config.pairingSite, mediaType: 1,
                }}
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch (e) {
            await react(sock, m, '❌');
            reply(`❌ Failed: ${e.message}\n\n${sig()}`);
        } finally {
            [tmp, out].forEach(f => { try { fs.unlinkSync(f); } catch(_){} });
        }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .volvideo — change video volume
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'volvideo', category: 'video',
    execute: async (sock, m, { args, reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('video'))
            return reply(`❓ *Usage:* *.volvideo <volume>* (reply to video)\nExample: _.volvideo 200_ (200% volume)\n\n${sig()}`);

        const vol = parseFloat(args[0]) || 150;
        if (vol < 10 || vol > 800) return reply('❌ Volume must be between 10 and 800%\n\n' + sig());

        await react(sock, m, '🔊');
        const tmp = getTmp('.mp4'), out = getTmp('.mp4');
        try {
            const buf = await sock.downloadMediaMessage(q.msg || q);
            fs.writeFileSync(tmp, buf);
            const factor = (vol / 100).toFixed(2);
            await new Promise((res, rej) => exec(
                `ffmpeg -y -i "${tmp}" -af "volume=${factor}" -c:v copy "${out}"`,
                (err, _, stderr) => err && !fs.existsSync(out) ? rej(new Error(stderr.slice(0,200))) : res()
            ));
            const vid = fs.readFileSync(out);
            await sock.sendMessage(m.chat, {
                video: vid, caption: `🔊 *Volume changed to ${vol}%*\n\n${sig()}`,
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch (e) {
            await react(sock, m, '❌');
            reply(`❌ Failed: ${e.message}\n\n${sig()}`);
        } finally {
            [tmp, out].forEach(f => { try { fs.unlinkSync(f); } catch(_){} });
        }
    }
},

];
