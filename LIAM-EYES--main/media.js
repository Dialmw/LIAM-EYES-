// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — media.js  (download engine + channel branding)        ║
// ════════════════════════════════════════════════════════════════════════════
//  1. Puts the bundled ffmpeg on PATH (audio/sticker/video tools need it).
//  2. Manages a yt-dlp binary (auto-download + daily self-update).
//  3. socialDownload(): TikTok / Instagram / Facebook / X / YouTube / more,
//     tried in order: tikwm → yt-dlp → cobalt (if you host one) → free APIs.
//  4. Everything is downloaded to a Buffer / local file by the BOT, then sent,
//     so WhatsApp never has to fetch a blocked or expired URL itself.
//  5. Channel branding: every reply can show "Forwarded from <channel>" and a
//     tappable "Join channel" card that opens your WhatsApp channel.
// ════════════════════════════════════════════════════════════════════════════
'use strict';

const fs     = require('fs');
const os     = require('os');
const path   = require('path');
const crypto = require('crypto');
const axios  = require('axios');
const { spawn } = require('child_process');

let FileType = null;
try { FileType = require('file-type'); } catch (_) {}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const MB = 1024 * 1024;
const log = (...a) => console.log('\x1b[36m[MEDIA]\x1b[0m', ...a);

// ── 1. ffmpeg on PATH ──────────────────────────────────────────────────────
let FFMPEG = 'ffmpeg';
(function setupFfmpegPath() {
    try {
        const p = require('@ffmpeg-installer/ffmpeg').path;
        if (p && fs.existsSync(p)) {
            FFMPEG = p;
            const dir = path.dirname(p);
            const parts = (process.env.PATH || '').split(path.delimiter);
            if (!parts.includes(dir)) process.env.PATH = dir + path.delimiter + (process.env.PATH || '');
        }
    } catch (_) { /* system ffmpeg (if any) will be used */ }
})();

// ── temp dir (auto-cleaned) ────────────────────────────────────────────────
const TMP_DIR = path.join(os.tmpdir(), 'liam-eyes-media');
try { fs.mkdirSync(TMP_DIR, { recursive: true }); } catch (_) {}
const rid = () => crypto.randomBytes(6).toString('hex');
const scheduleDelete = (p, ms = 15 * 60 * 1000) => {
    const t = setTimeout(() => fs.unlink(p, () => {}), ms);
    if (t.unref) t.unref();
};
// sweep leftovers from previous runs
try {
    for (const f of fs.readdirSync(TMP_DIR)) {
        const fp = path.join(TMP_DIR, f);
        if (Date.now() - fs.statSync(fp).mtimeMs > 30 * 60 * 1000) fs.unlinkSync(fp);
    }
} catch (_) {}

// ── 2. yt-dlp manager ──────────────────────────────────────────────────────
const BIN_DIR = (() => {
    const d = path.join(__dirname, 'bin');
    try { fs.mkdirSync(d, { recursive: true }); fs.accessSync(d, fs.constants.W_OK); return d; }
    catch (_) { return TMP_DIR; }
})();
const YTDLP_PATH = path.join(BIN_DIR, 'yt-dlp');
let ytdlpBin = null;        // resolved executable (or null if unavailable)
let ytdlpReady = null;      // promise

const ytdlpAsset = () => {
    if (process.platform !== 'linux') return null;
    return process.arch === 'arm64' ? 'yt-dlp_linux_aarch64' : 'yt-dlp_linux';
};

function exec(bin, args, { timeout = 120000, input } = {}) {
    return new Promise((resolve, reject) => {
        let out = '', err = '';
        let p;
        try { p = spawn(bin, args, { env: process.env }); } catch (e) { return reject(e); }
        const t = setTimeout(() => { try { p.kill('SIGKILL'); } catch (_) {} reject(new Error('timeout')); }, timeout);
        p.stdout.on('data', d => { out += d; if (out.length > 2e6) out = out.slice(-1e6); });
        p.stderr.on('data', d => { err += d; if (err.length > 2e6) err = err.slice(-1e6); });
        p.on('error', e => { clearTimeout(t); reject(e); });
        p.on('close', code => {
            clearTimeout(t);
            if (code === 0) return resolve({ out, err });
            const line = (err.trim().split('\n').filter(l => /ERROR/i.test(l)).pop() || err.trim().split('\n').pop() || `exit ${code}`);
            reject(new Error(line.replace(/^ERROR:\s*/i, '').slice(0, 300)));
        });
        if (input) p.stdin.end(input);
    });
}

