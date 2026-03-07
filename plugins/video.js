const yts = require('yt-search');
const axios = require('axios');
module.exports = {
    command: 'video', description: 'Download a YouTube video', category: 'downloader',
    execute: async (sock, m, { text, prefix, reply }) => {
        if (!text) return reply(`🎬 Usage: *${prefix}video <title>*`);
        await sock.sendMessage(m.chat, { react: { text: '🎬', key: m.key } });
        try {
            const { videos } = await yts(text);
            if (!videos?.length) return reply('❌ Video not found!');
            const v = videos[0];
            await reply(`⬇️ Downloading: *${v.title}*\n⏱️ ${v.timestamp}`);
            const { data } = await axios.get(`https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(v.url)}`);
            if (!data?.video) return reply('🚫 Video download unavailable. Try .play for audio!');
            await sock.sendMessage(m.chat, {
                video: { url: data.video }, caption: `🎬 *${data.title || v.title}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 Bot`
            }, { quoted: m });
            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        } catch (e) { reply('💥 Error: ' + e.message); }
    }
};
