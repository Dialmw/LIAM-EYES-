const yts = require('yt-search');
const axios = require('axios');
module.exports = {
    command: 'song', description: 'Download a song as MP3', category: 'downloader',
    execute: async (sock, m, { text, prefix, reply }) => {
        if (!text) return reply(`🎵 Usage: *${prefix}song <song name>*`);
        await sock.sendMessage(m.chat, { react: { text: '🎵', key: m.key } });
        try {
            const { videos } = await yts(text);
            if (!videos?.length) return reply('❌ Song not found!');
            const v = videos[0];
            await reply(`⬇️ Downloading: *${v.title}*\n⏱️ ${v.timestamp}`);
            const { data } = await axios.get(`https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(v.url)}`);
            if (!data?.audio) return reply('🚫 Download failed. Try again!');
            await sock.sendMessage(m.chat, {
                audio: { url: data.audio }, mimetype: 'audio/mpeg',
                fileName: `${(data.title || v.title).substring(0, 50)}.mp3`
            }, { quoted: m });
            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        } catch (e) { reply('💥 Error: ' + e.message); }
    }
};