async function ensureYtdlp() {
    if (ytdlpBin) return ytdlpBin;
    if (ytdlpReady) return ytdlpReady;
    ytdlpReady = (async () => {
        // 1) already downloaded?
        if (fs.existsSync(YTDLP_PATH)) {
            try { await exec(YTDLP_PATH, ['--version'], { timeout: 15000 }); ytdlpBin = YTDLP_PATH; }
            catch (_) { try { fs.unlinkSync(YTDLP_PATH); } catch (__) {} }
        }
        // 2) system yt-dlp?
        if (!ytdlpBin) {
            try { await exec('yt-dlp', ['--version'], { timeout: 15000 }); ytdlpBin = 'yt-dlp'; } catch (_) {}
        }
        // 3) download the standalone binary from GitHub releases
        if (!ytdlpBin) {
            const asset = ytdlpAsset();
            if (asset) {
                try {
                    log('Downloading yt-dlp …');
                    const r = await axios.get(`https://github.com/yt-dlp/yt-dlp/releases/latest/download/${asset}`,
                        { responseType: 'arraybuffer', timeout: 120000, maxRedirects: 8, headers: { 'User-Agent': UA } });
                    fs.writeFileSync(YTDLP_PATH, Buffer.from(r.data));
                    fs.chmodSync(YTDLP_PATH, 0o755);
                    await exec(YTDLP_PATH, ['--version'], { timeout: 20000 });
                    ytdlpBin = YTDLP_PATH;
                    log('yt-dlp ready');
                } catch (e) {
                    log('yt-dlp install failed:', e.message);
                    try { fs.unlinkSync(YTDLP_PATH); } catch (_) {}
                }
            }
        }
        // 4) self-update if the local copy is older than 24h (fire-and-forget)
        if (ytdlpBin === YTDLP_PATH) {
            try {
                const age = Date.now() - fs.statSync(YTDLP_PATH).mtimeMs;
                if (age > 24 * 3600 * 1000) {
                    exec(YTDLP_PATH, ['-U'], { timeout: 90000 })
                        .then(() => { try { fs.utimesSync(YTDLP_PATH, new Date(), new Date()); } catch (_) {} log('yt-dlp updated'); })
                        .catch(() => { try { fs.utimesSync(YTDLP_PATH, new Date(), new Date()); } catch (_) {} });
                }
            } catch (_) {}
        }
        if (!ytdlpBin) ytdlpReady = null; // allow retry later
        return ytdlpBin;
    })();
    return ytdlpReady;
}

// Extra yt-dlp flags from the environment:
//   YTDLP_COOKIES = path to a cookies.txt (Netscape format) — fixes YouTube/Instagram login walls
//   YTDLP_PROXY   = http(s)/socks5 proxy URL — fixes datacenter-IP blocks
//   YTDLP_ARGS    = any additional raw flags
function envArgs() {
    const a = [];
    const cookies = process.env.YTDLP_COOKIES || process.env.COOKIES_FILE;
    if (cookies && fs.existsSync(cookies)) a.push('--cookies', cookies);
    if (process.env.YTDLP_PROXY) a.push('--proxy', process.env.YTDLP_PROXY);
    if (process.env.YTDLP_ARGS) a.push(...process.env.YTDLP_ARGS.split(/\s+/).filter(Boolean));
    return a;
}

/**
 * Download with yt-dlp → local file.
 * @returns {{path:string, title:string, ext:string}}
 */
