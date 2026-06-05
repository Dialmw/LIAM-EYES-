// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — AUDIO TOOLS  (9 commands)
//  bass, blown, deep, earrape, reverse, robot, tomp3, toptt, volaudio
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('../settings/config');
const { exec } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tmp   = () => path.join(os.tmpdir(), `liameyes_${Date.now()}`);

const runFF = (cmd) => new Promise((res, rej) => exec(cmd, e => e ? rej(e) : res()));

// Download media buffer from quoted message
const getAudio = async (sock, m) => {
    const q = m.quoted || m;
    const mime = (q.msg || q).mimetype || '';
    if (!mime.includes('audio') && !mime.includes('video'))
        throw new Error('Reply to an *audio* or *video* message!');
    return { buf: await sock.downloadMediaMessage(q), mime };
};

const sendAudio = async (sock, m, buf, caption) => {
    await sock.sendMessage(m.chat, {
        audio: buf, mimetype: 'audio/mpeg'
    }, { quoted: m });
};

// ffmpeg-based audio effects
const ffxEffect = async (sock, m, reply, label, emoji, filter) => {
    await sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } }).catch(() => {});
    try {
        const { buf } = await getAudio(sock, m);
        const inp  = tmp() + '.mp3';
        const out  = tmp() + '_out.mp3';
        fs.writeFileSync(inp, buf);
        await runFF(`ffmpeg -y -i "${inp}" -af "${filter}" "${out}"`);
        const outBuf = fs.readFileSync(out);
        fs.unlinkSync(inp); fs.unlinkSync(out);
        await sendAudio(sock, m, outBuf, `${emoji} ${label} by LIAM EYES`);
        await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
    } catch (e) {
        await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
        reply(`❌ *${label} failed:* ${e.message}\n\n_Make sure you reply to an audio/video message_\n\n${sig()}`);
    }
};

module.exports = [

    // ── .tomp3 — convert any media to mp3 ──────────────────────────────────
    {
        command: 'tomp3', category: 'audio',
        execute: async (sock, m, { reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '🎵', key: m.key } }).catch(() => {});
            try {
                const q = m.quoted || m;
                const mime = (q.msg || q).mimetype || '';
                if (!mime) return reply(`❗ Reply to an audio or video message!\n\n${sig()}`);
                const buf  = await sock.downloadMediaMessage(q);
                const inp  = tmp() + '.input';
                const out  = tmp() + '.mp3';
                fs.writeFileSync(inp, buf);
                await runFF(`ffmpeg -y -i "${inp}" -codec:a libmp3lame -qscale:a 2 "${out}"`);
                const outBuf = fs.readFileSync(out);
                fs.unlinkSync(inp); fs.unlinkSync(out);
                await sendAudio(sock, m, outBuf, '🎵 Converted to MP3 by LIAM EYES');
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
            } catch (e) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                reply(`❌ Conversion failed: ${e.message}\n\n${sig()}`);
            }
        }
    },

    // ── .bass ────────────────────────────────────────────────────────────────
    { command: 'bass', category: 'audio',
      execute: (s,m,{reply}) => ffxEffect(s,m,reply,'Bass Boost','🔊','bass=g=20,dynaudnorm=f=200') },

    // ── .deep ────────────────────────────────────────────────────────────────
    { command: 'deep', category: 'audio',
      execute: (s,m,{reply}) => ffxEffect(s,m,reply,'Deep Bass','🎚️','asetrate=44100*0.7,atempo=1.43,bass=g=15') },

    // ── .earrape ─────────────────────────────────────────────────────────────
    { command: 'earrape', category: 'audio',
      execute: (s,m,{reply}) => ffxEffect(s,m,reply,'Earrape','💥','acrusher=level_in=5:level_out=15:bits=8:mode=log:aa=1') },

    // ── .blown ───────────────────────────────────────────────────────────────
    { command: 'blown', category: 'audio',
      execute: (s,m,{reply}) => ffxEffect(s,m,reply,'Blown Out','📢','acrusher=level_in=8:level_out=18:bits=4:mode=log:aa=1,highpass=f=200') },

    // ── .robot ───────────────────────────────────────────────────────────────
    { command: 'robot', category: 'audio',
      execute: (s,m,{reply}) => ffxEffect(s,m,reply,'Robot Voice','🤖','afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=512:overlap=0.75') },

    // ── .reverse ─────────────────────────────────────────────────────────────
    { command: 'reverse', category: 'audio',
      execute: (s,m,{reply}) => ffxEffect(s,m,reply,'Reversed','⏪','areverse') },

    // ── .volaudio ────────────────────────────────────────────────────────────
    {
        command: 'volaudio', category: 'audio',
        execute: async (sock, m, { args, reply }) => {
            const vol = parseFloat(args[0]) || 2;
            if (vol < 0.1 || vol > 10) return reply(`❗ Volume must be between 0.1 and 10\nUsage: *.volaudio 2.5*\n\n${sig()}`);
            await ffxEffect(sock, m, reply, `Volume ×${vol}`, '🔉', `volume=${vol}`);
        }
    },

    // ── .toptt — text to speech ────────────────────────────────────────────
    {
        command: 'toptt', category: 'audio',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.toptt <text>*\nExample: _.toptt Hello, I am LIAM EYES!_\n\n${sig()}`);
            await sock.sendMessage(m.chat, { react: { text: '🔈', key: m.key } }).catch(() => {});
            try {
                const url = `https://api.sound.lol/tts?text=${encodeURIComponent(text)}&lang=en`;
                const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
                await sendAudio(sock, m, Buffer.from(data), '🔈 TTS by LIAM EYES');
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
            } catch {
                // Fallback: use Google TTS
                try {
                    const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.slice(0,200))}&tl=en&client=tw-ob`;
                    const { data } = await axios.get(gUrl, { responseType: 'arraybuffer', timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                    await sendAudio(sock, m, Buffer.from(data), '🔈 TTS by LIAM EYES');
                    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e2) {
                    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    reply(`❌ TTS failed: ${e2.message}\n\n${sig()}`);
                }
            }
        }
    },

];
