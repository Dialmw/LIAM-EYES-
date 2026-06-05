// ═══════════════════════════════════════════════════════════════════════════
// ║  LIAM EYES — download_tools.js  (all free APIs, no keys needed)       ║
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('../settings/config');

const sig    = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react  = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});
const UA     = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0';
const ctxAd  = (title, body) => ({ externalAdReply:{
    title, body, thumbnailUrl: config.thumbUrl,
    sourceUrl: config.pairingSite, mediaType:1
}});

// ── Universal social-media downloader (free, multi-endpoint fallback) ─────
const socDL = async (url) => {
    const enc = encodeURIComponent(url);
    const endpoints = [
        () => axios.get(`https://api.ryzendesu.vip/api/downloader/igdl?url=${enc}`,{timeout:18000}),
        () => axios.get(`https://api.tiklydown.eu.org/api/download?url=${enc}`,{timeout:18000}),
        () => axios.get(`https://api.cobalt.tools/api/json`,{method:'POST',
              data:JSON.stringify({url,isAudioOnly:false}),
              headers:{'Content-Type':'application/json','Accept':'application/json'},timeout:18000}),
        () => axios.post(`https://api.cobalt.tools/api/json`,
              {url,isAudioOnly:false},
              {headers:{'Content-Type':'application/json','Accept':'application/json'},timeout:18000}),
    ];
    const errs=[];
    for (const fn of endpoints) {
        try {
            const r = await fn();
            const d = r.data;
            // Extract media URL from various response shapes
            const media = d?.url || d?.data?.[0]?.url || d?.result?.[0]?.url ||
                          d?.media?.[0]?.url || d?.video || d?.audio ||
                          (Array.isArray(d?.data) ? d.data[0]?.url : null);
            if (media) return { url:media, title: d?.title||d?.data?.[0]?.title||'media',
                                thumb: d?.thumbnail||d?.cover||d?.data?.[0]?.thumb||'' };
        } catch(e){ errs.push(e.message); }
    }
    throw new Error(`All DL endpoints failed: ${errs[0]||'unknown'}`);
};

// ── Instagram downloader (multi-API, 6 fallbacks) ────────────────────────
const igDL = async (url) => {
    const enc = encodeURIComponent(url);

    const extractItems = (data) => {
        const candidates = [
            data?.data?.result, data?.data, data?.result, data?.media,
            data?.items, data?.carousel_media,
            data?.url ? [{ url: data.url, type: 'video' }] : null,
        ];
        for (const c of candidates) {
            if (Array.isArray(c) && c.length) {
                const items = c.map(i => ({
                    url:  i?.url || i?.download_url || i?.video_url || i?.image_url || (typeof i === 'string' ? i : null),
                    type: i?.type || (i?.video_url ? 'video' : 'image'),
                    thumb: i?.thumbnail || i?.display_url || '',
                })).filter(i => i.url);
                if (items.length) return items;
            }
        }
        return null;
    };

    const apis = [
        // Primary — reliable free APIs 2025
        () => axios.get(`https://api.ryzendesu.vip/api/downloader/igdl?url=${enc}`,          { headers:{'User-Agent':UA}, timeout:18000 }),
        () => axios.get(`https://instaloader.app/api/download?url=${enc}`,                    { headers:{'User-Agent':UA}, timeout:18000 }),
        () => axios.get(`https://api.vreden.my.id/api/igdl?url=${enc}`,                       { headers:{'User-Agent':UA}, timeout:18000 }),
        () => axios.get(`https://saveig.app/api?url=${enc}`,                                  { headers:{'User-Agent':UA}, timeout:18000 }),
        () => axios.post(`https://api.cobalt.tools/api/json`,
                         { url, isAudioOnly: false },
                         { headers:{'Content-Type':'application/json','Accept':'application/json'}, timeout:18000 }),
        // scraper fallback
        () => axios.get(`https://igram.world/api/ig/info/?url=${enc}&ts=${Date.now()}`,       { headers:{'User-Agent':UA,'Referer':'https://igram.world/'}, timeout:18000 }),
    ];

    for (const fn of apis) {
        try {
            const r = await fn();
            const d = r.data;
            // Cobalt returns direct url
            if (d?.url) return [{ url: d.url, type: d.url.includes('.mp4') ? 'video' : 'image', thumb: '' }];
            const items = extractItems(d);
            if (items?.length) return items;
        } catch (_) {}
    }
    throw new Error('Instagram download failed — post may be private or all APIs are down');
};