async function ytdlpDownload(url, { audio = false, maxHeight = 480, maxMB = 95, extra = [] } = {}) {
    const bin = await ensureYtdlp();
    if (!bin) throw new Error('yt-dlp unavailable on this host');
    const id = rid();
    const tpl = path.join(TMP_DIR, `${id}.%(ext)s`);
    const args = [
        '--no-playlist', '--no-warnings', '--no-progress', '--restrict-filenames',
        '--socket-timeout', '20', '--retries', '2', '--fragment-retries', '2',
        '--max-filesize', `${maxMB}M`,
        '--ffmpeg-location', FFMPEG,
        ...envArgs(),
    ];
    if (audio) {
        args.push('-f', 'bestaudio/best', '-x', '--audio-format', 'mp3', '--audio-quality', '5');
    } else {
        args.push(
            '-f', `b[ext=mp4][height<=${maxHeight}]/bv*[vcodec^=avc1][height<=${maxHeight}]+ba[ext=m4a]/b[height<=${maxHeight}]/b`,
            '--merge-output-format', 'mp4'
        );
    }
    args.push(...extra, '--print', 'after_move:%(title).80s\t%(filepath)s', '-o', tpl, url);

    const { out } = await exec(bin, args, { timeout: 150000 });
    let title = 'media', file = null;
    const last = out.trim().split('\n').pop() || '';
    if (last.includes('\t')) { const [t, f] = last.split('\t'); title = t || title; file = f; }
    if (!file || !fs.existsSync(file)) {
        const found = fs.readdirSync(TMP_DIR).find(f => f.startsWith(id + '.'));
        if (!found) throw new Error('yt-dlp produced no file');
        file = path.join(TMP_DIR, found);
    }
    scheduleDelete(file);
    return { path: file, title, ext: path.extname(file).slice(1).toLowerCase() };
}

// ── helpers ────────────────────────────────────────────────────────────────
async function fetchBuffer(url, { referer, timeout = 60000, maxMB = 95, headers = {} } = {}) {
    const r = await axios.get(url, {
        responseType: 'arraybuffer', timeout, maxRedirects: 6,
        maxContentLength: maxMB * MB, maxBodyLength: maxMB * MB,
        headers: { 'User-Agent': UA, Accept: '*/*', ...(referer ? { Referer: referer } : {}), ...headers },
    });
    const buf = Buffer.from(r.data);
    if (!buf.length) throw new Error('empty download');
    // reject HTML/JSON error pages masquerading as media
    const head = buf.slice(0, 64).toString('utf8').trimStart().toLowerCase();
    if (head.startsWith('<!doctype') || head.startsWith('<html') || head.startsWith('{"')) throw new Error('got a web page instead of media');
    return buf;
}

async function sniff(buf, fallbackExt) {
    try {
        const ft = FileType && await FileType.fromBuffer(buf);
        if (ft) return { ext: ft.ext, mime: ft.mime };
    } catch (_) {}
    const ext = (fallbackExt || 'bin').toLowerCase();
    const map = { mp4: 'video/mp4', mp3: 'audio/mpeg', m4a: 'audio/mp4', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    return { ext, mime: map[ext] || 'application/octet-stream' };
}
const kindOf = mime => mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'audio' : mime.startsWith('image/') ? 'image' : 'document';

const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (_) { return ''; } };
const absUrl = (u, base) => !u ? u : /^https?:\/\//i.test(u) ? u : (u.startsWith('//') ? 'https:' + u : base.replace(/\/$/, '') + (u.startsWith('/') ? '' : '/') + u);

// ── 3. providers ───────────────────────────────────────────────────────────
// Each provider returns [{ url? | path?, type?: 'video'|'image'|'audio' }] + title

async function p_tikwm(url) {
    const { data } = await axios.get('https://www.tikwm.com/api/', {
        params: { url, hd: 1 }, timeout: 25000, headers: { 'User-Agent': UA },
    });
    const d = data?.data;
    if (!d) throw new Error(data?.msg || 'tikwm: no data');
    const base = 'https://www.tikwm.com';
    if (Array.isArray(d.images) && d.images.length)
        return { title: d.title, items: d.images.slice(0, 8).map(u => ({ url: absUrl(u, base), type: 'image' })), audio: d.music ? absUrl(d.music, base) : null };
    const v = d.hdplay || d.play || d.wmplay;
    if (!v) throw new Error('tikwm: no video url');
    return { title: d.title, items: [{ url: absUrl(v, base), type: 'video' }], audio: d.music ? absUrl(d.music, base) : null, meta: d };
}

async function p_ytdlp(url, { audio = false } = {}) {
    const r = await ytdlpDownload(url, { audio });
    return { title: r.title, items: [{ path: r.path, type: audio ? 'audio' : undefined }] };
}

