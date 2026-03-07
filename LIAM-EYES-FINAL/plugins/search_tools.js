// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// LIAM EYES — SEARCH TOOLS (7 commands)
// define, define2, imdb, lyrics, shazam, weather, yts
'use strict';
const axios  = require('axios');
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

module.exports = [

  { command:'define', category:'search',
    execute: async (sock,m,{text,reply}) => {
      if(!text) return reply(`❓ Usage: *.define <word>*\n\n${sig()}`);
      await react(sock,m,'📖');
      try {
        const {data} = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text)}`,{timeout:10000});
        const entry = data[0]; const meaning = entry.meanings[0];
        const def = meaning.definitions[0];
        reply(`📖 *${entry.word}*\n━━━━━━━━━━━━━━━\n🏷️ *Part of speech:* ${meaning.partOfSpeech}\n\n📝 *Definition:*\n${def.definition}${def.example?'\n\n💬 *Example:*\n"'+def.example+'"':''}\n${entry.phonetics?.[0]?.text?'\n🔊 *Phonetic:* '+entry.phonetics[0].text:''}\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch(e){await react(sock,m,'❌');reply(`❌ Definition not found for *${text}*\n\n${sig()}`);}
    }
  },

  { command:'define2', category:'search',
    execute: async (sock,m,{text,reply}) => {
      if(!text) return reply(`❓ Usage: *.define2 <word>*\n_Alternative dictionary_\n\n${sig()}`);
      await react(sock,m,'📚');
      try {
        const {data} = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text)}`,{timeout:10000});
        const entry = data[0];
        const allMeanings = entry.meanings.slice(0,3).map(m2=>
          `*${m2.partOfSpeech}:*\n${m2.definitions.slice(0,2).map((d,i)=>`  ${i+1}. ${d.definition}`).join('\n')}`
        ).join('\n\n');
        const synonyms = entry.meanings[0]?.definitions[0]?.synonyms?.slice(0,5).join(', ') || '';
        reply(`📚 *${entry.word}* — Extended Definition\n━━━━━━━━━━━━━━━\n${allMeanings}${synonyms?'\n\n🔗 *Synonyms:* '+synonyms:''}\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch{await react(sock,m,'❌');reply(`❌ Word *${text}* not found\n\n${sig()}`);}
    }
  },

  { command:'weather', category:'search',
    execute: async (sock,m,{text,reply}) => {
      if(!text) return reply(`❓ Usage: *.weather <city>*\nExample: *.weather Nairobi*\n\n${sig()}`);
      await react(sock,m,'🌤️');
      try {
        const {data} = await axios.get(`https://wttr.in/${encodeURIComponent(text)}?format=j1`,{timeout:12000});
        const c = data.current_condition[0];
        const a = data.nearest_area[0];
        const city = a.areaName[0]?.value || text;
        const country = a.country[0]?.value || '';
        const desc = c.weatherDesc[0]?.value || '';
        const temp = c.temp_C; const feels = c.FeelsLikeC;
        const humid = c.humidity; const wind = c.windspeedKmph;
        const emoji = temp>30?'🌡️':temp>20?'🌤️':temp>10?'🌥️':'❄️';
        reply(`${emoji} *Weather — ${city}, ${country}*\n━━━━━━━━━━━━━━━━━━\n🌡️ Temp: *${temp}°C* (feels ${feels}°C)\n☁️ Condition: *${desc}*\n💧 Humidity: *${humid}%*\n💨 Wind: *${wind} km/h*\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch{await react(sock,m,'❌');reply(`❌ Weather not found for *${text}*\n\n${sig()}`);}
    }
  },

  { command:'lyrics', category:'search',
    execute: async (sock,m,{text,reply}) => {
      if(!text) return reply(`❓ Usage: *.lyrics <song name>*\n\n${sig()}`);
      await react(sock,m,'🎶');
      try {
        const {data} = await axios.get(`https://api.lyrics.ovh/suggest/${encodeURIComponent(text)}`,{timeout:10000});
        const song = data.data?.[0];
        if(!song) throw new Error('No results');
        const {data:ld} = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(song.artist.name)}/${encodeURIComponent(song.title)}`,{timeout:15000});
        const excerpt = (ld.lyrics||'').slice(0,1500);
        reply(`🎶 *${song.title}*\n👤 ${song.artist.name}\n━━━━━━━━━━━━━━━━\n${excerpt}${ld.lyrics?.length>1500?'\n\n_...lyrics truncated_':''}\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch{await react(sock,m,'❌');reply(`❌ Lyrics not found for *${text}*\n\n${sig()}`);}
    }
  },

  { command:'imdb', category:'search',
    execute: async (sock,m,{text,reply}) => {
      if(!text) return reply(`❓ Usage: *.imdb <movie/show name>*\n\n${sig()}`);
      await react(sock,m,'🎬');
      try {
        const {data} = await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(text)}&apikey=trilogy&plot=short`,{timeout:10000});
        if(data.Response==='False') throw new Error(data.Error||'Not found');
        reply(`🎬 *${data.Title}* (${data.Year})\n━━━━━━━━━━━━━━━━\n🎭 *Genre:* ${data.Genre}\n⭐ *Rating:* ${data.imdbRating}/10 (${data.imdbVotes} votes)\n⏱️ *Runtime:* ${data.Runtime}\n👥 *Director:* ${data.Director}\n🌟 *Cast:* ${data.Actors}\n🌍 *Country:* ${data.Country}\n\n📝 *Plot:*\n${data.Plot}\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch(e){await react(sock,m,'❌');reply(`❌ Movie not found: ${e.message}\n\n${sig()}`);}
    }
  },

  { command:'shazam', category:'search',
    execute: async (sock,m,{reply}) => {
      const q = m.quoted;
      if(!q) return reply(`❗ *Reply to an audio message to identify the song!*\n\n${sig()}`);
      await react(sock,m,'🎵');
      reply(`🎵 *Shazam — Song Detection*\n\n_Audio fingerprinting requires a paid Shazam API key._\n_Try using the Shazam app directly on your device._\n\n📱 Download: shazam.com\n\n${sig()}`);
    }
  },

  { command:'yts', category:'search',
    execute: async (sock,m,{text,reply}) => {
      if(!text) return reply(`❓ Usage: *.yts <search term>*\n\n${sig()}`);
      await react(sock,m,'🔍');
      try {
        // Use Invidious API — fast, no key needed, multiple fallback instances
        const instances = [
          'https://invidious.snopyta.org',
          'https://yewtu.be',
          'https://vid.puffyan.us',
          'https://invidious.kavin.rocks'
        ];
        let results = null;
        for (const inst of instances) {
          try {
            const {data} = await axios.get(
              `${inst}/api/v1/search?q=${encodeURIComponent(text)}&type=video&fields=title,videoId,author,lengthSeconds,viewCount`,
              { timeout: 8000 }
            );
            if (Array.isArray(data) && data.length > 0) { results = data.slice(0,5); break; }
          } catch(_) {}
        }
        if (!results) {
          // Final fallback to yt-search
          const ytsr = require('yt-search');
          const res = await ytsr(text, {});
          results = res.videos.slice(0,5).map(v => ({
            title: v.title, videoId: v.videoId || v.url.split('v=')[1],
            author: v.author?.name || '?',
            lengthSeconds: 0, viewCount: v.views || 0, _ytsr: v
          }));
        }
        if (!results?.length) throw new Error('No results');
        const fmt = s => s >= 3600 ? `${~~(s/3600)}h${~~(s%3600/60)}m` : s >= 60 ? `${~~(s/60)}m${s%60}s` : s + 's';
        const list = results.map((v,i) => {
          const vid   = v.videoId || (v._ytsr?.url?.split('v=')[1]);
          const url   = `https://youtu.be/${vid}`;
          const dur   = v.lengthSeconds ? fmt(v.lengthSeconds) : (v._ytsr?.timestamp || '?');
          const views = (v.viewCount||v._ytsr?.views||0).toLocaleString();
          return `*${i+1}.* ${v.title}\n   ⏱️ ${dur} • 👁️ ${views}\n   🔗 ${url}`;
        }).join('\n\n');
        reply(`🔍 *YouTube: ${text}*\n━━━━━━━━━━━━━━━━\n${list}\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch(e){await react(sock,m,'❌');reply(`❌ YT search failed: ${e.message}\n\n${sig()}`);}
    }
  },

];