// ── Facebook downloader ───────────────────────────────────────────────────
const fbDL = async (url) => {
    const enc = encodeURIComponent(url);
    const apis = [
        `https://api.tiklydown.eu.org/api/download?url=${enc}`,
        `https://api.ryzendesu.vip/api/downloader/fbdl?url=${enc}`,
        `https://api.vreden.my.id/api/fbdl?url=${enc}`,
    ];
    for (const api of apis) {
        try {
            const {data} = await axios.get(api,{headers:{'User-Agent':UA},timeout:18000});
            const u = data?.data?.hd||data?.data?.sd||data?.hd||data?.sd||data?.url||data?.result?.[0]?.url||data?.data?.[0]?.url;
            if (u) return u;
        } catch(_) {}
    }
    throw new Error('Facebook download failed — video may be private');
};

// ── Twitter/X downloader ──────────────────────────────────────────────────
const twDL = async (url) => {
    const enc = encodeURIComponent(url);
    const apis = [
        `https://api.tiklydown.eu.org/api/download?url=${enc}`,
        `https://api.ryzendesu.vip/api/downloader/twitter?url=${enc}`,
        `https://api.vreden.my.id/api/twitterdl?url=${enc}`,
        `https://twitsave.com/info?url=${enc}`,
    ];
    for (const api of apis) {
        try {
            const {data} = await axios.get(api,{headers:{'User-Agent':UA},timeout:18000});
            const u = data?.data?.[0]?.url || data?.url || data?.result?.[0]?.url ||
                      data?.videos?.[0]?.url || data?.media?.[0]?.url;
            if (u) return u;
        } catch(_) {}
    }
    throw new Error('Twitter/X download failed — tweet may have no video');
};

module.exports = [

// ── .tiktok ───────────────────────────────────────────────────────────────
{
    command:'tiktok', category:'download',
    execute: async (sock,m,{text,reply}) => {
        if (!text) return reply(`❓ *.tiktok <url>*\n\n${sig()}`);
        await react(sock,m,'⬇️');
        try {
            const {data} = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`,{timeout:20000});
            if (!data?.data?.play) throw new Error('No video found');
            const d = data.data;
            await sock.sendMessage(m.chat,{
                video:{url:d.play},
                caption:`🎵 *${d.title||'TikTok'}*\n👤 @${d.author?.unique_id||'?'}\n❤️ ${d.digg_count||0}  💬 ${d.comment_count||0}\n\n${sig()}`,
                contextInfo: ctxAd('LIAM EYES — TikTok','⬇️ Downloaded')
            },{quoted:m});
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ TikTok failed: ${e.message}\n\n${sig()}`); }
    }
},

// ── .tiktokaudio ──────────────────────────────────────────────────────────
{
    command:'tiktokaudio', category:'download',
    execute: async (sock,m,{text,reply}) => {
        if (!text) return reply(`❓ *.tiktokaudio <url>*\n\n${sig()}`);
        await react(sock,m,'🎵');
        try {
            const {data} = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(text)}`,{timeout:20000});
            if (!data?.data?.music) throw new Error('No audio found');
            const d = data.data;
            await sock.sendMessage(m.chat,{audio:{url:d.music},mimetype:'audio/mpeg'},{quoted:m});
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ Failed: ${e.message}\n\n${sig()}`); }
    }
},

// ── .instagram ────────────────────────────────────────────────────────────
{
    command:'instagram', category:'download',
    execute: async (sock,m,{text,reply}) => {
        if (!text) return reply(`❓ *.instagram <url>*\n_Only public posts/reels/stories_\n\n${sig()}`);
        await react(sock,m,'📸');
        try {
            const items = await igDL(text);
            if (!items?.length) throw new Error('No media found');
            let sent=0;
            for (const item of items.slice(0,4)) {
                const isVid = item.type==='video' || item.url?.includes('.mp4');
                if (isVid) {
                    await sock.sendMessage(m.chat,{video:{url:item.url},caption:sent===0?`📸 *Instagram Video*\n\n${sig()}`:'▶️'},{quoted:m});
                } else {
                    await sock.sendMessage(m.chat,{image:{url:item.url},caption:sent===0?`📸 *Instagram Post*\n\n${sig()}`:'🖼️'},{quoted:m});
                }
                sent++;
                if (sent < items.length) await new Promise(r=>setTimeout(r,800));
            }
            await react(sock,m,'✅');
        } catch(e){
            await react(sock,m,'❌');
            reply(`❌ Instagram failed: ${e.message}\n\n_Make sure the account is public_\n\n${sig()}`);
        }
    }
},