// cobalt v10 API — only used if you point COBALT_API at an instance you can use
// (public api.cobalt.tools needs a key / bot-check; self-hosting is free).
//   COBALT_API=https://your-cobalt.example.com   COBALT_KEY=optional-api-key
async function p_cobalt(url, { audio = false } = {}) {
    const base = (process.env.COBALT_API || '').replace(/\/$/, '');
    if (!base) throw new Error('cobalt: COBALT_API not set');
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': UA };
    if (process.env.COBALT_KEY) headers.Authorization = `Api-Key ${process.env.COBALT_KEY}`;
    const { data } = await axios.post(base + '/', {
        url, downloadMode: audio ? 'audio' : 'auto', audioFormat: 'mp3', videoQuality: '480', filenameStyle: 'basic',
    }, { headers, timeout: 25000 });
    if (data.status === 'tunnel' || data.status === 'redirect')
        return { title: (data.filename || 'media').replace(/\.[a-z0-9]+$/i, ''), items: [{ url: data.url, type: audio ? 'audio' : undefined }] };
    if (data.status === 'picker' && Array.isArray(data.picker) && data.picker.length)
        return { title: 'media', items: data.picker.slice(0, 8).map(p => ({ url: p.url, type: p.type === 'photo' ? 'image' : p.type })) };
    throw new Error(`cobalt: ${data?.error?.code || data.status || 'no result'}`);
}

