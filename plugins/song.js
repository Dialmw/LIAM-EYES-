'use strict';
const { dlAudio } = require('../library/dl');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

module.exports = [
{
    command:'song', category:'audio', description:'Download song (alias for play)',
    execute: async (sock, m, ctx) => {
        const pl = [].concat(require('./play')).find(p => p.command === 'play');
        return pl?.execute(sock, m, ctx);
    }
},
{
    command:'ytmp3', category:'audio', description:'Download audio from YouTube URL',
    execute: async (sock, m, { text, prefix, reply }) => {
        if (!text) return reply(`🎵 *Usage:* ${prefix}ytmp3 <YouTube URL>\n\n${sig()}`);
        await sock.sendMessage(m.chat, { react:{ text:'⬇️', key:m.key } });
        try {
            const result = await dlAudio(text);
            await sock.sendMessage(m.chat, {
                audio:{ url:result.url }, mimetype:'audio/mpeg',
                fileName:`${(result.title||'audio').slice(0,60)}.mp3`,
            }, { quoted:m });
            await sock.sendMessage(m.chat, { react:{ text:'✅', key:m.key } });
        } catch(e) {
            await sock.sendMessage(m.chat, { react:{ text:'❌', key:m.key } });
            reply(`💥 ytmp3 failed: _${e.message.split('\n')[0]}_\n\n${sig()}`);
        }
    }
},
];