// ── .facebook ─────────────────────────────────────────────────────────────
{
    command:'facebook', category:'download',
    execute: async (sock,m,{text,reply}) => {
        if (!text) return reply(`❓ *.facebook <url>*\n\n${sig()}`);
        await react(sock,m,'📘');
        try {
            const url = await fbDL(text);
            await sock.sendMessage(m.chat,{video:{url},caption:`📘 *Facebook Video*\n\n${sig()}`},{quoted:m});
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ FB failed: ${e.message}\n\n${sig()}`); }
    }
},

// ── .twitter ──────────────────────────────────────────────────────────────
{
    command:'twitter', category:'download',
    execute: async (sock,m,{text,reply}) => {
        if (!text) return reply(`❓ *.twitter <tweet url>*\n\n${sig()}`);
        await react(sock,m,'🐦');
        try {
            const url = await twDL(text);
            await sock.sendMessage(m.chat,{video:{url},caption:`🐦 *Twitter/X Video*\n\n${sig()}`},{quoted:m});
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ Twitter failed: ${e.message}\n\n${sig()}`); }
    }
},

// ── .song / song2 ─────────────────────────────────────────────────────────

{
    command:'song2', category:'audio',
    execute: async (sock,m,ctx) => {
        const pl = [].concat(require('./play')).find(p=>p.command==='play2');
        return pl?.execute(sock,m,ctx);
    }
},

// ── .video / videodoc ─────────────────────────────────────────────────────