// Free community scrapers (best effort — these come and go).
async function p_freeApis(url) {
    const enc = encodeURIComponent(url);
    const host = hostOf(url);
    const list = [];
    if (/instagram\.com/.test(host)) list.push(
        `https://api.ryzendesu.vip/api/downloader/igdl?url=${enc}`,
        `https://api.vreden.my.id/api/igdl?url=${enc}`);
    else if (/facebook\.com|fb\.watch/.test(host)) list.push(
        `https://api.ryzendesu.vip/api/downloader/fbdl?url=${enc}`,
        `https://api.vreden.my.id/api/fbdl?url=${enc}`);
    else if (/twitter\.com|x\.com/.test(host)) list.push(
        `https://api.ryzendesu.vip/api/downloader/twitter?url=${enc}`,
        `https://api.vreden.my.id/api/twitterdl?url=${enc}`);
    list.push(`https://api.tiklydown.eu.org/api/download?url=${enc}`);

    const pick = d => {
        const arr = [d?.data?.result, d?.data, d?.result, d?.media, d?.items].find(Array.isArray);
        if (arr?.length) {
            const items = arr.map(i => ({
                url: typeof i === 'string' ? i : (i?.url || i?.download_url || i?.video_url || i?.hd || i?.sd || i?.image_url),
                type: i?.type === 'image' || i?.type === 'photo' ? 'image' : (i?.type === 'video' ? 'video' : undefined),
            })).filter(i => /^https?:\/\//.test(i.url || ''));
            if (items.length) return items;
        }
        const single = d?.data?.hd || d?.data?.sd || d?.data?.play || d?.hd || d?.sd || d?.url || d?.video;
        return /^https?:\/\//.test(single || '') ? [{ url: single }] : null;
    };
    const errs = [];
    for (const api of list) {
        try {
            const { data } = await axios.get(api, { timeout: 18000, headers: { 'User-Agent': UA } });
            const items = pick(data);
            if (items) return { title: data?.title || data?.data?.title || 'media', items: items.slice(0, 6) };
        } catch (e) { errs.push(e.message); }
    }
    throw new Error('free APIs: ' + (errs[0] || 'no result'));
}

// ── resolve provider output to sendable buffers ────────────────────────────
async function materialize(res, referer) {
    const out = [];
    for (const it of res.items) {
        let buf;
        if (it.path) {
            const st = fs.statSync(it.path);
            if (st.size > 100 * MB) throw new Error('file too large for WhatsApp (>100MB)');
            buf = fs.readFileSync(it.path);
            const s = await sniff(buf, path.extname(it.path).slice(1));
            out.push({ buffer: buf, mime: s.mime, ext: s.ext, kind: it.type || kindOf(s.mime) });
        } else {
            buf = await fetchBuffer(it.url, { referer });
            const s = await sniff(buf, (it.url.split('?')[0].match(/\.([a-z0-9]{2,4})$/i) || [])[1]);
            out.push({ buffer: buf, mime: s.mime, ext: s.ext, kind: kindOf(s.mime) });
        }
    }
    return out;
}

/**
 * Universal downloader.
 * @param {string} url
 * @param {{audio?:boolean}} opts
 * @returns {Promise<{title:string, files:{buffer,mime,ext,kind}[], via:string}>}
 */
async function socialDownload(url, { audio = false } = {}) {
    if (!/^https?:\/\//i.test(url || '')) throw new Error('Send a valid link starting with http(s)://');
    const host = hostOf(url);
    const isTT = /tiktok\.com/.test(host);

    const chain = [];
    if (isTT) chain.push(['tikwm', async () => {
        const r = await p_tikwm(url);
        if (audio) { if (!r.audio) throw new Error('no audio'); return { title: r.title, items: [{ url: r.audio, type: 'audio' }] }; }
        return r;
    }]);
    chain.push(['yt-dlp', () => p_ytdlp(url, { audio })]);
    if (process.env.COBALT_API) chain.push(['cobalt', () => p_cobalt(url, { audio })]);
    if (!audio) chain.push(['free-apis', () => p_freeApis(url)]);

    const errs = [];
    for (const [name, fn] of chain) {
        try {
            const res = await fn();
            const files = await materialize(res, url);
            if (files.length) { log(`✔ ${host} via ${name}`); return { title: res.title || 'media', files, via: name }; }
        } catch (e) {
            errs.push(`${name}: ${e.message}`);
            log(`✗ ${host} ${name}: ${e.message}`);
        }
    }
    const hint = /instagram|facebook|youtube|youtu\.be/.test(host)
        ? ' (this site often needs login cookies or a proxy from server IPs — see README → "Downloads")' : '';
    throw new Error((errs[0] || 'no provider worked') + hint);
}

/** Send the result of socialDownload() to a chat. */
async function sendDownloaded(sock, m, dl, caption) {
    let n = 0;
    for (const f of dl.files) {
        const quoted = { quoted: m };
        if (f.kind === 'video')
            await sock.sendMessage(m.chat, { video: f.buffer, mimetype: 'video/mp4', caption: n === 0 ? caption : '' }, quoted);
        else if (f.kind === 'image')
            await sock.sendMessage(m.chat, { image: f.buffer, caption: n === 0 ? caption : '' }, quoted);
        else if (f.kind === 'audio')
            await sock.sendMessage(m.chat, { audio: f.buffer, mimetype: f.ext === 'mp3' ? 'audio/mpeg' : f.mime, ptt: false }, quoted);
        else
            await sock.sendMessage(m.chat, { document: f.buffer, mimetype: f.mime, fileName: `${(dl.title || 'file').slice(0, 50)}.${f.ext}`, caption: n === 0 ? caption : '' }, quoted);
        n++;
        if (n < dl.files.length) await new Promise(r => setTimeout(r, 700));
    }
    return n;
}

// ── YouTube helpers used by library/dl (return {url,title}; url may be a local path) ──
async function ytAudio(url) {
    const toRes = r => ({ url: r.path, title: r.title, thumb: '' });
    try { return toRes(await ytdlpDownload(url, { audio: true })); }
    catch (e) {
        if (!/youtu/i.test(url)) throw e;
        log('YouTube blocked this host:', e.message.slice(0, 90));
        // 1) retry with player clients that sometimes skip the sign-in check
        try {
            return toRes(await ytdlpDownload(url, { audio: true, extra: ['--extractor-args', 'youtube:player_client=android_vr,tv_embedded'] }));
        } catch (_) {}
        // 2) no-login fallback: find the same song on SoundCloud (title via YouTube oEmbed, which needs no sign-in)
        try {
            const { data } = await axios.get('https://www.youtube.com/oembed', { params: { url, format: 'json' }, timeout: 12000, headers: { 'User-Agent': UA } });
            const clean = String(data?.title || '')
                .replace(/[\(\[][^)\]]*(official|video|audio|lyric|lyrics|visuali[sz]er|hd|4k|mv)[^)\]]*[\)\]]/gi, '')
                .replace(/\s+/g, ' ').trim();
            if (clean) {
                log('trying SoundCloud for:', clean);
                return toRes(await ytdlpDownload(`scsearch1:${clean}`, { audio: true }));
            }
        } catch (e2) { log('SoundCloud fallback failed:', e2.message); }
        throw e;
    }
}
async function ytVideo(url, quality = '360') {
    const r = await ytdlpDownload(url, { audio: false, maxHeight: parseInt(quality, 10) || 480 });
    return { url: r.path, title: r.title, thumb: '' };
}

