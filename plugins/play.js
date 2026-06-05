// ── LIAM EYES — play.js  (music downloader, fast delivery)
'use strict';
const yts  = require('yt-search');
const { dlAudio, fmtDur } = require('../library/dl');
const config = require('../settings/config');
const sig  = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

module.exports = [

// ── .play — fast search + download
{
    command: 'play', category: 'audio', description: 'Download music from YouTube',
    execute: async (sock, m, { text, prefix, reply, sender }) => {
        if (!text) return reply(
            `🎧 *LIAM EYES MUSIC*\n\n┌─❖\n│ ✦ Send a song name\n│ ✦ Example: ${prefix}play faded alan walker\n└───────────────◉\n\n${sig()}`
        );

        // Instant feedback — react immediately
        await sock.sendMessage(m.chat, { react: { text: '🎶', key: m.key } });

        // Send processing message fast
        let proc = null;
        try {
            proc = await sock.sendMessage(m.chat,
                { text: `🔍 *Searching:* _"${text}"_\n⏳ Please wait...` },
                { quoted: m }
            );
        } catch(_) {}

        // Search
        let vid;
        try {
            if (/^https?:\/\//i.test(text)) {
                vid = { url: text, title: text, timestamp: '', views: '', thumbnail: '' };
            } else {
                const { videos } = await yts(text);
                if (!videos?.length) throw new Error('No results');
                vid = videos[0];
            }
        } catch(e) {
            await sock.sendMessage(m.chat, { react: { text: '😔', key: m.key } });
            const txt = `❌ *Not found*\n\n💡 Try: _${prefix}play artist - song name_\n\n${sig()}`;
            proc ? sock.sendMessage(m.chat, { text: txt, edit: proc.key }).catch(()=>{}) : reply(txt);
            return;
        }

        // Update: found song
        await sock.sendMessage(m.chat, { react: { text: '⬇️', key: m.key } });
        if (proc) sock.sendMessage(m.chat, {
            text: `✅ *Song Found!*\n\n🎵 *${vid.title}*\n⏱️ ${fmtDur(vid)}${vid.views ? ' | 👁️ ' + vid.views : ''}\n\n⬇️ _Starting download..._`,
            edit: proc.key,
        }).catch(() => {});

        // Download — sequential API chain
        try {
            const result = await dlAudio(vid.url);

            // Update message before sending audio
            if (proc) sock.sendMessage(m.chat, {
                text: `🎉 *Ready!*\n\n🎵 ${result.title || vid.title}\n✅ _Sending now..._`,
                edit: proc.key,
            }).catch(() => {});

            await sock.sendMessage(m.chat, { react: { text: '⚡', key: m.key } });

            // Send audio — WhatsApp fetches from URL directly (fast delivery)
            await sock.sendMessage(m.chat, {
                audio: { url: result.url },
                mimetype: 'audio/mpeg',
                fileName: `${(result.title || vid.title).slice(0, 50)}.mp3`,
                contextInfo: {
                    mentionedJid: [sender],
                    externalAdReply: {
                        title: '🎧 LIAM EYES Music',
                        body: result.title || vid.title,
                        thumbnailUrl: vid.thumbnail || config.thumbUrl,
                        sourceUrl: config.channel || 'https://whatsapp.com/channel/0029VbBeZTc1t90aZjks9v2S',
                        mediaType: 1,
                    },
                },
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch(e) {
            await sock.sendMessage(m.chat, { react: { text: '💀', key: m.key } });
            const errTxt = `💥 *Download Failed*\n\n❌ ${e.message.split('\n')[0]}\n\n💡 Try *${prefix}play2* to force file delivery\n\n${sig()}`;
            proc
                ? sock.sendMessage(m.chat, { text: errTxt, edit: proc.key }).catch(() => {})
                : reply(errTxt);
        }
    },
},

// ── .play2 — always sends as document file
{
    command: 'play2', category: 'audio', description: 'Send music as downloadable file',
    execute: async (sock, m, { text, prefix, reply }) => {
        if (!text) return reply(`🎵 *Usage:* ${prefix}play2 <song name>\n_Sends as file — guaranteed delivery_\n\n${sig()}`);
        await sock.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });
        try {
            let vid;
            if (/^https?:\/\//i.test(text)) { vid = { url: text, title: 'audio' }; }
            else {
                const { videos } = await yts(text);
                vid = videos?.[0];
                if (!vid) throw new Error('No results');
            }
            await reply(`⬇️ _Getting:_ *${vid.title || vid.url}* ${fmtDur(vid)}`);
            await sock.sendMessage(m.chat, { react: { text: '⬇️', key: m.key } });
            const result = await dlAudio(vid.url);
            await sock.sendMessage(m.chat, {
                document: { url: result.url },
                mimetype: 'audio/mpeg',
                fileName: `${(result.title || vid.title || 'audio').slice(0, 60)}.mp3`,
            }, { quoted: m });
            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        } catch(e) {
            await sock.sendMessage(m.chat, { react: { text: '💥', key: m.key } });
            reply(`💥 *play2 failed:* _${e.message.split('\n')[0]}_\n\n${sig()}`);
        }
    },
},

// ── .plays — send multiple songs
{
    command: 'plays', category: 'audio', description: 'Send multiple songs',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`🎶 *Usage:* .plays <query>  or  .plays 3 <query>\n\n${sig()}`);
        const nm = text.match(/^(\d)\s+/);
        const count = nm ? Math.min(5, +nm[1]) : 4;
        const q = nm ? text.slice(nm[0].length) : text;
        await sock.sendMessage(m.chat, { react: { text: '🎵', key: m.key } });
        try {
            const vids = (await yts(q)).videos?.slice(0, count);
            if (!vids?.length) throw new Error('No results');
            await reply(`🎶 *${vids.length} songs found* — downloading...\n\n${vids.map((v,i)=>`${i+1}. ${v.title}`).join('\n')}\n\n${sig()}`);
            let sent = 0, fail = 0;
            for (const [i, vid] of vids.entries()) {
                try {
                    const res = await dlAudio(vid.url);
                    await sock.sendMessage(m.chat, {
                        audio: { url: res.url }, mimetype: 'audio/mpeg',
                        fileName: `${(res.title || vid.title).slice(0,60)}.mp3`,
                    }, { quoted: m });
                    sent++;
                    if (i < vids.length - 1) await new Promise(r => setTimeout(r, 1200));
                } catch(e) { fail++; }
            }
            await sock.sendMessage(m.chat, { react: { text: sent ? '✅' : '❌', key: m.key } });
            reply(`${sent ? '✅' : '❌'} *Done:* ${sent}/${vids.length} sent${fail ? `, ${fail} failed` : ''}\n\n${sig()}`);
        } catch(e) {
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply(`❌ ${e.message}\n\n${sig()}`);
        }
    },
},
];
