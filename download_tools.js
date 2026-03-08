// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — DOWNLOAD TOOLS  (20 commands)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('../settings/config');

const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const API  = config.api.baseurl;
const ctxAd = (title, body) => ({ externalAdReply: {
    title, body, thumbnailUrl: config.thumbUrl,
    sourceUrl: config.pairingSite, mediaType: 1, renderLargerThumbnail: false,
}});

const react = (sock, m, e) => sock.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {});

// Generic downloader via API
const dlAPI = async (endpoint, params) => {
    const { data } = await axios.get(`${API}/${endpoint}`, { params, timeout: 25000 });
    return data;
};

module.exports = [

    // ── .tiktok ──────────────────────────────────────────────────────────────
    {
        command: 'tiktok', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.tiktok <url>*\n\n${sig()}`);
            await react(sock, m, '⬇️');
            try {
                const { data } = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`, { timeout: 20000 });
                if (!data?.data?.play) throw new Error('Could not fetch video');
                const d = data.data;
                await sock.sendMessage(m.chat, {
                    video: { url: d.play },
                    caption: `🎵 *${d.title || 'TikTok Video'}*\n👤 *@${d.author?.unique_id || '?'}*\n❤️ ${d.digg_count || 0}  💬 ${d.comment_count || 0}\n\n${sig()}`,
                    contextInfo: ctxAd('𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — TikTok', '⬇️ Downloaded by LIAM EYES'),
                }, { quoted: m });
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ TikTok failed: ${e.message}\n\n${sig()}`); }
        }
    },

    // ── .tiktokaudio ─────────────────────────────────────────────────────────
    {
        command: 'tiktokaudio', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.tiktokaudio <url>*\n\n${sig()}`);
            await react(sock, m, '🎵');
            try {
                const { data } = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(text)}`, { timeout: 20000 });
                if (!data?.data?.music) throw new Error('No audio found');
                const d = data.data;
                await sock.sendMessage(m.chat, {
                    audio: { url: d.music },
                    mimetype: 'audio/mpeg',
                    contextInfo: ctxAd('𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — TikTok Audio', d.music_info?.title || 'Audio'),
                }, { quoted: m });
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ Failed: ${e.message}\n\n${sig()}`); }
        }
    },

    // ── .instagram ───────────────────────────────────────────────────────────
    {
        command: 'instagram', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.instagram <url>*\n\n${sig()}`);
            await react(sock, m, '📸');
            try {
                const { data } = await axios.get(`https://instagram-downloader-api1.p.rapidapi.com/index?url=${encodeURIComponent(text)}`,
                    { headers: { 'X-RapidAPI-Host': 'instagram-downloader-api1.p.rapidapi.com', 'X-RapidAPI-Key': 'SIGN-UP-FOR-KEY' }, timeout: 20000 });
                const url = data?.media?.[0]?.url || data?.result?.[0]?.url;
                if (!url) throw new Error('No media found — check URL');
                const isVideo = (url.includes('.mp4') || data?.media?.[0]?.type === 'video');
                if (isVideo) {
                    await sock.sendMessage(m.chat, { video: { url }, caption: `📸 Instagram Video\n\n${sig()}` }, { quoted: m });
                } else {
                    await sock.sendMessage(m.chat, { image: { url }, caption: `📸 Instagram Image\n\n${sig()}` }, { quoted: m });
                }
                await react(sock, m, '✅');
            } catch (e) {
                await react(sock, m, '❌');
                reply(`❌ Instagram download failed: ${e.message}\n\n_Tip: Make sure the post is public_\n\n${sig()}`);
            }
        }
    },

    // ── .facebook ────────────────────────────────────────────────────────────
    {
        command: 'facebook', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.facebook <url>*\n\n${sig()}`);
            await react(sock, m, '📘');
            try {
                const { data } = await axios.get(`https://fb-video-downloader2.p.rapidapi.com/facebook?url=${encodeURIComponent(text)}`,
                    { headers: { 'X-RapidAPI-Host': 'fb-video-downloader2.p.rapidapi.com', 'X-RapidAPI-Key': 'free' }, timeout: 20000 });
                const url = data?.hd || data?.sd || data?.links?.[0]?.url;
                if (!url) throw new Error('No video found');
                await sock.sendMessage(m.chat, { video: { url }, caption: `📘 Facebook Video\n\n${sig()}` }, { quoted: m });
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ FB download failed: ${e.message}\n\n${sig()}`); }
        }
    },

    // ── .twitter ─────────────────────────────────────────────────────────────
    {
        command: 'twitter', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.twitter <tweet url>*\n\n${sig()}`);
            await react(sock, m, '🐦');
            try {
                const { data } = await axios.get(`https://twittervid.com/api/ajaxSearch?q=${encodeURIComponent(text)}`, { timeout: 20000 });
                const url = data?.data?.[0]?.url || data?.result?.[0]?.url;
                if (!url) throw new Error('No video in this tweet');
                await sock.sendMessage(m.chat, { video: { url }, caption: `🐦 Twitter Video\n\n${sig()}` }, { quoted: m });
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ Twitter DL failed: ${e.message}\n\n${sig()}`); }
        }
    },

    // ── .youtube / .song / .song2 / .video / .videodoc ───────────────────────
    {
        command: 'song', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.song <name or URL>*\nExample: _.song Ni wewe Hillsong_\n\n${sig()}`);
            await react(sock, m, '🎵');
            try {
                const ytsr = require('yt-search');
                const res  = await ytsr(text);
                const vid  = res.videos[0];
                if (!vid) throw new Error('No results found');
                const dlUrl = `https://api.fabdl.com/youtube/get?url=${encodeURIComponent(vid.url)}&type=mp3`;
                const { data } = await axios.get(dlUrl, { timeout: 25000 });
                const audioUrl = data?.download_url || data?.url || data?.link;
                if (!audioUrl) throw new Error('Could not get download link');
                await sock.sendMessage(m.chat, {
                    audio: { url: audioUrl }, mimetype: 'audio/mpeg',
                    contextInfo: ctxAd(`🎵 ${vid.title}`, `👤 ${vid.author?.name || '?'} • ⏱️ ${vid.timestamp}`),
                }, { quoted: m });
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ Song download failed: ${e.message}\n\n${sig()}`); }
        }
    },
    {
        command: 'song2', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.song2 <name>*\n\n${sig()}`);
            await react(sock, m, '🎵');
            try {
                const { data } = await axios.get(`https://api.simsimi.vn/v1/youtube/mp3?q=${encodeURIComponent(text)}`, { timeout: 25000 });
                const url = data?.url || data?.link;
                if (!url) throw new Error('Not found');
                await sock.sendMessage(m.chat, { audio: { url }, mimetype: 'audio/mpeg' }, { quoted: m });
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ song2 failed: ${e.message}\n\n${sig()}`); }
        }
    },
    {
        command: 'video', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.video <name or URL>*\n\n${sig()}`);
            await react(sock, m, '🎬');
            try {
                const ytsr = require('yt-search');
                const res  = await ytsr(text);
                const vid  = res.videos[0];
                if (!vid) throw new Error('No results');
                const dlUrl = `https://api.fabdl.com/youtube/get?url=${encodeURIComponent(vid.url)}&type=mp4`;
                const { data } = await axios.get(dlUrl, { timeout: 25000 });
                const videoUrl = data?.download_url || data?.url;
                if (!videoUrl) throw new Error('No download link');
                await sock.sendMessage(m.chat, {
                    video: { url: videoUrl },
                    caption: `🎬 *${vid.title}*\n👤 ${vid.author?.name}\n\n${sig()}`,
                    contextInfo: ctxAd('𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — Video', vid.title),
                }, { quoted: m });
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ Video DL failed: ${e.message}\n\n${sig()}`); }
        }
    },
    {
        command: 'videodoc', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.videodoc <name or URL>*\n_Sends video as document file_\n\n${sig()}`);
            await react(sock, m, '📄');
            try {
                const ytsr = require('yt-search');
                const res  = await ytsr(text);
                const vid  = res.videos[0];
                if (!vid) throw new Error('No results');
                const dlUrl = `https://api.fabdl.com/youtube/get?url=${encodeURIComponent(vid.url)}&type=mp4`;
                const { data } = await axios.get(dlUrl, { timeout: 25000 });
                const videoUrl = data?.download_url || data?.url;
                if (!videoUrl) throw new Error('No link');
                const { data: vbuf } = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 60000 });
                await sock.sendMessage(m.chat, {
                    document: Buffer.from(vbuf), filename: `${(vid.title || 'video').slice(0,40)}.mp4`,
                    mimetype: 'video/mp4', caption: `📄 *${vid.title}*\n\n${sig()}`,
                }, { quoted: m });
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ Failed: ${e.message}\n\n${sig()}`); }
        }
    },

    // ── .image — download image from URL ──────────────────────────────────────
    {
        command: 'image', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.image <url or search term>*\n\n${sig()}`);
            await react(sock, m, '🖼️');
            try {
                // Try as direct URL first
                let url = text;
                if (!text.startsWith('http')) {
                    const { data } = await axios.get(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(text)}&client_id=free`, { timeout: 10000 });
                    url = data?.urls?.regular || `https://source.unsplash.com/800x600/?${encodeURIComponent(text)}`;
                }
                await sock.sendMessage(m.chat, { image: { url }, caption: `🖼️ *Image*\n\n${sig()}` }, { quoted: m });
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ Image failed: ${e.message}\n\n${sig()}`); }
        }
    },

    // ── .apk — search APK ────────────────────────────────────────────────────
    {
        command: 'apk', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.apk <app name>*\nExample: _.apk WhatsApp_\n\n${sig()}`);
            await react(sock, m, '📱');
            try {
                const q = encodeURIComponent(text);
                const url = `https://apkpure.com/search?q=${q}`;
                reply(`📱 *APK Search: ${text}*\n\nVisit: ${url}\n\n⚠️ _Only download APKs from trusted sources!_\n\n${sig()}`);
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ APK search failed\n\n${sig()}`); }
        }
    },

    // ── .gdrive ───────────────────────────────────────────────────────────────
    {
        command: 'gdrive', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.gdrive <google drive url>*\n\n${sig()}`);
            await react(sock, m, '📁');
            try {
                const match = text.match(/[-\w]{25,}/);
                if (!match) throw new Error('Invalid Google Drive URL');
                const id  = match[0];
                const url = `https://drive.google.com/uc?export=download&id=${id}`;
                reply(`📁 *Google Drive Download*\n\nDirect link:\n${url}\n\n_Tap the link to download_\n\n${sig()}`);
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ GDrive error: ${e.message}\n\n${sig()}`); }
        }
    },

    // ── .gitclone ─────────────────────────────────────────────────────────────
    {
        command: 'gitclone', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.gitclone <github url>*\n\n${sig()}`);
            await react(sock, m, '🐙');
            try {
                const match = text.match(/github\.com\/([^/]+)\/([^/\s?]+)/);
                if (!match) throw new Error('Invalid GitHub URL');
                const [, user, repo] = match;
                const zipUrl = `https://github.com/${user}/${repo}/archive/refs/heads/main.zip`;
                const { data } = await axios.get(`https://api.github.com/repos/${user}/${repo}`, { timeout: 10000 });
                reply(`🐙 *GitHub Repo: ${data.full_name}*\n\n` +
                    `⭐ Stars: ${data.stargazers_count}\n🍴 Forks: ${data.forks_count}\n📝 ${data.description || 'No description'}\n\n` +
                    `📦 Download ZIP:\n${zipUrl}\n\n${sig()}`);
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ GitHub error: ${e.message}\n\n${sig()}`); }
        }
    },

    // ── .itunes ───────────────────────────────────────────────────────────────
    {
        command: 'itunes', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.itunes <song name>*\n\n${sig()}`);
            await react(sock, m, '🍎');
            try {
                const { data } = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(text)}&entity=song&limit=5`, { timeout: 10000 });
                if (!data.results?.length) throw new Error('No results');
                const results = data.results.slice(0, 5).map((r, i) =>
                    `*${i+1}.* ${r.trackName} — ${r.artistName}\n   💿 ${r.collectionName} (${new Date(r.releaseDate).getFullYear()})\n   🎵 Preview: ${r.previewUrl}`
                ).join('\n\n');
                reply(`🍎 *iTunes Results for: ${text}*\n\n${results}\n\n${sig()}`);
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ iTunes search failed: ${e.message}\n\n${sig()}`); }
        }
    },

    // ── .mediafire ────────────────────────────────────────────────────────────
    {
        command: 'mediafire', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.mediafire <mediafire url>*\n\n${sig()}`);
            await react(sock, m, '🗂️');
            try {
                const { data } = await axios.get(`https://www.mediafire.com/api/1.5/file/get_info.php?quick_key=${text.split('/').filter(Boolean).pop()}&response_format=json`, { timeout: 15000 });
                const file = data?.response?.file_info;
                if (!file) throw new Error('File not found');
                reply(`🗂️ *MediaFire File*\n\n📄 Name: ${file.filename}\n📦 Size: ${(file.size/1024/1024).toFixed(2)} MB\n\n⬇️ Download: ${file.links?.normal_download}\n\n${sig()}`);
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ MediaFire error: ${e.message}\n\n${sig()}`); }
        }
    },

    // ── .pin ─────────────────────────────────────────────────────────────────
    {
        command: 'pin', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.pin <pinterest url or search>*\n\n${sig()}`);
            await react(sock, m, '📌');
            try {
                // Use Pinterest image via search
                const q = encodeURIComponent(text.startsWith('http') ? 'pinterest image' : text);
                const url = `https://i.pinimg.com/originals/${Math.random().toString(36).slice(2,8)}.jpg`;
                const imgUrl = `https://source.unsplash.com/800x600/?${q}`;
                await sock.sendMessage(m.chat, { image: { url: imgUrl }, caption: `📌 *Pinterest Style*\n🔍 ${text}\n\n${sig()}` }, { quoted: m });
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ Pinterest failed: ${e.message}\n\n${sig()}`); }
        }
    },

    // ── .savestatus ───────────────────────────────────────────────────────────
    {
        command: 'savestatus', category: 'download',
        execute: async (sock, m, { reply }) => {
            const q = m.quoted;
            if (!q) return reply(`❗ *Reply to a status to save it!*\n\n${sig()}`);
            await react(sock, m, '💾');
            try {
                const buf  = await sock.downloadMediaMessage(q);
                const mime = (q.msg || q).mimetype || '';
                if (mime.includes('video'))
                    await sock.sendMessage(m.chat, { video: buf, caption: `✅ *Status saved!*\n\n${sig()}` }, { quoted: m });
                else if (mime.includes('audio'))
                    await sock.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mp4' }, { quoted: m });
                else
                    await sock.sendMessage(m.chat, { image: buf, caption: `✅ *Status saved!*\n\n${sig()}` }, { quoted: m });
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ Failed: ${e.message}\n\n${sig()}`); }
        }
    },

    // ── .telesticker ─────────────────────────────────────────────────────────
    {
        command: 'telesticker', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.telesticker <telegram sticker pack url>*\n\n${sig()}`);
            await react(sock, m, '🎭');
            reply(`🎭 *Telegram Sticker Download*\n\nPack URL: ${text}\n\n_Direct Telegram sticker download requires Telegram API access._\n_Use @Sticker bot on Telegram to export packs._\n\n${sig()}`);
            await react(sock, m, 'ℹ️');
        }
    },

    // ── .xvideos ─────────────────────────────────────────────────────────────
    {
        command: 'xvideos', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.xvideos <url>*\n\n${sig()}`);
            await react(sock, m, '🔞');
            // Owner/admin only for this one
            reply(`⚠️ *Adult content download is disabled for safety.*\n\n_Use .mode private if needed, and only on personal chats._\n\n${sig()}`);
        }
    },

    // ── .download ────────────────────────────────────────────────────────────
    {
        command: 'download', category: 'download',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.download <url>*\n_Downloads any direct file URL_\n\n${sig()}`);
            await react(sock, m, '⬇️');
            try {
                const { data, headers } = await axios.get(text, { responseType: 'arraybuffer', timeout: 30000 });
                const mime = headers['content-type'] || 'application/octet-stream';
                const ext  = mime.split('/')[1]?.split(';')[0] || 'bin';
                const fname = `download_${Date.now()}.${ext}`;
                if (mime.includes('image')) {
                    await sock.sendMessage(m.chat, { image: Buffer.from(data), caption: `⬇️ Downloaded\n\n${sig()}` }, { quoted: m });
                } else if (mime.includes('video')) {
                    await sock.sendMessage(m.chat, { video: Buffer.from(data), caption: `⬇️ Downloaded\n\n${sig()}` }, { quoted: m });
                } else if (mime.includes('audio')) {
                    await sock.sendMessage(m.chat, { audio: Buffer.from(data), mimetype: mime }, { quoted: m });
                } else {
                    await sock.sendMessage(m.chat, { document: Buffer.from(data), filename: fname, mimetype: mime, caption: `⬇️ Downloaded\n\n${sig()}` }, { quoted: m });
                }
                await react(sock, m, '✅');
            } catch (e) { await react(sock, m, '❌'); reply(`❌ Download failed: ${e.message}\n\n${sig()}`); }
        }
    },

];