{
    command:'videodoc', category:'video',
    execute: async (sock,m,{text,reply}) => {
        if (!text) return reply(`❓ *.videodoc <name or URL>*\n_Sends video as file_\n\n${sig()}`);
        await react(sock,m,'📄');
        try {
            const {dlVideo} = require('../library/dl');
            const yts = require('yt-search');
            let vid;
            if (/^https?:\/\//i.test(text)) vid={url:text,title:'Video'};
            else { const r=await yts(text); vid=r.videos?.[0]; if(!vid) throw new Error('No results'); }
            const result = await dlVideo(vid.url,'360');
            await sock.sendMessage(m.chat,{
                document:{url:result.url},mimetype:'video/mp4',
                fileName:`${(result.title||vid.title||'video').slice(0,50)}.mp4`,
                caption:`📄 *${result.title||vid.title}*\n\n${sig()}`
            },{quoted:m});
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ Failed: ${e.message}\n\n${sig()}`); }
    }
},

// ── .image — search or download ───────────────────────────────────────────
{
    command:'image', category:'image',
    execute: async (sock,m,{text,reply}) => {
        if (!text) return reply(`❓ *.image <search term or URL>*\n\n${sig()}`);
        await react(sock,m,'🖼️');
        try {
            let url;
            if (/^https?:\/\//i.test(text)) {
                url = text;
            } else {
                // Use Unsplash source (no key needed)
                url = `https://source.unsplash.com/800x600/?${encodeURIComponent(text)}&t=${Date.now()}`;
            }
            await sock.sendMessage(m.chat,{image:{url},caption:`🖼️ *${text}*\n\n${sig()}`},{quoted:m});
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ Image failed: ${e.message}\n\n${sig()}`); }
    }
},

// ── .apk ─────────────────────────────────────────────────────────────────
{
    command:'apk', category:'download',
    execute: async (sock,m,{text,reply}) => {
        if (!text) return reply(`❓ *.apk <app name>*\n\n${sig()}`);
        await react(sock,m,'📱');
        try {
            const q = encodeURIComponent(text);
            reply(`📱 *APK Search: ${text}*\n\n🔗 APKPure: https://apkpure.com/search?q=${q}\n🔗 APKMirror: https://www.apkmirror.com/?post_type=app_release&searchtype=app&s=${q}\n\n⚠️ _Only download from trusted sources!_\n\n${sig()}`);
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ APK search failed\n\n${sig()}`); }
    }
},

// ── .gdrive ───────────────────────────────────────────────────────────────
{
    command:'gdrive', category:'download',
    execute: async (sock,m,{text,reply}) => {
        if (!text) return reply(`❓ *.gdrive <google drive url>*\n\n${sig()}`);
        await react(sock,m,'📁');
        try {
            const match = text.match(/[-\w]{25,}/);
            if (!match) throw new Error('Invalid Google Drive URL — paste full share link');
            const id  = match[0];
            const url = `https://drive.google.com/uc?export=download&id=${id}`;
            reply(`📁 *Google Drive*\n\nDirect download link:\n${url}\n\n_Tap to download_\n\n${sig()}`);
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}\n\n${sig()}`); }
    }
},

// ── .gitclone ─────────────────────────────────────────────────────────────
{
    command:'gitclone', category:'download',
    execute: async (sock,m,{text,reply}) => {
        if (!text) return reply(`❓ *.gitclone <github url>*\n\n${sig()}`);
        await react(sock,m,'🐙');
        try {
            const match = text.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
            if (!match) throw new Error('Invalid GitHub URL');
            const [,user,repo] = match;
            const {data} = await axios.get(`https://api.github.com/repos/${user}/${repo}`,{timeout:10000});
            const zipUrl = `https://github.com/${user}/${repo}/archive/refs/heads/${data.default_branch||'main'}.zip`;
            reply(`🐙 *${data.full_name}*\n\n⭐ ${data.stargazers_count}  🍴 ${data.forks_count}  📝 ${data.language||'?'}\n${data.description||''}\n\n📦 ZIP: ${zipUrl}\n\n${sig()}`);
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}\n\n${sig()}`); }
    }
},

// ── .itunes ───────────────────────────────────────────────────────────────
{
    command:'itunes', category:'search',
    execute: async (sock,m,{text,reply}) => {
        if (!text) return reply(`❓ *.itunes <song name>*\n\n${sig()}`);
        await react(sock,m,'🍎');
        try {
            const {data} = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(text)}&entity=song&limit=5`,{timeout:10000});
            if (!data.results?.length) throw new Error('No results');
            const list = data.results.slice(0,5).map((r,i)=>
                `*${i+1}.* ${r.trackName} — ${r.artistName}\n   💿 ${r.collectionName||''} (${new Date(r.releaseDate||0).getFullYear()})\n   🎧 Preview: ${r.previewUrl||'none'}`
            ).join('\n\n');
            reply(`🍎 *iTunes: ${text}*\n\n${list}\n\n${sig()}`);
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ iTunes failed: ${e.message}\n\n${sig()}`); }
    }
},

// ── .mediafire ────────────────────────────────────────────────────────────
{
    command:'mediafire', category:'download',
    execute: async (sock,m,{text,reply}) => {
        if (!text) return reply(`❓ *.mediafire <mediafire url>*\n\n${sig()}`);
        await react(sock,m,'🗂️');
        try {
            const key = text.split('/').filter(Boolean).pop()?.split('?')[0];
            if (!key) throw new Error('Invalid MediaFire URL');
            const {data} = await axios.get(`https://www.mediafire.com/api/1.5/file/get_info.php?quick_key=${key}&response_format=json`,{timeout:15000});
            const file = data?.response?.file_info;
            if (!file) throw new Error('File not found or link is private');
            const size = (file.size/1024/1024).toFixed(2);
            const dl   = file.links?.normal_download;
            reply(`🗂️ *MediaFire*\n\n📄 ${file.filename}\n📦 ${size} MB\n\n⬇️ ${dl}\n\n${sig()}`);
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ MediaFire: ${e.message}\n\n${sig()}`); }
    }
},

// ── .savestatus ───────────────────────────────────────────────────────────

// ── .download ─────────────────────────────────────────────────────────────
{
    command:'download', category:'download',
    execute: async (sock,m,{text,reply}) => {
        if (!text) return reply(`❓ *.download <url>*\n_Downloads any direct file URL_\n\n${sig()}`);
        await react(sock,m,'⬇️');
        try {
            const {data,headers} = await axios.get(text,{responseType:'arraybuffer',timeout:40000,headers:{'User-Agent':UA}});
            const mime = headers['content-type']||'application/octet-stream';
            const ext  = mime.split('/')[1]?.split(';')[0]||'bin';
            const buf  = Buffer.from(data);
            if (mime.includes('image')) await sock.sendMessage(m.chat,{image:buf,caption:`⬇️ Downloaded\n\n${sig()}`},{quoted:m});
            else if (mime.includes('video')) await sock.sendMessage(m.chat,{video:buf,caption:`⬇️ Downloaded\n\n${sig()}`},{quoted:m});
            else if (mime.includes('audio')) await sock.sendMessage(m.chat,{audio:buf,mimetype:mime},{quoted:m});
            else await sock.sendMessage(m.chat,{document:buf,filename:`download.${ext}`,mimetype:mime,caption:`⬇️ Downloaded\n\n${sig()}`},{quoted:m});
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ Download failed: ${e.message}\n\n${sig()}`); }
    }
},

// ── .pin (Pinterest-style image) ──────────────────────────────────────────
{
    command:'pin', category:'image',
    execute: async (sock,m,{text,reply}) => {
        if (!text) return reply(`❓ *.pin <search term>*\n\n${sig()}`);
        await react(sock,m,'📌');
        try {
            const url = `https://source.unsplash.com/800x600/?${encodeURIComponent(text)}&t=${Date.now()}`;
            await sock.sendMessage(m.chat,{image:{url},caption:`📌 *${text}*\n\n${sig()}`},{quoted:m});
            await react(sock,m,'✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ Failed: ${e.message}\n\n${sig()}`); }
    }
},

// ── .telesticker ─────────────────────────────────────────────────────────
{
    command:'telesticker', category:'download',
    execute: async (sock,m,{text,reply}) => {
        reply(`🎭 *Telegram Sticker Packs*\n\nTo get stickers from Telegram:\n1️⃣ Open @Stickers bot on Telegram\n2️⃣ Send /addsticker to start\n\nOr use WebP converter: https://ezgif.com/webp-to-png\n\n${sig()}`);
    }
},

];
