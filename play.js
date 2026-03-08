const yts = require('yt-search');
const axios = require('axios');
module.exports = {
    command: 'play', description: 'Play/search music from YouTube', category: 'downloader',
    execute: async (sock, m, { text, prefix, reply, sender }) => {
        if (!text) return reply(`🎧 *LIAM EYES MUSIC*\n\nUsage: *${prefix}play <song name>*\nExample: *${prefix}play faded alan walker*`);
        await sock.sendMessage(m.chat, { react: { text: '🎶', key: m.key } });
        let proc = await sock.sendMessage(m.chat, { text: `🔍 Searching: _"${text}"_...` }, { quoted: m });
        try {
            const { videos } = await yts(text);
            if (!videos?.length) return reply('❌ No results found. Try different keywords!');
            const v = videos[0];
            await sock.sendMessage(m.chat, { text: `✅ Found: *${v.title}*\n⏱️ ${v.timestamp} | ⬇️ Downloading...`, edit: proc.key });
            await sock.sendMessage(m.chat, { react: { text: '⬇️', key: m.key } });
            const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(v.url)}`;
            const { data } = await axios.get(apiUrl);
            if (!data?.status || !data.audio) return reply('🚫 Download service unavailable. Try again!');
            await sock.sendMessage(m.chat, { text: `🎉 Ready! *${data.title || v.title}*\n🎶 Sending now...`, edit: proc.key });
            await sock.sendMessage(m.chat, {
                audio: { url: data.audio }, mimetype: 'audio/mpeg',
                fileName: `${(data.title || v.title).substring(0, 50)}.mp3`
            }, { quoted: m });
            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        } catch (e) { await reply('💥 Error: ' + e.message); }
    }
};
