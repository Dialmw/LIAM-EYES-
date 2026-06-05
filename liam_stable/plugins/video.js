// ── LIAM EYES — video.js (stable video download)
'use strict';
const yts = require('yt-search');
const { dlVideo, dlAudio, fmtDur, safeName } = require('../library/dl');
const cfg = () => require('../settings/config');
const react = (s, m, e) => s.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {});

module.exports = [
{
    command: 'video', category: 'video', description: 'Download a YouTube video',
    execute: async (sock, m, { text, prefix, reply, sender }) => {
        if (!text) return reply(`🎬 *Usage:* ${prefix}video <title or YouTube URL>\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`);
        await react(sock, m, '⚡');

        let proc = await sock.sendMessage(m.chat,
            { text: `🎬 *Searching YouTube...*\n\n🔍 "${text}"\n⏳ Please wait...` },
            { quoted: m }
        );

        let vid;
        try {
            if (/^https?:\/\//i.test(text)) {
                vid = { url: text, title: 'Video', thumbnail: '' };
            } else {
                const { videos } = await yts(text);
                if (!videos?.length) throw new Error('No results found');
                vid = videos[0];
            }
        } catch (e) {
            await react(sock, m, '😔');
            return sock.sendMessage(m.chat, { text: `❌ Not found: ${e.message}`, edit: proc.key });
        }

        await react(sock, m, '⬇️');
        await sock.sendMessage(m.chat, {
            text: `✅ *Video Found!*\n\n📀 ${vid.title}\n⏱️ ${fmtDur(vid)}\n🎥 Quality: 360p\n\n⬇️ Downloading...`,
            edit: proc.key,
        });

        // thumbnail preview
        if (vid.thumbnail) {
            sock.sendMessage(m.chat, {
                image: { url: vid.thumbnail },
                caption: `🎬 *${vid.title}*\n⬇️ Downloading 360p...`,
            }, { quoted: m }).catch(() => {});
        }

        try {
            const result = await dlVideo(vid.url, '360');
            const config = cfg();
            await sock.sendMessage(m.chat, {
                video:    { url: result.url },
                mimetype: 'video/mp4',
                fileName: safeName(result.title || vid.title, 'mp4'),
                caption:  `🎬 *${result.title || vid.title}*\n🎥 360p\n✅ Downloaded\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`,
                contextInfo: {
                    externalAdReply: {
                        title: '🎬 LIAM EYES Video', body: 'Click for more downloads!',
                        mediaType: 2, thumbnailUrl: vid.thumbnail || config.thumbUrl,
                        sourceUrl: config.channel || 'https://whatsapp.com/channel/0029VbBeZTc1t90aZjks9v2S',
                    },
                },
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch (e) {
            // Auto-fallback to audio
            await react(sock, m, '⚠️');
            await reply(`⚠️ _Video unavailable — sending audio instead..._`);
            try {
                const ar = await dlAudio(vid.url);
                await sock.sendMessage(m.chat, {
                    audio: { url: ar.url }, mimetype: 'audio/mpeg',
                    fileName: safeName(ar.title || vid.title, 'mp3'),
                }, { quoted: m });
                await react(sock, m, '✅');
            } catch (e2) {
                await react(sock, m, '💥');
                reply(`💥 *Download Error*\n\n❌ ${e2.message.split('\n')[0]}\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`);
            }
        }
    },
},
{
    command: 'ytmp4', category: 'video', description: 'Download YouTube video by URL',
    execute: async (sock, m, ctx) => {
        const mod = [].concat(require('./video')).find(p => p.command === 'video');
        return mod?.execute(sock, m, ctx);
    },
},
];