// ── 5. Channel branding ────────────────────────────────────────────────────
// settings.js:  channelBrand: 'both' | 'forward' | 'card' | 'off'
//               channelJid:   optional "120363…@newsletter" (auto-resolved from the invite link if empty)
function installChannelBranding(sock, getCfg) {
    if (!sock || sock.__channelBrand) return sock?.__channelBrand;
    const cfg = () => { try { return getCfg() || {}; } catch (_) { return {}; } };
    const state = { jid: null, name: null, tried: false };

    const inviteUrl = () => cfg().channel || cfg().autoJoinChannel || '';
    const inviteCode = () => (inviteUrl().match(/channel\/([A-Za-z0-9_-]+)/) || [])[1];

    async function resolve() {
        const manual = cfg().channelJid || process.env.CHANNEL_JID;
        if (manual && /@newsletter$/.test(manual)) { state.jid = manual; state.name = state.name || cfg().botName || 'LIAM EYES'; return state; }
        if (state.jid) return state;
        const code = inviteCode();
        if (!code || typeof sock.newsletterMetadata !== 'function') return state;
        try {
            const md = await sock.newsletterMetadata('invite', code);
            if (md?.id) { state.jid = md.id; state.name = md.name || md.thread_metadata?.name?.text || 'LIAM EYES'; log('channel resolved:', state.name); }
        } catch (e) { log('channel lookup failed:', e.message); }
        return state;
    }

    const mode = () => (cfg().channelBrand || process.env.CHANNEL_BRAND || 'both').toLowerCase();
    const orig = sock.sendMessage.bind(sock);

    sock.sendMessage = (jid, content, options) => {
        try {
            const mm = mode();
            if (mm !== 'off' && content && typeof content === 'object' && typeof jid === 'string' &&
                !jid.endsWith('@newsletter') && jid !== 'status@broadcast' &&
                !content.react && !content.delete && !content.edit && !content.poll &&
                !content.forward && !content.disappearingMessagesInChat && !content.pin) {

                const hasText   = typeof content.text === 'string';
                const hasMedia  = content.image || content.video || content.document || content.audio;
                const isSticker = !!content.sticker;
                if (hasText || hasMedia || isSticker) {
                    const ci = { ...(content.contextInfo || {}) };

                    if ((mm === 'forward' || mm === 'both') && state.jid && !ci.forwardedNewsletterMessageInfo) {
                        ci.isForwarded = true;
                        ci.forwardingScore = 1;
                        ci.forwardedNewsletterMessageInfo = {
                            newsletterJid: state.jid, newsletterName: state.name || 'LIAM EYES',
                            serverMessageId: 100 + Math.floor(Math.random() * 900),
                        };
                    }

                    const url = inviteUrl();
                    if ((mm === 'card' || mm === 'both') && url && !isSticker && !content.audio) {
                        const ad = { ...(ci.externalAdReply || {}) };
                        ad.sourceUrl = url;                                       // ← tap = open the channel
                        ad.title = ad.title || '📢 Tap to join our channel';
                        ad.body  = ad.body  || cfg().botName || 'LIAM EYES';
                        if (!ad.thumbnailUrl && !ad.thumbnail && cfg().thumbUrl) ad.thumbnailUrl = cfg().thumbUrl;
                        ad.mediaType = 1;
                        ad.renderLargerThumbnail = false;
                        ad.showAdAttribution = false;
                        ci.externalAdReply = ad;
                    }
                    content = { ...content, contextInfo: ci };
                }
            }
        } catch (_) { /* never block a send because of branding */ }
        return orig(jid, content, options);
    };

    sock.__channelBrand = { resolve, state };
    return sock.__channelBrand;
}

module.exports = {
    FFMPEG, TMP_DIR,
    ensureYtdlp, ytdlpDownload, fetchBuffer,
    socialDownload, sendDownloaded, ytAudio, ytVideo,
    p_tikwm, p_cobalt,
    installChannelBranding,
};

// warm up in the background so the first command is fast
ensureYtdlp().catch(() => {});
