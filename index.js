// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// LIAM EYES Bot — index.js
// Only clear console for the main process; child instances log inline
if (!process.env.LIAM_INSTANCE_ID) console.clear();

const fs       = require('fs');
const path     = require('path');
const pino     = require('pino');
const chalk    = require('chalk');
const readline = require('readline');
const FileType = require('file-type');
const { Boom } = require('@hapi/boom');
const os       = require('os');

// ════════════════════════════════════════════════════════════
// Auto-bundled module registry — library/ and plugins/ folders
// have been merged directly into this file. Do not hand-edit
// the __BUNDLE section below; edit the source and re-bundle,
// or edit the wrapped function bodies directly — they are
// plain JS, just namespaced by id.
// ════════════════════════════════════════════════════════════
const __ROOT_DIRNAME__ = __dirname;
const __bundleModules = {};
const __bundleCache = {};
function __bundleRequire(id) {
    if (__bundleCache[id]) return __bundleCache[id].exports;
    const mod = { exports: {} };
    __bundleCache[id] = mod;
    __bundleModules[id](mod, mod.exports);
    return mod.exports;
}
function __bundleReload(id) { delete __bundleCache[id]; }
const __pluginIds = ["plugins/advanced_features","plugins/ai_tools","plugins/alive","plugins/audio_tools","plugins/auto_features","plugins/bridge_run","plugins/cool_features","plugins/dominate","plugins/download_tools","plugins/ephoto_tools","plugins/extra_features","plugins/fun_boost","plugins/fun_extra","plugins/fun_games","plugins/group_tools","plugins/image_tools","plugins/keepalive","plugins/media_tools","plugins/multisession_tools","plugins/other_tools","plugins/others_extended","plugins/owner_controls","plugins/ping","plugins/play","plugins/presence_tools","plugins/reaction_tools","plugins/religion_tools","plugins/search_tools","plugins/settings_tools","plugins/song","plugins/sports_tools","plugins/status_tools","plugins/support_tools","plugins/tools_extended","plugins/tostatus_tools","plugins/translate_tools","plugins/video","plugins/video_tools"];

// ── module: library/Api.js ─────────────────────────────────────────────────
__bundleModules["library/Api"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;

// © 2025 Debraj. All Rights Reserved.
// respect the work, don’t just copy-paste.

const config = require('./settings');
const fetch = require('node-fetch')

const Api = {
  get: async (endpoint, params = {}) => {
    const query = new URLSearchParams(params).toString()
    const res = await fetch(`${config.api.baseurl}${endpoint}?${query}`)
    return await res.json()
  },

  post: async (endpoint, body = {}) => {
    const res = await fetch(`${config.api.baseurl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
    return await res.json()
  }
}

module.exports = Api
};

// ── module: library/auth.js ────────────────────────────────────────────────
__bundleModules["library/auth"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — auth.js  (20-session edition)                        ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';

const _K  = 0x5A;
const _EA = '686f6e6d6a6f6e62696a6f68';   // creator: 254705483052
const _EP = ['686f6e6d6e6968626f6f6c69', '686f6e6d6a6f6e62696a6f68']; // privileged

const _d = hex => Buffer.from(hex, 'hex').map(b => b ^ _K).toString('ascii');

module.exports = {
    getOwner: () => _d(_EA),
    getSudo:  (customList = []) => customList,

    isOwner: (jid, customOwner) => {
        const num      = (jid || '').split('@')[0].replace(/:\d+/, '');
        const ownerNum = customOwner || _d(_EA);
        return num === ownerNum || jid === ownerNum + '@s.whatsapp.net';
    },

    isPrivileged: (num) => {
        const n = (num || '').replace(/\D/g,'').replace(/^0+/,'');
        return _EP.some(e => _d(e).replace(/\D/g,'') === n);
    },

    // Privileged numbers get 20; everyone else gets defaultLimit (also 20 now)
    getSessionLimit: (num, defaultLimit = 20) => {
        const n = (num || '').replace(/\D/g,'').replace(/^0+/,'');
        return _EP.some(e => _d(e).replace(/\D/g,'') === n) ? 20 : defaultLimit;
    },

    validate: () => {
        try { const v = _d(_EA); return /^\d{10,15}$/.test(v); }
        catch(_) { return false; }
    },
};

};

// ── module: library/bridge.js ──────────────────────────────────────────────
__bundleModules["library/bridge"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — bridge.js                                             ║
// ║  Real-time HTTP bridge between WhatsApp bot ↔ Telegram bot ↔ Website  ║
// ║  Uses Server-Sent Events (SSE) for realtime push to website            ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';

const http = require('http');
const config = require('./settings');

let _sock = null;           // Baileys socket ref
const _sseClients = [];     // SSE subscribers (website dashboard)
let _server = null;

// ── Register WhatsApp socket ───────────────────────────────────────────────
function setSock(sock) { _sock = sock; }

// ── Broadcast event to all SSE clients (website) ──────────────────────────
function pushSSE(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (let i = _sseClients.length - 1; i >= 0; i--) {
        try { _sseClients[i].write(payload); }
        catch { _sseClients.splice(i, 1); }
    }
}

// ── Token validation ───────────────────────────────────────────────────────
function validToken(req) {
    const tok = req.headers['x-bridge-token'] || req.headers['authorization']?.replace('Bearer ', '');
    return tok && tok === (config.bridgeToken || config.settings?.bridgeToken || '');
}

// ── Start bridge HTTP server ───────────────────────────────────────────────
function startBridge() {
    const port = config.bridgePort || config.settings?.bridgePort || 3001;
    if (!config.bridgeToken && !config.settings?.bridgeToken) {
        console.log('\x1b[33m  [BRIDGE] No bridgeToken set — bridge disabled. Set bridgeToken in settings.js\x1b[0m');
        return;
    }

    _server = http.createServer(async (req, res) => {
        // CORS for website panel
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-bridge-token, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

        const url = req.url.split('?')[0];

        // ── GET /health — ping ───────────────────────────────────────────
        if (req.method === 'GET' && url === '/health') {
            res.writeHead(200, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ ok: true, bot: 'LIAM EYES WA', ts: Date.now() }));
            return;
        }

        // ── GET /events — SSE stream for website dashboard ──────────────
        if (req.method === 'GET' && url === '/events') {
            if (!validToken(req)) { res.writeHead(401); res.end('Unauthorized'); return; }
            res.writeHead(200, {
                'Content-Type':  'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection':    'keep-alive',
            });
            res.write(`event: connected\ndata: {"bot":"LIAM EYES WA","ts":${Date.now()}}\n\n`);
            _sseClients.push(res);
            req.on('close', () => {
                const i = _sseClients.indexOf(res);
                if (i >= 0) _sseClients.splice(i, 1);
            });
            return;
        }

        // ── POST /send — Telegram sends message to WhatsApp ─────────────
        // Body: { jid: "2547xxxx@s.whatsapp.net", text: "...", media?: base64, mimetype?: "image/jpeg" }
        if (req.method === 'POST' && url === '/send') {
            if (!validToken(req)) { res.writeHead(401); res.end('Unauthorized'); return; }
            if (!_sock) { res.writeHead(503); res.end(JSON.stringify({ok:false,error:'WA not connected'})); return; }

            let body = '';
            req.on('data', d => body += d);
            req.on('end', async () => {
                try {
                    const { jid, text, media, mimetype, caption } = JSON.parse(body);
                    if (!jid) throw new Error('jid required');

                    let result;
                    if (media && mimetype) {
                        const buf = Buffer.from(media, 'base64');
                        if (mimetype.includes('image'))
                            result = await _sock.sendMessage(jid, { image: buf, caption: caption || text || '' });
                        else if (mimetype.includes('video'))
                            result = await _sock.sendMessage(jid, { video: buf, caption: caption || text || '' });
                        else if (mimetype.includes('audio'))
                            result = await _sock.sendMessage(jid, { audio: buf, mimetype, ptt: false });
                        else
                            result = await _sock.sendMessage(jid, { document: buf, mimetype, fileName: 'file' });
                    } else if (text) {
                        result = await _sock.sendMessage(jid, { text });
                    } else {
                        throw new Error('text or media required');
                    }

                    res.writeHead(200, {'Content-Type':'application/json'});
                    res.end(JSON.stringify({ ok: true, id: result?.key?.id }));
                    pushSSE('wa_sent', { jid, text: text || '[media]', ts: Date.now() });
                } catch(e) {
                    res.writeHead(400, {'Content-Type':'application/json'});
                    res.end(JSON.stringify({ ok: false, error: e.message }));
                }
            });
            return;
        }

        // ── POST /status — Telegram posts text/image to WA status ───────
        if (req.method === 'POST' && url === '/status') {
            if (!validToken(req)) { res.writeHead(401); res.end('Unauthorized'); return; }
            if (!_sock) { res.writeHead(503); res.end(JSON.stringify({ok:false,error:'WA not connected'})); return; }

            let body = '';
            req.on('data', d => body += d);
            req.on('end', async () => {
                try {
                    const { text, media, mimetype, caption } = JSON.parse(body);
                    // Get contact list for statusJidList
                    let jids = [];
                    try {
                        const store = _sock.store || _sock._store;
                        if (store?.contacts) {
                            jids = Object.keys(store.contacts).filter(j => j.endsWith('@s.whatsapp.net'));
                        }
                    } catch {}
                    const opts = jids.length ? { statusJidList: jids } : {};

                    if (media && mimetype) {
                        const buf = Buffer.from(media, 'base64');
                        if (mimetype.includes('image'))
                            await _sock.sendMessage('status@broadcast', { image: buf, caption: caption || text || '👁️ LIAM EYES', ...opts });
                        else if (mimetype.includes('video'))
                            await _sock.sendMessage('status@broadcast', { video: buf, caption: caption || text || '👁️ LIAM EYES', ...opts });
                    } else if (text) {
                        await _sock.sendMessage('status@broadcast', { text, ...opts });
                    } else {
                        throw new Error('text or media required');
                    }

                    res.writeHead(200, {'Content-Type':'application/json'});
                    res.end(JSON.stringify({ ok: true }));
                    pushSSE('wa_status', { text: text || '[media]', ts: Date.now() });
                } catch(e) {
                    res.writeHead(400, {'Content-Type':'application/json'});
                    res.end(JSON.stringify({ ok: false, error: e.message }));
                }
            });
            return;
        }

        res.writeHead(404); res.end('Not found');
    });

    _server.listen(port, () => {
        console.log(`\x1b[36m  [BRIDGE] 🌉 Bridge server running on port ${port}\x1b[0m`);
        console.log(`\x1b[36m  [BRIDGE] 🔑 Token: ${(config.bridgeToken || config.settings?.bridgeToken || '').slice(0,12)}...\x1b[0m`);
    });

    _server.on('error', e => console.error('  [BRIDGE] Error:', e.message));
}

// ── Called from index.js when a message arrives (relay to TG/website) ─────
function onIncomingMessage(m) {
    if (!m?.message) return;
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
    const from = m.key?.remoteJid || '';
    const sender = m.pushName || from.split('@')[0];
    pushSSE('wa_message', { from, sender, text: text.slice(0,200), ts: Date.now() });
}

module.exports = { startBridge, setSock, pushSSE, onIncomingMessage };

};

// ── module: library/cipher.js ──────────────────────────────────────────────
__bundleModules["library/cipher"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ─────────────────────────────────────────────────────────────────
//  LIAM EYES — Cipher utilities
//  Provides decryption for protected config values
// ─────────────────────────────────────────────────────────────────
'use strict';

const _K = Buffer.from('LIAMEYES');

/** Decrypt XOR+base64 encoded string */
const decrypt = enc => {
    const buf = Buffer.from(enc, 'base64');
    return Buffer.from(buf.map((b, i) => b ^ _K[i % _K.length])).toString();
};

/** Encrypt string to XOR+base64 */
const encrypt = str => {
    const buf = Buffer.from(str);
    return Buffer.from(buf.map((b, i) => b ^ _K[i % _K.length])).toString('base64');
};

/** Simple anti-tamper marker — embedded in output */
const SIGNATURE = Buffer.from('LIAMEYES\x01\x09Alpha').toString('base64');

module.exports = { decrypt, encrypt, SIGNATURE };

};

// ── module: library/connection/connection.js ───────────────────────────────
__bundleModules["library/connection/connection"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — connection.js  (Hardened Stability Edition)          ║
// ║  Handles all Baileys disconnect reasons robustly                       ║
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const chalk = require('chalk');

// Reasons that are safe to reconnect immediately
const RECONNECT_CODES = new Set([
    405, // connectionClosed
    408, // connectionLost
    428, // restartRequired
    503, // timedOut
    // Unknown / unmapped: also reconnect
]);

// Reasons that mean the session is dead — must exit cleanly
const FATAL_CODES = new Set([
    401, // loggedOut
    403, // badSession (device blocked/banned)
    500, // connectionReplaced (another device opened)
    515, // multideviceNotSupported
]);

module.exports = {
    konek: async ({ sock, update, clientstart, DisconnectReason, Boom }) => {
        const { connection, lastDisconnect, isNewLogin } = update;

        if (connection === 'connecting') return; // nothing to do

        if (connection === 'open') {
            console.log(chalk.bold.green('  [CONN] ✅ Successfully connected to WhatsApp'));
            return;
        }

        if (connection === 'close') {
            let reason;
            try {
                reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            } catch (_) {
                reason = 0;
            }

            const errMsg = lastDisconnect?.error?.message || 'unknown';

            if (FATAL_CODES.has(reason)) {
                if (reason === DisconnectReason.loggedOut) {
                    console.log(chalk.bold.red('  [CONN] ⛔ Logged out — session invalid. Delete session folder and re-pair.'));
                } else if (reason === DisconnectReason.badSession) {
                    console.log(chalk.bold.red('  [CONN] ⛔ Bad session file — delete session folder and re-pair.'));
                } else if (reason === DisconnectReason.connectionReplaced) {
                    console.log(chalk.bold.yellow('  [CONN] ⚠️  Connection replaced — another device opened this session. Exiting.'));
                } else {
                    console.log(chalk.bold.red(`  [CONN] ⛔ Fatal disconnect (code ${reason}) — ${errMsg}. Exiting.`));
                }
                process.exit(1);
                return;
            }

            // All other codes: reconnect
            const label = {
                [DisconnectReason.connectionClosed]:  'Connection closed',
                [DisconnectReason.connectionLost]:    'Connection lost from server',
                [DisconnectReason.restartRequired]:   'Restart required by server',
                [DisconnectReason.timedOut]:          'Connection timed out',
            }[reason] || `Unknown disconnect (code=${reason})`;

            console.log(chalk.bold.yellow(`  [CONN] 🔄 ${label} — reconnecting…`));
            // Delegate to clientstart() — it has full back-off logic
            clientstart();
        }
    },
};

};

// ── module: library/converter.js ───────────────────────────────────────────
__bundleModules["library/converter"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;

// © 2025 Debraj. All Rights Reserved.
// respect the work, don’t just copy-paste.

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  return new Promise(async (resolve, reject) => {
    try {
      const tmpDir = path.join(__dirname, 'tmp')
      fs.mkdirSync(tmpDir, { recursive: true })
      let tmp = path.join(tmpDir, Date.now() + '.' + ext)
      let out = tmp + '.' + ext2
      await fs.promises.writeFile(tmp, buffer)
      spawn("ffmpeg", [
        '-y',
        '-i', tmp,
        ...args,
        out
      ])
        .on('error', reject)
        .on('close', async (code) => {
          try {
            await fs.promises.unlink(tmp)
            if (code !== 0) return reject(code)
            resolve(await fs.promises.readFile(out))
            await fs.promises.unlink(out)
          } catch (e) {
            reject(e)
          }
        })
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Convert Audio to Playable WhatsApp Audio
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension 
 */
function toAudio(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-ac', '2',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'mp3'
  ], ext, 'mp3')
}

/**
 * Convert Audio to Playable WhatsApp PTT
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension 
 */
function toPTT(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
    '-compression_level', '10'
  ], ext, 'opus')
}

/**
 * Convert Audio to Playable WhatsApp Video
 * @param {Buffer} buffer Video Buffer
 * @param {String} ext File Extension 
 */
function toVideo(buffer, ext) {
  return ffmpeg(buffer, [
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-ab', '128k',
    '-ar', '44100',
    '-crf', '32',
    '-preset', 'slow'
  ], ext, 'mp4')
}

module.exports = {
  toAudio,
  toPTT,
  toVideo,
  ffmpeg,
}

};

// ── module: library/dl.js ──────────────────────────────────────────────────
__bundleModules["library/dl"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  LIAM EYES — dl.js v7  (Maximum Coverage Music Engine 2025)           ║
// ║  10+ API sources, dynamic cobalt instances, parallel fast batch        ║
// ╚══════════════════════════════════════════════════════════════════════════╝
'use strict';
const axios = require('axios');
const UA  = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36';
const UAB = 'LIAM-EYES-Bot/7.0 (+https://github.com/Dialmw/LIAM-EYES-)'; // for cobalt instances
const ytId = url => url?.match(/(?:v=|youtu\.be\/|\/v\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)?.[1];
const safe = (t, ext) => `${(t||'audio').replace(/[<>:"/\\|?*\x00-\x1f]/g,'').trim().slice(0,60)}.${ext}`;

const get  = (url, cfg={}) => axios.get(url,  { headers:{'User-Agent':UA,'Accept':'application/json',...cfg.headers}, timeout:cfg.timeout||15000, ...cfg });
const post = (url, data, cfg={}) => axios.post(url, data, { headers:{'User-Agent':UA,'Content-Type':'application/json','Accept':'application/json',...cfg.headers}, timeout:cfg.timeout||15000, ...cfg });

// ── Dynamic cobalt instance cache ─────────────────────────────────────────────
let _cobaltInstances = null;
let _cobaltCacheTime = 0;

const getCobaltInstances = async () => {
    const now = Date.now();
    if (_cobaltInstances && now - _cobaltCacheTime < 10 * 60 * 1000) return _cobaltInstances;
    try {
        const r = await axios.get('https://instances.cobalt.best/api/instances.json', {
            headers: { 'User-Agent': UAB }, timeout: 8000,
        });
        const instances = (r.data || [])
            .filter(i => i.online && i.api && (i.services?.youtube || i.services?.['youtube music']))
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 8)
            .map(i => `https://${i.api}`);
        if (instances.length > 0) {
            _cobaltInstances = instances;
            _cobaltCacheTime = now;
            return instances;
        }
    } catch (_) {}
    // Fallback hardcoded instances
    return [
        'https://api.cobalt.tools',
        'https://cobalt.tools',
        'https://cobalt.privacyredirect.com',
        'https://cbl.in.ua',
    ];
};

// ════════════════════════════════════════════════════════════════════════════════
// API 1: cobalt (community instances — no bot protection)
// ════════════════════════════════════════════════════════════════════════════════
const api_cobalt = async (ytUrl) => {
    const instances = await getCobaltInstances();
    for (const ep of instances) {
        try {
            const r = await axios.post(`${ep}/api/json`,
                { url: ytUrl, isAudioOnly: true, aFormat: 'mp3', audioBitrate: '128' },
                { headers: { 'User-Agent': UAB, 'Content-Type': 'application/json', 'Accept': 'application/json' }, timeout: 14000 });
            const u = r.data?.url || r.data?.audio;
            if (u) return { url: u, title: r.data?.filename?.replace(/\.mp3$/i,'') || 'audio' };
        } catch (_) {}
    }
    throw new Error('cobalt: all instances failed');
};

// ════════════════════════════════════════════════════════════════════════════════
// API 2: piped.video mirrors
// ════════════════════════════════════════════════════════════════════════════════
const api_piped = async (id) => {
    const mirrors = [
        'https://pipedapi.kavin.rocks','https://pipedapi.in','https://piped.smnz.de',
        'https://piped.adminforge.de','https://piped.moomoo.me','https://api.piped.yt',
        'https://pipedapi.tokhmi.xyz','https://pipedapi.syncpundit.io',
    ];
    for (const m of mirrors) {
        try {
            const r = await get(`${m}/streams/${id}`, { timeout: 10000 });
            const streams = (r.data?.audioStreams||[]).filter(s=>s.url).sort((a,b)=>(b.bitrate||0)-(a.bitrate||0));
            if (streams[0]?.url) return { url: streams[0].url, title: r.data?.title||'audio' };
        } catch (_) {}
    }
    throw new Error('piped: no working mirror');
};

// ════════════════════════════════════════════════════════════════════════════════
// API 3: invidious mirrors
// ════════════════════════════════════════════════════════════════════════════════
const api_inv = async (id) => {
    const instances = [
        'https://inv.nadeko.net','https://y.com.sb','https://invidious.nerdvpn.de',
        'https://yt.dragonrender.io','https://invidious.privacyredirect.com',
        'https://iv.melmac.space','https://invidious.incogniweb.net',
        'https://invidious.fdn.fr','https://invidious.tiekoetter.com',
    ];
    for (const inst of instances) {
        try {
            const r = await get(`${inst}/api/v1/videos/${id}`, { timeout: 10000 });
            const fmts = (r.data?.adaptiveFormats||[]).filter(f=>f.type?.includes('audio')).sort((a,b)=>(b.bitrate||0)-(a.bitrate||0));
            if (fmts[0]?.url) return { url: fmts[0].url, title: r.data?.title||'audio' };
        } catch (_) {}
    }
    throw new Error('invidious: no working instance');
};

// ════════════════════════════════════════════════════════════════════════════════
// API 4: y2mate
// ════════════════════════════════════════════════════════════════════════════════
const api_y2mate = async (ytUrl, id) => {
    const a = await post('https://www.y2mate.com/mates/analyzeV2/ajax',
        `k_query=https://youtube.com/watch?v=${id}&k_page=Youtube&hl=en&q_auto=0`,
        { headers: {'Content-Type':'application/x-www-form-urlencoded'}, timeout: 18000 });
    if (a.data?.status !== 'ok') throw new Error('y2: analyze failed');
    const mp3 = a.data?.links?.mp3 || {};
    const k = Object.keys(mp3)[0];
    if (!k) throw new Error('y2: no mp3 links');
    const c = await post('https://www.y2mate.com/mates/convertV2/index',
        `vid=${id}&k=${mp3[k].k}`,
        { headers: {'Content-Type':'application/x-www-form-urlencoded'}, timeout: 25000 });
    if (c.data?.dlink) return { url: c.data.dlink, title: a.data?.title||'audio' };
    throw new Error('y2: convert failed');
};

// ════════════════════════════════════════════════════════════════════════════════
// API 5: fabdl
// ════════════════════════════════════════════════════════════════════════════════
const api_fabdl = async (id) => {
    const r = await get(`https://api.fabdl.com/youtube/get?url=https://www.youtube.com/watch?v=${id}&type=mp3`);
    if (r.data?.result?.download_url) return { url: r.data.result.download_url, title: r.data.result.title||'audio' };
    const { process_id:pid, gid, title } = r.data?.result || {};
    if (!pid) throw new Error('fabdl: no process');
    for (let i = 0; i < 10; i++) {
        await new Promise(x => setTimeout(x, 2000));
        const p = await get(`https://api.fabdl.com/youtube/mp3convert-progress?id=${gid}&pid=${pid}`, { timeout: 8000 });
        if (p.data?.result?.download_url) return { url: p.data.result.download_url, title: title||'audio' };
    }
    throw new Error('fabdl: timeout');
};

// ════════════════════════════════════════════════════════════════════════════════
// API 6: yt1s.com (fast, no key)
// ════════════════════════════════════════════════════════════════════════════════
const api_yt1s = async (id) => {
    const a = await post('https://www.yt1s.com/api/ajaxSearch/index',
        `q=https://www.youtube.com/watch?v=${id}&vt=mp3`,
        { headers:{'Content-Type':'application/x-www-form-urlencoded','Referer':'https://www.yt1s.com/'}, timeout: 15000 });
    if (a.data?.status !== 'ok') throw new Error('yt1s: search failed');
    const links = a.data?.links?.mp3 || {};
    const key   = Object.keys(links).find(k => k.includes('128') || k.includes('mp3'));
    if (!key) throw new Error('yt1s: no mp3');
    const c = await post('https://www.yt1s.com/api/ajaxConvert/convert',
        `vid=${id}&k=${links[key].k}`,
        { headers:{'Content-Type':'application/x-www-form-urlencoded','Referer':'https://www.yt1s.com/'}, timeout: 20000 });
    if (c.data?.dlink) return { url: c.data.dlink, title: a.data?.title||'audio' };
    throw new Error('yt1s: convert failed');
};

// ════════════════════════════════════════════════════════════════════════════════
// API 7: mp3download.to
// ════════════════════════════════════════════════════════════════════════════════
const api_mp3dl = async (id) => {
    const r = await post('https://mp3download.to/api/json',
        { url: `https://www.youtube.com/watch?v=${id}`, type: 'mp3' },
        { headers:{'Origin':'https://mp3download.to','Referer':'https://mp3download.to/'}, timeout: 18000 });
    const u = r.data?.url || r.data?.download_url || r.data?.link;
    if (u) return { url: u, title: r.data?.title||'audio' };
    throw new Error('mp3dl: no url');
};

// ════════════════════════════════════════════════════════════════════════════════
// API 8: loader.to (y2mate sister)
// ════════════════════════════════════════════════════════════════════════════════
const api_loaderto = async (id) => {
    const a = await get(`https://loader.to/api/button/?url=https://www.youtube.com/watch?v=${id}&f=mp3`,
        { headers:{'Referer':'https://loader.to/'}, timeout: 12000 });
    const dlUrl = a.data?.url;
    if (dlUrl) return { url: dlUrl, title: 'audio' };
    throw new Error('loaderto: no url');
};

// ════════════════════════════════════════════════════════════════════════════════
// API 9: ndown.org
// ════════════════════════════════════════════════════════════════════════════════
const api_ndown = async (id) => {
    const r = await get(`https://ndown.org/api/download?url=https://www.youtube.com/watch?v=${id}&type=mp3`);
    const u = r.data?.link || r.data?.url || r.data?.data?.link;
    if (u) return { url: u, title: r.data?.title||'audio' };
    throw new Error('ndown: no link');
};

// ════════════════════════════════════════════════════════════════════════════════
// API 10: convert2mp3.net style (yt-download.org)
// ════════════════════════════════════════════════════════════════════════════════
const api_ytdl_org = async (id) => {
    const r = await get(`https://www.yt-download.org/api/button/mp3/${id}`,
        { headers:{'Referer':'https://www.yt-download.org/'}, timeout: 12000 });
    // Response is usually HTML with the download link
    if (typeof r.data === 'string') {
        const match = r.data.match(/href="(https?:\/\/[^"]+\.mp3[^"]*)"/i);
        if (match) return { url: match[1], title: 'audio' };
    }
    const u = r.data?.url || r.data?.link;
    if (u) return { url: u, title: r.data?.title||'audio' };
    throw new Error('ytdl_org: no url');
};

// ════════════════════════════════════════════════════════════════════════════════
// MAIN: dlAudio — parallel fast batch then sequential fallbacks
// ════════════════════════════════════════════════════════════════════════════════
const firstSuccess = (fns, timeoutMs) => new Promise((resolve, reject) => {
    let done = false, pending = fns.length;
    const errs = [];
    const timer = setTimeout(() => { if (!done) { done = true; reject(new Error('batch timeout')); } }, timeoutMs);
    for (const fn of fns) {
        Promise.resolve().then(fn)
            .then(r => { if (!done && r?.url) { done = true; clearTimeout(timer); resolve(r); } else { pending--; if (pending === 0 && !done) reject(new Error('all failed')); } })
            .catch(e => { errs.push(e.message); pending--; if (pending === 0 && !done) reject(new Error('all failed: ' + errs[0])); });
    }
});

const dlAudio = async (ytUrl) => {
    const id = ytId(ytUrl);
    if (!id && /^https?:\/\//i.test(ytUrl)) return { url: ytUrl, title: 'audio', thumb: '' };
    if (!id) throw new Error('Invalid YouTube URL');

    // Batch 1: fastest (parallel, 16s window)
    try {
        const r = await firstSuccess([
            () => api_cobalt(ytUrl),
            () => api_piped(id),
            () => api_ndown(id),
        ], 16000);
        if (r?.url) { console.log('  ✔ [music] batch-1'); return { ...r, thumb: '' }; }
    } catch (_) {}

    // Batch 2: medium (parallel, 22s window)
    try {
        const r = await firstSuccess([
            () => api_inv(id),
            () => api_y2mate(ytUrl, id),
            () => api_yt1s(id),
        ], 22000);
        if (r?.url) { console.log('  ✔ [music] batch-2'); return { ...r, thumb: '' }; }
    } catch (_) {}

    // Batch 3: last resort (parallel, 28s window)
    try {
        const r = await firstSuccess([
            () => api_fabdl(id),
            () => api_mp3dl(id),
            () => api_loaderto(id),
            () => api_ytdl_org(id),
        ], 28000);
        if (r?.url) { console.log('  ✔ [music] batch-3'); return { ...r, thumb: '' }; }
    } catch (_) {}

    throw new Error('Music unavailable — all 10 APIs failed. Try again in 30 seconds.');
};

// ════════════════════════════════════════════════════════════════════════════════
// MAIN: dlVideo
// ════════════════════════════════════════════════════════════════════════════════
const dlVideo = async (ytUrl, quality = '360') => {
    const id = ytId(ytUrl);
    // cobalt instances
    try {
        const instances = await getCobaltInstances();
        for (const ep of instances.slice(0, 3)) {
            try {
                const r = await axios.post(`${ep}/api/json`,
                    { url: ytUrl, isAudioOnly: false, vQuality: quality },
                    { headers: { 'User-Agent': UAB, 'Content-Type': 'application/json', 'Accept': 'application/json' }, timeout: 14000 });
                const u = r.data?.url || r.data?.video;
                if (u) return { url: u, title: r.data?.filename||'video', thumb: '' };
            } catch (_) {}
        }
    } catch (_) {}
    // piped video
    if (id) {
        for (const m of ['https://pipedapi.kavin.rocks','https://pipedapi.in','https://piped.smnz.de']) {
            try {
                const r = await get(`${m}/streams/${id}`, { timeout: 10000 });
                const streams = (r.data?.videoStreams||[]).filter(s=>s.url).sort((a,b)=>parseInt(b.quality||0)-parseInt(a.quality||0));
                if (streams[0]?.url) return { url: streams[0].url, title: r.data?.title||'video', thumb: '' };
            } catch (_) {}
        }
    }
    throw new Error('Video download failed — try again');
};

const sendAudio = async (sock, m, result, asDoc = false) => {
    const fname = safe(result.title||'audio', 'mp3');
    try {
        await sock.sendMessage(m.chat,
            asDoc ? { document:{url:result.url}, mimetype:'audio/mpeg', fileName:fname }
                  : { audio:{url:result.url}, mimetype:'audio/mpeg', fileName:fname, ptt:false },
            { quoted: m });
    } catch (_) {
        await sock.sendMessage(m.chat, { document:{url:result.url}, mimetype:'audio/mpeg', fileName:fname }, { quoted: m });
    }
};

const sendVideo = async (sock, m, result, caption) =>
    sock.sendMessage(m.chat, {
        video:{url:result.url}, mimetype:'video/mp4',
        fileName:safe(result.title||'video','mp4'),
        caption: caption || `🎬 *${result.title||'Video'}*\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`,
    }, { quoted: m });

const fmtDur = v => v?.duration?.timestamp || v?.duration || '';

module.exports = { dlAudio, dlVideo, sendAudio, sendVideo, fmtDur, ytId, safe };

};

// ── module: library/exif.js ────────────────────────────────────────────────
__bundleModules["library/exif"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// LIAM EYES — exif.js (jimp v1 compatible)

const fs      = require('fs')
const { tmpdir } = require('os')
const Crypto  = require('crypto')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ff      = require('fluent-ffmpeg')
const webp    = require('node-webpmux')
const path    = require('path')
ff.setFfmpegPath(ffmpegPath)

const tmpRand = (ext) => path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0,6).toString(36)}.${ext}`)

async function imageToWebp(media) {
    const tmpOut = tmpRand('webp')
    const tmpIn  = tmpRand('jpg')
    fs.writeFileSync(tmpIn, media)
    await new Promise((resolve, reject) => {
        ff(tmpIn)
            .on('error', reject)
            .on('end', () => resolve(true))
            .addOutputOptions([
                '-vcodec', 'libwebp',
                '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse"
            ])
            .toFormat('webp').save(tmpOut)
    })
    const buff = fs.readFileSync(tmpOut)
    try { fs.unlinkSync(tmpOut); fs.unlinkSync(tmpIn) } catch (_) {}
    return buff
}

async function videoToWebp(media) {
    const tmpOut = tmpRand('webp')
    const tmpIn  = tmpRand('mp4')
    fs.writeFileSync(tmpIn, media)
    await new Promise((resolve, reject) => {
        ff(tmpIn)
            .on('error', reject)
            .on('end', () => resolve(true))
            .addOutputOptions([
                '-vcodec', 'libwebp',
                '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
                '-loop', '0', '-ss', '00:00:00', '-t', '00:00:05',
                '-preset', 'default', '-an', '-vsync', '0'
            ])
            .toFormat('webp').save(tmpOut)
    })
    const buff = fs.readFileSync(tmpOut)
    try { fs.unlinkSync(tmpOut); fs.unlinkSync(tmpIn) } catch (_) {}
    return buff
}

function buildExif(packname, author, categories = ['']) {
    const json = {
        'sticker-pack-id':        Crypto.randomBytes(16).toString('hex'),
        'sticker-pack-name':      packname || 'LIAM EYES',
        'sticker-pack-publisher': author   || 'Liam',
        'emojis':                 categories,
    }
    const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00])
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
    const exif = Buffer.concat([exifAttr, jsonBuff])
    exif.writeUIntLE(jsonBuff.length, 14, 4)
    return exif
}

async function writeExifImg(media, metadata) {
    const wMedia  = await imageToWebp(media)
    const tmpIn   = tmpRand('webp')
    const tmpOut  = tmpRand('webp')
    fs.writeFileSync(tmpIn, wMedia)
    const img = new webp.Image()
    await img.load(tmpIn)
    try { fs.unlinkSync(tmpIn) } catch (_) {}
    img.exif = buildExif(metadata.packname, metadata.author, metadata.categories)
    await img.save(tmpOut)
    return tmpOut
}

async function writeExifVid(media, metadata) {
    const wMedia  = await videoToWebp(media)
    const tmpIn   = tmpRand('webp')
    const tmpOut  = tmpRand('webp')
    fs.writeFileSync(tmpIn, wMedia)
    const img = new webp.Image()
    await img.load(tmpIn)
    try { fs.unlinkSync(tmpIn) } catch (_) {}
    img.exif = buildExif(metadata.packname, metadata.author, metadata.categories)
    await img.save(tmpOut)
    return tmpOut
}

async function writeExif(media, metadata) {
    let wMedia
    if (/webp/.test(media.mimetype))   wMedia = media.data
    else if (/image/.test(media.mimetype)) wMedia = await imageToWebp(media.data)
    else if (/video/.test(media.mimetype)) wMedia = await videoToWebp(media.data)
    else return null
    const tmpIn  = tmpRand('webp')
    const tmpOut = tmpRand('webp')
    fs.writeFileSync(tmpIn, wMedia)
    const img = new webp.Image()
    await img.load(tmpIn)
    try { fs.unlinkSync(tmpIn) } catch (_) {}
    img.exif = buildExif(metadata.packname, metadata.author, metadata.categories)
    await img.save(tmpOut)
    return tmpOut
}

async function addExif(webpSticker, packname, author, categories = ['']) {
    const img = new webp.Image()
    await img.load(webpSticker)
    img.exif = buildExif(packname, author, categories)
    return await img.save(null)
}

async function exifAvatar(buffer, packname, author, categories = [''], extra = {}) {
    const img = new webp.Image()
    const json = { 'sticker-pack-id': 'liam-eyes', 'sticker-pack-name': packname, 'sticker-pack-publisher': author, 'emojis': categories, 'is-avatar-sticker': 1, ...extra }
    const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00])
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf8')
    const exif = Buffer.concat([exifAttr, jsonBuff])
    exif.writeUIntLE(jsonBuff.length, 14, 4)
    await img.load(buffer)
    img.exif = exif
    return await img.save(null)
}

module.exports = { imageToWebp, videoToWebp, writeExifImg, writeExifVid, writeExif, exifAvatar, addExif }

};

// ── module: library/function.js ────────────────────────────────────────────
__bundleModules["library/function"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// LIAM EYES — function.js (compatible: no human-readable, no crypto-js, jimp v1 API)

const axios  = require('axios')
const moment = require('moment-timezone')
const util   = require('util')
const vm     = require('vm')

const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000)

const resize = async (image, width, height) => {
    const Jimp = require('jimp')
    const img = await Jimp.read(image)
    return await img.resize({ w: width, h: height }).getBuffer('image/jpeg')
}

const generateMessageTag = (epoch) => {
    let tag = unixTimestampSeconds().toString()
    if (epoch) tag += '.--' + epoch
    return tag
}

const processTime = (timestamp, now) => {
    return moment.duration(now - moment(timestamp * 1000)).asSeconds()
}

const clockString = (ms) => {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

const runtime = (seconds) => {
    seconds = Number(seconds)
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    const dD = d > 0 ? `${d} day${d>1?'s':''}, ` : ''
    const dH = h > 0 ? `${h} hour${h>1?'s':''}, ` : ''
    const dM = m > 0 ? `${m} minute${m>1?'s':''}, ` : ''
    const dS = s > 0 ? `${s} second${s>1?'s':''}` : ''
    return (dD + dH + dM + dS).trim().replace(/,\s*$/, '') || '0 seconds'
}

const getTime = (format, date) => {
    if (date) return moment(date).tz('Asia/Kolkata').locale('en-in').format(format)
    return moment.tz('Asia/Kolkata').locale('en-in').format(format)
}

const formatDate = (dateValue, locale = 'en-IN') => {
    return new Date(dateValue).toLocaleDateString(locale, {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric', timeZone: 'Asia/Kolkata'
    })
}

const formatDateIndia = (inputDate) => {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const d = new Date(inputDate)
    return `${days[d.getDay()]}, ${d.getDate()} - ${months[d.getMonth()]} - ${d.getFullYear()}`
}

const getRandom = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`

const getBuffer = async (url, options = {}) => {
    try {
        const res = await axios({
            method: 'get', url,
            headers: { 'DNT': 1, 'Upgrade-Insecure-Request': 1 },
            ...options, responseType: 'arraybuffer'
        })
        return res.data
    } catch (err) { return err }
}

const fetchJson = async (url, options = {}) => {
    try {
        const res = await axios({ method: 'GET', url, headers: { 'User-Agent': 'Mozilla/5.0' }, ...options })
        return res.data
    } catch (err) { return err }
}

// Native size formatter — replaces 'human-readable' package
const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i]
}

const formatp = (bytes) => formatSize(bytes)

const bytesToSize = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024, dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes','KB','MB','GB','TB','PB','EB','ZB','YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const getSizeMedia = (p) => new Promise((resolve, reject) => {
    if (/http/.test(p)) {
        axios.get(p).then(res => {
            const len = parseInt(res.headers['content-length'])
            if (!isNaN(len)) resolve(bytesToSize(len, 3))
        }).catch(reject)
    } else if (Buffer.isBuffer(p)) {
        const len = Buffer.byteLength(p)
        if (!isNaN(len)) resolve(bytesToSize(len, 3))
    } else reject('Invalid path or buffer')
})

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const isUrl = (url) => url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'))

const jsonformat = (string) => JSON.stringify(string, null, 2)
const format     = (...args) => util.format(...args)

const parseMention = (text = '') => [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')

const getGroupAdmins = (participants) => {
    let admins = []
    for (let i of participants) {
        if (i.admin === 'superadmin' || i.admin === 'admin') admins.push(i.id)
    }
    return admins
}

const generateProfilePicture = async (buffer) => {
    const Jimp = require('jimp')
    const image = await Jimp.read(buffer)
    const w = image.bitmap.width, h = image.bitmap.height
    const cropped = image.crop({ x: 0, y: 0, w, h })
    return {
        img:     await cropped.scaleToFit({ w: 720, h: 720 }).getBuffer('image/jpeg'),
        preview: await cropped.scaleToFit({ w: 720, h: 720 }).getBuffer('image/jpeg')
    }
}

// AES decrypt using Node built-in crypto — no crypto-js needed
const dechtml = async (buffer) => {
    const crypto = require('crypto')
    const html = buffer.toString('utf8')

    if (/const chunks =/.test(html)) {
        const c = html.match(/const chunks = (\[[\s\S]*?\]);/)[1]
        const k = html.match(/const splitKey = (\[[\s\S]*?\]);/)[1]
        const v = html.match(/const splitIv = (\[[\s\S]*?\]);/)[1]
        const s = {}
        vm.createContext(s)
        vm.runInContext(`chunks=${c}`, s)
        vm.runInContext(`splitKey=${k}`, s)
        vm.runInContext(`splitIv=${v}`, s)
        const key = Buffer.from(s.splitKey[0].concat(s.splitKey[1]).map(Number))
        const iv  = Buffer.from(s.splitIv[0].concat(s.splitIv[1]).map(Number))
        const cipher = Buffer.from(s.chunks.join(''), 'base64')
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
        return Buffer.concat([decipher.update(cipher), decipher.final()])
    }

    if (/atob\(/.test(html)) {
        const base64  = html.match(/atob\(["'`]([^"'`]+)["'`]\)/)[1]
        const decoded = Buffer.from(base64, 'base64')
        let text
        try { text = decodeURIComponent(unescape(decoded.toString('binary'))) }
        catch { text = decoded.toString('utf8') }
        return Buffer.from(text, 'utf8')
    }

    return Buffer.from(html, 'utf8')
}

const fetchWithTimeout = async (url, ms) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), ms)
    try {
        const res = await axios.get(url, { signal: controller.signal })
        return res
    } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError')
            throw new Error(`Request timed out after ${ms}ms`)
        throw err
    } finally { clearTimeout(timeout) }
}

module.exports = {
    unixTimestampSeconds, resize, generateMessageTag, processTime,
    getRandom, getBuffer, formatSize, fetchJson, runtime, clockString,
    sleep, isUrl, getTime, formatDate, formatDateIndia, formatp,
    jsonformat, format, generateProfilePicture, bytesToSize,
    getSizeMedia, parseMention, getGroupAdmins, dechtml, fetchWithTimeout
}

};

// ── module: library/liam.js ────────────────────────────────────────────────
__bundleModules["library/liam"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ─────────────────────────────────────────────────────────────────
//  LIAM EYES — Cipher utilities
//  Provides decryption for protected config values
// ─────────────────────────────────────────────────────────────────
'use strict';

const _K = Buffer.from('LIAMEYES');

/** Decrypt XOR+base64 encoded string */
const decrypt = enc => {
    const buf = Buffer.from(enc, 'base64');
    return Buffer.from(buf.map((b, i) => b ^ _K[i % _K.length])).toString();
};

/** Encrypt string to XOR+base64 */
const encrypt = str => {
    const buf = Buffer.from(str);
    return Buffer.from(buf.map((b, i) => b ^ _K[i % _K.length])).toString('base64');
};

/** Simple anti-tamper marker — embedded in output */
const SIGNATURE = Buffer.from('LIAMEYES\x01\x09Alpha').toString('base64');

module.exports = { decrypt, encrypt, SIGNATURE };

};

// ── module: library/quoted.js ──────────────────────────────────────────────
__bundleModules["library/quoted"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;

// © 2025 Debraj. All Rights Reserved.
// respect the work, don’t just copy-paste.

const fs = require('fs')

const fquoted = {
    channel: {
        key: {
            fromMe: false,
            participant: "0@s.whatsapp.net",
            remoteJid: "27796262030@s.whatsapp.net"
        },
        message: {
            newsletterAdminInviteMessage: {
                newsletterJid: "0@newsletter",
                newsletterName: " X ",
                caption: "DEBRAJ WA SIMPLE BASE BOT",
                inviteExpiration: "0"
            }
        }
    }
};

module.exports = { fquoted };


};

// ── module: library/serialize.js ───────────────────────────────────────────
__bundleModules["library/serialize"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// © 2025 Liam — serialize.js for @whiskeysockets/baileys rc.9+
// sock.decodeJid removed — use jidNormalizedUser directly
'use strict';
const {
    jidNormalizedUser,
    proto,
    getContentType,
    areJidsSameUser,
} = require('@whiskeysockets/baileys');

// Safe jid decoder — replaces removed sock.decodeJid
const decodeJid = raw => {
    if (!raw) return raw;
    const str = String(raw);
    // strip device suffix :XX@ → @
    return str.replace(/:\d+@/, '@').trim() || str;
};

const smsg = async (sock, m, store) => {
    if (!m) return m;
    const M = proto.WebMessageInfo;

    if (m.key) {
        m.id      = m.key.id;
        m.chat    = m.key.remoteJid;
        m.fromMe  = m.key.fromMe;
        m.isGroup = (m.chat || '').endsWith('@g.us');
        m.from    = (m.chat || '').startsWith('status')
            ? jidNormalizedUser(m.key?.participant || m.participant || m.chat)
            : jidNormalizedUser(m.chat);
        m.sender  = decodeJid(
            m.fromMe && sock.user?.id ||
            m.key.participant || m.participant || m.chat || ''
        );
        if (m.isGroup) m.participant = decodeJid(m.key.participant) || '';
        m.isBaileys = (m.id || '').startsWith('BAE5') && m.id.length === 16;
    }

    if (m.message) {
        // Unwrap wrappers
        if (m.message.ephemeralMessage)
            m.message = m.message.ephemeralMessage.message;
        if (m.message.viewOnceMessage)
            m.message = m.message.viewOnceMessage.message;
        if (m.message.viewOnceMessageV2)
            m.message = m.message.viewOnceMessageV2.message;

        m.mtype = getContentType(m.message);
        m.msg   = m.mtype ? m.message[m.mtype] : null;

        // Safe body
        m.body = '';
        try {
            m.body =
                m.message.conversation                                                      ||
                m.msg?.caption                                                              ||
                m.msg?.text                                                                 ||
                (m.mtype === 'extendedTextMessage'      && m.msg?.text)                    ||
                (m.mtype === 'listResponseMessage'      && m.msg?.singleSelectReply?.selectedRowId) ||
                (m.mtype === 'buttonsResponseMessage'   && m.msg?.selectedButtonId)        ||
                (m.mtype === 'templateButtonReplyMessage' && m.msg?.selectedId)            ||
                m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || '';
        } catch (_) { m.body = ''; }
        m.text = m.body;

        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];

        // Quoted
        const rawQuoted = m.msg?.contextInfo?.quotedMessage;
        m.quoted = null;
        if (rawQuoted) {
            try {
                const qtype = getContentType(rawQuoted);
                let qmsg = rawQuoted[qtype];
                if (['productMessage'].includes(qtype)) {
                    const qt2 = getContentType(qmsg);
                    qmsg = qmsg?.[qt2];
                }
                if (typeof qmsg === 'string') qmsg = { text: qmsg };
                m.quoted = qmsg || {};
                m.quoted.mtype    = qtype;
                m.quoted.key      = {
                    remoteJid:   m.msg.contextInfo.remoteJid || m.from,
                    participant: jidNormalizedUser(m.msg.contextInfo.participant),
                    fromMe:      areJidsSameUser(
                        jidNormalizedUser(m.msg.contextInfo.participant),
                        jidNormalizedUser(sock?.user?.id)
                    ),
                    id: m.msg.contextInfo.stanzaId,
                };
                m.quoted.id       = m.msg.contextInfo.stanzaId;
                m.quoted.chat     = m.msg.contextInfo.remoteJid || m.chat;
                m.quoted.from     = /g\.us|status/.test(m.quoted.chat)
                    ? m.quoted.key.participant : m.quoted.chat;
                m.quoted.sender   = decodeJid(m.msg.contextInfo.participant);
                m.quoted.fromMe   = m.quoted.sender === sock.user?.id;
                m.quoted.text     = qmsg?.text || qmsg?.caption || qmsg?.conversation ||
                                    qmsg?.contentText || qmsg?.selectedDisplayText || qmsg?.title || '';
                m.quoted.mentionedJid = m.msg.contextInfo.mentionedJid || [];
                m.quoted.download = () => sock.downloadMediaMessage(
                    M.fromObject({ key: m.quoted.key, message: rawQuoted })
                );
                m.getQuotedObj = m.getQuotedMessage = async () => {
                    if (!m.quoted.id) return false;
                    const q = await store.loadMessage(m.chat, m.quoted.id);
                    return q ? smsg(sock, q, store) : false;
                };
            } catch (_) { m.quoted = null; }
        }
    } else {
        m.body = ''; m.text = ''; m.mtype = ''; m.msg = null;
        m.quoted = null; m.mentionedJid = [];
    }

    if (m.msg?.url) m.download = () => sock.downloadMediaMessage(m.msg);

    return m;
};

module.exports = { smsg };

};

// ── module: library/store.js ───────────────────────────────────────────────
__bundleModules["library/store"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ╔═══════════════════════════════════════════════════════════╗
// ║  LIAM LITE — persistent JSON store (groups, sudo, etc.) ║
// ╚═══════════════════════════════════════════════════════════╝
'use strict';
const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'Resources', 'store.json');

const defaults = {
    sudo:           [],   // sudo numbers (owner-level)
    botadmin:       [],   // bot admin numbers (group admin cmds)
    antilinkGroups: {},   // { jid: { mode:'warn'|'delete'|'kick', warns:{} } }
    antideleteOn:   true,
};

const load = () => {
    try {
        if (fs.existsSync(FILE)) return { ...defaults, ...JSON.parse(fs.readFileSync(FILE,'utf8')) };
    } catch(_) {}
    return { ...defaults };
};

const save = (data) => {
    try { fs.writeFileSync(FILE, JSON.stringify(data, null, 2)); } catch(_) {}
};

let _data = load();

const get  = (key) => _data[key];
const set  = (key, val) => { _data[key] = val; save(_data); };
const push = (key, val) => { if (!_data[key]) _data[key]=[]; if(!_data[key].includes(val)){_data[key].push(val); save(_data);} };
const pull = (key, val) => { _data[key]=(_data[key]||[]).filter(x=>x!==val); save(_data); };
const reload = () => { _data = load(); };

// antilink helpers
const antilinkGet = (jid) => (_data.antilinkGroups||{})[jid] || null;
const antilinkSet = (jid, obj) => {
    if (!_data.antilinkGroups) _data.antilinkGroups = {};
    _data.antilinkGroups[jid] = obj;
    save(_data);
};
const antilinkDel = (jid) => {
    if (_data.antilinkGroups) { delete _data.antilinkGroups[jid]; save(_data); }
};

// sudo helpers
const isSudo = (num) => {
    const n = num.replace(/[^0-9]/g,'');
    return (_data.sudo||[]).map(x=>x.replace(/[^0-9]/g,'')).includes(n);
};
const isBotAdmin = (num) => {
    const n = num.replace(/[^0-9]/g,'');
    return (_data.botadmin||[]).map(x=>x.replace(/[^0-9]/g,'')).includes(n);
};

module.exports = { get, set, push, pull, reload, antilinkGet, antilinkSet, antilinkDel, isSudo, isBotAdmin };

};

// ── module: library/updater.js ─────────────────────────────────────────────
__bundleModules["library/updater"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  LIAM EYES — updater.js  (auto-update + .update command)               ║
// ║  • Checks GitHub on startup (60s delay) then every N hours             ║
// ║  • Respects settings.autoUpdate = true/false                           ║
// ║  • Uses git pull if repo cloned, else ZIP download fallback            ║
// ║  • Skips sessions/, settings/, .env — never overwrites user config     ║
// ╚══════════════════════════════════════════════════════════════════════════╝
'use strict';

const axios  = require('axios');
const fs     = require('fs');
const path   = require('path');
const { execSync, exec } = require('child_process');
const { promisify }      = require('util');
const execP  = promisify(exec);

const ROOT         = __dirname;
const VERSION_FILE = path.join(ROOT, '.liam_version');
const REPO_OWNER   = 'Dialmw';
const REPO_NAME    = 'LIAM-EYES-';
const REPO_API     = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/main`;
const REPO_ZIP     = `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/refs/heads/main.zip`;
const sig          = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

// ── Helpers ───────────────────────────────────────────────────────────────
const isGit = () => {
    try { execSync(`git -C "${ROOT}" rev-parse HEAD`, { stdio:'ignore' }); return true; }
    catch { return false; }
};

const isPm2 = () => {
    try { execSync('pm2 -v', { stdio:'ignore' }); return true; }
    catch { return false; }
};

const getLocalSha = () => {
    try {
        if (fs.existsSync(VERSION_FILE)) return fs.readFileSync(VERSION_FILE, 'utf8').trim().slice(0, 7);
        if (isGit()) return execSync(`git -C "${ROOT}" rev-parse HEAD`, { encoding:'utf8' }).trim().slice(0, 7);
    } catch(_) {}
    return null;
};

const setLocalSha = sha => {
    try { fs.writeFileSync(VERSION_FILE, sha.slice(0, 7)); } catch(_) {}
};

const getRemoteSha = async () => {
    const { data } = await axios.get(REPO_API, {
        timeout: 15000,
        headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'LIAM-EYES-Bot' },
    });
    return {
        sha:     data.sha.slice(0, 7),
        fullSha: data.sha,
        msg:     (data.commit?.message || '').split('\n')[0].slice(0, 80),
        date:    data.commit?.author?.date || '',
    };
};

const gitPull = async () => {
    const { stdout, stderr } = await execP(`git -C "${ROOT}" pull --rebase origin main 2>&1`);
    return (stdout + stderr).trim().slice(0, 300);
};

// ── ZIP update (when not a git clone) ────────────────────────────────────
const zipUpdate = async () => {
    const os_  = require('os');
    const tmpZ = path.join(os_.tmpdir(), 'liam_eyes_upd.zip');
    const tmpD = path.join(os_.tmpdir(), 'liam_eyes_upd_ext');

    console.log('[UPDATER] Downloading ZIP…');
    const { data } = await axios.get(REPO_ZIP, {
        responseType: 'arraybuffer',
        timeout:      120000,
        headers:      { 'User-Agent': 'LIAM-EYES-Bot', Accept: 'application/zip' },
    });
    if (!data || data.byteLength < 1000) throw new Error('Empty ZIP response');
    fs.writeFileSync(tmpZ, Buffer.from(data));

    if (fs.existsSync(tmpD)) await execP(`rm -rf "${tmpD}"`).catch(() => {});
    fs.mkdirSync(tmpD, { recursive: true });
    await execP(`unzip -o "${tmpZ}" -d "${tmpD}" 2>&1`);

    const items     = fs.readdirSync(tmpD);
    const extracted = items.find(d => /liam.eyes/i.test(d) || /dialmw/i.test(d)) || items[0];
    if (!extracted) throw new Error(`No extracted folder. Contents: ${items.join(', ')}`);

    const srcDir = path.join(tmpD, extracted);
    if (!fs.statSync(srcDir).isDirectory()) throw new Error(`Not a directory: ${extracted}`);

    // Never overwrite user config / session files
    const SKIP = new Set([
        'sessions', 'settings', '.liam_version', 'README.md',
        '.env', 'PANEL_SETUP.md', 'node_modules',
    ]);

    const copyDir = (src, dst) => {
        fs.mkdirSync(dst, { recursive: true });
        for (const item of fs.readdirSync(src)) {
            if (SKIP.has(item)) continue;
            const s = path.join(src, item);
            const d = path.join(dst, item);
            try {
                fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
            } catch(_) {}
        }
    };

    copyDir(srcDir, ROOT);
    await execP(`rm -rf "${tmpD}" "${tmpZ}"`).catch(() => {});
    return `ZIP applied from ${extracted}`;
};

const npmInstall = async () => {
    await execP(`npm install --prefix "${ROOT}" --no-audit --no-fund 2>&1`)
        .catch(e => console.log('[npm]', e.message));
};

// ── Graceful restart ──────────────────────────────────────────────────────
const gracefulRestart = async (reply) => {
    if (isPm2()) {
        try {
            await execP(`pm2 restart "${process.env.PM2_APP_NAME || 'LIAM-EYES'}" 2>&1`);
        } catch(_) {}
        setTimeout(() => process.exit(0), 2000);
        return;
    }
    if (process.env.NODEMON) {
        setTimeout(() => process.kill(process.pid, 'SIGUSR2'), 500);
        return;
    }
    if (reply) {
        await reply(
            `✅ *Update applied!*\n\n` +
            `⚠️ *Restart required:*\n` +
            `• pm2: \`pm2 restart LIAM-EYES\`\n` +
            `• Termux/VPS: Ctrl+C → \`npm start\`\n` +
            `• Render: will auto-restart on next deploy\n\n${sig()}`
        );
    }
};

// ── Core update logic ─────────────────────────────────────────────────────
const runUpdate = async () => {
    const remote   = await getRemoteSha();
    const localSha = getLocalSha();

    // Up to date?
    if (localSha && (localSha === remote.sha || remote.fullSha.startsWith(localSha))) {
        return { upToDate: true, sha: localSha };
    }

    // Apply update
    let log = '', method = '';
    try {
        if (isGit()) {
            try { log = await gitPull(); method = 'git'; }
            catch(e) { log = await zipUpdate(); method = 'zip(git-fail)'; }
        } else {
            log = await zipUpdate();
            method = 'zip';
        }
    } catch(e) {
        throw new Error(`Update apply failed (${method}): ${e.message}`);
    }

    await npmInstall();
    setLocalSha(remote.sha);
    return { upToDate: false, sha: remote.sha, msg: remote.msg, log, method };
};

// ── Silent auto-update (called on schedule) ───────────────────────────────
const autoUpdate = async (sock) => {
    // Only run on parent process, not child instances
    if (process.env.LIAM_INSTANCE_ID) return;

    const cfg = (() => { try { return require('./settings'); } catch { return {}; } })();
    if (!cfg.autoUpdate && cfg.autoUpdate !== undefined) return; // disabled in settings

    const ownerJid = (sock?.user?.id || '').split(':')[0].split('@')[0] + '@s.whatsapp.net';
    if (!ownerJid || ownerJid === '@s.whatsapp.net') return;

    try {
        const result = await runUpdate();
        if (result.upToDate) {
            console.log(`[UPDATER] Already at latest (${result.sha})`);
            return;
        }
        console.log(`[UPDATER] ✅ Updated to ${result.sha} via ${result.method}`);
        sock.sendMessage(ownerJid, {
            text:
                `✅ *LIAM EYES Auto-Updated!*\n\n` +
                `🔖 Version: \`${result.sha}\`\n` +
                `📝 ${result.msg}\n` +
                `🔧 Method: ${result.method}\n\n` +
                `⚠️ Restart the bot to apply.\n\n${sig()}`
        }).catch(() => {});
        await gracefulRestart(null);
    } catch(e) {
        console.log(`[UPDATER] Auto-update failed: ${e.message}`);
    }
};

// ── Start the scheduled checker ───────────────────────────────────────────
const startChecker = (sock) => {
    // Skip for child instances — only parent handles updates
    if (process.env.LIAM_INSTANCE_ID) return;

    const cfg = (() => { try { return require('./settings'); } catch { return {}; } })();
    if (cfg.autoUpdate === false) {
        console.log('[UPDATER] Auto-update disabled in settings.');
        return;
    }

    const hours = Math.max(1, cfg.autoUpdateInterval || 48);
    const ms    = hours * 60 * 60 * 1000;

    // First check 90s after startup (give WA connection time to settle)
    setTimeout(() => autoUpdate(sock).catch(() => {}), 90 * 1000);

    // Repeat every N hours
    setInterval(() => autoUpdate(sock).catch(() => {}), ms);
    console.log(`[UPDATER] Auto-update enabled — checking every ${hours}h`);
};

// ── Manual .update command ────────────────────────────────────────────────
const doUpdate = async (sock, m, reply) => {
    await reply(`🔍 *Checking GitHub for updates…*\n\n${sig()}`);

    let remote;
    try { remote = await getRemoteSha(); }
    catch(e) {
        return reply(`❌ *GitHub unreachable:* ${e.message}\n\n_Check internet connection & retry_\n\n${sig()}`);
    }

    const localSha = getLocalSha();
    const date     = remote.date ? new Date(remote.date).toLocaleDateString() : '?';

    if (localSha && (localSha === remote.sha || remote.fullSha.startsWith(localSha))) {
        return reply(
            `✅ *Already up to date!*\n\n` +
            `📌 Version: \`${localSha}\`\n` +
            `📅 Commit date: ${date}\n\n${sig()}`
        );
    }

    await reply(
        `📦 *Update available!*\n\n` +
        `Current : \`${localSha || 'unknown'}\`\n` +
        `Latest  : \`${remote.sha}\`\n` +
        `📝 ${remote.msg}\n` +
        `📅 ${date}\n\n` +
        `⏳ Downloading & applying…\n\n${sig()}`
    );

    let result;
    try {
        result = await runUpdate();
    } catch(e) {
        return reply(
            `❌ *Update failed!*\n\n${e.message}\n\n` +
            `Try manually:\n\`git pull && npm install\`\n\n${sig()}`
        );
    }

    await reply(
        `✅ *Update applied!*\n\n` +
        `🔖 \`${result.sha}\` via ${result.method}\n` +
        `📝 ${result.msg}\n\n${sig()}`
    );

    await gracefulRestart(reply);
};

module.exports = { startChecker, doUpdate, getLocalSha, autoUpdate };

};

// ── module: library/uploader.js ────────────────────────────────────────────
__bundleModules["library/uploader"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;

// © 2025 Debraj. All Rights Reserved.
// respect the work, don’t just copy-paste.

const FormData = require("form-data");
const fetch = require("node-fetch")

async function tempfiles(buffer, filename = "debrajzero.jpg") {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const form = new FormData();
    form.append("file", buf, { 
        filename: filename, 
        contentType: "image/jpeg"
    });
    
    const res = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    });
    
    const json = await res.json();
    const idMatch = json.data.url.match(/\/(\d+)\//);
    const id = idMatch[1];
    return `https://tmpfiles.org/dl/${id}/${filename}`;
}

module.exports = { tempfiles };

};

// ── module: plugins/advanced_features.js ───────────────────────────────────
__bundleModules["plugins/advanced_features"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ─────────────────────────────────────────────────────────────────
//  LIAM EYES — Advanced Features Plugin
//  Commands: password, encode, decode, bmi, currency, trivia,
//            advice, cat, dog, color, morse, binary, qr,
//            emojimix, avatar, joke2, wyr, compliment2, reverse,
//            poll, remindme, serverinfo
// ─────────────────────────────────────────────────────────────────
const axios  = require('axios');
const crypto = require('crypto');
const config = require('./settings');
const os     = require('os');

// ── Shared reply card helper ─────────────────────────────────────
const card = (sock, m, text) => sock.sendMessage(m.chat, {
    text
}, { quoted: m });

module.exports = [

    // ── 🔑 Password Generator ──────────────────────────────────────
    {
        command: 'password',
        description: 'Generate a secure random password',
        category: 'utility',
        execute: async (sock, m, { args, prefix, reply }) => {
            const len = Math.min(Math.max(parseInt(args[0]) || 16, 6), 64);
            const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}';
            const bytes = crypto.randomBytes(len);
            const pwd   = Array.from(bytes).map(b => charset[b % charset.length]).join('');
            const strength = len >= 20 ? '🟢 Strong' : len >= 12 ? '🟡 Medium' : '🔴 Weak';
            await sock.sendMessage(m.chat, { react: { text: '🔑', key: m.key } });
            reply(
                `🔑 *Password Generator*\n\n` +
                `\`\`\`${pwd}\`\`\`\n\n` +
                `> 📏 Length: ${len}\n` +
                `> 💪 Strength: ${strength}\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ── 🔐 Base64 Encode ───────────────────────────────────────────
    {
        command: 'encode',
        description: 'Encode text to Base64',
        category: 'utility',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text) return reply(`🔐 Usage: *${prefix}encode Hello World*`);
            const encoded = Buffer.from(text).toString('base64');
            reply(`🔐 *Base64 Encode*\n\nInput: \`${text.slice(0, 60)}\`\n\nOutput:\n\`\`\`${encoded}\`\`\`\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },

    // ── 🔓 Base64 Decode ───────────────────────────────────────────
    {
        command: 'decode',
        description: 'Decode Base64 text',
        category: 'utility',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text) return reply(`🔓 Usage: *${prefix}decode SGVsbG8gV29ybGQ=*`);
            try {
                const decoded = Buffer.from(text.trim(), 'base64').toString('utf8');
                reply(`🔓 *Base64 Decode*\n\nInput: \`${text.slice(0, 60)}\`\n\nOutput:\n\`\`\`${decoded}\`\`\`\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
            } catch { reply('❌ Invalid Base64 string!'); }
        }
    },

    // ── 💪 BMI Calculator ──────────────────────────────────────────
    {
        command: 'bmi',
        description: 'Calculate Body Mass Index',
        category: 'utility',
        execute: async (sock, m, { args, prefix, reply }) => {
            const weight = parseFloat(args[0]);
            const height = parseFloat(args[1]);
            if (!weight || !height) return reply(`⚖️ Usage: *${prefix}bmi 70 1.75* (weight kg, height m)`);
            const bmi = (weight / (height * height)).toFixed(1);
            const cat =
                bmi < 18.5 ? '🔵 Underweight' :
                bmi < 25   ? '🟢 Normal weight' :
                bmi < 30   ? '🟡 Overweight' :
                             '🔴 Obese';
            reply(
                `⚖️ *BMI Calculator*\n\n` +
                `> ⚖️ Weight: ${weight} kg\n` +
                `> 📏 Height: ${height} m\n` +
                `> 🔢 BMI: *${bmi}*\n` +
                `> 📊 Category: ${cat}\n\n` +
                `━━━━━━━━━━━━━━\n` +
                `< 18.5  Underweight\n` +
                `18.5–24.9  Normal\n` +
                `25–29.9  Overweight\n` +
                `30+  Obese\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ── 💱 Currency Converter ──────────────────────────────────────
    {
        command: 'currency',
        description: 'Convert currency (e.g. .currency 100 USD KES)',
        category: 'utility',
        execute: async (sock, m, { args, prefix, reply }) => {
            if (args.length < 3) return reply(`💱 Usage: *${prefix}currency 100 USD KES*`);
            const amount = parseFloat(args[0]);
            const from   = args[1].toUpperCase();
            const to     = args[2].toUpperCase();
            if (isNaN(amount)) return reply('❌ Invalid amount!');
            await sock.sendMessage(m.chat, { react: { text: '💱', key: m.key } });
            try {
                const { data } = await axios.get(
                    `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`,
                    { timeout: 6000 }
                );
                const result = data.rates[to];
                reply(
                    `💱 *Currency Converter*\n\n` +
                    `> ${amount.toLocaleString()} ${from}\n` +
                    `> = *${result?.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}*\n\n` +
                    `> Rate via Frankfurter API\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            } catch { reply(`❌ Conversion failed. Check currency codes (e.g. USD, EUR, KES, GBP)`); }
        }
    },

    // ── 🎓 Trivia ──────────────────────────────────────────────────

// ── 🌟 Random Advice ──────────────────────────────────────────
    {
        command: 'advice',
        description: 'Get a random piece of advice',
        category: 'fun',
        execute: async (sock, m, { reply }) => {
            try {
                const { data } = await axios.get('https://api.adviceslip.com/advice', { timeout: 5000 });
                reply(`🌟 *Advice*\n\n_"${data.slip.advice}"_\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
            } catch { reply(`🌟 *Advice*\n\n_"The best time to start was yesterday. The second best time is now."_\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`); }
        }
    },

    // ── 🐱 Random Cat Image ────────────────────────────────────────
    {
        command: 'cat',
        description: 'Random cat image',
        category: 'fun',
        execute: async (sock, m, { reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '🐱', key: m.key } });
            try {
                const { data } = await axios.get('https://api.thecatapi.com/v1/images/search', { timeout: 5000 });
                const url = data[0]?.url;
                if (!url) throw new Error('no url');
                await sock.sendMessage(m.chat, { image: { url }, caption: `🐱 *Random Cat!*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️` }, { quoted: m });
            } catch { reply('❌ Could not fetch cat image right now.'); }
        }
    },

    // ── 🐶 Random Dog Image ───────────────────────────────────────
    {
        command: 'dog',
        description: 'Random dog image',
        category: 'fun',
        execute: async (sock, m, { reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '🐶', key: m.key } });
            try {
                const { data } = await axios.get('https://dog.ceo/api/breeds/image/random', { timeout: 5000 });
                await sock.sendMessage(m.chat, { image: { url: data.message }, caption: `🐶 *Random Dog!*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️` }, { quoted: m });
            } catch { reply('❌ Could not fetch dog image right now.'); }
        }
    },

    // ── 🔵 Random Color ────────────────────────────────────────────

// ── ·–· Morse Code ────────────────────────────────────────────

// ── 01 Binary Converter ───────────────────────────────────────

// ── 🔄 Reverse Text ───────────────────────────────────────────

// ── 🤔 Would You Rather ───────────────────────────────────────

// ── 🖥️ Server / Bot Info ──────────────────────────────────────
    {
        command: 'serverinfo',
        description: 'Detailed bot server information',
        category: 'general',
        execute: async (sock, m, { reply }) => {
            const mem  = process.memoryUsage();
            const up   = process.uptime();
            const upStr = `${~~(up/86400)}d ${~~(up%86400/3600)}h ${~~(up%3600/60)}m ${~~(up%60)}s`;
            const cpus = os.cpus();
            const load = os.loadavg();

            reply(
                `🖥️ *LIAM EYES — Server Info*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `> 🟢 Status: Online\n` +
                `> ⏱️ Uptime: ${upStr}\n` +
                `> 🔖 Node: ${process.version}\n` +
                `> 💻 OS: ${os.type()} ${os.arch()}\n` +
                `> 🖥️ CPU: ${cpus[0].model.slice(0,32)}\n` +
                `> ⚙️ Cores: ${cpus.length}\n` +
                `> 📊 Load: ${load.map(l=>l.toFixed(2)).join(' | ')}\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `> 💾 Heap Used: ${(mem.heapUsed/1024/1024).toFixed(1)}MB\n` +
                `> 💾 Heap Total: ${(mem.heapTotal/1024/1024).toFixed(1)}MB\n` +
                `> 💾 RSS: ${(mem.rss/1024/1024).toFixed(1)}MB\n` +
                `> 🖥️ Total RAM: ${(os.totalmem()/1024/1024/1024).toFixed(2)}GB\n` +
                `> 🆓 Free RAM: ${(os.freemem()/1024/1024/1024).toFixed(2)}GB\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ── 🔢 Hash Generator ─────────────────────────────────────────
    {
        command: 'hash',
        description: 'Generate MD5/SHA256 hash of text',
        category: 'utility',
        execute: async (sock, m, { args, text, prefix, reply }) => {
            if (!text) return reply(`#️⃣ Usage: *${prefix}hash Hello World*`);
            const md5    = crypto.createHash('md5').update(text).digest('hex');
            const sha256 = crypto.createHash('sha256').update(text).digest('hex');
            reply(
                `#️⃣ *Hash Generator*\n\n` +
                `Input: \`${text.slice(0,50)}\`\n\n` +
                `> 🔷 MD5:\n\`${md5}\`\n\n` +
                `> 🔶 SHA256:\n\`${sha256}\`\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ── ✂️ Text Tools ─────────────────────────────────────────────
    {
        command: 'textcount',
        description: 'Count words, chars, lines in text',
        category: 'utility',
        execute: async (sock, m, { text, prefix, reply }) => {
            const q = m.quoted?.text || m.quoted?.caption || text;
            if (!q) return reply(`📊 Usage: *${prefix}textcount* (reply to a message) or *${prefix}textcount some text here*`);
            const chars   = q.length;
            const words   = q.trim().split(/\s+/).filter(Boolean).length;
            const lines   = q.split('\n').length;
            const sentences = (q.match(/[.!?]+/g) || []).length;
            reply(
                `📊 *Text Analysis*\n\n` +
                `> 🔤 Characters: ${chars}\n` +
                `> 📝 Words: ${words}\n` +
                `> 📄 Lines: ${lines}\n` +
                `> ❓ Sentences: ${sentences}\n` +
                `> ⏱️ Read time: ~${Math.ceil(words/200)} min\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ── 🎯 Dare Extreme Edition ────────────────────────────────────
    {
        command: 'challenge',
        description: 'Random challenge for groups',
        category: 'fun',
        execute: async (sock, m, { reply }) => {
            const challenges = [
                '📸 Post a photo of your current screen wallpaper!',
                '🎤 Send a 5-second voice note of you beatboxing.',
                '📝 Share the last photo in your gallery (pg-13 only!).',
                '🤳 Send a selfie taken RIGHT NOW, no filter!',
                '🎶 Name 3 songs from your most recently played playlist.',
                '⏱️ You have 60 seconds — type the alphabet backwards and send it!',
                '💌 Send your most used emoji to this chat.',
                '🧠 Quick! Name 5 countries starting with the letter "A" in 30 seconds.',
                '🤝 Tag someone in this chat and say one genuine nice thing about them.',
                '🎭 Describe your personality in exactly 5 emojis.',
            ];
            await sock.sendMessage(m.chat, { react: { text: '🎯', key: m.key } });
            reply(`🎯 *Group Challenge!*\n\n${challenges[~~(Math.random() * challenges.length)]}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },

    // ── 🌐 IP/URL Lookup ──────────────────────────────────────────
    {
        command: 'ipinfo',
        description: 'Look up IP address geolocation',
        category: 'utility',
        execute: async (sock, m, { args, prefix, reply }) => {
            const ip = args[0];
            if (!ip) return reply(`🌐 Usage: *${prefix}ipinfo 8.8.8.8*`);
            await sock.sendMessage(m.chat, { react: { text: '🌐', key: m.key } });
            try {
                const { data } = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 6000 });
                if (data.error) return reply(`❌ ${data.reason || 'Invalid IP'}`);
                reply(
                    `🌐 *IP Info — ${ip}*\n` +
                    `━━━━━━━━━━━━━━━━━━\n` +
                    `> 🌍 Country: ${data.country_name} ${data.country_code}\n` +
                    `> 🏙️ City: ${data.city || 'N/A'}\n` +
                    `> 📍 Region: ${data.region || 'N/A'}\n` +
                    `> ⏰ Timezone: ${data.timezone || 'N/A'}\n` +
                    `> 🌐 ISP: ${data.org || 'N/A'}\n` +
                    `> 🗺️ Coords: ${data.latitude}, ${data.longitude}\n` +
                    `━━━━━━━━━━━━━━━━━━\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            } catch { reply('❌ IP lookup failed. Try again.'); }
        }
    },

    // ── ⏰ Age Calculator ─────────────────────────────────────────
    {
        command: 'age',
        description: 'Calculate exact age from birthdate',
        category: 'utility',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text) return reply(`🎂 Usage: *${prefix}age 2000-06-15* (YYYY-MM-DD)`);
            const birth = new Date(text.trim());
            if (isNaN(birth)) return reply('❌ Invalid date. Use format: YYYY-MM-DD');
            const now    = new Date();
            let years    = now.getFullYear() - birth.getFullYear();
            let months   = now.getMonth()    - birth.getMonth();
            let days     = now.getDate()     - birth.getDate();
            if (days   < 0) { months--; days   += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
            if (months < 0) { years--;  months += 12; }
            const totalDays = Math.floor((now - birth) / 86400000);
            const nextBday  = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
            if (nextBday < now) nextBday.setFullYear(now.getFullYear() + 1);
            const daysLeft = Math.ceil((nextBday - now) / 86400000);

            reply(
                `🎂 *Age Calculator*\n\n` +
                `> 📅 Born: ${birth.toDateString()}\n` +
                `> 🎉 Age: *${years} years, ${months} months, ${days} days*\n` +
                `> 📆 Total days lived: ${totalDays.toLocaleString()}\n` +
                `> 🎁 Next birthday in: ${daysLeft} days\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ── 📡 Uptime Monitor ─────────────────────────────────────────

// ── 🎲 Spin Wheel ─────────────────────────────────────────────
    {
        command: 'spin',
        description: 'Spin a wheel between options',
        category: 'fun',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text || !text.includes(',')) return reply(`🎡 Usage: *${prefix}spin Option1, Option2, Option3*`);
            const opts = text.split(',').map(o => o.trim()).filter(Boolean);
            if (opts.length < 2) return reply('❗ Provide at least 2 options.');
            await sock.sendMessage(m.chat, { react: { text: '🎡', key: m.key } });
            const pick = opts[~~(Math.random() * opts.length)];
            const wheel = opts.map((o, i) => o === pick ? `> 🏆 *${o}* ◀` : `   ${o}`).join('\n');
            reply(`🎡 *Wheel Spin*\n\n${wheel}\n\n🎯 Result: *${pick}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },

];

// ── Helpers ───────────────────────────────────────────────────────
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [~~(h*360), ~~(s*100), ~~(l*100)];
}

function colorName(r, g, b) {
    const colors = [
        [[255,0,0],'Red'],[[0,255,0],'Lime'],[[0,0,255],'Blue'],
        [[255,255,0],'Yellow'],[[0,255,255],'Cyan'],[[255,0,255],'Magenta'],
        [[255,165,0],'Orange'],[[128,0,128],'Purple'],[[255,192,203],'Pink'],
        [[165,42,42],'Brown'],[[0,0,0],'Black'],[[255,255,255],'White'],
        [[128,128,128],'Gray'],[[0,128,0],'Green'],[[0,0,128],'Navy'],
        [[64,224,208],'Turquoise'],[[255,215,0],'Gold'],[[192,192,192],'Silver'],
    ];
    let best = 'Unknown', bestD = Infinity;
    for (const [[cr,cg,cb], name] of colors) {
        const d = Math.sqrt((r-cr)**2+(g-cg)**2+(b-cb)**2);
        if (d < bestD) { bestD = d; best = name; }
    }
    return best;
}

};

// ── module: plugins/ai_tools.js ────────────────────────────────────────────
__bundleModules["plugins/ai_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — AI TOOLS  (15 commands)
//  analyze, blackbox, code, dalle, deepseek, doppleai, gemini, generate,
//  gpt, programming, recipe, story, summarize, teach, translate2
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('./settings');

const H   = config.api.baseurl;
const KEY = config.api.apikey;
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── AI text via pollinations (free, no key) ───────────────────────────────
const aiText = async (prompt, system = '') => {
    const full = system ? system + '\n\n' + prompt : prompt;
    const { data } = await axios.get(
        `https://text.pollinations.ai/${encodeURIComponent(full)}`,
        { timeout: 20000, headers: { 'User-Agent': 'LIAM-EYES/2.0' } }
    );
    return (data?.toString() || '').trim() || 'No response received.';
};

// ── AI image via pollinations ────────────────────────────────────────────
const aiImg = async (prompt) =>
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&enhance=true&seed=${Date.now()}`;

// ── React + execute helper ────────────────────────────────────────────────
const run = async (sock, m, emoji, fn, reply) => {
    await sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } }).catch(() => {});
    try {
        const res = await fn();
        await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
        return res;
    } catch (e) {
        await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
        reply(`❌ *Error:* ${e.message}\n\n${sig()}`);
        return null;
    }
};

// ── Box formatter ─────────────────────────────────────────────────────────
const box = (icon, title, q, answer) =>
    `${icon} *${title}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🔍 *Query:* ${q.length > 80 ? q.slice(0, 80) + '…' : q}\n\n` +
    `💬 *Answer:*\n${answer}\n\n${sig()}`;

module.exports = [

    // ── .gpt ────────────────────────────────────────────────────────────────
    {
        command: 'gpt', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.gpt <question>*\nExample: _.gpt explain black holes_\n\n${sig()}`);
            await run(sock, m, '🤔', async () => {
                const ans = await aiText(text);
                reply(box('🤖', 'GPT', text, ans));
            }, reply);
        }
    },

    // ── .gemini ──────────────────────────────────────────────────────────────
    {
        command: 'gemini', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.gemini <question>*\n\n${sig()}`);
            await run(sock, m, '♊', async () => {
                const ans = await aiText('Answer this as Google Gemini would: ' + text);
                reply(box('♊', 'Gemini', text, ans));
            }, reply);
        }
    },

    // ── .blackbox ────────────────────────────────────────────────────────────
    {
        command: 'blackbox', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.blackbox <question/code task>*\n\n${sig()}`);
            await run(sock, m, '⬛', async () => {
                const ans = await aiText('Answer as Blackbox AI code assistant: ' + text);
                reply(box('⬛', 'Blackbox AI', text, ans));
            }, reply);
        }
    },

    // ── .deepseek ─────────────────────────────────────────────────────────
    {
        command: 'deepseek', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.deepseek <question>*\n\n${sig()}`);
            await run(sock, m, '🔵', async () => {
                const ans = await aiText('Answer this with DeepSeek-level depth and reasoning: ' + text);
                reply(box('🔵', 'DeepSeek', text, ans));
            }, reply);
        }
    },

    // ── .doppleai ─────────────────────────────────────────────────────────
    {
        command: 'doppleai', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.doppleai <persona> <message>*\nExample: _.doppleai Elon Musk tell me about Mars_\n\n${sig()}`);
            const parts = text.split(' ');
            const persona = parts.slice(0, 2).join(' ');
            const msg     = parts.slice(2).join(' ') || text;
            await run(sock, m, '🎭', async () => {
                const ans = await aiText(msg, `You are ${persona}. Respond exactly as ${persona} would. Stay fully in character.`);
                reply(box('🎭', `DoppleAI — ${persona}`, msg, ans));
            }, reply);
        }
    },

    // ── .analyze ─────────────────────────────────────────────────────────
    {
        command: 'analyze', category: 'ai',
        execute: async (sock, m, { text, reply, quoted }) => {
            const input = text || quoted?.text || '';
            if (!input) return reply(`❓ Usage: *.analyze <text>* or reply to a message\n\n${sig()}`);
            await run(sock, m, '🔬', async () => {
                const ans = await aiText(
                    `Analyze this text deeply. Cover: tone, intent, key themes, sentiment, and any notable patterns.\n\nText: "${input}"`
                );
                reply(box('🔬', 'Text Analysis', input.slice(0, 60) + '…', ans));
            }, reply);
        }
    },

    // ── .summarize ───────────────────────────────────────────────────────
    {
        command: 'summarize', category: 'ai',
        execute: async (sock, m, { text, reply, quoted }) => {
            const input = text || quoted?.text || '';
            if (!input) return reply(`❓ Usage: *.summarize <text>* or reply to a message\n\n${sig()}`);
            await run(sock, m, '📝', async () => {
                const ans = await aiText(`Summarize this in 3-5 concise bullet points:\n\n${input}`);
                reply(box('📝', 'Summary', input.slice(0, 50) + '…', ans));
            }, reply);
        }
    },

    // ── .code ────────────────────────────────────────────────────────────
    {
        command: 'code', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.code <description>*\nExample: _.code python fibonacci_\n\n${sig()}`);
            await run(sock, m, '💻', async () => {
                const ans = await aiText(`Write clean, well-commented code for: ${text}\nInclude the code and a brief explanation.`);
                reply(box('💻', 'Code AI', text, ans));
            }, reply);
        }
    },

    // ── .programming ─────────────────────────────────────────────────────
    {
        command: 'programming', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.programming <question>*\nExample: _.programming what is recursion_\n\n${sig()}`);
            await run(sock, m, '🖥️', async () => {
                const ans = await aiText(`Answer this programming/CS question with examples:\n\n${text}`);
                reply(box('🖥️', 'Programming', text, ans));
            }, reply);
        }
    },

    // ── .generate / .dalle ───────────────────────────────────────────────
    {
        command: 'generate', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.generate <image description>*\nExample: _.generate neon city at night_\n\n${sig()}`);
            await sock.sendMessage(m.chat, { react: { text: '🎨', key: m.key } }).catch(() => {});
            try {
                const url = await aiImg(text);
                await sleep(2500);
                await sock.sendMessage(m.chat, {
                    image: { url },
                    caption: `🎨 *AI Image*\n🖼️ *Prompt:* ${text}\n\n${sig()}`
                }, { quoted: m });
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
            } catch (e) { reply(`❌ Generation failed: ${e.message}\n\n${sig()}`); }
        }
    },
    {
        command: 'dalle', category: 'ai',
        execute: async (sock, m, ctx) => {
            const p = ctx.text;
            if (!p) return ctx.reply(`❓ Usage: *.dalle <prompt>*\n\n${sig()}`);
            ctx.args[0] = 'generate'; // reuse generate
            const gen = module.exports.find(c => c.command === 'generate');
            return gen.execute(sock, m, ctx);
        }
    },

    // ── .story ───────────────────────────────────────────────────────────
    {
        command: 'story', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.story <theme/characters>*\nExample: _.story a brave lion and a clever fox_\n\n${sig()}`);
            await run(sock, m, '📖', async () => {
                const ans = await aiText(`Write a short, engaging story (200-300 words) about: ${text}. Make it entertaining with a clear beginning, middle, and end.`);
                reply(`📖 *Story Time*\n━━━━━━━━━━━━━━━━\n${ans}\n\n${sig()}`);
            }, reply);
        }
    },

    // ── .recipe ──────────────────────────────────────────────────────────
    {
        command: 'recipe', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.recipe <dish name>*\nExample: _.recipe ugali with beef stew_\n\n${sig()}`);
            await run(sock, m, '🍳', async () => {
                const ans = await aiText(`Give me a detailed recipe for: ${text}\nInclude: ingredients (with amounts), step-by-step instructions, cooking time, and serving tips.`);
                reply(`🍳 *Recipe: ${text}*\n━━━━━━━━━━━━━━━━\n${ans}\n\n${sig()}`);
            }, reply);
        }
    },

    // ── .teach ───────────────────────────────────────────────────────────
    {
        command: 'teach', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.teach <topic>*\nExample: _.teach photosynthesis_\n\n${sig()}`);
            await run(sock, m, '📚', async () => {
                const ans = await aiText(`Explain "${text}" as a patient teacher would to a curious student. Use simple language, analogies, and examples. Include key points to remember.`);
                reply(box('📚', 'Teaching Mode', text, ans));
            }, reply);
        }
    },

    // ── .translate2 ──────────────────────────────────────────────────────
    {
        command: 'translate2', category: 'ai',
        execute: async (sock, m, { args, reply }) => {
            if (args.length < 2) return reply(`❓ Usage: *.translate2 <lang> <text>*\nExample: _.translate2 swahili Hello friend_\n\n${sig()}`);
            const lang = args[0];
            const txt  = args.slice(1).join(' ');
            await run(sock, m, '🌍', async () => {
                const ans = await aiText(`Translate this to ${lang}. Reply ONLY with the translation, nothing else:\n"${txt}"`);
                reply(`🌍 *Translation → ${lang}*\n━━━━━━━━━━━━━━━━\n*Original:* ${txt}\n*Translated:* ${ans}\n\n${sig()}`);
            }, reply);
        }
    },

];

};

// ── module: plugins/alive.js ───────────────────────────────────────────────
__bundleModules["plugins/alive"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
const config = require('./settings');
const os = require('os');
function runtime(s) { s=Number(s); const d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60),sc=Math.floor(s%60); return `${d}d ${h}h ${m}m ${sc}s`; }
module.exports = {
    command: 'alive', description: 'Check bot status', category: 'general',
    execute: async (sock, m, { reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '⚡', key: m.key } });
        const ping = Date.now() - m.messageTimestamp * 1000;
        const msg =
`👁️ *𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — System Status*
━━━━━━━━━━━━━━━━━━━━━
👤 *User:* ${m.pushName || 'User'}
⏱️ *Uptime:* ${runtime(process.uptime())}
💾 *RAM:* ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB / ${(os.totalmem()/1024/1024/1024).toFixed(1)}GB
📶 *Ping:* ${ping}ms
🖥️ *Platform:* ${os.platform()} ${os.arch()}
🔖 *Version:* Alpha
👑 *Creator:* Liam
━━━━━━━━━━━━━━━━━━━━━
📡 https://whatsapp.com/channel/0029VbBeZTc1t90aZjks9v2S`;
        await sock.sendMessage(m.chat, { image: { url: config.thumbUrl }, caption: msg
        }, { quoted: m });
        await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    }
};

};

// ── module: plugins/audio_tools.js ─────────────────────────────────────────
__bundleModules["plugins/audio_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — AUDIO TOOLS  (9 commands)
//  bass, blown, deep, earrape, reverse, robot, tomp3, toptt, volaudio
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('./settings');
const { exec } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tmp   = () => path.join(os.tmpdir(), `liameyes_${Date.now()}`);

const runFF = (cmd) => new Promise((res, rej) => exec(cmd, e => e ? rej(e) : res()));

// Download media buffer from quoted message
const getAudio = async (sock, m) => {
    const q = m.quoted || m;
    const mime = (q.msg || q).mimetype || '';
    if (!mime.includes('audio') && !mime.includes('video'))
        throw new Error('Reply to an *audio* or *video* message!');
    return { buf: await sock.downloadMediaMessage(q), mime };
};

const sendAudio = async (sock, m, buf, caption) => {
    await sock.sendMessage(m.chat, {
        audio: buf, mimetype: 'audio/mpeg'
    }, { quoted: m });
};

// ffmpeg-based audio effects
const ffxEffect = async (sock, m, reply, label, emoji, filter) => {
    await sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } }).catch(() => {});
    try {
        const { buf } = await getAudio(sock, m);
        const inp  = tmp() + '.mp3';
        const out  = tmp() + '_out.mp3';
        fs.writeFileSync(inp, buf);
        await runFF(`ffmpeg -y -i "${inp}" -af "${filter}" "${out}"`);
        const outBuf = fs.readFileSync(out);
        fs.unlinkSync(inp); fs.unlinkSync(out);
        await sendAudio(sock, m, outBuf, `${emoji} ${label} by LIAM EYES`);
        await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
    } catch (e) {
        await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
        reply(`❌ *${label} failed:* ${e.message}\n\n_Make sure you reply to an audio/video message_\n\n${sig()}`);
    }
};

module.exports = [

    // ── .tomp3 — convert any media to mp3 ──────────────────────────────────
    {
        command: 'tomp3', category: 'audio',
        execute: async (sock, m, { reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '🎵', key: m.key } }).catch(() => {});
            try {
                const q = m.quoted || m;
                const mime = (q.msg || q).mimetype || '';
                if (!mime) return reply(`❗ Reply to an audio or video message!\n\n${sig()}`);
                const buf  = await sock.downloadMediaMessage(q);
                const inp  = tmp() + '.input';
                const out  = tmp() + '.mp3';
                fs.writeFileSync(inp, buf);
                await runFF(`ffmpeg -y -i "${inp}" -codec:a libmp3lame -qscale:a 2 "${out}"`);
                const outBuf = fs.readFileSync(out);
                fs.unlinkSync(inp); fs.unlinkSync(out);
                await sendAudio(sock, m, outBuf, '🎵 Converted to MP3 by LIAM EYES');
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
            } catch (e) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                reply(`❌ Conversion failed: ${e.message}\n\n${sig()}`);
            }
        }
    },

    // ── .bass ────────────────────────────────────────────────────────────────
    { command: 'bass', category: 'audio',
      execute: (s,m,{reply}) => ffxEffect(s,m,reply,'Bass Boost','🔊','bass=g=20,dynaudnorm=f=200') },

    // ── .deep ────────────────────────────────────────────────────────────────
    { command: 'deep', category: 'audio',
      execute: (s,m,{reply}) => ffxEffect(s,m,reply,'Deep Bass','🎚️','asetrate=44100*0.7,atempo=1.43,bass=g=15') },

    // ── .earrape ─────────────────────────────────────────────────────────────
    { command: 'earrape', category: 'audio',
      execute: (s,m,{reply}) => ffxEffect(s,m,reply,'Earrape','💥','acrusher=level_in=5:level_out=15:bits=8:mode=log:aa=1') },

    // ── .blown ───────────────────────────────────────────────────────────────
    { command: 'blown', category: 'audio',
      execute: (s,m,{reply}) => ffxEffect(s,m,reply,'Blown Out','📢','acrusher=level_in=8:level_out=18:bits=4:mode=log:aa=1,highpass=f=200') },

    // ── .robot ───────────────────────────────────────────────────────────────
    { command: 'robot', category: 'audio',
      execute: (s,m,{reply}) => ffxEffect(s,m,reply,'Robot Voice','🤖','afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=512:overlap=0.75') },

    // ── .reverse ─────────────────────────────────────────────────────────────
    { command: 'reverse', category: 'audio',
      execute: (s,m,{reply}) => ffxEffect(s,m,reply,'Reversed','⏪','areverse') },

    // ── .volaudio ────────────────────────────────────────────────────────────
    {
        command: 'volaudio', category: 'audio',
        execute: async (sock, m, { args, reply }) => {
            const vol = parseFloat(args[0]) || 2;
            if (vol < 0.1 || vol > 10) return reply(`❗ Volume must be between 0.1 and 10\nUsage: *.volaudio 2.5*\n\n${sig()}`);
            await ffxEffect(sock, m, reply, `Volume ×${vol}`, '🔉', `volume=${vol}`);
        }
    },

    // ── .toptt — text to speech ────────────────────────────────────────────
    {
        command: 'toptt', category: 'audio',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.toptt <text>*\nExample: _.toptt Hello, I am LIAM EYES!_\n\n${sig()}`);
            await sock.sendMessage(m.chat, { react: { text: '🔈', key: m.key } }).catch(() => {});
            try {
                const url = `https://api.sound.lol/tts?text=${encodeURIComponent(text)}&lang=en`;
                const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
                await sendAudio(sock, m, Buffer.from(data), '🔈 TTS by LIAM EYES');
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
            } catch {
                // Fallback: use Google TTS
                try {
                    const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.slice(0,200))}&tl=en&client=tw-ob`;
                    const { data } = await axios.get(gUrl, { responseType: 'arraybuffer', timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                    await sendAudio(sock, m, Buffer.from(data), '🔈 TTS by LIAM EYES');
                    await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                } catch (e2) {
                    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    reply(`❌ TTS failed: ${e2.message}\n\n${sig()}`);
                }
            }
        }
    },

];

};

// ── module: plugins/auto_features.js ───────────────────────────────────────
__bundleModules["plugins/auto_features"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — AUTO FEATURES  (18 toggle commands)
//  alwaysonline, antibug, anticall, antidelete, antideletestatus, antiedit,
//  autobio, autoblock, autoreact, autoreactstatus, autoread, autorecord,
//  autorecordtyping, autotype, autoviewstatus, chatbot, antiflood, antiviewonce
//
//  Usage: .command on | .command off | .command (flip)
//  All owner-only.
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const config = require('./settings');

const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

// Shared toggle engine — .cmd on | off | (no arg = show status)
const tog = async (feat, label, emoji, sock, m, ctx) => {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);
    if (!config.features) config.features = {};

    const arg = (ctx.args[0] || '').toLowerCase();
    const current = !!config.features[feat];

    // No argument = show current state, DO NOT toggle
    if (!arg) {
        await sock.sendMessage(m.chat, { react: { text: current ? emoji : '⚙️', key: m.key } }).catch(() => {});
        return ctx.reply(
            `${current ? emoji : '❌'} *${label}*\n\n` +
            `Status: *${current ? '✅ ACTIVE' : '❌ INACTIVE'}*\n\n` +
            `Use *.${ctx.args[-1]||feat} on* or *.${ctx.args[-1]||feat} off*\n\n${sig()}`
        );
    }

    let on;
    if      (arg === 'on')  on = true;
    else if (arg === 'off') on = false;
    else                    on = !current;  // flip only when explicit toggle word

    // Already in desired state
    if (on === current && (arg === 'on' || arg === 'off')) {
        await sock.sendMessage(m.chat, { react: { text: on ? '✅' : 'ℹ️', key: m.key } }).catch(() => {});
        return ctx.reply(
            `${on ? emoji : '❌'} *${label}* is already *${on ? '✅ ACTIVE' : '❌ INACTIVE'}*\n\n${sig()}`
        );
    }

    config.features[feat] = on;

    await sock.sendMessage(m.chat, { react: { text: on ? emoji : '❌', key: m.key } }).catch(() => {});
    ctx.reply(
        `${on ? emoji : '❌'} *${label}*\n\n` +
        (on
            ? `╔═══════════════════╗\n║  ✅  E N A B L E D  ║\n╚═══════════════════╝\n\n_${label} is now ACTIVE_`
            : `╔══════════════════════╗\n║  ❌  D I S A B L E D  ║\n╚══════════════════════╝\n\n_${label} is now OFF_`
        ) +
        `\n\n${sig()}`
    );
};

// Helper to build a toggle command object
const mk = (cmd, feat, label, emoji) => ({
    command: cmd, category: 'settings', owner: true,
    execute: (s, m, ctx) => tog(feat, label, emoji, s, m, ctx),
});

module.exports = [
    mk('alwaysonline',     'alwaysonline',    'Always Online',           '🟢'),
    mk('antibug',          'antibug',         'Anti Bug Protection',     '🛡️'),
    mk('anticall',         'anticall',        'Anti Call (Reject Calls)','📵'),
    mk('antidelete',       'antidelete',      'Anti Delete',             '🗑️'),
    mk('antideletestatus', 'antideletestatus','Anti Delete Status',      '📸'),
    mk('antiedit',         'antiedit',        'Anti Edit Logger',        '✏️'),
    mk('autobio',          'autobio',         'Auto Bio Update',         '📝'),
    mk('autoblock',        'autoblock',       'Auto Block Non-Contacts', '🚫'),
    mk('antiflood',        'antiflood',       'Anti Flood',              '🌊'),
    mk('antiviewonce',     'antiviewonce',    'Anti View Once',          '🔓'),
    mk('autoreact',        'autoreact',       'Auto React',              '❤️'),
    mk('autoreactstatus',  'autoreactstatus', 'Auto React to Status',    '😍'),
    mk('autoread',         'autoread',        'Auto Read Messages',      '👁️'),
    mk('autorecord',       'autorecording',   'Auto Recording',          '🎙️'),
    mk('autorecordtyping', 'autorecording',   'Auto Record + Typing',    '🎙️'),
    mk('autotype',         'autotyping',      'Auto Typing Indicator',   '⌨️'),
    mk('autoviewstatus',   'autoviewstatus',  'Auto View Status',        '👀'),
    mk('chatbot',          'chatbot',         'AI Chatbot',              '🤖'),
];

};

// ── module: plugins/bridge_run.js ──────────────────────────────────────────
__bundleModules["plugins/bridge_run"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — bridge_run.js  (20-session edition)                   ║
// ║  .run <sessionId>  — spawn a bot instance (up to 20 simultaneous)      ║
// ║  .runstop <id>     — stop a running instance                           ║
// ║  .runlist          — list all running instances                        ║
// ║  .runrestart <id>  — force-restart a specific instance                 ║
// ║  .bridge <token>   — connect Telegram bridge                           ║
// ║  .webconnect <url> — connect website to bridge                         ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';

const fs      = require('fs');
const path    = require('path');
const { fork } = require('child_process');
const config  = require('./settings');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat, { react:{text:e,key:m.key} }).catch(()=>{});
const sleep = ms => new Promise(r => setTimeout(r, ms));

const L = global._L || {
    ok:   m => console.log(`  ✔ ${m}`),
    warn: m => console.log(`  ⚠ ${m}`),
    err:  m => console.error(`  ✖ ${m}`),
    info: m => console.log(`  ℹ ${m}`),
};

// ── Global instance registry ───────────────────────────────────────────────
if (!global._liamInstances)   global._liamInstances   = new Map();
if (!global._liamBridge)      global._liamBridge       = { token:'', connected:false };
if (!global._liamWebConnect)  global._liamWebConnect   = { url:'', connected:false };

const instances = global._liamInstances;
const bridge    = global._liamBridge;
if (!bridge.token && config.bridgeToken) bridge.token = config.bridgeToken;

// ── Hard cap: 20 concurrent sub-instances ─────────────────────────────────
// ── Hard cap: 50 concurrent sub-instances ────────────────────────────────
const MAX_INSTANCES = 50;

// ── Session decode ─────────────────────────────────────────────────────────
function decodeSession(sessionId) {
    const s   = (sessionId || '').trim();
    const b64 = s.replace(/^LIAM:?~/i, '');
    if (!b64 || b64 === s) return null;
    for (const enc of ['base64', 'base64url']) {
        try {
            const text = Buffer.from(b64, enc).toString('utf8');
            const obj  = JSON.parse(text);
            if (obj && (obj.noiseKey || obj.signedIdentityKey || obj.me || obj.registered !== undefined))
                return obj;
        } catch { /* try next */ }
    }
    return null;
}

// ── Instance health / state ────────────────────────────────────────────────
function instState(id) {
    return instances.get(id) || null;
}

// ── Spawn one child instance ──────────────────────────────────────────────
// Stability design:
//   • Staggered start (100ms×slot) prevents mass connection storms
//   • Exponential back-off capped at 3 min (not 1 min) for 50-session load
//   • MAX_RESTARTS bumped to 12 — Baileys sometimes needs >8 retries on flaky nets
//   • startTimer extended to 90s — Render/Railway cold starts can be slow
//   • Fatal exit codes (401 loggedOut, 403 badSession) skip restart entirely
//   • Child stdout/stderr filtered for noise; important lines forwarded
//   • sock.ws?.close() + ev.removeAllListeners() before any new fork attempt

// Codes that mean the session is permanently dead — never restart
const FATAL_EXIT_SIGNALS = new Set(['SIGKILL']); // kernel OOM
const FATAL_STDOUT_PHRASES = [
    'bad session file',       // 403
    'device loggedout',       // 401
    'logged out',             // 401
    'multidevice not supported',
];

function spawnChild(opts) {
    const {
        sock,
        m,
        instanceId,
        sessionDir,
        isRestart = false,
    } = opts;

    // ── Stagger: delay start by (slot index × 150ms) to avoid auth flood ──
    const slotIndex = instances.size;
    const staggerMs = isRestart ? 0 : slotIndex * 150;

    const _doSpawn = () => {
        const child = fork(path.join(__dirname, 'index.js'), [], {
            env: {
                ...process.env,
                LIAM_SESSION_DIR: sessionDir,
                LIAM_INSTANCE_ID: instanceId,
                LIAM_PARENT_JID:  m?.chat || '',
                // ── Clear ALL parent session vars — child must be isolated ──
                SESSION_ID:       '',
                LIAM_SESSION_ID:  '',
                PAIR_NUMBER:      '',
                PHONE_NUMBER:     '',
                LIAM_NUMBER:      '',
                // ── Increase Node.js heap for large multi-session deployments ──
                NODE_OPTIONS:     (process.env.NODE_OPTIONS || '') + ' --max-old-space-size=512',
            },
            detached: false,
            silent:   true,
        });

        const inst      = instances.get(instanceId) || {};
        let started     = false;
        let fatalSeen   = false;
        let exitCount   = inst.exitCount || 0;
        let startTimer;

        const NOISE = [
            'EKEYTYPE','Bad MAC','rate-overlimit','item-not-found',
            'Socket connection timeout','write EPIPE','read ECONNRESET',
            'ECONNRESET','EPIPE','unexpected server response',
        ];

        // ── stdout: watch for ONLINE signal and fatal phrases ─────────────
        child.stdout?.on('data', d => {
            const txt = d.toString();
            const lines = txt.split('\n').map(l => l.trim()).filter(Boolean);
            for (const line of lines) {
                process.stdout.write(`[${instanceId}] ${line}\n`);
                if (!started && (line.includes('ONLINE') || line.includes('successfully connected') || line.includes('IS NOW ONLINE')))
                    started = true;
                if (FATAL_STDOUT_PHRASES.some(p => line.toLowerCase().includes(p)))
                    fatalSeen = true;
            }
        });

        child.stderr?.on('data', d => {
            const txt = d.toString();
            const lines = txt.split('\n').map(l => l.trim()).filter(Boolean);
            for (const line of lines) {
                if (!NOISE.some(x => line.includes(x)))
                    process.stderr.write(`[${instanceId}] ERR: ${line}\n`);
            }
        });

        // ── IPC: child sends CONNECTED once WhatsApp socket is open ──────
        child.on('message', async msg => {
            if (msg.type !== 'CONNECTED') return;
            started = true;
            clearTimeout(startTimer);
            const existing = instances.get(instanceId) || {};
            instances.set(instanceId, {
                ...existing,
                pid:        child.pid,
                child,
                num:        msg.number || '?',
                startedAt:  existing.startedAt || Date.now(),
                sessionDir,
                exitCount,
                status:     'online',
            });
            if (!isRestart && sock && m) {
                await sock.sendMessage(m.chat, {
                    text:
                        `✅ *Bot Instance Connected!*\n\n` +
                        `🆔 ID   : \`${instanceId}\`\n` +
                        `📱 Num  : *+${msg.number || '?'}*\n` +
                        `⚡ PID  : ${child.pid}\n` +
                        `📊 Total: *${instances.size} / ${MAX_INSTANCES}*\n\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━\n\n${sig()}`
                }, { quoted: m }).catch(() => {});
            } else if (isRestart) {
                L.ok(`[${instanceId}] Reconnected (#${exitCount}) as +${msg.number || '?'}`);
            }
        });

        // ── child process error (fork failure) ────────────────────────────
        child.on('error', async e => {
            L.err(`[${instanceId}] fork error: ${e.message}`);
            if (!isRestart && sock && m)
                sock.sendMessage(m.chat, { text: `❌ Instance fork error: ${e.message}\n\n${sig()}` }, { quoted: m }).catch(() => {});
        });

        // ── child exit ────────────────────────────────────────────────────
        child.on('exit', (code, signal) => {
            clearTimeout(startTimer);
            const current = instances.get(instanceId);

            // ── Intentional stop (.runstop / SIGTERM) ─────────────────────
            if (!instances.has(instanceId) || signal === 'SIGTERM') {
                instances.delete(instanceId);
                L.warn(`[${instanceId}] Stopped cleanly (code=${code} sig=${signal})`);
                return;
            }

            // ── Fatal session (logged out / bad session) — never restart ──
            if (fatalSeen || code === 1 && fatalSeen) {
                instances.delete(instanceId);
                L.err(`[${instanceId}] Fatal session error — not restarting (logged out / bad session).`);
                if (sock && m)
                    sock.sendMessage(m.chat, {
                        text: `⛔ *Instance \`${instanceId}\` has a dead session.*\n\nLogged out or bad session — re-pair this number.\n\n${sig()}`
                    }, { quoted: m }).catch(() => {});
                return;
            }

            // ── OOM kill — don't spam restarts ────────────────────────────
            if (FATAL_EXIT_SIGNALS.has(signal)) {
                instances.delete(instanceId);
                L.err(`[${instanceId}] Killed by OS (${signal}) — likely OOM. Not restarting.`);
                return;
            }

            exitCount++;
            instances.set(instanceId, { ...current, status: 'crashed', exitCount, child: null, pid: null });

            // ── Auto-restart with exponential back-off ────────────────────
            // 12 attempts, cap at 3 min — enough to survive long WA server outages
            const MAX_RESTARTS = 12;
            if (exitCount <= MAX_RESTARTS) {
                const delay_ms = Math.min(3000 * Math.pow(1.7, exitCount - 1), 180000);
                L.warn(`[${instanceId}] Exited (code=${code}). Restart in ${(delay_ms/1000).toFixed(0)}s (attempt ${exitCount}/${MAX_RESTARTS})`);
                setTimeout(() => {
                    if (!instances.has(instanceId)) return; // was stopped while waiting
                    instances.set(instanceId, { ...instances.get(instanceId), status: 'restarting' });
                    spawnChild({ sock, m, instanceId, sessionDir, isRestart: true });
                }, delay_ms);
            } else {
                instances.delete(instanceId);
                L.err(`[${instanceId}] Permanently failed after ${exitCount} restarts`);
                if (sock && m)
                    sock.sendMessage(m.chat, {
                        text: `💀 *Instance \`${instanceId}\` gave up after ${exitCount} restarts.*\n\nCheck the session or re-pair.\n\n${sig()}`
                    }, { quoted: m }).catch(() => {});
            }
        });

        // Update registry immediately
        instances.set(instanceId, {
            ...(instances.get(instanceId) || {}),
            pid:        child.pid,
            child,
            num:        (instances.get(instanceId) || {}).num || '?',
            startedAt:  (instances.get(instanceId) || {}).startedAt || Date.now(),
            sessionDir,
            exitCount,
            status:     'starting',
        });

        // ── Startup timeout: 90s (cold starts on free-tier can be slow) ──
        startTimer = setTimeout(() => {
            if (!started) {
                L.warn(`[${instanceId}] Startup timeout (90s) — session may be expired.`);
                child.kill('SIGTERM');
                instances.delete(instanceId);
                if (!isRestart && sock && m)
                    sock.sendMessage(m.chat, {
                        text: `⏱️ Instance \`${instanceId}\` timed out after 90s — session may be expired.\n\n${sig()}`
                    }, { quoted: m }).catch(() => {});
            }
        }, 90000);

        return child;
    };

    // ── Stagger the actual fork to avoid auth flood ───────────────────────
    if (staggerMs > 0) {
        setTimeout(_doSpawn, staggerMs);
    } else {
        _doSpawn();
    }
}

// ═════════════════════════════════════════════════════════════════════════════
//  .run <sessionId>
// ═════════════════════════════════════════════════════════════════════════════
async function runInstance(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);

    const raw = ctx.args[0] || ctx.text;
    if (!raw) {
        return ctx.reply(
            `❓ *Usage:* \`.run <session_id>\`\n\n` +
            `Paste a LIAM:~ session ID to start a second bot instance.\n` +
            `Get session IDs: https://liam-scanner.onrender.com/pair\n\n` +
            `📊 Running: *${instances.size} / ${MAX_INSTANCES}*\n\n${sig()}`
        );
    }

    const decoded = decodeSession(raw);
    if (!decoded) {
        return ctx.reply(
            `❌ *Invalid session ID format.*\n\n` +
            `Expected format: \`LIAM:~...\`\n\n` +
            `Get one at: https://liam-scanner.onrender.com/pair\n` +
            `⚠️ Use a *different* phone number, not the same as this bot.\n\n${sig()}`
        );
    }

    // Guard: same number as parent
    const mainNum  = (sock.user?.id || '').replace(/:\d+@.*/, '');
    const childNum = (decoded?.me?.id || decoded?.me?.phone || '')
        .replace(/:\d+@.*/, '').replace('@s.whatsapp.net', '');
    if (childNum && mainNum && childNum === mainNum) {
        return ctx.reply(
            `❌ *Cannot run the same number twice!*\n\n` +
            `This session belongs to *+${mainNum}* — the same as the main bot.\n\n` +
            `👉 Pair a *different* phone number:\n` +
            `1. https://liam-scanner.onrender.com/pair\n` +
            `2. Enter a different number → copy LIAM:~\n` +
            `3. \`.run LIAM:~...\`\n\n${sig()}`
        );
    }

    // Hard cap check
    if (instances.size >= MAX_INSTANCES) {
        return ctx.reply(
            `🚫 *Maximum session cap reached!*\n\n` +
            `Hard limit: *${MAX_INSTANCES} instances*\n` +
            `Running now: *${instances.size}*\n\n` +
            `Stop one with \`.runstop <id>\` first.\n\n${sig()}`
        );
    }

    // Detect duplicate session (same creds already running)
    for (const [id, inst] of instances) {
        const existingCreds = path.join(inst.sessionDir || '', 'creds.json');
        try {
            const existing = JSON.parse(fs.readFileSync(existingCreds, 'utf8'));
            const exNum = (existing?.me?.id || '').replace(/:\d+@.*/, '').replace('@s.whatsapp.net','');
            if (exNum && childNum && exNum === childNum) {
                return ctx.reply(
                    `⚠️ *Session +${childNum} already running!*\n\n` +
                    `Instance ID: \`${id}\`\n` +
                    `Status: *${inst.status || 'online'}*\n\n` +
                    `Use \`.runstop ${id}\` to stop it first.\n\n${sig()}`
                );
            }
        } catch { /* no creds yet, skip */ }
    }

    const instanceId = `inst_${Date.now()}`;
    const sessionDir = path.join(__dirname, 'sessions', instanceId);
    fs.mkdirSync(sessionDir, { recursive: true });

    try {
        fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(decoded));
    } catch(e) {
        return ctx.reply(`❌ Failed to write session: ${e.message}\n\n${sig()}`);
    }

    await react(sock, m, '🚀');
    await ctx.reply(
        `⏳ *Spawning bot instance…*\n\n` +
        `🆔 \`${instanceId}\`\n` +
        `📊 Slot: *${instances.size + 1} / ${MAX_INSTANCES}*\n\n${sig()}`
    );

    spawnChild({ sock, m, instanceId, sessionDir, isRestart: false });
}

// ═════════════════════════════════════════════════════════════════════════════
//  .runstop <id>
// ═════════════════════════════════════════════════════════════════════════════
async function runStop(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);
    const id = ctx.args[0];
    if (!id) return ctx.reply(`❓ Usage: *.runstop <instance_id>*\n\n${sig()}`);

    const inst = instances.get(id);
    if (!inst) return ctx.reply(`❌ Instance \`${id}\` not found.\n\nUse *.runlist* to see running instances.\n\n${sig()}`);

    // Mark deleted BEFORE killing so exit handler skips auto-restart
    instances.delete(id);
    try { inst.child?.kill('SIGTERM'); } catch(_) {}

    // Clean up session dir
    try {
        const sd = inst.sessionDir;
        if (sd && fs.existsSync(sd)) fs.rmSync(sd, { recursive: true, force: true });
    } catch(_) {}

    await react(sock, m, '🛑');
    ctx.reply(
        `🛑 *Instance Stopped*\n\n` +
        `🆔 \`${id}\`\n` +
        `📱 +${inst.num || '?'}\n` +
        `📊 Running: *${instances.size} / ${MAX_INSTANCES}*\n\n${sig()}`
    );
}

// ═════════════════════════════════════════════════════════════════════════════
//  .runrestart <id>
// ═════════════════════════════════════════════════════════════════════════════
async function runRestart(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);
    const id = ctx.args[0];
    if (!id) return ctx.reply(`❓ Usage: *.runrestart <instance_id>*\n\n${sig()}`);

    const inst = instances.get(id);
    if (!inst) return ctx.reply(`❌ Instance \`${id}\` not found.\n\n${sig()}`);

    // Kill current child without removing from registry
    try { inst.child?.kill('SIGTERM'); } catch(_) {}
    inst.exitCount = 0;
    inst.status    = 'restarting';
    instances.set(id, inst);

    await react(sock, m, '🔄');
    await ctx.reply(`🔄 *Restarting \`${id}\`…*\n\n${sig()}`);

    setTimeout(() => {
        spawnChild({ sock, m, instanceId: id, sessionDir: inst.sessionDir, isRestart: true });
    }, 2000);
}

// ═════════════════════════════════════════════════════════════════════════════
//  .runlist
// ═════════════════════════════════════════════════════════════════════════════
async function runList(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);

    if (instances.size === 0) {
        return ctx.reply(`📋 *No running instances.*\n\nStart one with *.run <session_id>*\n\n${sig()}`);
    }

    const lines = [];
    let idx = 1;
    for (const [id, inst] of instances) {
        const upSec = inst.startedAt ? Math.floor((Date.now() - inst.startedAt)/1000) : 0;
        const upStr = upSec >= 3600
            ? `${Math.floor(upSec/3600)}h ${Math.floor(upSec%3600/60)}m`
            : `${Math.floor(upSec/60)}m ${upSec%60}s`;
        const statusIcon = {
            online:     '🟢', starting: '🟡', restarting: '🔄',
            crashed:    '🔴', stopped:   '⚫',
        }[inst.status || 'online'] || '❓';
        lines.push(
            `${idx}. ${statusIcon} *+${inst.num || '?'}*\n` +
            `   🆔 \`${id}\`\n` +
            `   ⏱️ Up: ${upStr}  💥 Crashes: ${inst.exitCount || 0}`
        );
        idx++;
    }

    ctx.reply(
        `📋 *Running Instances — LIAM EYES*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 *${instances.size} / ${MAX_INSTANCES}* slots used\n\n` +
        lines.join('\n\n') +
        `\n\n${sig()}`
    );
}

// ═════════════════════════════════════════════════════════════════════════════
//  .bridge <token>
// ═════════════════════════════════════════════════════════════════════════════
async function runBridge(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);
    const token = (ctx.args[0] || '').trim();
    if (!token || !token.startsWith('LIAM-BRIDGE-')) {
        return ctx.reply(
            `❓ *Usage:* \`.bridge <token>\`\n\n` +
            `Get token from Telegram: @liameyesrelay_bot → /watoken\n` +
            `Then: \`.bridge LIAM-BRIDGE-xxxx\`\n\n${sig()}`
        );
    }
    await react(sock, m, '🌉');
    bridge.token = token;
    bridge.connected = true;
    config.bridgeToken = token;
    try {
        const sp = path.join(__dirname, 'settings.js');
        let src = fs.readFileSync(sp, 'utf8');
        src = src.replace(/bridgeToken:\s*["'][^"']*["']/, `bridgeToken: "${token}"`);
        fs.writeFileSync(sp, src);
    } catch(_) {}
    try { const br = __bundleRequire('library/bridge'); if (br.setToken) br.setToken(token); } catch(_) {}
    ctx.reply(
        `✅ *Telegram Bridge Connected!*\n\n` +
        `🔑 Token: \`${token.slice(0,20)}…\`\n\n` +
        `_Messages from WA will now forward to Telegram_\n\n${sig()}`
    );
}

// ═════════════════════════════════════════════════════════════════════════════
//  .webconnect <url>
// ═════════════════════════════════════════════════════════════════════════════
async function webConnect(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);
    const url = (ctx.args[0] || '').trim();
    if (!url || !url.startsWith('http')) {
        return ctx.reply(`❓ *Usage:* \`.webconnect <url>\`\n\nExample: \`.webconnect https://my-site.com/bridge\`\n\n${sig()}`);
    }
    await react(sock, m, '🌐');
    global._liamWebConnect = { url, connected: true };
    ctx.reply(`✅ *Web Bridge Connected!*\n\n🌐 \`${url}\`\n\n${sig()}`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  Plugin exports
// ═════════════════════════════════════════════════════════════════════════════
module.exports = [
    {
        command: 'run', category: 'multisession', owner: true,
        description: 'Spawn a new bot instance (.run <LIAM:~session>)',
        execute: runInstance,
    },
    {
        command: 'runstop', category: 'multisession', owner: true,
        description: 'Stop a running bot instance (.runstop <id>)',
        execute: runStop,
    },
    {
        command: 'runlist', category: 'multisession', owner: true,
        description: 'List all running bot instances',
        execute: runList,
    },
    {
        command: 'runrestart', category: 'multisession', owner: true,
        description: 'Force-restart a specific instance (.runrestart <id>)',
        execute: runRestart,
    },
    {
        command: 'bridge', category: 'multisession', owner: true,
        description: 'Link Telegram bot (.bridge <LIAM-BRIDGE-token>)',
        execute: runBridge,
    },
    {
        command: 'webconnect', category: 'multisession', owner: true,
        description: 'Connect website to bridge (.webconnect <url>)',
        execute: webConnect,
    },
];

};

// ── module: plugins/cool_features.js ───────────────────────────────────────
__bundleModules["plugins/cool_features"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// Cool Extra Features — sticker, tts, weather, quote, fact, joke, calculator, qr, translate
const config = require('./settings');
const axios  = require('axios');

module.exports = [

{
        command: 'toimg', description: 'Convert sticker to image', category: 'tools',
        execute: async (sock, m, { reply }) => {
            const q = m.quoted || m;
            if (!(q?.msg?.mimetype || '').includes('webp')) return reply('❗ Reply to a sticker!');
            try {
                const buf = await sock.downloadMediaMessage(q.msg || q);
                await sock.sendMessage(m.chat, { image: buf, caption: '🖼️ *Converted!*\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒' }, { quoted: m });
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            } catch (e) { reply('❌ ' + e.message); }
        }
    },
    {
        command: 'fact', description: 'Random interesting fact', category: 'fun',
        execute: async (sock, m, { reply }) => {
            try {
                const { data } = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en', { timeout: 5000 });
                reply(`💡 *Random Fact*\n\n${data.text}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`);
            } catch (_) { reply('💡 Did you know? Honey never spoils — archaeologists have found 3000-year-old honey in Egyptian tombs!'); }
        }
    },
    {
        command: 'joke', description: 'Random joke', category: 'fun',
        execute: async (sock, m, { reply }) => {
            try {
                const { data } = await axios.get('https://official-joke-api.appspot.com/random_joke', { timeout: 5000 });
                reply(`😂 *Joke Time*\n\n*${data.setup}*\n\n${data.punchline}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`);
            } catch (_) { reply('😂 Why don\'t scientists trust atoms? Because they make up everything!'); }
        }
    },
    {
        command: 'quote', description: 'Random inspirational quote', category: 'fun',
        execute: async (sock, m, { reply }) => {
            const quotes = [
                ['The only way to do great work is to love what you do.','Steve Jobs'],
                ['Stay hungry, stay foolish.','Steve Jobs'],
                ['In the middle of every difficulty lies opportunity.','Albert Einstein'],
                ['It does not matter how slowly you go as long as you do not stop.','Confucius'],
                ['The secret of getting ahead is getting started.','Mark Twain'],
                ['Life is what happens when you\'re busy making other plans.','John Lennon'],
                ['The future belongs to those who believe in the beauty of their dreams.','Eleanor Roosevelt'],
                ['You miss 100% of the shots you don\'t take.','Wayne Gretzky'],
                ['Whether you think you can or you think you can\'t, you\'re right.','Henry Ford'],
                ['The best time to plant a tree was 20 years ago. The second best is now.','Chinese Proverb']
            ];
            const [q, a] = quotes[~~(Math.random() * quotes.length)];
            reply(`✨ *Quote of the Moment*\n\n"${q}"\n\n— *${a}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`);
        }
    },
    {
        command: 'calc', description: 'Calculator — evaluate math expression', category: 'tools',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text) return reply(`🔢 Usage: *${prefix}calc 5 * 9 + 3*`);
            try {
                const safe = text.replace(/[^0-9+\-*/.()%^ ]/g,'');
                const result = Function(`"use strict"; return (${safe})`)();
                reply(`🔢 *Calculator*\n\n\`${text}\`\n\n= *${result}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`);
            } catch (_) { reply('❌ Invalid expression!'); }
        }
    },
{
        command: 'tts', description: 'Text to speech (audio)', category: 'tools',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text) return reply(`🔊 Usage: *${prefix}tts Hello World*`);
            await sock.sendMessage(m.chat, { react: { text: '🔊', key: m.key } });
            try {
                const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
                await sock.sendMessage(m.chat, { audio: { url }, mimetype: 'audio/mpeg', ptt: true }, { quoted: m });
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            } catch (_) { reply('❌ TTS failed. Try a shorter text.'); }
        }
    },
    {
        command: 'time', description: 'Current time for a timezone/city', category: 'tools',
        execute: async (sock, m, { text, reply }) => {
            const tz = text || 'Africa/Nairobi';
            try {
                const now = new Date().toLocaleString('en-US', { timeZone: tz, dateStyle: 'full', timeStyle: 'long' });
                reply(`🕒 *Time — ${tz}*\n\n${now}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`);
            } catch (_) { reply('❌ Invalid timezone. Use format like *Africa/Nairobi* or *America/New_York*'); }
        }
    },
    {
        command: 'speed', description: 'Test bot response speed', category: 'general',
        execute: async (sock, m, { reply }) => {
            const start = Date.now();
            await sock.sendMessage(m.chat, { react: { text: '⚡', key: m.key } });
            const ping = Date.now() - start;
            const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
            reply(`⚡ *Speed Test*\n\n> 🏓 Response: ${ping}ms\n> 💾 RAM Used: ${mem}MB\n> 🕒 ${new Date().toLocaleString()}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`);
        }
    },
    {
        command: 'info', description: 'Get info about a WhatsApp user (reply/mention)', category: 'tools',
        execute: async (sock, m, { reply, quoted }) => {
            const target = m.quoted?.sender || m.mentionedJid?.[0] || m.sender;
            const num = target.split('@')[0];
            let pp = config.thumbUrl;
            try { pp = await sock.profilePictureUrl(target, 'image'); } catch (_) {}
            await sock.sendMessage(m.chat, {
                image: { url: pp },
                caption:
                    `👤 *User Info*\n` +
                    `━━━━━━━━━━━━━━━━\n` +
                    `> 📱 *Number:* +${num}\n` +
                    `> 🔗 *JID:* ${target}\n` +
                    `> 💬 *WA.me:* wa.me/${num}\n` +
                    `━━━━━━━━━━━━━━━━\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`
            }, { quoted: m });
        }
    },
    {
        command: 'profilepic', description: 'Get profile picture of user', category: 'tools',
        execute: async (sock, m, { reply }) => {
            const target = m.quoted?.sender || m.mentionedJid?.[0] || m.sender;
            try {
                const pp = await sock.profilePictureUrl(target, 'image');
                await sock.sendMessage(m.chat, { image: { url: pp }, caption: `📸 Profile Picture\n+${target.split('@')[0]}\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒` }, { quoted: m });
            } catch (_) { reply('❌ No profile picture available or privacy settings block it.'); }
        }
    }
];

};

// ── module: plugins/dominate.js ────────────────────────────────────────────
__bundleModules["plugins/dominate"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
'use strict';
const fs   = require('fs');
const path = require('path');
const config = require('./settings');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

const _DFILE = path.join(__dirname, 'Resources', 'dominate.json');
const _dLoad = () => { try { return JSON.parse(fs.readFileSync(_DFILE, 'utf8')); } catch { return {}; } };
const _dSave = d  => { try { fs.writeFileSync(_DFILE, JSON.stringify(d, null, 2)); } catch {} };
let _dom = _dLoad();
const ds = {
    get:    jid     => _dom[jid] || null,
    set: (jid, obj) => { _dom[jid] = obj; _dSave(_dom); },
    del:    jid     => { delete _dom[jid]; _dSave(_dom); },
};

module.exports._ds = ds;

module.exports = [
{
    command: 'dominate', category: 'group', group: true,
    execute: async (sock, m, ctx) => {
        if (!ctx.isCreator && !ctx.isAdmins) return ctx.reply(`⚠️ Admins only!\n\n${sig()}`);
        const arg = (ctx.args[0] || '').toLowerCase();
        const jid = m.chat;
        const current = !!ds.get(jid);
        const on = arg === 'on' ? true : arg === 'off' ? false : !current;

        if (on === current && (arg === 'on' || arg === 'off')) {
            await react(sock, m, on ? '✅' : 'ℹ️');
            return ctx.reply(`👑 *Dominate* is already *${on ? '✅ ON' : '❌ OFF'}*\n\n${sig()}`);
        }

        if (on) {
            ds.set(jid, { blocked: 0, on: Date.now() });
            await react(sock, m, '👑');
            return ctx.reply(
                `👑 *Dominate*\n\n╔═══════════════════╗\n║  ✅  E N A B L E D  ║\n╚═══════════════════╝\n\n_LIAM EYES is now the only active bot._\n_Other bot commands deleted._\n\n${sig()}`
            );
        } else {
            ds.del(jid);
            await react(sock, m, '❌');
            return ctx.reply(
                `👑 *Dominate*\n\n╔══════════════════════╗\n║  ❌  D I S A B L E D  ║\n╚══════════════════════╝\n\n_Normal mode restored._\n\n${sig()}`
            );
        }
    }
},
];

};

// ── module: plugins/download_tools.js ──────────────────────────────────────
__bundleModules["plugins/download_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ═══════════════════════════════════════════════════════════════════════════
// ║  LIAM EYES — download_tools.js  (all free APIs, no keys needed)       ║
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('./settings');

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
        const pl = [].concat(__bundleRequire('plugins/play')).find(p=>p.command==='play2');
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
            const {dlVideo} = __bundleRequire('library/dl');
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

};

// ── module: plugins/ephoto_tools.js ────────────────────────────────────────
__bundleModules["plugins/ephoto_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — EPHOTO360 TOOLS  (34 commands)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('./settings');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (sock, m, e) => sock.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {});

// ── Ephoto360 API wrapper ─────────────────────────────────────────────────
const ephoto = async (endpoint, text) => {
    const { data } = await axios.get(`https://api.ephoto360.com/${endpoint}?text=${encodeURIComponent(text)}`,
        { timeout: 25000, headers: { 'User-Agent': 'LIAM-EYES/2.0' } });
    return data?.imageUrl || data?.result || data?.url || data?.image;
};

// ── AI image-text generator (pollinations-based) ─────────────────────────
const genTextEffect = async (style, text) => {
    const prompt = `${style} text effect design with the text "${text}", high quality, digital art`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=400&nologo=true&seed=${Date.now()}`;
};

// ── Send result image ─────────────────────────────────────────────────────
const sendResult = async (sock, m, reply, url, label, text) => {
    if (!url) throw new Error('No image URL returned');
    await sock.sendMessage(m.chat, {
        image: { url },
        caption: `✨ *${label}*\n📝 Text: _${text}_\n\n${sig()}`,
        contextInfo: { externalAdReply: {
            title: `𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — ${label}`, body: '👁️ EPhoto360 Effect',
            thumbnailUrl: config.thumbUrl, sourceUrl: config.pairingSite, mediaType: 1,
        }},
    }, { quoted: m });
};

// ── Build a command for each EPhoto style ────────────────────────────────
const makeCmd = (command, category, label, style, apiPath) => ({
    command, category,
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❓ Usage: *.${command} <text>*\nExample: _.${command} LIAM EYES_\n\n${sig()}`);
        await react(sock, m, '🎨');
        try {
            let url;
            if (apiPath) {
                try { url = await ephoto(apiPath, text); } catch (_) {}
            }
            if (!url) url = await genTextEffect(style, text);
            await sendResult(sock, m, reply, url, label, text);
            await react(sock, m, '✅');
        } catch (e) {
            await react(sock, m, '❌');
            reply(`❌ *${label} failed:* ${e.message}\n\n${sig()}`);
        }
    }
});

module.exports = [
    makeCmd('1917style',       'ephoto', '1917 Style',           '1917 movie cinematic vintage sepia',       '1917-text-effect'),
    makeCmd('advancedglow',    'ephoto', 'Advanced Glow',        'advanced neon glow electric blue',         'advanced-glow-text'),
    makeCmd('blackpinklogo',   'ephoto', 'Blackpink Logo',       'BLACKPINK K-pop logo pink black diamond',  'blackpink-logo'),
    makeCmd('blackpinkstyle',  'ephoto', 'Blackpink Style',      'BLACKPINK K-pop style pink glitter',       'blackpink-text'),
    makeCmd('cartoonstyle',    'ephoto', 'Cartoon Style',        'cartoon comic book pop art bold outline',   'cartoon-text'),
    makeCmd('deletingtext',    'ephoto', 'Deleting Text',        'text being deleted pixel glitch erase',    'deleting-text'),
    makeCmd('dragonball',      'ephoto', 'Dragon Ball',          'Dragon Ball Z golden energy flames saiyan','dragonball-text'),
    makeCmd('effectclouds',    'ephoto', 'Effect Clouds',        'clouds sky heavenly white fluffy text',    'clouds-text'),
    makeCmd('flag3dtext',      'ephoto', '3D Flag Text',         '3D waving flag country colors realistic',  'flag-3d-text'),
    makeCmd('flagtext',        'ephoto', 'Flag Text',            'flag colors patriotic country text',       'flag-text'),
    makeCmd('freecreate',      'ephoto', 'Free Create',          'creative artistic custom digital design',  'free-create'),
    makeCmd('galaxystyle',     'ephoto', 'Galaxy Style',         'galaxy space stars nebula cosmic purple',  'galaxy-text'),
    makeCmd('galaxywallpaper', 'ephoto', 'Galaxy Wallpaper',     'galaxy wallpaper milky way stars universe','galaxy-wallpaper'),
    makeCmd('glitchtext',      'ephoto', 'Glitch Text',          'digital glitch RGB split error VHS',       'glitch-text'),
    makeCmd('glowingtext',     'ephoto', 'Glowing Text',         'bright glowing neon light halo white',     'glowing-text'),
    makeCmd('gradienttext',    'ephoto', 'Gradient Text',        'beautiful gradient rainbow color fade',    'gradient-text'),
    makeCmd('graffiti',        'ephoto', 'Graffiti',             'street graffiti spray paint urban wall',   'graffiti-text'),
    makeCmd('incandescent',    'ephoto', 'Incandescent',         'incandescent hot metal burning ember glow','incandescent-text'),
    makeCmd('lighteffects',    'ephoto', 'Light Effects',        'light rays bokeh golden particles shine',  'light-effects-text'),
    makeCmd('logomaker',       'ephoto', 'Logo Maker',           'professional clean modern logo design',    'logo-maker'),
    makeCmd('luxurygold',      'ephoto', 'Luxury Gold',          'luxury gold metallic premium elegant',     'luxury-gold-text'),
    makeCmd('makingneon',      'ephoto', 'Making Neon',          'making neon sign workshop realistic',      'neon-making'),
    makeCmd('matrix',          'ephoto', 'Matrix',               'Matrix green code digital rain falling',   'matrix-text'),
    makeCmd('multicoloredneon','ephoto', 'Multicolored Neon',    'multicolor neon sign vibrant rainbow glow','multicolor-neon'),
    makeCmd('neonglitch',      'ephoto', 'Neon Glitch',          'neon glitch cyberpunk RGB split glow',     'neon-glitch'),
    makeCmd('papercutstyle',   'ephoto', 'Paper Cut Style',      'paper cut shadow layered craft art',       'paper-cut-text'),
    makeCmd('pixelglitch',     'ephoto', 'Pixel Glitch',         'pixel art glitch 8-bit retro game error',  'pixel-glitch'),
    makeCmd('royaltext',       'ephoto', 'Royal Text',           'royal crown gold medieval regal ornate',   'royal-text'),
    makeCmd('sand',            'ephoto', 'Sand Text',            'sand beach letters carved sun desert',     'sand-text'),
    makeCmd('summerbeach',     'ephoto', 'Summer Beach',         'summer beach tropical sunny ocean waves',  'summer-beach-text'),
    makeCmd('topography',      'ephoto', 'Topography',           'topographic map lines contour terrain',    'topography-text'),
    makeCmd('typography',      'ephoto', 'Typography',           'beautiful typography font art design',     'typography-art'),
    makeCmd('watercolortext',  'ephoto', 'Watercolor Text',      'watercolor paint brush artistic soft',     'watercolor-text'),
    makeCmd('writetext',       'ephoto', 'Write Text',           'handwriting pen ink signature cursive',    'write-text'),
];

};

// ── module: plugins/extra_features.js ──────────────────────────────────────
__bundleModules["plugins/extra_features"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// Extra Cool Features — 8ball, ship, roast, tictactoe, poll, broadcast, lyrics, gpt-style, hug, slap
const config = require('./settings');
const axios  = require('axios');

module.exports = [

{
        command: 'dare', description: 'Random dare challenge', category: 'fun',
        execute: async (sock, m, { reply }) => {
            const dares = [
                'Send a voice note singing the chorus of any song 🎤',
                'Change your WhatsApp status to "I lost a dare" for 1 hour 😂',
                'Send a selfie with the silliest face you can make 🤪',
                'Tag 3 people and tell them something nice 💛',
                'Write a 3-sentence story using only emojis 📖',
                'Send a GIF that describes your personality perfectly 🎭',
                'Guess the first name of everyone in this chat 🔍',
                'Do 10 pushups and send proof 💪'
            ];
            await sock.sendMessage(m.chat, { react: { text: '😈', key: m.key } });
            reply(`😈 *DARE*\n\n${dares[~~(Math.random() * dares.length)]}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },
    {
        command: 'truth', description: 'Random truth question', category: 'fun',
        execute: async (sock, m, { reply }) => {
            const truths = [
                'What\'s the most embarrassing thing you\'ve Googled? 🔍',
                'Have you ever lied to get out of plans? Be honest! 😅',
                'What\'s your biggest fear you haven\'t told anyone? 😨',
                'What\'s the last lie you told? 🤥',
                'Who in this chat would you call at 3AM? 📞',
                'What\'s something you pretend to like but actually don\'t? 🙂',
                'What\'s the weirdest thing you do when you\'re alone? 🤷',
                'Have you ever blamed someone else for something you did? 😬'
            ];
            await sock.sendMessage(m.chat, { react: { text: '🎯', key: m.key } });
            reply(`🎯 *TRUTH*\n\n${truths[~~(Math.random() * truths.length)]}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐓 👁️`);
        }
    },
{
        command: 'rps', description: 'Rock Paper Scissors vs bot', category: 'fun',
        execute: async (sock, m, { text, prefix, reply }) => {
            const choices = ['rock', 'paper', 'scissors'];
            const emojis  = { rock: '🪨', paper: '📄', scissors: '✂️' };
            const pick = (text || '').toLowerCase().trim();
            if (!choices.includes(pick)) return reply(`✂️ Usage: *${prefix}rps rock* | *paper* | *scissors*`);
            const bot = choices[~~(Math.random() * 3)];
            let result;
            if (pick === bot) result = "🤝 It's a tie!";
            else if ((pick==='rock'&&bot==='scissors')||(pick==='paper'&&bot==='rock')||(pick==='scissors'&&bot==='paper')) result = '🏆 You win!';
            else result = '🤖 Bot wins!';
            await sock.sendMessage(m.chat, { react: { text: result.includes('You') ? '🏆' : result.includes('tie') ? '🤝' : '🤖', key: m.key } });
            reply(`✂️ *Rock Paper Scissors*\n\n👤 You: ${emojis[pick]} *${pick}*\n🤖 Bot: ${emojis[bot]} *${bot}*\n\n*${result}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },
{
        command: 'number', description: 'Random number between range', category: 'fun',
        execute: async (sock, m, { args, prefix, reply }) => {
            const min = parseInt(args[0]) || 1;
            const max = parseInt(args[1]) || 100;
            if (min >= max) return reply(`❓ Usage: *${prefix}number 1 100*`);
            const rand = ~~(Math.random() * (max - min + 1)) + min;
            reply(`🔢 *Random Number*\n\nRange: ${min}–${max}\nResult: *${rand}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },
{
        command: 'rate', description: 'Bot rates something or someone /100', category: 'fun',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text) return reply(`⭐ Usage: *${prefix}rate your cooking*`);
            const score = ~~(Math.random() * 101);
            const stars = '⭐'.repeat(Math.ceil(score/20));
            const comment = score >= 90 ? 'Legendary! 🔥' : score >= 70 ? 'Pretty solid! 💛' : score >= 50 ? 'Could be better 😅' : score >= 30 ? 'Needs work... 🤔' : 'Absolutely not 💀';
            reply(`⭐ *LIAM EYES Rating*\n\n"${text}" — *${score}/100*\n${stars}\n\n${comment}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },
    {
        command: 'aesthetic', description: 'Convert text to aesthetic style', category: 'fun',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text) return reply(`✨ Usage: *${prefix}aesthetic liam eyes*`);
            const map = 'abcdefghijklmnopqrstuvwxyz';
            const aes = 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ';
            const out = text.toLowerCase().split('').map(c => {
                const i = map.indexOf(c);
                return i >= 0 ? aes[i] : c === ' ' ? '　' : c;
            }).join('');
            reply(`✨ *Aesthetic*\n\n${out}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },
    {
        command: 'hug', description: 'Send a virtual hug', category: 'fun',
        execute: async (sock, m, { reply, sender }) => {
            const num = sender.split('@')[0];
            const hugs = ['(っ˘̩╭╮˘̩)っ', 'づ｡◕‿‿◕｡づ', '(づ￣ ³￣)づ', '⊂(•‿•⊂)', '(⊃｡•́‿•̀｡)⊃'];
            const hug = hugs[~~(Math.random() * hugs.length)];
            await sock.sendMessage(m.chat, { react: { text: '🤗', key: m.key } });
            reply(`🤗 *Virtual Hug!*\n\n${hug}\n\nSending warmth to everyone! 💛\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    }
];

};

// ── module: plugins/fun_boost.js ───────────────────────────────────────────
__bundleModules["plugins/fun_boost"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  LIAM EYES — fun_boost.js  (Fun, uptime, presence, entertainment)      ║
// ╚══════════════════════════════════════════════════════════════════════════╝
'use strict';
const axios  = require('axios');
const config = require('./settings');
const sig    = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react  = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

// ── Uptime formatter ──────────────────────────────────────────────────────────
const fmt = s => {
    const d=~~(s/86400), h=~~(s%86400/3600), m=~~(s%3600/60), sc=~~(s%60);
    return [d&&`${d}d`,h&&`${h}h`,m&&`${m}m`,`${sc}s`].filter(Boolean).join(' ');
};

// ── Tiny data pools ───────────────────────────────────────────────────────────
const JOKES = [
    "Why don't scientists trust atoms?\nBecause they make up everything! 😂",
    "I told my wife she was drawing her eyebrows too high.\nShe looked surprised! 😳",
    "Why do cows wear bells?\nBecause their horns don't work! 🐄",
    "What do you call a fake noodle?\nAn impasta! 🍝",
    "Why can't a bicycle stand on its own?\nIt's two-tired! 🚲",
    "What do you call cheese that isn't yours?\nNacho cheese! 🧀",
    "I'm reading a book on anti-gravity.\nIt's impossible to put down! 📚",
    "Why did the scarecrow win an award?\nHe was outstanding in his field! 🌾",
    "Why can't an egg tell a joke?\nIt would crack up! 🥚",
    "What do you call a pony with a cough?\nA little hoarse! 🐴",
];
const FACTS = [
    "🐝 Honey never spoils — archaeologists found 3000-year-old honey in Egyptian tombs!",
    "🦈 Sharks are older than trees — they've existed for ~450 million years.",
    "🌙 A day on Venus is longer than a year on Venus.",
    "🐙 Octopuses have three hearts and blue blood.",
    "🍌 Bananas are slightly radioactive due to potassium-40.",
    "🦋 Butterflies taste with their feet.",
    "⚡ Lightning strikes Earth about 100 times per second.",
    "🧠 Your brain uses about 20% of your body's energy.",
    "🌊 The Pacific Ocean is wider than the Moon.",
    "🔥 Hot water can freeze faster than cold water — the Mpemba effect.",
];
const ROASTS = [
    "You're like a cloud ☁️ — when you disappear, it's a beautiful day.",
    "I'd roast you harder but my mom said I'm not allowed to burn trash 🗑️",
    "You're proof that evolution can go in reverse 🦴",
    "I've seen better arguments in a shampoo bottle 🧴",
    "You're not stupid, you just have bad luck thinking 🧠",
];
const COMPLIMENTS = [
    "You're genuinely one of the most thoughtful people I know! 💫",
    "The world is better because you're in it 🌍✨",
    "You have the kind of energy that lights up every room 🔆",
    "Your smile could charge a solar panel ☀️",
    "You make complicated things look easy — that's a superpower 💪",
];
const QUOTES = [
    "\"The only way to do great work is to love what you do.\" — Steve Jobs",
    "\"In the middle of every difficulty lies opportunity.\" — Albert Einstein",
    "\"It does not matter how slowly you go as long as you do not stop.\" — Confucius",
    "\"Life is what happens when you're busy making other plans.\" — John Lennon",
    "\"The future belongs to those who believe in the beauty of their dreams.\" — Eleanor Roosevelt",
    "\"Success is not final, failure is not fatal: it is the courage to continue that counts.\" — Winston Churchill",
    "\"If you tell the truth, you don't have to remember anything.\" — Mark Twain",
    "\"Strive not to be a success, but rather to be of value.\" — Albert Einstein",
];
const EIGHTBALL = [
    "✅ It is certain","✅ Without a doubt","✅ Yes, definitely",
    "✅ You may rely on it","✅ As I see it, yes","✅ Most likely",
    "🟡 Reply hazy, try again","🟡 Ask again later","🟡 Cannot predict now",
    "🟡 Concentrate and ask again","❌ Don't count on it",
    "❌ Very doubtful","❌ My sources say no","❌ Outlook not so good",
];
const pick = arr => arr[~~(Math.random()*arr.length)];

// ── TRIVIA pool ───────────────────────────────────────────────────────────────
const TRIVIA = [
    { q:"What planet is closest to the Sun?",         a:"Mercury",          hint:"It has no moons" },
    { q:"How many sides does a hexagon have?",         a:"6",                hint:"Think honeycomb" },
    { q:"What is the chemical symbol for gold?",       a:"Au",               hint:"From Latin 'Aurum'" },
    { q:"Which country invented pizza?",               a:"Italy",            hint:"Think of Rome" },
    { q:"What is the longest river in the world?",     a:"Nile",             hint:"It's in Africa" },
    { q:"How many bones are in the adult human body?", a:"206",              hint:"More than 200" },
    { q:"What gas do plants absorb from the air?",     a:"Carbon dioxide",   hint:"CO₂" },
    { q:"Who painted the Mona Lisa?",                  a:"Leonardo da Vinci",hint:"Italian renaissance" },
];
const triviaActive = new Map(); // chat → { q, a, hint, asked }

module.exports = [

// ── .uptime ──────────────────────────────────────────────────────────────────
{
    command:'uptime', category:'general', description:'Show bot uptime & system info',
    execute: async (sock,m,{reply}) => {
        const up  = process.uptime();
        const mem = (process.memoryUsage().heapUsed/1024/1024).toFixed(1);
        const rss = (process.memoryUsage().rss/1024/1024).toFixed(1);
        await react(sock,m,'⚡');
        reply(
            `⚡ *LIAM EYES — System Status*\n\n` +
            `⏱️ *Uptime:*    ${fmt(up)}\n` +
            `💾 *Heap RAM:*  ${mem}MB\n` +
            `🧠 *Total RAM:* ${rss}MB\n` +
            `🔢 *Node:*      ${process.version}\n` +
            `📅 *Started:*   ${new Date(Date.now()-up*1000).toLocaleString('en-KE',{timeZone:'Africa/Nairobi'})}\n\n` +
            sig()
        );
    }
},

// ── .joke ─────────────────────────────────────────────────────────────────────

// ── .fact ─────────────────────────────────────────────────────────────────────

// ── .quote ────────────────────────────────────────────────────────────────────

// ── .roast ────────────────────────────────────────────────────────────────────
{
    command:'roast', category:'fun', description:'Get roasted 🔥',
    execute: async (sock,m,{reply,pushname}) => {
        await react(sock,m,'🔥');
        reply(`🔥 *Roasting ${pushname}*\n\n${pick(ROASTS)}\n\n_No cap, all love 💚_\n\n${sig()}`);
    }
},

// ── .compliment ───────────────────────────────────────────────────────────────
{
    command:'compliment', category:'fun', description:'Get a compliment 💫',
    execute: async (sock,m,{reply,pushname}) => {
        await react(sock,m,'💝');
        reply(`💝 *Hey ${pushname}!*\n\n${pick(COMPLIMENTS)}\n\n${sig()}`);
    }
},

// ── .8ball ────────────────────────────────────────────────────────────────────
{
    command:'8ball', category:'fun', description:'Ask the magic 8ball a yes/no question',
    execute: async (sock,m,{text,reply,prefix}) => {
        if (!text) return reply(`🎱 *Usage:* ${prefix}8ball <your question>\n\nExample: ${prefix}8ball Will I be rich?\n\n${sig()}`);
        await react(sock,m,'🎱');
        reply(`🎱 *Magic 8-Ball*\n\n❓ _${text}_\n\n${pick(EIGHTBALL)}\n\n${sig()}`);
    }
},

// ── .trivia ───────────────────────────────────────────────────────────────────
{
    command:'trivia', category:'fun', description:'Answer a trivia question',
    execute: async (sock,m,{text,reply,prefix}) => {
        const existing = triviaActive.get(m.chat);
        // .trivia answer <text>
        if (text?.toLowerCase().startsWith('answer ') || text?.toLowerCase().startsWith('ans ')) {
            if (!existing) return reply(`❓ No active trivia! Start one with ${prefix}trivia\n\n${sig()}`);
            const guess = text.replace(/^(answer|ans)\s+/i,'').trim().toLowerCase();
            if (existing.a.toLowerCase().includes(guess) || guess.includes(existing.a.toLowerCase())) {
                triviaActive.delete(m.chat);
                await react(sock,m,'🏆');
                reply(`🏆 *CORRECT!* 🎉\n\n✅ Answer: *${existing.a}*\n\n${sig()}`);
            } else {
                reply(`❌ *Wrong!* Try again or type *${prefix}trivia hint*\n\n${sig()}`);
            }
            return;
        }
        if (text?.toLowerCase() === 'hint') {
            if (!existing) return reply(`❓ No active trivia!\n\n${sig()}`);
            reply(`💡 *Hint:* ${existing.hint}\n\n${sig()}`);
            return;
        }
        if (text?.toLowerCase() === 'skip' || text?.toLowerCase() === 'give up') {
            if (!existing) return reply(`❓ No active trivia!\n\n${sig()}`);
            triviaActive.delete(m.chat);
            reply(`🏳️ *Skipped!* The answer was: *${existing.a}*\n\n${sig()}`);
            return;
        }
        // Start new trivia
        const q = pick(TRIVIA);
        triviaActive.set(m.chat, q);
        reply(
            `🧩 *TRIVIA TIME!*\n\n` +
            `❓ ${q.q}\n\n` +
            `📝 Reply: *${prefix}trivia answer <your answer>*\n` +
            `💡 Hint: *${prefix}trivia hint*\n` +
            `🏳️ Give up: *${prefix}trivia skip*\n\n` +
            sig()
        );
    }
},

// ── .wyr ─ Would You Rather ──────────────────────────────────────────────────
{
    command:'wyr', category:'fun', description:'Would you rather?',
    execute: async (sock,m,{reply}) => {
        const pairs = [
            ['fly but only 1 metre off the ground ✈️','run at 100km/h 🏃'],
            ['speak every language 🌍','play every instrument 🎸'],
            ['know the future 🔮','change the past ⏪'],
            ['never be cold 🌞','never be hot ❄️'],
            ['always be 10 min early ⏰','always be 20 min late 😬'],
            ['live with no internet for 1 year 📵','live with no music for 1 year 🔇'],
            ['be invisible 👻','read minds 🧠'],
            ['win $1M today 💰','earn $10K/month forever 📈'],
        ];
        const [a,b] = pick(pairs);
        await react(sock,m,'🤔');
        reply(`🤔 *Would You Rather?*\n\n🅰️ ${a}\n\n              OR\n\n🅱️ ${b}\n\n_Reply A or B!\n\n${sig()}`);
    }
},

// ── .coinflip ─────────────────────────────────────────────────────────────────
{
    command:'coinflip', category:'fun', description:'Flip a coin',
    execute: async (sock,m,{reply}) => {
        await react(sock,m,'🪙');
        const res = Math.random() < 0.5 ? '🪙 *HEADS!*' : '🪙 *TAILS!*';
        reply(`${res}\n\n_The coin has spoken._\n\n${sig()}`);
    }
},

// ── .dice ─────────────────────────────────────────────────────────────────────
{
    command:'dice', category:'fun', description:'Roll dice',
    execute: async (sock,m,{text,reply}) => {
        await react(sock,m,'🎲');
        const sides  = Math.min(100, Math.max(2, parseInt(text) || 6));
        const result = ~~(Math.random()*sides)+1;
        const faces  = {1:'⚀',2:'⚁',3:'⚂',4:'⚃',5:'⚄',6:'⚅'};
        reply(`🎲 *Rolled a ${sides}-sided die!*\n\n${faces[result]||''} *${result}*\n\n${sig()}`);
    }
},

// ── .choose ───────────────────────────────────────────────────────────────────
{
    command:'choose', category:'fun', description:'Let the bot decide for you',
    execute: async (sock,m,{text,prefix,reply}) => {
        if (!text || !text.includes(',')) return reply(`❓ *Usage:* ${prefix}choose <option1>, <option2>, ...\n\nExample: ${prefix}choose Pizza, Burger, Sushi\n\n${sig()}`);
        await react(sock,m,'🎯');
        const opts = text.split(',').map(o=>o.trim()).filter(Boolean);
        const chosen = pick(opts);
        reply(`🎯 *Decision Made!*\n\nOptions: _${opts.join(' | ')}_\n\n✅ I choose: *${chosen}*\n\n${sig()}`);
    }
},

// ── .moodring ─────────────────────────────────────────────────────────────────
{
    command:'moodring', category:'fun', description:'Read your mood by your name vibration',
    execute: async (sock,m,{pushname,reply}) => {
        const moods = [
            '🔴 Passionate & intense — you\'re on fire today!',
            '🟠 Creative & energetic — big ideas incoming!',
            '🟡 Happy & optimistic — sunshine vibes ☀️',
            '🟢 Calm & balanced — zen mode activated 🧘',
            '🔵 Thoughtful & focused — deep thinker alert!',
            '🟣 Mysterious & intuitive — psychic energy today!',
            '⚪ Neutral & adaptable — chameleon energy!',
            '🩷 Loving & caring — your heart is huge today!',
        ];
        const hash = [...(pushname||'User')].reduce((a,c)=>a+c.charCodeAt(0),0);
        await react(sock,m,'💍');
        reply(`💍 *Mood Ring — ${pushname}*\n\n${moods[hash%moods.length]}\n\n_Based on your name's cosmic vibration 🌌_\n\n${sig()}`);
    }
},

// ── .ship ─────────────────────────────────────────────────────────────────────
{
    command:'ship', category:'fun', description:'Ship two names together for compatibility %',
    execute: async (sock,m,{text,prefix,reply}) => {
        if (!text || !text.includes(',')) return reply(`💑 *Usage:* ${prefix}ship <name1>, <name2>\n\n${sig()}`);
        const [a,b] = text.split(',').map(s=>s.trim());
        const score = ((a+b).split('').reduce((x,c)=>x+c.charCodeAt(0),0))%101;
        const bar   = '❤️'.repeat(~~(score/20))+'🖤'.repeat(5-~~(score/20));
        const msg   = score >= 80 ? 'SOULMATES! 💍' : score >= 60 ? 'Strong match! 🔥' : score >= 40 ? 'Good friends... for now 😏' : score >= 20 ? 'It\'s complicated 😅' : 'Just friends 🤝';
        await react(sock,m,'💘');
        reply(`💘 *Compatibility*\n\n💑 ${a} + ${b}\n\n${bar}\n\n*${score}%* — ${msg}\n\n${sig()}`);
    }
},

// ── .afk ─────────────────────────────────────────────────────────────────────
{
    command:'afk', category:'general', description:'Set AFK status — bot replies on your behalf',
    execute: async (sock,m,{text,reply,sender}) => {
        global._afkUsers = global._afkUsers || new Map();
        global._afkUsers.set(sender, { reason: text || 'Away from keyboard', since: Date.now() });
        await react(sock,m,'💤');
        reply(`💤 *AFK mode on!*\n\n_Reason: ${text||'AFK'}_\n\nI'll let people know you're away.\nType anything to come back.\n\n${sig()}`);
    }
},

];

};

// ── module: plugins/fun_extra.js ───────────────────────────────────────────
__bundleModules["plugins/fun_extra"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const config = require('./settings');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

// ── .flirt ────────────────────────────────────────────────────────────────────
const flirts = [
    "If you were a vegetable, you'd be a cute-cumber 🥒😏",
    "Are you a magician? Because whenever I look at you, everyone else disappears ✨",
    "Do you have a name, or can I call you mine? 💕",
    "Are you a parking ticket? Because you've got 'Fine' written all over you 😂",
    "Is your name Google? Because you have everything I've been searching for 🔍❤️",
    "If beauty were time, you'd be an eternity 😍",
    "Do you believe in love at first chat, or should I message you again? 💬💖",
    "Are you a wifi password? Because I feel a strong connection 📶❤️",
    "You must be a broom because you swept me off my feet 🧹😘",
    "If you were a fruit, you'd be a fineapple 🍍👑",
    "Are you the sun? Because you light up my world ☀️🌍",
    "If my heart was a house, you'd be home 🏡❤️",
    "Do you have a map? I keep getting lost in your eyes 🗺️😍",
    "Are you made of copper and tellurium? Because you're CuTe 🧪💕",
    "I must be a snowflake because I've fallen for you ❄️💖",
    "If kisses were raindrops, I'd send you a storm 🌧️💋",
    "You're the reason I check my phone every 5 seconds 📱😏",
    "Is this real or am I dreaming? Either way, don't wake me up 😴💕",
    "You must be tired — you've been running through my mind all day 🏃❤️",
    "Even in a parallel universe, I'd still choose you 🌌💖",
];

// ── .kill and .wake are in message.js as built-ins (use global state) ─────────

module.exports = [
    // ── .flirt ───────────────────────────────────────────────────────────────
    {
        command: 'flirt',
        category: 'fun',
        execute: async (sock, m, ctx) => {
            const target = ctx.quoted?.sender
                ? `@${ctx.quoted.sender.split('@')[0]}`
                : ctx.text
                    ? ctx.text
                    : `@${ctx.senderNum}`;
            const line   = flirts[~~(Math.random() * flirts.length)];
            ctx.reply(`😍 *To: ${target}*\n\n💌 ${line}\n\n${sig()}`);
        }
    },

    // ── .kill (proxy — real logic in message.js global) ──────────────────────
    {
        command: 'kill',
        category: 'owner',
        owner: true,
        execute: async (sock, m, ctx) => {
            // Handled as built-in in message.js — this entry just ensures it
            // appears in the OWNER MENU command list
            if (!ctx.isCreator) return ctx.reply(config.message.owner);
            if (global._botKill) global._botKill();
            ctx.reply(`🔴 *Bot Paused*\n\nNo longer responding to others.\nUse *.wake* to resume.\n\n${sig()}`);
        }
    },

    // ── .wake ─────────────────────────────────────────────────────────────────
    {
        command: 'wake',
        category: 'owner',
        owner: true,
        execute: async (sock, m, ctx) => {
            if (!ctx.isCreator) return ctx.reply(config.message.owner);
            if (global._botWake) global._botWake();
            ctx.reply(`🟢 *Bot Active*\n\nBack online! 🚀\n\n${sig()}`);
        }
    },

    // ── .menustyle (category=menustyle so it appears in menu 21) ─────────────
    {
        command: 'menustyle',
        category: 'menustyle',
        execute: async (sock, m, ctx) => {
            // Actual logic is in message.js built-in handler
            // This entry ensures it shows in the MENU STYLE category (item 21)
            const n = parseInt(ctx.args[0]);
            if (!ctx.isCreator && !ctx.isSudo) return ctx.reply(config.message.owner);
            if (!n || n < 1 || n > 4) {
                const curr  = config.menuStyle || 1;
                const icons = { 1:'🔢 Numbered', 2:'📋 List', 3:'🗂️ Classic', 4:'✒️ Cursive' };
                return ctx.reply(
                    `🎨 *Menu Style*\n\n` +
                    `*Current:* Style ${curr} — ${icons[curr]}\n\n` +
                    `*Styles:*\n` +
                    `│ *1* — Numbered _(reply with number)_\n` +
                    `│ *2* — List _(all commands visible)_\n` +
                    `│ *3* — Classic _(box headers)_\n` +
                    `│ *4* — Cursive _(flower/script)_\n\n` +
                    `*Usage:*\n` +
                    `  *.numbered*  *.list*  *.classic*  *.cursive*\n\n${sig()}`
                );
            }
            config.menuStyle = n;
            const names = { 1:'Numbered', 2:'List', 3:'Classic', 4:'Cursive' };
            ctx.reply(`✅ Menu style → *${n} (${names[n]})*\n\nType *.menu* to see it.\n\n${sig()}`);
        }
    },

    // ── .setmenustyle (alias) ─────────────────────────────────────────────────
    {
        command: 'setmenustyle',
        category: 'menustyle',
        execute: async (sock, m, ctx) => {
            // Same as .menustyle
            const n = parseInt(ctx.args[0]);
            if (!ctx.isCreator && !ctx.isSudo) return ctx.reply(config.message.owner);
            if (!n || n < 1 || n > 4) return ctx.reply(`Usage: *.setmenustyle 1/2/3/4*\n\n${sig()}`);
            config.menuStyle = n;
            const names = { 1:'Numbered', 2:'List', 3:'Classic', 4:'Cursive' };
            ctx.reply(`✅ Menu style → *${n} (${names[n]})*\n\nType *.menu* to see it.\n\n${sig()}`);
        }
    },

    // ── .showstyle ────────────────────────────────────────────────────────────
    {
        command: 'showstyle',
        category: 'menustyle',
        execute: async (sock, m, ctx) => {
            const curr  = config.menuStyle || 1;
            const names = { 1:'Numbered', 2:'List', 3:'Classic', 4:'Cursive' };
            ctx.reply(`🎨 *Current Menu Style:* ${curr} — *${names[curr]}*\n\n${sig()}`);
        }
    },
];

};

// ── module: plugins/fun_games.js ───────────────────────────────────────────
__bundleModules["plugins/fun_games"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — FUN + GAMES  (7+3 = 10 commands)
//  fact, jokes, memes, quotes, trivia, truthdetector, xxqc
//  dare, truth, truthordare
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('./settings');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (sock, m, e) => sock.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {});
const rand  = arr => arr[Math.floor(Math.random() * arr.length)];

// ── Static fallback data ─────────────────────────────────────────────────
const QUOTES = [
    ['The only way to do great work is to love what you do.','Steve Jobs'],
    ['Stay hungry, stay foolish.','Steve Jobs'],
    ['In the middle of every difficulty lies opportunity.','Albert Einstein'],
    ['It does not matter how slowly you go as long as you do not stop.','Confucius'],
    ['The secret of getting ahead is getting started.','Mark Twain'],
    ['Life is what happens when you are busy making other plans.','John Lennon'],
    ['You miss 100% of the shots you do not take.','Wayne Gretzky'],
    ['Whether you think you can or think you cannot — you are right.','Henry Ford'],
    ['The future belongs to those who believe in the beauty of their dreams.','Eleanor Roosevelt'],
    ['Hardships often prepare ordinary people for extraordinary destiny.','C.S. Lewis'],
    ['Jifunze kwa bidii, kwa sababu elimu ni ufunguo wa mafanikio.','Methali ya Kiswahili'],
    ['Umoja ni nguvu, utengano ni udhaifu.','Methali ya Afrika']
];
const TRUTHS = [
    'What is the most embarrassing thing you have ever done?',
    'Have you ever lied to get out of trouble?',
    'What is your biggest fear?',
    'Who is your secret crush?',
    'What is the worst thing you have eaten?',
    'Have you ever cheated on a test?',
    'What is your biggest pet peeve?',
    'What is something you have never told anyone?',
    'Have you ever stolen anything?',
    'What is your most used emoji and why?',
    'Ni nani unayempenda zaidi katika maisha yako?',
    'Je, umewahi kudanganya mtu unayempenda?'
];
const DARES = [
    'Send a voice note singing any song for 15 seconds',
    'Change your WhatsApp profile photo for 1 hour',
    'Send a screenshot of your most recent Google search',
    'Send an ugly selfie',
    'Write a love poem to the last person you texted',
    'Send a voice note saying "I love you" in 5 different languages',
    'Change your display name to LIAM EYES BOT for 30 minutes',
    'Send a voice note doing your best impression of an animal',
    'Share your most embarrassing photo',
    'Text your crush "hey stranger 👀" right now'
];
const TRIVIA = [
    { q: 'What planet is closest to the sun?', a: 'Mercury' },
    { q: 'How many sides does a hexagon have?', a: '6' },
    { q: 'What is the capital of Kenya?', a: 'Nairobi' },
    { q: 'Who wrote Romeo and Juliet?', a: 'William Shakespeare' },
    { q: 'What is H₂O commonly known as?', a: 'Water' },
    { q: 'Which animal is the fastest on land?', a: 'Cheetah' },
    { q: 'How many continents are there?', a: '7' },
    { q: 'What year did the Titanic sink?', a: '1912' },
    { q: 'What is the largest ocean on Earth?', a: 'Pacific Ocean' },
    { q: 'Who painted the Mona Lisa?', a: 'Leonardo da Vinci' },
    { q: 'Nchi gani ndiyo kubwa zaidi barani Afrika?', a: 'Algeria' },
    { q: 'What is the national language of Brazil?', a: 'Portuguese' }
];

module.exports = [

    // ═════════════ FUN COMMANDS ═════════════

{ command: 'jokes', category: 'fun',
      execute: async (sock, m, { reply }) => {
        await react(sock, m, '😂');
        try {
            const { data } = await axios.get('https://official-joke-api.appspot.com/random_joke', { timeout: 6000 });
            reply(`😂 *Joke Time!*\n━━━━━━━━━━━━━━━━\n*${data.setup}*\n\n${data.punchline} 😆\n\n${sig()}`);
        } catch {
            const jokes = [
                ['Why don\'t scientists trust atoms?', 'Because they make up everything! 😂'],
                ['Why did the scarecrow win an award?', 'Because he was outstanding in his field! 🌾'],
                ['I told my wife she was drawing her eyebrows too high.', 'She looked surprised. 😮'],
                ['Nikamwambia mtu "Unaonekana mchoka". Akasema "Ndio, nimechoka na wewe!" 😂', '']
            ];
            const [setup, punch] = rand(jokes);
            reply(`😂 *Joke Time!*\n━━━━━━━━━━━━━━━━\n*${setup}*\n${punch ? '\n' + punch : ''}\n\n${sig()}`);
        }
      }
    },

    { command: 'quotes', category: 'fun',
      execute: async (sock, m, { reply }) => {
        await react(sock, m, '💭');
        try {
            const { data } = await axios.get('https://api.quotable.io/random', { timeout: 6000 });
            reply(`💭 *Quote of the Moment*\n━━━━━━━━━━━━━━━━\n_"${data.content}"_\n\n— *${data.author}*\n\n${sig()}`);
        } catch {
            const [quote, author] = rand(QUOTES);
            reply(`💭 *Quote of the Moment*\n━━━━━━━━━━━━━━━━\n_"${quote}"_\n\n— *${author}*\n\n${sig()}`);
        }
      }
    },

    { command: 'memes', category: 'fun',
      execute: async (sock, m, { reply }) => {
        await react(sock, m, '😆');
        try {
            const { data } = await axios.get('https://meme-api.com/gimme', { timeout: 10000 });
            if (!data?.url) throw new Error('No meme');
            await sock.sendMessage(m.chat, {
                image: { url: data.url },
                caption: `😆 *${data.title}*\n📌 r/${data.subreddit} • 👍 ${data.ups}\n\n${sig()}`,
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch {
            reply(`😆 *Meme Time!*\n━━━━━━━━━━━━━━━━\n_When you run .memes but the API is down_ 😂\n\nVisit: reddit.com/r/memes\n\n${sig()}`);
        }
      }
    },
{ command: 'truthdetector', category: 'fun',
      execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❓ Usage: *.truthdetector <statement>*\nExample: _.truthdetector I love studying_\n\n${sig()}`);
        await react(sock, m, '🔍');
        const percent = Math.floor(Math.random() * 101);
        const verdict = percent > 70 ? '✅ TRUE' : percent > 40 ? '🤔 HALF TRUE' : '❌ LIE DETECTED';
        reply(`🔍 *LIAM Truth Detector™*\n━━━━━━━━━━━━━━━━\n📋 Statement: _"${text}"_\n\n${'█'.repeat(Math.floor(percent/10))}${'░'.repeat(10-Math.floor(percent/10))} ${percent}%\n\n*Verdict: ${verdict}*\n\n_Results are scientifically accurate* 😂_\n*(not really)\n\n${sig()}`);
      }
    },

    { command: 'xxqc', category: 'fun',
      execute: async (sock, m, { reply, pushname }) => {
        await react(sock, m, '💝');
        const percent = Math.floor(Math.random() * 101);
        const hearts = '❤️'.repeat(Math.min(5, Math.ceil(percent/20)));
        const level = percent > 80 ? 'DEEPLY IN LOVE 💘' : percent > 60 ? 'CRUSHING HARD 💕' : percent > 40 ? 'STARTING TO FEEL IT 💓' : percent > 20 ? 'JUST FRIENDS 🤝' : 'NO SPARKS YET 💔';
        reply(`💝 *LIAM Love Meter™*\n━━━━━━━━━━━━━━━━\n👤 ${pushname}\n\n${hearts} ${percent}%\n\n*Status: ${level}*\n\n_Results certified by LIAM EYES dating algorithm™ 😂_\n\n${sig()}`);
      }
    },

    // ═════════════ GAMES COMMANDS ═════════════

{ command: 'truthordare', category: 'games',
      execute: async (sock, m, { reply, pushname }) => {
        const isTruth = Math.random() > 0.5;
        if (isTruth) {
            const t = rand(TRUTHS);
            reply(`🎮 *TRUTH or DARE — You got TRUTH!*\n━━━━━━━━━━━━━━━━\n👤 ${pushname}:\n\n*"${t}"*\n\n_Answer honestly! No lying allowed 🤞_\n\n${sig()}`);
        } else {
            const d = rand(DARES);
            reply(`🎮 *TRUTH or DARE — You got DARE!*\n━━━━━━━━━━━━━━━━\n👤 ${pushname}:\n\n*"${d}"*\n\n_Do it or be forever shamed! 😤_\n\n${sig()}`);
        }
      }
    }

];

};

// ── module: plugins/group_tools.js ─────────────────────────────────────────
__bundleModules["plugins/group_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — GROUP TOOLS  (54 commands)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const config = require('./settings');
const fs     = require('fs');
const path   = require('path');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (sock, m, e) => sock.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {});
const fixJid = j => (j || '').replace(/:\d+@/g, '@');

// Runtime stores
const groupCodes   = new Map(); // groupId → [ codes ]
const groupAllowed = new Map(); // groupId → [ jids ]
const groupKick    = new Map(); // groupId → { cancelled }

// ── Admin-check shortcut ──────────────────────────────────────────────────
const reqAdmin = (ctx, reply) => {
    if (!ctx.isBotAdmins) { reply(`❌ *Bot must be admin for this command!*\n\n${sig()}`); return false; }
    if (!ctx.isAdmins && !ctx.isCreator) { reply(`❌ *You must be an admin!*\n\n${sig()}`); return false; }
    return true;
};

// ── Mention all participants ──────────────────────────────────────────────
const mentionAll = (participants) => participants.map(p => p.id).join('\n');

module.exports = [

    // ── .kick ────────────────────────────────────────────────────────────────
    {
        command: 'kick', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            const target = m.quoted?.sender || ctx.args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!target || target === '@s.whatsapp.net') return ctx.reply(`❓ Reply to a message or mention a user.\n\n${sig()}`);
            await react(sock, m, '🚫');
            await sock.groupParticipantsUpdate(m.chat, [fixJid(target)], 'remove');
            ctx.reply(`✅ *Kicked!* @${target.split('@')[0]} has been removed.\n\n${sig()}`);
        }
    },

    // ── .promote ─────────────────────────────────────────────────────────────
    {
        command: 'promote', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            const target = m.quoted?.sender || ctx.args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!target || target === '@s.whatsapp.net') return ctx.reply(`❓ Reply to a message or mention user.\n\n${sig()}`);
            await react(sock, m, '👑');
            await sock.groupParticipantsUpdate(m.chat, [fixJid(target)], 'promote');
            ctx.reply(`✅ @${target.split('@')[0]} has been *promoted to admin!* 👑\n\n${sig()}`);
        }
    },

    // ── .demote ──────────────────────────────────────────────────────────────
    {
        command: 'demote', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            const target = m.quoted?.sender || ctx.args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!target || target === '@s.whatsapp.net') return ctx.reply(`❓ Reply to a message or mention user.\n\n${sig()}`);
            await react(sock, m, '⬇️');
            await sock.groupParticipantsUpdate(m.chat, [fixJid(target)], 'demote');
            ctx.reply(`✅ @${target.split('@')[0]} has been *demoted from admin.*\n\n${sig()}`);
        }
    },

    // ── .add ─────────────────────────────────────────────────────────────────
    {
        command: 'add', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            const num = ctx.args[0]?.replace(/[^0-9]/g, '');
            if (!num) return ctx.reply(`❓ Usage: *.add <number>*\nExample: _.add 254712345678_\n\n${sig()}`);
            await react(sock, m, '➕');
            const res = await sock.groupParticipantsUpdate(m.chat, [num + '@s.whatsapp.net'], 'add');
            const status = res?.[0]?.status;
            if (status === 200) ctx.reply(`✅ *@${num} added successfully!*\n\n${sig()}`);
            else if (status === 403) ctx.reply(`❌ *${num} has their privacy set to not allow adds.*\nSend invite link instead.\n\n${sig()}`);
            else if (status === 408) ctx.reply(`❌ *${num} is not on WhatsApp.*\n\n${sig()}`);
            else ctx.reply(`⚠️ Status: ${status}\n\n${sig()}`);
        }
    },

    // ── .link ─────────────────────────────────────────────────────────────────
    {
        command: 'link', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!ctx.isBotAdmins) return ctx.reply(`❌ Bot must be admin!\n\n${sig()}`);
            await react(sock, m, '🔗');
            const code = await sock.groupInviteCode(m.chat);
            ctx.reply(`🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}\n\n⚠️ Share carefully!\n\n${sig()}`);
        }
    },

    // ── .invite ───────────────────────────────────────────────────────────────
    {
        command: 'invite', category: 'group', group: true,
        execute: async (sock, m, ctx) => {
            if (!ctx.isBotAdmins) return ctx.reply(`❌ Bot must be admin!\n\n${sig()}`);
            const code = await sock.groupInviteCode(m.chat);
            const link = `https://chat.whatsapp.com/${code}`;
            await sock.sendMessage(m.chat, {
                text: `🔗 *${ctx.groupName}*\n\n${link}\n\n${sig()}`
            }, { quoted: m });
        }
    },

    // ── .resetlink ────────────────────────────────────────────────────────────
    {
        command: 'resetlink', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            await react(sock, m, '🔄');
            await sock.groupRevokeInvite(m.chat);
            const code = await sock.groupInviteCode(m.chat);
            ctx.reply(`✅ *Invite link reset!*\n\nNew link: https://chat.whatsapp.com/${code}\n\n${sig()}`);
        }
    },

    // ── .open / .close ────────────────────────────────────────────────────────
    {
        command: 'open', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            await react(sock, m, '🔓');
            await sock.groupSettingUpdate(m.chat, 'not_announcement');
            ctx.reply(`🔓 *Group opened!* Everyone can now send messages.\n\n${sig()}`);
        }
    },
    {
        command: 'close', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            await react(sock, m, '🔒');
            await sock.groupSettingUpdate(m.chat, 'announcement');
            ctx.reply(`🔒 *Group locked!* Only admins can now send messages.\n\n${sig()}`);
        }
    },

    // ── .tag / .tagall / .tagadmin ────────────────────────────────────────────
    {
        command: 'tag', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const text = ctx.text || '👋';
            const mentions = ctx.participants.map(p => p.id);
            await sock.sendMessage(m.chat, {
                text: `📢 *${text}*\n\n${mentions.map(j => `@${j.split('@')[0]}`).join(' ')}`,
                mentions
            }, { quoted: m });
        }
    },
    {
        command: 'tagall', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const mentions = ctx.participants.map(p => p.id);
            const text = ctx.text || '📢 *Attention everyone!*';
            await sock.sendMessage(m.chat, {
                text: `${text}\n\n${mentions.map(j => `@${j.split('@')[0]}`).join(' ')} `,
                mentions,
            }, { quoted: m });
        }
    },
    {
        command: 'tagadmin', category: 'group', group: true,
        execute: async (sock, m, ctx) => {
            const admins = ctx.groupAdmins;
            if (!admins.length) return ctx.reply(`❌ No admins found.\n\n${sig()}`);
            const text = ctx.text || '📢 Admins, your attention please!';
            await sock.sendMessage(m.chat, {
                text: `${text}\n\n${admins.map(j => `@${j.split('@')[0]}`).join(' ')}`,
                mentions: admins,
            }, { quoted: m });
        }
    },
    {
        command: 'hidetag', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const mentions = ctx.participants.map(p => p.id);
            const text = ctx.text || ctx.config?.watermark || '👁️ LIAM EYES';
            await sock.sendMessage(m.chat, { text, mentions }, { quoted: m });
        }
    },
    {
        command: 'mediatag', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const q = m.quoted;
            if (!q) return ctx.reply(`❗ Reply to a media message.\n\n${sig()}`);
            const mentions = ctx.participants.map(p => p.id);
            const mime = (q.msg || q).mimetype || '';
            const buf  = await sock.downloadMediaMessage(q);
            if (mime.includes('image'))
                await sock.sendMessage(m.chat, { image: buf, caption: ctx.text || '📢', mentions }, { quoted: m });
            else if (mime.includes('video'))
                await sock.sendMessage(m.chat, { video: buf, caption: ctx.text || '📢', mentions }, { quoted: m });
        }
    },
    {
        command: 'antitag', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features = config.features || {};
            config.features.antitag = !config.features.antitag;
            const on = config.features.antitag;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Tag* is now *${on ? '✅ ON' : '❌ OFF'}*\n\n${sig()}`);
        }
    },
    {
        command: 'antitagadmin', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features = config.features || {};
            config.features.antitagadmin = !config.features.antitagadmin;
            const on = config.features.antitagadmin;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Tag Admin* is now *${on ? '✅ ON' : '❌ OFF'}*\n\n${sig()}`);
        }
    },

    // ── .setgroupname / .setdesc / .setppgroup / .delppgroup / .getgrouppp ───
    {
        command: 'setgroupname', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!ctx.text) return ctx.reply(`❓ Usage: *.setgroupname <name>*\n\n${sig()}`);
            if (!reqAdmin(ctx, ctx.reply)) return;
            await react(sock, m, '✏️');
            await sock.groupUpdateSubject(m.chat, ctx.text);
            ctx.reply(`✅ *Group name changed to:* ${ctx.text}\n\n${sig()}`);
        }
    },
    {
        command: 'setdesc', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!ctx.text) return ctx.reply(`❓ Usage: *.setdesc <description>*\n\n${sig()}`);
            if (!reqAdmin(ctx, ctx.reply)) return;
            await react(sock, m, '📝');
            await sock.groupUpdateDescription(m.chat, ctx.text);
            ctx.reply(`✅ *Group description updated!*\n\n${sig()}`);
        }
    },
    {
        command: 'setppgroup', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            const q = m.quoted;
            if (!q) return ctx.reply(`❗ Reply to an image to set as group icon.\n\n${sig()}`);
            await react(sock, m, '🖼️');
            const buf = await sock.downloadMediaMessage(q);
            await sock.updateProfilePicture(m.chat, buf);
            ctx.reply(`✅ *Group photo updated!*\n\n${sig()}`);
        }
    },
    {
        command: 'delppgroup', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            await react(sock, m, '🗑️');
            await sock.removeProfilePicture(m.chat);
            ctx.reply(`✅ *Group photo removed!*\n\n${sig()}`);
        }
    },
    {
        command: 'getgrouppp', category: 'group', group: true,
        execute: async (sock, m, ctx) => {
            await react(sock, m, '🖼️');
            try {
                const url = await sock.profilePictureUrl(m.chat, 'image');
                await sock.sendMessage(m.chat, { image: { url }, caption: `🖼️ *${ctx.groupName} — Group Photo*\n\n${sig()}` }, { quoted: m });
            } catch { ctx.reply(`❌ Could not fetch group photo.\n\n${sig()}`); }
        }
    },

    // ── .totalmembers ─────────────────────────────────────────────────────────
    {
        command: 'totalmembers', category: 'group', group: true,
        execute: async (sock, m, ctx) => {
            const total  = ctx.participants.length;
            const admins = ctx.groupAdmins.length;
            ctx.reply(`👥 *${ctx.groupName}*\n\n👤 Total Members: *${total}*\n👑 Admins: *${admins}*\n👶 Regular: *${total - admins}*\n\n${sig()}`);
        }
    },

    // ── .poll ────────────────────────────────────────────────────────────────
    {
        command: 'poll', category: 'group', group: true,
        execute: async (sock, m, ctx) => {
            if (ctx.args.length < 3) return ctx.reply(`❓ Usage: *.poll Question | Option1 | Option2 | ...*\nExample: _.poll Favorite color | Red | Blue | Green_\n\n${sig()}`);
            const parts = ctx.text.split('|').map(s => s.trim());
            const question = parts[0];
            const options  = parts.slice(1);
            if (options.length < 2) return ctx.reply(`❗ Need at least 2 options\n\n${sig()}`);
            await react(sock, m, '📊');
            await sock.sendMessage(m.chat, {
                poll: { name: question, values: options, selectableCount: 1 }
            }, { quoted: m });
        }
    },

    // ── .welcome ──────────────────────────────────────────────────────────────
    {
        command: 'welcome', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.welcome = !config.features.welcome;
            const on = config.features.welcome;
            await react(sock, m, on ? '👋' : '❌');
            ctx.reply(`👋 *Welcome Messages* are now *${on ? '✅ ON' : '❌ OFF'}*\n\n${sig()}`);
        }
    },

    // ── .kickall ─────────────────────────────────────────────────────────────
    {
        command: 'kickall', category: 'group', group: true, admin: true, owner: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            const botId  = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net';
            const targets = ctx.participants.filter(p => !p.admin && p.id !== botId).map(p => p.id);
            if (!targets.length) return ctx.reply(`❌ No regular members to kick.\n\n${sig()}`);
            await react(sock, m, '🚫');
            ctx.reply(`⚠️ *Kicking ${targets.length} members...*\n\n${sig()}`);
            for (const jid of targets) {
                await sock.groupParticipantsUpdate(m.chat, [jid], 'remove').catch(() => {});
                await new Promise(r => setTimeout(r, 500));
            }
            ctx.reply(`✅ *Kicked ${targets.length} members!*\n\n${sig()}`);
        }
    },

    // ── .kickinactive ────────────────────────────────────────────────────────
    {
        command: 'kickinactive', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            ctx.reply(`ℹ️ *Kick Inactive*\n\nThis feature tracks message activity.\n_Currently, manual tracking is not enabled._\n_Use .kickall to remove all non-admins._\n\n${sig()}`);
        }
    },

    // ── .listactive / .listinactive ───────────────────────────────────────────
    {
        command: 'listactive', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const admins = ctx.groupAdmins.map(j => `👑 @${j.split('@')[0]}`).join('\n');
            const others = ctx.participants.filter(p => !p.admin).map(p => `👤 @${p.id.split('@')[0]}`).join('\n');
            ctx.reply(`📋 *${ctx.groupName} — Members*\n\n*Admins (${ctx.groupAdmins.length}):*\n${admins}\n\n*Members (${ctx.participants.length - ctx.groupAdmins.length}):*\n${others}\n\n${sig()}`);
        }
    },
    {
        command: 'listinactive', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            ctx.reply(`ℹ️ *List Inactive*\n\nActivity tracking is not currently enabled.\nUse *.listactive* to see all members.\n\n${sig()}`);
        }
    },

    // ── .approve / .approveall / .disapproveall / .reject ─────────────────────
    {
        command: 'listrequests', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            try {
                const req = await sock.groupRequestParticipantsList(m.chat);
                if (!req?.length) return ctx.reply(`ℹ️ No pending join requests.\n\n${sig()}`);
                const list = req.map((r, i) => `${i+1}. @${r.jid.split('@')[0]}`).join('\n');
                ctx.reply(`📋 *Pending Requests (${req.length}):*\n\n${list}\n\n${sig()}`);
            } catch { ctx.reply(`❌ Could not fetch requests.\n\n${sig()}`); }
        }
    },
    {
        command: 'approve', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const target = m.quoted?.sender || ctx.args[0]?.replace(/[^0-9]/g,'') + '@s.whatsapp.net';
            if (!target || target === '@s.whatsapp.net') return ctx.reply(`❓ Reply to a request message or provide number.\n\n${sig()}`);
            await react(sock, m, '✅');
            await sock.groupRequestParticipantsUpdate(m.chat, [fixJid(target)], 'approve');
            ctx.reply(`✅ @${target.split('@')[0]} approved!\n\n${sig()}`);
        }
    },
    {
        command: 'approveall', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            await react(sock, m, '✅');
            try {
                const req = await sock.groupRequestParticipantsList(m.chat);
                if (!req?.length) return ctx.reply(`ℹ️ No pending requests.\n\n${sig()}`);
                for (const r of req)
                    await sock.groupRequestParticipantsUpdate(m.chat, [r.jid], 'approve').catch(() => {});
                ctx.reply(`✅ Approved *${req.length} requests!*\n\n${sig()}`);
            } catch (e) { ctx.reply(`❌ Error: ${e.message}\n\n${sig()}`); }
        }
    },
    {
        command: 'disapproveall', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            await react(sock, m, '❌');
            try {
                const req = await sock.groupRequestParticipantsList(m.chat);
                if (!req?.length) return ctx.reply(`ℹ️ No pending requests.\n\n${sig()}`);
                for (const r of req)
                    await sock.groupRequestParticipantsUpdate(m.chat, [r.jid], 'reject').catch(() => {});
                ctx.reply(`❌ Rejected *${req.length} requests!*\n\n${sig()}`);
            } catch (e) { ctx.reply(`❌ Error: ${e.message}\n\n${sig()}`); }
        }
    },
    {
        command: 'reject', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const target = m.quoted?.sender || ctx.args[0]?.replace(/[^0-9]/g,'') + '@s.whatsapp.net';
            if (!target || target === '@s.whatsapp.net') return ctx.reply(`❓ Reply to request or provide number.\n\n${sig()}`);
            await react(sock, m, '❌');
            await sock.groupRequestParticipantsUpdate(m.chat, [fixJid(target)], 'reject').catch(() => {});
            ctx.reply(`❌ Request from @${target.split('@')[0]} rejected.\n\n${sig()}`);
        }
    },

    // ── .addcode / .delcode / .listcode ───────────────────────────────────────
    {
        command: 'addcode', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const code = ctx.text?.toUpperCase();
            if (!code) return ctx.reply(`❓ Usage: *.addcode <code>*\n\n${sig()}`);
            if (!groupCodes.has(m.chat)) groupCodes.set(m.chat, []);
            groupCodes.get(m.chat).push(code);
            ctx.reply(`✅ Code *${code}* added!\nUsers can join with: *.join ${code}*\n\n${sig()}`);
        }
    },
    {
        command: 'delcode', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const code = ctx.text?.toUpperCase();
            if (!code) return ctx.reply(`❓ Usage: *.delcode <code>*\n\n${sig()}`);
            const list = groupCodes.get(m.chat) || [];
            const idx  = list.indexOf(code);
            if (idx === -1) return ctx.reply(`❌ Code *${code}* not found.\n\n${sig()}`);
            list.splice(idx, 1);
            ctx.reply(`✅ Code *${code}* removed!\n\n${sig()}`);
        }
    },
    {
        command: 'listcode', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const codes = groupCodes.get(m.chat) || [];
            if (!codes.length) return ctx.reply(`ℹ️ No codes set for this group.\n\n${sig()}`);
            ctx.reply(`📋 *Group Codes:*\n\n${codes.map((c,i) => `${i+1}. \`${c}\``).join('\n')}\n\n${sig()}`);
        }
    },

    // ── .allow / .delallowed / .listallowed ───────────────────────────────────
    {
        command: 'allow', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const target = m.quoted?.sender || ctx.args[0]?.replace(/[^0-9]/g,'') + '@s.whatsapp.net';
            if (!target || target === '@s.whatsapp.net') return ctx.reply(`❓ Mention or reply to a user.\n\n${sig()}`);
            if (!groupAllowed.has(m.chat)) groupAllowed.set(m.chat, []);
            groupAllowed.get(m.chat).push(fixJid(target));
            ctx.reply(`✅ @${target.split('@')[0]} is now *allowed* even when group is locked.\n\n${sig()}`);
        }
    },
    {
        command: 'delallowed', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const target = m.quoted?.sender || ctx.args[0]?.replace(/[^0-9]/g,'') + '@s.whatsapp.net';
            const list   = groupAllowed.get(m.chat) || [];
            const idx    = list.indexOf(fixJid(target));
            if (idx !== -1) list.splice(idx, 1);
            ctx.reply(`✅ @${target.split('@')[0]} removed from allowed list.\n\n${sig()}`);
        }
    },
    {
        command: 'listallowed', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const list = groupAllowed.get(m.chat) || [];
            if (!list.length) return ctx.reply(`ℹ️ Allowed list is empty.\n\n${sig()}`);
            ctx.reply(`📋 *Allowed Users:*\n\n${list.map((j,i) => `${i+1}. @${j.split('@')[0]}`).join('\n')}\n\n${sig()}`);
        }
    },

    // ── .userid ───────────────────────────────────────────────────────────────
    {
        command: 'userid', category: 'group', group: true,
        execute: async (sock, m, ctx) => {
            const target = m.quoted?.sender || ctx.sender;
            ctx.reply(`🆔 *User ID*\n\nJID: \`${target}\`\nNumber: *+${target.split('@')[0]}*\n\n${sig()}`);
        }
    },

    // ── .vcf ─────────────────────────────────────────────────────────────────
    {
        command: 'vcf', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            await react(sock, m, '📇');
            const vcfData = ctx.participants.map(p => {
                const num = p.id.split('@')[0];
                return `BEGIN:VCARD\nVERSION:3.0\nFN:+${num}\nTEL:+${num}\nEND:VCARD`;
            }).join('\n');
            const buf = Buffer.from(vcfData, 'utf8');
            await sock.sendMessage(m.chat, {
                document: buf, filename: `${ctx.groupName.slice(0,30)}_members.vcf`,
                mimetype: 'text/vcard', caption: `📇 *${ctx.participants.length} contacts exported*\n\n${sig()}`,
            }, { quoted: m });
            await react(sock, m, '✅');
        }
    },

    // ── .tosgroup ─────────────────────────────────────────────────────────────
    {
        command: 'tosgroup', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const q = m.quoted;
            if (!q) return ctx.reply(`❗ Reply to a message to forward to all groups.\n\n${sig()}`);
            ctx.reply(`ℹ️ *Group broadcast requires accessing all groups.*\n_Use .tostatus to post to your status instead._\n\n${sig()}`);
        }
    },

    // ── .announcements ───────────────────────────────────────────────────────
    {
        command: 'announcements', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!ctx.text) return ctx.reply(`❓ Usage: *.announcements <message>*\n\n${sig()}`);
            const mentions = ctx.participants.map(p => p.id);
            await sock.sendMessage(m.chat, {
                text: `📢 *ANNOUNCEMENT*\n━━━━━━━━━━━━━━━━━━\n${ctx.text}\n━━━━━━━━━━━━━━━━━━\n_${ctx.groupName}_\n\n${sig()}`,
                mentions,
            }, { quoted: m });
        }
    },

    // ── .editsettings ────────────────────────────────────────────────────────
    {
        command: 'editsettings', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            const arg = ctx.args[0];
            if (arg === 'adminsonly') {
                await sock.groupSettingUpdate(m.chat, 'locked');
                ctx.reply(`🔒 *Only admins can edit group info now.*\n\n${sig()}`);
            } else {
                await sock.groupSettingUpdate(m.chat, 'unlocked');
                ctx.reply(`🔓 *All members can edit group info.*\n\n${sig()}`);
            }
        }
    },

    // ── .closetime / .opentime ────────────────────────────────────────────────
    {
        command: 'closetime', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const time = ctx.text;
            if (!time) return ctx.reply(`❓ Usage: *.closetime <HH:MM>*\nExample: _.closetime 22:00_\n\n${sig()}`);
            config.closeTime = time;
            ctx.reply(`🔒 *Group will auto-close at ${time}*\n\n${sig()}`);
        }
    },
    {
        command: 'opentime', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const time = ctx.text;
            if (!time) return ctx.reply(`❓ Usage: *.opentime <HH:MM>*\nExample: _.opentime 06:00_\n\n${sig()}`);
            config.openTime = time;
            ctx.reply(`🔓 *Group will auto-open at ${time}*\n\n${sig()}`);
        }
    },

    // ── Anti-group features ────────────────────────────────────────────────────
    {
        command: 'antilink', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antilink = !config.features.antilink;
            const on = config.features.antilink;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Link* is now *${on ? '✅ ON' : '❌ OFF'}*\n\n${sig()}`);
        }
    },
    {
        command: 'antilinkgc', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antilinkgc = !config.features.antilinkgc;
            const on = config.features.antilinkgc;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti Group-Link* is now *${on ? '✅ ON' : '❌ OFF'}*\n_Blocks WhatsApp group links specifically_\n\n${sig()}`);
        }
    },
    {
        command: 'antibadword', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antibadword = !config.features.antibadword;
            const on = config.features.antibadword;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Bad Word* is now *${on ? '✅ ON' : '❌ OFF'}*\n\n${sig()}`);
        }
    },
    {
        command: 'antibot', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antibot = !config.features.antibot;
            const on = config.features.antibot;
            await react(sock, m, on ? '🤖' : '❌');
            ctx.reply(`🤖 *Anti-Bot* is now *${on ? '✅ ON' : '❌ OFF'}*\n_Removes bots that join the group_\n\n${sig()}`);
        }
    },
    {
        command: 'antidemote', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antidemote = !config.features.antidemote;
            const on = config.features.antidemote;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Demote* is now *${on ? '✅ ON' : '❌ OFF'}*\n_Kicks anyone who demotes the bot_\n\n${sig()}`);
        }
    },
    {
        command: 'antiforeign', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antiforeign = !config.features.antiforeign;
            const on = config.features.antiforeign;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Foreign* is now *${on ? '✅ ON' : '❌ OFF'}*\n_Removes members with foreign country codes_\n\n${sig()}`);
        }
    },
    {
        command: 'antigroupmention', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antigroupmention = !config.features.antigroupmention;
            const on = config.features.antigroupmention;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Group-Mention* is now *${on ? '✅ ON' : '❌ OFF'}*\n_Deletes messages that @mention all_\n\n${sig()}`);
        }
    },
    {
        command: 'antisticker', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antisticker = !config.features.antisticker;
            const on = config.features.antisticker;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Sticker* is now *${on ? '✅ ON' : '❌ OFF'}*\n\n${sig()}`);
        }
    },

    // ── .cancelkick ───────────────────────────────────────────────────────────
    {
        command: 'cancelkick', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            groupKick.set(m.chat, { cancelled: true });
            ctx.reply(`✅ *Kick operation cancelled!*\n\n${sig()}`);
        }
    },

];

};

// ── module: plugins/image_tools.js ─────────────────────────────────────────
__bundleModules["plugins/image_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// LIAM EYES — IMAGE TOOLS (2 commands): remini, wallpaper
'use strict';
const axios  = require('axios');
const config = require('./settings');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

module.exports = [
  { command:'remini', category:'image',
    execute: async (sock,m,{reply}) => {
      const q = m.quoted||m;
      const mime = (q.msg||q).mimetype||'';
      if(!mime.includes('image')) return reply(`❗ *Reply to an image to enhance it!*\n\n${sig()}`);
      await react(sock,m,'✨');
      try {
        const buf = await sock.downloadMediaMessage(q);
        const FormData = require('form-data');
        const form = new FormData();
        form.append('image', buf, {filename:'photo.jpg',contentType:'image/jpeg'});
        const {data} = await axios.post('https://inferenceengine.vyro.ai/enhance',form,
          {headers:{...form.getHeaders(),'User-Agent':'okhttp/4.9.3'},timeout:30000,responseType:'arraybuffer'});
        await sock.sendMessage(m.chat,{
          image:Buffer.from(data),caption:`✨ *Image Enhanced (Remini)*\n\n${sig()}`
        },{quoted:m});
        await react(sock,m,'✅');
      } catch(e){await react(sock,m,'❌');reply(`❌ Enhance failed: ${e.message}\n\n${sig()}`);}
    }
  },

  { command:'wallpaper', category:'image',
    execute: async (sock,m,{text,reply}) => {
      const q = text||'abstract nature 4k';
      await react(sock,m,'🖼️');
      try {
        const queries = q.split(',').map(s=>s.trim()).slice(0,3);
        const results = [];
        for(const qr of queries){
          const url = `https://loremflickr.com/1920/1080/${encodeURIComponent(qr)}&${Date.now()}`;
          results.push({url,label:qr});
        }
        for(const r of results){
          await sock.sendMessage(m.chat,{
            image:{url:r.url},caption:`🖼️ *Wallpaper: ${r.label}*\n📐 1920×1080\n\n${sig()}`
          },{quoted:m});
          await new Promise(r2=>setTimeout(r2,500));
        }
        await react(sock,m,'✅');
      } catch(e){await react(sock,m,'❌');reply(`❌ Wallpaper failed: ${e.message}\n\n${sig()}`);}
    }
  },
];

};

// ── module: plugins/keepalive.js ───────────────────────────────────────────
__bundleModules["plugins/keepalive"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  LIAM EYES — keepalive.js  (always online, anti-idle, health beats)    ║
// ╚══════════════════════════════════════════════════════════════════════════╝
'use strict';
const config = require('./settings');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

// ── Global keep-alive engine (starts once, shared across restarts) ────────────
// Presence: always online — sends presenceUpdate every 2 min so WhatsApp
// never marks bot as "last seen" and disconnects drop-idle logic
let _kaStarted = false;

const startKeepalive = sock => {
    if (_kaStarted) return;
    _kaStarted = true;

    // ── Presence ping every 2 min ─────────────────────────────────────────
    const presencePing = setInterval(() => {
        try { sock.sendPresenceUpdate('available').catch(() => {}); } catch(_) {}
    }, 2 * 60 * 1000);

    // ── Self-DM heartbeat every 30 min (keeps session alive on hosting platforms)
    const heartbeat = setInterval(async () => {
        try {
            const f = (config.features || {});
            if (!f.keepalive) return;
            const linked = (sock.user?.id||'').split(':')[0].replace('@s.whatsapp.net','');
            if (!linked) return;
            const jid = linked + '@s.whatsapp.net';
            await sock.sendMessage(jid, { delete: (
                // Send and immediately delete so inbox stays clean
                await sock.sendMessage(jid, { text: '🤖 _[LIAM EYES heartbeat]_' }).catch(()=>null)
            )?.key }).catch(()=>{});
        } catch(_) {}
    }, 30 * 60 * 1000);

    // Cleanup on process exit
    process.once('SIGINT', () => { clearInterval(presencePing); clearInterval(heartbeat); });
    process.once('SIGTERM',() => { clearInterval(presencePing); clearInterval(heartbeat); });
};

// Auto-start when module is first loaded (sock injected via global)
setImmediate(() => { if (global._waSocket) startKeepalive(global._waSocket); });

module.exports = [
// ── .ping (enhanced with keepalive status) ───────────────────────────────────
{
    command:'ping2', category:'general', description:'Ping + keepalive status',
    execute: async (sock,m,{reply}) => {
        startKeepalive(sock); // ensure started
        const start = Date.now();
        await sock.sendMessage(m.chat, { react: { text: '🏓', key: m.key } });
        const lat = Date.now() - start;
        const up  = process.uptime();
        const d=~~(up/86400),h=~~(up%86400/3600),mn=~~(up%3600/60),s=~~(up%60);
        reply(
            `🏓 *Pong!*\n\n` +
            `⚡ *Latency:*  ${lat}ms\n` +
            `⏱️ *Uptime:*   ${d}d ${h}h ${mn}m ${s}s\n` +
            `🔋 *Keepalive:* ${_kaStarted ? '✅ Active' : '❌ Stopped'}\n` +
            `🌐 *Presence:*  ${sock.user ? '✅ Online' : '❌ Off'}\n\n` +
            sig()
        );
    }
},
// ── .ka ─ toggle keepalive ────────────────────────────────────────────────────
{
    command:'ka', category:'owner', description:'Toggle keepalive heartbeat (owner)', owner:true,
    execute: async (sock,m,{isCreator,reply}) => {
        if (!isCreator) return reply(config.message?.owner || '⚠️ Owner only!');
        config.features = config.features || {};
        config.features.keepalive = !config.features.keepalive;
        const on = config.features.keepalive;
        if (on) startKeepalive(sock);
        await sock.sendMessage(m.chat, { react: { text: on?'💚':'🔴', key: m.key } });
        reply(`${on?'💚':'🔴'} *Keepalive heartbeat:* ${on?'ON ✅':'OFF ❌'}\n\n${sig()}`);
    }
},
];

};

// ── module: plugins/media_tools.js ─────────────────────────────────────────
__bundleModules["plugins/media_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────────────────────────────
//  LIAM EYES — Media & Identity Tools
//  .pair  .share  .tostatus  .toprofile  .tomenuimg
//  .autobio  .menustyle
// ─────────────────────────────────────────────────────────────────────────────
const config = require('./settings');
const fs     = require('fs');
const path   = require('path');
const pino   = require('pino');

// ── Fancy bold-sans font ─────────────────────────────────────────────────────
function fancy(text) {
    const map = {
        A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',
        M:'𝗠',N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',
        Y:'𝗬',Z:'𝗭',
        a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',
        m:'𝗺',n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',
        y:'𝘆',z:'𝘇',
        '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵',
    };
    return text.split('').map(c => map[c] || c).join('');
}

// ── Auto-bio interval handle ─────────────────────────────────────────────────
let _bioClock = null;

// ── Media download helper ────────────────────────────────────────────────────
const dlMedia = async (sock, q) => {
    const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
    const mime   = (q.msg || q).mimetype || '';
    const type   = q.mtype ? q.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(q.msg || q, type);
    let buf = Buffer.from([]);
    for await (const c of stream) buf = Buffer.concat([buf, c]);
    return buf;
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = [

    // ─────────────────────────────────────────────────────────────────────────
    //  .pair <number>
    //  Spawns a temporary socket, gets a pairing code, sends the bare code
    //  first (easy copy), then replies to it with step-by-step instructions.
    //  When the number pairs, sends bare Session ID first, then instructions.
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'pair',
        category: 'owner',
        owner: true,
        execute: async (sock, m, { args, reply, isCreator, prefix }) => {
            if (!isCreator) return reply(config.message.owner);

            const num = (args[0] || '').replace(/\D/g, '');
            if (!num || num.length < 7) {
                return reply(
                    `📱 *LIAM EYES — Pair a Number*\n\n` +
                    `Usage: *${prefix}pair 254712345678*\n\n` +
                    `Enter full number with country code, no + or spaces.\n\n` +
                    `Or use the pairing site: ${config.pairingSite}\n\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
            await reply(`⏳ _Connecting to pairing server for +${num}… (may take 20s if server is waking)_`);

            // ── Use pairing site API ──────────────────────────────────────────
            // The pairing site creates a dedicated socket that stays alive
            // until the user enters the code AND the session is saved.
            // Direct socket from bot conflicts on panel hosting.
            const siteBase = (config.pairingSite || 'https://liam-pannel.onrender.com/pair')
                .replace(/\/pair\b.*$/, '');

            // Step 1: Wake the server with a health ping first
            try {
                const healthUrl = siteBase + '/ping';
                const hU = new URL(healthUrl);
                await new Promise(res => {
                    const req = (hU.protocol === 'https:' ? require('https') : require('http'))
                        .get({ hostname: hU.hostname, path: '/ping', timeout: 5000 }, res);
                    req.on('error', () => res());
                    req.on('timeout', () => { req.destroy(); res(); });
                });
            } catch (_) {}

            // Step 2: Request pairing code
            let code = null, pairSid = null, apiError = null;
            try {
                const apiUrl = siteBase + '/code?number=' + encodeURIComponent(num);
                const u = new URL(apiUrl);
                const resp = await new Promise((resolve, reject) => {
                    const req = (u.protocol === 'https:' ? require('https') : require('http'))
                        .get(
                            { hostname: u.hostname, path: u.pathname + u.search,
                              timeout: 30000, headers: { 'User-Agent': 'LIAM-EYES/1.0' } },
                            (res) => {
                                let data = '';
                                res.on('data', d => data += d);
                                res.on('end', () => {
                                    try { resolve(JSON.parse(data)); }
                                    catch { resolve({ error: 'Bad response: ' + data.slice(0,80) }); }
                                });
                            }
                        );
                    req.on('error', reject);
                    req.on('timeout', () => { req.destroy(); reject(new Error('Pairing server timeout — it may still be waking. Try again in 30 seconds.')); });
                });
                if (resp.error) apiError = resp.error;
                else if (resp.code) { code = resp.code; pairSid = resp.sid; }
                else apiError = 'No code in response';
            } catch (e) { apiError = e.message; }

            if (!code) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply(
                    `❌ *Could not get pairing code*\n\n` +
                    `Reason: ${apiError || 'Unknown'}\n\n` +
                    `*Fixes:*\n` +
                    `• Log out all WhatsApp Web sessions on +${num}\n` +
                    `• Wait 30s (server may be waking) then try again\n` +
                    `• Use the site directly: ${config.pairingSite}\n\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            }

            // ── Send the code ─────────────────────────────────────────────────
            await sock.sendMessage(m.chat, { react: { text: '🔑', key: m.key } });

            const codeMsg = await sock.sendMessage(m.chat, {
                text: `*${code}*`,
                contextInfo: { externalAdReply: {
                    title: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — Pairing Code',
                    body: `📱 +${num}  •  ⏱️ Valid 60 seconds`,
                    thumbnailUrl: config.thumbUrl, sourceUrl: config.pairingSite, mediaType: 1,
                }}
            }, { quoted: m });

            await sock.sendMessage(m.chat, {
                text:
                    `📲 *How to link:*\n` +
                    `1️⃣ Open WhatsApp on *+${num}*\n` +
                    `2️⃣ Tap ⋮ Menu → *Linked Devices*\n` +
                    `3️⃣ Tap *Link with Phone Number*\n` +
                    `4️⃣ Enter the code above ↑\n\n` +
                    `⏱️ _Code expires in 60 seconds!_\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `📦 *After linking:*\n` +
                    `A session ID (LIAM~...) will be sent to *+${num}'s* WhatsApp DM.\n\n` +
                    `1️⃣ Copy the LIAM~ message\n` +
                    `2️⃣ Panel → Startup/Env → set *SESSION_ID = LIAM~...*\n` +
                    `3️⃣ Click *Start/Restart*\n\n` +
                    `⚠️ _This code links a new session — set SESSION_ID to deploy!_\n\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            }, { quoted: codeMsg });
        }
    },

    {
        command: 'poststatus',
        category: 'tostatus',
        owner: true,
        execute: async (sock, m, { reply, isCreator }) => {
            if (!isCreator) return reply(config.message.owner);
            const q    = m.quoted || m;
            const mime = (q.msg || q).mimetype || '';
            if (!mime.includes('image') && !mime.includes('video'))
                return reply('❗ *Reply to an image or video* to post it as your status!');

            await sock.sendMessage(m.chat, { react: { text: '📤', key: m.key } });
            try {
                const buf = await dlMedia(sock, q);
                const payload = mime.includes('video')
                    ? { video: buf, caption: config.tagline }
                    : { image: buf, caption: config.tagline };
                await sock.sendMessage('status@broadcast', payload);
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                reply(`✅ *${fancy('Posted to Status!')}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
            } catch (e) { reply(`❌ Failed: ${e.message}`); }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .toprofile — reply to an image → set as BOT's profile picture
    //  (strips the :0 device suffix from sock.user.id before calling updateProfilePicture)
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'toprofile',
        category: 'media',
        owner: true,
        execute: async (sock, m, { reply, isCreator }) => {
            if (!isCreator) return reply(config.message.owner);
            const q    = m.quoted || m;
            const mime = (q.msg || q).mimetype || '';
            if (!mime.includes('image'))
                return reply('❗ *Reply to an image* to set it as the bot\'s profile picture!');

            await sock.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } });
            try {
                const buf    = await dlMedia(sock, q);
                // Baileys returns id like "254712345678:0@s.whatsapp.net" — strip device suffix
                const botJid = (sock.user?.id || '').replace(/:\d+@/, '@');
                await sock.updateProfilePicture(botJid, buf);
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                reply(`✅ *${fancy('Bot Profile Pic Updated!')}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
            } catch (e) { reply(`❌ Failed: ${e.message}\n_Ensure bot has permission to update its profile._`); }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .tomenuimg — reply to an image → replace .menu thumbnail
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'tomenuimg',
        category: 'media',
        owner: true,
        execute: async (sock, m, { reply, isCreator }) => {
            if (!isCreator) return reply(config.message.owner);
            const q    = m.quoted || m;
            const mime = (q.msg || q).mimetype || '';
            if (!mime.includes('image'))
                return reply('❗ *Reply to an image* to set it as the menu thumbnail!');

            await sock.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } });
            try {
                const buf     = await dlMedia(sock, q);
                const imgPath = path.join(__dirname, 'Resources', 'image.jpg');
                fs.writeFileSync(imgPath, buf);
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                reply(`✅ *${fancy('Menu Image Updated!')}*\n\n_Type .menu to see the new look!_\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
            } catch (e) { reply(`❌ Failed: ${e.message}`); }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .menustyle 1|2|3|4
    // ─────────────────────────────────────────────────────────────────────────

];

};

// ── module: plugins/multisession_tools.js ──────────────────────────────────
__bundleModules["plugins/multisession_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const fs     = require('fs');
const path   = require('path');
const config = require('./settings');
const auth   = __bundleRequire('library/auth');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OW    = ctx => ctx.isCreator;

const BACKUP = () => path.join(__dirname, 'sessions', 'backup');
const SESSION = () => path.join(__dirname, 'sessions');

module.exports = [

// ─────────────────────────────────────────────────────────────────────────
//  .sessionid — get current bot session ID / session for a number
// ─────────────────────────────────────────────────────────────────────────
{
    command: 'mysession', category: 'multisession', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(config.message.owner);
        const sessionDir = SESSION();
        const creds = path.join(sessionDir, 'creds.json');
        if (!fs.existsSync(creds)) return ctx.reply(`❌ No active session found.\n\n${sig()}`);
        const raw = fs.readFileSync(creds);
        const sid = 'LIAM~' + Buffer.from(raw).toString('base64url');
        await react(sock, m, '🔑');
        const sidMsg = await sock.sendMessage(m.chat, { text: sid }, { quoted: m });
        await sleep(500);
        sock.sendMessage(m.chat, {
            text: `🔑 *Your Current Bot Session ID*\n\n👆 Long-press the LIAM~ message above → *Copy*\n\n⚠️ _Never share this with anyone!_\n\n${sig()}`
        }, { quoted: sidMsg });
    }
},

// ─────────────────────────────────────────────────────────────────────────
//  .getsession <number> — retrieve saved session ID for a number
// ─────────────────────────────────────────────────────────────────────────
{
    command: 'getsession', category: 'multisession', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(config.message.owner);
        const num = (ctx.args[0] || '').replace(/\D/g, '');
        if (!num) return ctx.reply(`❓ Usage: *.getsession <number>*\nExample: _.getsession 254712345678_\n\n${sig()}`);

        const bDir = BACKUP();
        if (!fs.existsSync(bDir)) return ctx.reply(`❌ No backup directory.\n_Pair a number first._\n\n${sig()}`);

        const files = fs.readdirSync(bDir).filter(f => f.includes(num) && f.endsWith('.json'));
        if (!files.length) return ctx.reply(`❌ No saved session for +${num}\n\n_Sessions are auto-saved after .pair_\n\n${sig()}`);

        const data = JSON.parse(fs.readFileSync(path.join(bDir, files.sort().pop()), 'utf8'));
        const age  = Math.round((Date.now() - data.ts) / 60000);

        await react(sock, m, '🔑');
        const sidMsg = await sock.sendMessage(m.chat, { text: data.sid }, { quoted: m });
        await sleep(500);
        sock.sendMessage(m.chat, {
            text: `📋 *Session for +${num}*\n⏱️ Saved ${age} min ago\n\n👆 Long-press → Copy LIAM~ above\n\n${sig()}`
        }, { quoted: sidMsg });
    }
},

// ─────────────────────────────────────────────────────────────────────────
//  .listsessions — list all saved session backups
// ─────────────────────────────────────────────────────────────────────────
{
    command: 'listsessions', category: 'multisession', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(config.message.owner);
        const bDir = BACKUP();
        if (!fs.existsSync(bDir)) return ctx.reply(`❌ No backup directory.\n\n${sig()}`);

        const files = fs.readdirSync(bDir).filter(f => f.endsWith('.json'));
        if (!files.length) return ctx.reply(`📋 *No saved sessions yet.*\n_Pair a number with .pair to save one._\n\n${sig()}`);

        const list = files.slice(-20).map((f, i) => {
            try {
                const d = JSON.parse(fs.readFileSync(path.join(bDir, f), 'utf8'));
                const num = d.num || f.split('_')[1] || '?';
                const age = Math.round((Date.now() - d.ts) / 60000);
                return `${i + 1}. 📱 +${num}  ⏱️ ${age < 60 ? age + 'min' : Math.round(age/60) + 'hr'} ago`;
            } catch { return `${i+1}. 📁 ${f}`; }
        }).join('\n');

        ctx.reply(`📋 *Saved Session Backups*\n━━━━━━━━━━━━━━━━\n${list}\n\n_Use .getsession <number> to retrieve_\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────
//  .delsession <number> — delete a saved session backup
// ─────────────────────────────────────────────────────────────────────────
{
    command: 'delsession', category: 'multisession', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(config.message.owner);
        const num = (ctx.args[0] || '').replace(/\D/g, '');
        if (!num) return ctx.reply(`❓ Usage: *.delsession <number>*\n\n${sig()}`);

        const bDir = BACKUP();
        if (!fs.existsSync(bDir)) return ctx.reply(`❌ No backup directory.\n\n${sig()}`);

        const files = fs.readdirSync(bDir).filter(f => f.includes(num) && f.endsWith('.json'));
        if (!files.length) return ctx.reply(`❌ No session found for +${num}\n\n${sig()}`);

        files.forEach(f => { try { fs.unlinkSync(path.join(bDir, f)); } catch (_) {} });
        await react(sock, m, '🗑️');
        ctx.reply(`🗑️ *Deleted ${files.length} session backup(s) for +${num}*\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────
//  .activesessions — how many linked devices / active WA sessions
// ─────────────────────────────────────────────────────────────────────────
{
    command: 'activesessions', category: 'multisession', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(config.message.owner);
        try {
            const devices = await sock.getLinkedDevices?.() || [];
            // Session limit is looked up per-number, hidden from display
            const limit   = auth.getSessionLimit(ctx.senderNum, config.sessionLimits?.default || 3);
            ctx.reply(
                `📱 *Active Sessions — LIAM EYES*\n\n` +
                `🔗 Linked Devices: *${devices.length || 1}*\n` +
                `📊 Session Limit: *${limit}*\n` +
                `📶 Status: *Online*\n\n` +
                `${sig()}`
            );
        } catch {
            ctx.reply(`📱 *Active Sessions*\n\n🔗 Session: *Active (connected)*\n\n${sig()}`);
        }
    }
},

// ─────────────────────────────────────────────────────────────────────────
//  .setlimit <n> — set session limit for regular users
// ─────────────────────────────────────────────────────────────────────────
{
    command: 'setlimit', category: 'multisession', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(config.message.owner);
        const n = parseInt(ctx.args[0]);
        if (!n || n < 1 || n > 10) return ctx.reply(`❓ Usage: *.setlimit <1-10>*\nCurrent: *${config.sessionLimits?.default || 3}*\n\n${sig()}`);
        if (!config.sessionLimits) config.sessionLimits = {};
        config.sessionLimits.default = n;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Session limit set to ${n}*\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────
//  .getlink — get invite link for the pairing site
// ─────────────────────────────────────────────────────────────────────────
{
    command: 'getlink', category: 'multisession', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(config.message.owner);
        ctx.reply(
            `🔗 *LIAM EYES — Pairing Site*\n\n` +
            `${config.pairingSite}\n\n` +
            `_Share this with anyone who wants to pair a number_\n\n` +
            `${sig()}`
        );
    }
},

];

};

// ── module: plugins/other_tools.js ─────────────────────────────────────────
__bundleModules["plugins/other_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — OTHER TOOLS  (category: other)
//  Commands here: pair, share  (ping/runtime/time/botstatus/repo in others_extended)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const config = require('./settings');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

module.exports = [

{
    command: 'share', category: 'other',
    execute: async (sock, m, { reply }) => {
        const site = config.pairingSite || 'https://liam-pannel.onrender.com/pair';
        reply(
            `📤 *Share LIAM EYES*\n\n` +
            `🔗 Pairing Site: ${site}\n` +
            `📦 GitHub: ${config.github}\n` +
            `📡 Channel: ${config.channel}\n\n` +
            `_Share with friends who want a WhatsApp bot!_\n\n${sig()}`
        );
    }
},

{
    command: 'changelog', category: 'other',
    execute: async (sock, m, { reply }) => {
        reply(
            `📋 *LIAM EYES Changelog*\n\n` +
            `*v14 — Latest*\n` +
            `✅ 325+ commands\n` +
            `✅ 4 menu styles (numbered dropdown, classic, cursive, grid)\n` +
            `✅ Bilingual AI chatbot (Swahili + English)\n` +
            `✅ Customizable status react emojis\n` +
            `✅ Session ID backup & recovery\n` +
            `✅ Anti-delete → DM forwarding\n` +
            `✅ Status view → DM forwarding\n` +
            `✅ Sports: 9 leagues + wrestling\n` +
            `✅ Encrypted admin credentials\n\n` +
            `*v13* — Menu styles, chatbot\n` +
            `*v12* — .pair split-message flow\n` +
            `*v11* — Pairing site optimization\n` +
            `*v10* — .pair, .share, 3 menu styles\n\n` +
            `${sig()}`
        );
    }
},

{
    command: 'features', category: 'other',
    execute: async (sock, m, { reply }) => {
        reply(
            `⚡ *LIAM EYES Features*\n\n` +
            `🤖 AI Tools — GPT, Gemini, Blackbox, DALL-E\n` +
            `🎵 Audio — MP3, pitch, effects, TTS\n` +
            `⬇️ Downloads — TikTok, Instagram, YouTube, Spotify\n` +
            `🖼️ Ephoto360 — 34 text effects\n` +
            `😂 Fun — Facts, jokes, memes, trivia\n` +
            `🎮 Games — Truth or dare, riddles\n` +
            `👥 Groups — Full admin toolkit (55+ commands)\n` +
            `🌄 Image — Remini enhance, wallpapers\n` +
            `👑 Owner — Full control panel\n` +
            `🕌 Religion — Quran & Bible\n` +
            `🔍 Search — Define, IMDB, lyrics, weather\n` +
            `⚙️ Settings — 60+ customization options\n` +
            `⚽ Sports — 9 leagues + wrestling\n` +
            `🛠️ Tools — 35+ utilities\n` +
            `📤 Status — Post to status\n` +
            `🌍 Translate — 100+ languages\n` +
            `🎬 Video — Convert, extract audio\n\n` +
            `_Total: 325+ commands_\n\n${sig()}`
        );
    }
},

{
    command: 'help2', category: 'other',
    execute: async (sock, m, { prefix, reply }) => {
        reply(
            `❓ *Quick Help Guide*\n\n` +
            `*Menu:*\n${prefix}menu — Show all categories\n` +
            `${prefix}menu 5 — Open category 5 directly\n` +
            `_Reply with a number_ → See commands\n\n` +
            `*Session:*\n${prefix}session — Show bot session ID\n` +
            `${prefix}pair — Pair a new number\n\n` +
            `*Settings:*\n${prefix}chatbot on — Enable AI chat\n` +
            `${prefix}mode public/private\n` +
            `${prefix}setmenu 1/2/3/4 — Change menu style\n\n` +
            `*Owner:*\n${prefix}restart — Restart bot\n` +
            `${prefix}reload — Reload plugins\n\n` +
            `${sig()}`
        );
    }
},

{
    command: 'about', category: 'other',
    execute: async (sock, m, { reply }) => {
        reply(
            `👁️ *About LIAM EYES*\n\n` +
            `LIAM EYES is a powerful, open-source WhatsApp bot built with Baileys.\n\n` +
            `🔹 Version: Alpha\n` +
            `🔹 Commands: 325+\n` +
            `🔹 Language: Node.js\n` +
            `🔹 Framework: @whiskeysockets/baileys\n` +
            `🔹 AI: Pollinations.ai (free)\n` +
            `🔹 Platform: Cross-platform\n\n` +
            `_👁️ Your Eyes in the WhatsApp World_\n\n` +
            `${sig()}`
        );
    }
},

];

};

// ── module: plugins/others_extended.js ─────────────────────────────────────
__bundleModules["plugins/others_extended"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — OTHERS / EXTRA COMMANDS  (~25 commands)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('./settings');
const os     = require('os');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});
const sleep = ms => new Promise(r => setTimeout(r,ms));

// In-memory AFK store
const afkStore = new Map(); // jid → { reason, ts }

module.exports = [

// ─────────────────────────────────────────────────────────────────────────────
//  .botstatus — detailed bot status
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'botstatus', category: 'other',
    execute: async (sock, m, { reply }) => {
        const up    = process.uptime();
        const upStr = `${~~(up/86400)}d ${~~(up%86400/3600)}h ${~~(up%3600/60)}m ${~~(up%60)}s`;
        const mem   = process.memoryUsage();
        const cpu   = os.loadavg();
        reply(
            `👁️ *LIAM EYES Bot Status*\n\n` +
            `╔═══════════════════════════╗\n` +
            `║  ${sock.public ? '🌍 PUBLIC MODE' : '🔒 PRIVATE MODE'}          ║\n` +
            `╚═══════════════════════════╝\n\n` +
            `⚡ *Uptime:*    ${upStr}\n` +
            `💾 *RAM Used:* ${(mem.heapUsed/1024/1024).toFixed(1)} MB / ${(mem.heapTotal/1024/1024).toFixed(1)} MB\n` +
            `🖥️ *CPU Load:*  ${cpu[0].toFixed(2)} (1m avg)\n` +
            `🔧 *Node:*     ${process.version}\n` +
            `🌐 *Platform:* ${os.platform()} ${os.arch()}\n\n` +
            `*Active Features:*\n${Object.entries(config.features||{}).filter(([,v])=>v).map(([k])=>`✅ ${k}`).join('\n')||'_(none)_'}\n\n${sig()}`
        );
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .ping / .ping2
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  .runtime — uptime info
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'runtime', category: 'other',
    execute: async (sock, m, { reply }) => {
        const up = process.uptime();
        reply(`⏱️ *Bot Runtime*\n\n⚡ ${~~(up/86400)}d ${~~(up%86400/3600)}h ${~~(up%3600/60)}m ${~~(up%60)}s\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .time — show current time for timezone
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  .repo — show GitHub repo
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'repo', category: 'other',
    execute: async (sock, m, { reply }) => {
        reply(`📦 *LIAM EYES Repository*\n\n🔗 ${config.github || 'https://github.com/Dialmw/LIAM-EYES'}\n\n⭐ Star us on GitHub!\n📡 Subscribe: ${config.channel}\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .afk — set AFK mode
// ─────────────────────────────────────────────────────────────────────────────

{
    command: 'unafk', category: 'general',
    execute: async (sock, m, { reply, sender, pushname }) => {
        const data = afkStore.get(sender);
        if (!data) return reply(`❗ You weren't AFK.\n\n${sig()}`);
        const away = Math.round((Date.now() - data.ts) / 60000);
        afkStore.delete(sender);
        await react(sock, m, '👋');
        reply(`✅ *${pushname} is back!*\n\nWas AFK for ${away} minute(s)\nReason was: _${data.reason}_\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .note / .notes / .deletenote — quick notes
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'note', category: 'general',
    execute: async (sock, m, { text, reply, sender }) => {
        if (!text) return reply(`❗ Usage: *.note <text>*\n\n${sig()}`);
        if (!config._notes) config._notes = new Map();
        if (!config._notes.has(sender)) config._notes.set(sender, []);
        config._notes.get(sender).push({ text, ts: Date.now() });
        await react(sock, m, '📝');
        reply(`📝 *Note saved!*\n\n_"${text}"_\n\nView with *.notes*\n\n${sig()}`);
    }
},
{
    command: 'notes', category: 'general',
    execute: async (sock, m, { reply, sender }) => {
        const list = config._notes?.get(sender) || [];
        if (!list.length) return reply(`📝 *No notes* — use *.note <text>* to add one\n\n${sig()}`);
        const out = list.map((n,i) => `${i+1}. ${n.text}`).join('\n');
        reply(`📝 *Your Notes (${list.length})*\n\n${out}\n\nDelete: *.deletenote <number>*\n\n${sig()}`);
    }
},
{
    command: 'deletenote', category: 'general',
    execute: async (sock, m, { args, reply, sender }) => {
        const i = parseInt(args[0]) - 1;
        const list = config._notes?.get(sender) || [];
        if (!list.length) return reply(`❗ No notes to delete.\n\n${sig()}`);
        if (isNaN(i) || i < 0 || i >= list.length) return reply(`❗ Valid number: 1-${list.length}\n\n${sig()}`);
        const [removed] = list.splice(i, 1);
        await react(sock, m, '🗑️');
        reply(`🗑️ *Deleted note ${i+1}*\n\n_"${removed.text}"_\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .pm — send private message (bot to user DM)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'pm', category: 'general', owner: true,
    execute: async (sock, m, { args, text, isCreator, reply }) => {
        if (!isCreator) return reply('👑 Owner only!\n\n' + sig());
        const num = args[0]?.replace(/\D/g,'');
        const msg = args.slice(1).join(' ');
        if (!num || !msg) return reply(`❗ Usage: *.pm <number> <message>*\n\n${sig()}`);
        const jid = num + '@s.whatsapp.net';
        try {
            await sock.sendMessage(jid, { text: `👁️ *Message from LIAM EYES Owner*\n\n${msg}\n\n${sig()}` });
            await react(sock, m, '✅');
            reply(`✅ *Message sent to +${num}*\n\n${sig()}`);
        } catch(e){ reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .color — show color information for hex code
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'color', category: 'general',
    execute: async (sock, m, { args, reply }) => {
        const hex = (args[0] || '').replace('#','');
        if (!hex || !/^[0-9a-fA-F]{3,6}$/.test(hex)) return reply(`❗ Usage: *.color <hex>*\nExample: _.color ff5733_\n\n${sig()}`);
        const full = hex.length === 3 ? hex.split('').map(c=>c+c).join('') : hex.padEnd(6,'0');
        const r=parseInt(full.slice(0,2),16), g=parseInt(full.slice(2,4),16), b=parseInt(full.slice(4,6),16);
        const img = `https://singlecolorimage.com/get/${full}/200x100`;
        try {
            await sock.sendMessage(m.chat,{image:{url:img},caption:
                `🎨 *Color #${full.toUpperCase()}*\n\n🔴 R: ${r} · 🟢 G: ${g} · 🔵 B: ${b}\n💡 Hex: #${full.toUpperCase()}\n\n${sig()}`
            },{quoted:m});
        } catch(e){ reply(`🎨 Color #${full.toUpperCase()}\nR:${r} G:${g} B:${b}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .speedtest — internet speed estimate
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'speedtest', category: 'other',
    execute: async (sock, m, { reply }) => {
        await react(sock, m, '⚡');
        const start = Date.now();
        try {
            await axios.get('https://httpbin.org/bytes/512000', { timeout: 12000, responseType: 'arraybuffer' });
            const ms   = Date.now() - start;
            const mbps = ((0.512 * 8) / (ms / 1000)).toFixed(1);
            reply(`⚡ *Speed Test*\n\n📥 Download: ~${mbps} Mbps\n⏱️ Latency: ${ms}ms\n\n_Note: This is an estimate based on bot server speed_\n\n${sig()}`);
        } catch(e){ reply(`❌ Speed test failed: ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .weather2 — detailed weather (second provider)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'weather2', category: 'search',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.weather2 <city>*\n\n${sig()}`);
        await react(sock, m, '🌤️');
        try {
            const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(text)}?format=4`, { timeout: 8000 });
            reply(`🌤️ *Weather*\n\n${data}\n\n${sig()}`);
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .horoscope — daily horoscope
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'horoscope', category: 'fun',
    execute: async (sock, m, { args, reply }) => {
        const signs = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
        const sign  = (args[0] || '').toLowerCase();
        if (!signs.includes(sign))
            return reply(`❗ Usage: *.horoscope <sign>*\nSigns: ${signs.join(', ')}\n\n${sig()}`);
        await react(sock, m, '🔮');
        try {
            const { data } = await axios.post(`https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign=${sign}&day=TODAY`, {}, { timeout: 8000 });
            const h = data?.data;
            reply(`🔮 *${sign.charAt(0).toUpperCase()+sign.slice(1)} Horoscope*\n\n${h?.horoscope_data || 'The stars are aligning... try again.'}\n\n${sig()}`);
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .meme2 — fetch meme with search (alternative)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'meme2', category: 'fun',
    execute: async (sock, m, { args, reply }) => {
        await react(sock, m, '😂');
        try {
            const sub = args.length ? args.join('+') : 'funny';
            const { data } = await axios.get(`https://meme-api.com/gimme/${sub}`, { timeout: 10000 });
            if (!data?.url) throw new Error('No meme found');
            await sock.sendMessage(m.chat,{
                image:{url:data.url},
                caption:`😂 *${data.title||'Meme'}*\n👆 r/${data.subreddit||'memes'}\n\n${sig()}`
            },{quoted:m});
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .riddle — random riddle
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'riddle', category: 'fun',
    execute: async (sock, m, { reply }) => {
        const riddles = [
            { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?", a: "An echo" },
            { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps" },
            { q: "What has hands but can't clap?", a: "A clock" },
            { q: "What gets wetter the more it dries?", a: "A towel" },
            { q: "What can travel around the world while staying in one corner?", a: "A stamp" },
            { q: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?", a: "A map" },
            { q: "The more you have of it, the less you see. What is it?", a: "Darkness" },
        ];
        const r = riddles[Math.floor(Math.random()*riddles.length)];
        await react(sock, m, '🧩');
        await reply(`🧩 *Riddle*\n\n_${r.q}_\n\n||Answer: ${r.a}||  ← swipe/tap to reveal\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .wouldyou — would you rather
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'wouldyou', category: 'games',
    execute: async (sock, m, { reply }) => {
        const questions = [
            "Would you rather be invisible or be able to fly?",
            "Would you rather always speak your mind or never speak at all?",
            "Would you rather live in the past or the future?",
            "Would you rather be famous but broke or unknown but rich?",
            "Would you rather lose all your memories or never create new ones?",
            "Would you rather have unlimited money or unlimited time?",
            "Would you rather be able to talk to animals or speak every language?",
        ];
        const q = questions[Math.floor(Math.random()*questions.length)];
        reply(`🤔 *Would You Rather?*\n\n${q}\n\nReply with A or B!\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .compliment — send a random compliment
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  .roast — playful roast
// ─────────────────────────────────────────────────────────────────────────────

];

};

// ── module: plugins/owner_controls.js ──────────────────────────────────────
__bundleModules["plugins/owner_controls"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — OWNER CONTROLS  (~44 commands)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const { exec } = require('child_process');
const config = require('./settings');
const { encrypt } = __bundleRequire('library/liam');

const sig     = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react   = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});
const OW      = ctx => ctx.isCreator;
const ownerErr= '👑 This command is for the bot owner only!\n\n' + sig();
const getTmp  = ext => path.join(os.tmpdir(), `liam_${Date.now()}${ext}`);
const sleep   = ms => new Promise(r => setTimeout(r, ms));
const fixJid  = j  => (j||'').replace(/:\d+@/g,'@');

// ── Warn system (in-memory) ────────────────────────────────────────────────
const warnStore = new Map(); // jid → count
const getWarn = jid => warnStore.get(jid) || 0;
const addWarn = jid => { warnStore.set(jid, (warnStore.get(jid)||0)+1); return warnStore.get(jid); };
const resetWarn = jid => warnStore.set(jid, 0);

// ── AZA store (auto-reply) ─────────────────────────────────────────────────
const azaStore = new Map(); // keyword → reply text

module.exports = [

// ─────────────────────────────────────────────────────────────────────────────
//  .owner — show owner contact card
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'owner', category: 'owner',
    execute: async (sock, m, { reply }) => {
        const num = config.owner || '';
        await sock.sendMessage(m.chat, {
            contacts: {
                displayName: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 Owner',
                contacts: [{ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:LIAM EYES Owner\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD` }]
            }
        }, { quoted: m });
        reply(`👑 *Bot Owner*\n\n📞 +${num}\n👁️ LIAM EYES Alpha\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .block / .unblock — block/unblock a user
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'block', category: 'owner', owner: true,
    execute: async (sock, m, { reply, isCreator, quoted }) => {
        if (!isCreator) return reply(ownerErr);
        const jid = fixJid(quoted?.sender || m.quoted?.sender || '');
        if (!jid) return reply('❗ Reply to a message from the user to block.\n\n' + sig());
        await react(sock, m, '🚫');
        await sock.updateBlockStatus(jid, 'block').catch(() => {});
        reply(`🚫 *Blocked* @${jid.split('@')[0]}\n\n${sig()}`);
    }
},
{
    command: 'unblock', category: 'owner', owner: true,
    execute: async (sock, m, { args, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        const num = args[0]?.replace(/\D/g,'');
        if (!num) return reply('❗ Usage: *.unblock <number>*\n\n' + sig());
        const jid = num + '@s.whatsapp.net';
        await sock.updateBlockStatus(jid, 'unblock').catch(() => {});
        await react(sock, m, '✅');
        reply(`✅ *Unblocked* @${num}\n\n${sig()}`);
    }
},
{
    command: 'unblockall', category: 'owner', owner: true,
    execute: async (sock, m, { reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        await react(sock, m, '⏳');
        try {
            const blocked = await sock.fetchBlocklist();
            for (const jid of blocked) {
                await sock.updateBlockStatus(jid, 'unblock').catch(()=>{});
                await sleep(800);
            }
            reply(`✅ *Unblocked ${blocked.length} users*\n\n${sig()}`);
        } catch(e) { reply('❌ ' + e.message); }
    }
},
{
    command: 'listblocked', category: 'owner', owner: true,
    execute: async (sock, m, { reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        try {
            const list = await sock.fetchBlocklist();
            if (!list.length) return reply('📋 *No blocked users*\n\n' + sig());
            reply(`🚫 *Blocked Users (${list.length})*\n\n${list.map((j,i)=>`${i+1}. +${j.split('@')[0]}`).join('\n')}\n\n${sig()}`);
        } catch(e) { reply('❌ ' + e.message); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .join / .leave — join/leave groups
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'join', category: 'owner', owner: true,
    execute: async (sock, m, { args, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        const link = args[0];
        if (!link) return reply('❗ Usage: *.join <invite_link>*\n\n' + sig());
        const code = link.split('/').pop();
        try {
            await react(sock, m, '🔗');
            await sock.groupAcceptInvite(code);
            reply(`✅ *Joined group!*\n\n${sig()}`);
        } catch(e) { reply(`❌ Join failed: ${e.message}\n\n${sig()}`); }
    }
},
{
    command: 'leave', category: 'owner', owner: true,
    execute: async (sock, m, { args, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        const gid = args[0] || (m.isGroup ? m.chat : '');
        if (!gid) return reply('❗ Use in group or: *.leave <groupId>*\n\n' + sig());
        try {
            await react(sock, m, '👋');
            await sock.groupLeave(gid);
            reply(`✅ Left group!\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .delete — delete a replied-to message
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'delete', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, quoted, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const q = m.quoted;
        if (!q) return reply('❗ Reply to a message to delete it.\n\n' + sig());
        await sock.sendMessage(m.chat, { delete: q.key }).catch(() => {});
        await react(sock, m, '🗑️');
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .setbio — change bot's WhatsApp bio/about
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'setbio', category: 'owner', owner: true,
    execute: async (sock, m, { text, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        if (!text) return reply('❗ Usage: *.setbio <text>*\n\n' + sig());
        try {
            await sock.updateProfileStatus(text);
            await react(sock, m, '✅');
            reply(`✅ *Bio updated!*\n\n_"${text}"_\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .setprofilepic — change bot's WhatsApp profile picture
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'setprofilepic', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('image')) return reply('❗ Reply to an image.\n\n' + sig());
        try {
            await react(sock, m, '🖼️');
            const buf = await sock.downloadMediaMessage(q.msg || q);
            await sock.updateProfilePicture(sock.user.id, buf);
            await react(sock, m, '✅');
            reply(`✅ *Profile picture updated!*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .getpp — get profile picture of a user
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'getpp', category: 'tools',
    execute: async (sock, m, { args, reply, quoted, sender }) => {
        const jid = args[0]?.includes('@')
            ? args[0]
            : args[0]?.replace(/\D/g,'') ? args[0].replace(/\D/g,'') + '@s.whatsapp.net'
            : fixJid(m.quoted?.sender || sender);
        try {
            await react(sock, m, '🖼️');
            const url = await sock.profilePictureUrl(jid, 'image');
            await sock.sendMessage(m.chat, {
                image: { url }, caption: `🖼️ *Profile Picture*\n👤 @${jid.split('@')[0]}\n\n${sig()}`,
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch(e) { reply(`❌ No profile pic found\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .ppprivacy / .lastseen / .readreceipts / .online — WA privacy settings
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'ppprivacy', category: 'owner', owner: true,
    execute: async (sock, m, { args, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        const val = args[0] || 'contacts';
        const valid = ['all','contacts','contact_blacklist','none'];
        if (!valid.includes(val)) return reply(`❗ Options: ${valid.join(', ')}\n\nUsage: *.ppprivacy contacts*\n\n${sig()}`);
        try {
            await sock.updateProfilePicturePrivacy(val);
            await react(sock, m, '✅');
            reply(`✅ *Profile pic visibility → ${val}*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},
{
    command: 'lastseen', category: 'owner', owner: true,
    execute: async (sock, m, { args, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        const val = args[0] || 'contacts';
        try {
            await sock.updateLastSeenPrivacy(val);
            await react(sock, m, '✅');
            reply(`✅ *Last Seen → ${val}*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},
{
    command: 'readreceipts', category: 'owner', owner: true,
    execute: async (sock, m, { args, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        const val = args[0] || 'all';
        try {
            await sock.updateReadReceiptsPrivacy(val);
            await react(sock, m, '✅');
            reply(`✅ *Read Receipts → ${val}*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},
{
    command: 'online', category: 'owner', owner: true,
    execute: async (sock, m, { args, isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const on = (args[0] || 'toggle') !== 'off';
        await sock.sendPresenceUpdate(on ? 'available' : 'unavailable').catch(()=>{});
        config.features.alwaysonline = on;
        await react(sock, m, on ? '🟢' : '🔴');
        reply(`${on ? '🟢' : '🔴'} *Always Online → ${on ? 'ON' : 'OFF'}*\n\n${sig()}`);
    }
},
{
    command: 'gcaddprivacy', category: 'owner', owner: true,
    execute: async (sock, m, { args, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        const val = args[0] || 'contacts';
        try {
            await sock.updateGroupsAddPrivacy(val);
            await react(sock, m, '✅');
            reply(`✅ *Group Add Privacy → ${val}*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .disk — disk usage info
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'disk', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        exec('df -h /', (err, stdout) => {
            const lines = stdout?.trim().split('\n');
            const info  = lines?.[1]?.split(/\s+/) || [];
            reply(
                `💾 *Disk Usage*\n\n` +
                `Total:  ${info[1]||'N/A'}\n` +
                `Used:   ${info[2]||'N/A'} (${info[4]||'?'})\n` +
                `Free:   ${info[3]||'N/A'}\n\n${sig()}`
            );
        });
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .hostip — get server public IP
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'hostip', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        try {
            const { data } = await axios.get('https://api.ipify.org?format=json', { timeout: 6000 });
            const loc = await axios.get(`https://ipapi.co/${data.ip}/json/`, { timeout: 6000 });
            reply(
                `🌐 *Server Info*\n\n` +
                `🔹 IP: \`${data.ip}\`\n` +
                `🔹 Country: ${loc.data?.country_name || 'N/A'}\n` +
                `🔹 City: ${loc.data?.city || 'N/A'}\n` +
                `🔹 ISP: ${loc.data?.org || 'N/A'}\n` +
                `🔹 Platform: ${os.platform()} ${os.arch()}\n` +
                `🔹 Node: ${process.version}\n\n${sig()}`
            );
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .groupid — get current group JID
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'groupid', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        if (!m.isGroup) return reply('❗ Use in a group.\n\n' + sig());
        reply(`📋 *Group ID*\n\n\`${m.chat}\`\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .listgroups — list all groups bot is in
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'listgroups', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        try {
            const allChats = Object.keys(sock.store?.chats?.all?.() || {});
            const groups   = allChats.filter(j => j.endsWith('@g.us'));
            if (!groups.length) return reply('📋 Not in any groups yet.\n\n' + sig());
            const lines = [];
            for (const g of groups.slice(0, 30)) {
                const meta = await sock.groupMetadata(g).catch(() => null);
                if (meta) lines.push(`▸ ${meta.subject} (${meta.participants.length} members)`);
            }
            reply(`👥 *Groups (${groups.length})*\n\n${lines.join('\n')}\n\n${sig()}`);
        } catch(e) { reply('❌ ' + e.message); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .react — react to a message
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'react', category: 'owner', owner: true,
    execute: async (sock, m, { args, isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const emoji = args[0];
        if (!emoji) return reply('❗ Usage: *.react <emoji>* (reply to a message)\n\n' + sig());
        const target = m.quoted || m;
        await sock.sendMessage(m.chat, { react: { text: emoji, key: target.key } }).catch(() => {});
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .warn / .listwarn / .resetwarn — warn system
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'warn', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, text, reply, quoted, groupAdmins, isBotAdmins }) => {
        if (!isCreator) return reply(ownerErr);
        const jid = fixJid(m.quoted?.sender || '');
        if (!jid) return reply('❗ Reply to a user\'s message.\n\n' + sig());
        const num = addWarn(jid);
        const limit = config.warnLimit || 3;
        await react(sock, m, '⚠️');
        const reason = text || 'No reason given';
        let msg = `⚠️ *Warning ${num}/${limit}*\n\n👤 @${jid.split('@')[0]}\n📝 Reason: ${reason}\n\n`;
        if (num >= limit) {
            msg += '🔴 *LIMIT REACHED — Taking action!*';
            if (m.isGroup && isBotAdmins) {
                await sock.groupParticipantsUpdate(m.chat, [jid], 'remove').catch(()=>{});
            }
            resetWarn(jid);
        } else {
            msg += `_${limit - num} warning(s) left before action_`;
        }
        msg += `\n\n${sig()}`;
        await sock.sendMessage(m.chat, { text: msg, mentions: [jid] }, { quoted: m });
    }
},
{
    command: 'warnlist', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        if (!warnStore.size) return reply('📋 *No active warnings*\n\n' + sig());
        const lines = [...warnStore.entries()].map(([j,c]) => `👤 @${j.split('@')[0]} — ⚠️ ${c} warn(s)`);
        reply(`⚠️ *Active Warnings*\n\n${lines.join('\n')}\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .restart — restart the bot
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'restart', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        await react(sock, m, '🔄');
        await reply(`🔄 *Restarting LIAM EYES...*\n\nBe back in a moment!\n\n${sig()}`);
        await sleep(2000);
        process.exit(0);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .update — check for + apply GitHub updates
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'update', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        await sock.sendMessage(m.chat, { react: { text: '🔄', key: m.key } });
        const { doUpdate } = __bundleRequire('library/updater');
        await doUpdate(sock, m, reply);
    }
},


// ─────────────────────────────────────────────────────────────────────────────
//  .repo — show bot repository info
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  .deljunk / .cleartemp — clear temp files
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'deljunk', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const tmpDir = os.tmpdir();
        let count = 0;
        try {
            const files = fs.readdirSync(tmpDir).filter(f => f.startsWith('liam_'));
            files.forEach(f => {
                try { fs.unlinkSync(path.join(tmpDir, f)); count++; } catch(_) {}
            });
            await react(sock, m, '🗑️');
            reply(`🗑️ *Cleaned ${count} temp files*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .modestatus — toggle public/private mode
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'modestatus', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply, args }) => {
        if (!isCreator) return reply(ownerErr);
        const mode = (args[0] || (sock.public ? 'private' : 'public')).toLowerCase();
        if (!['public','private'].includes(mode)) return reply('❗ Usage: *.modestatus public/private*\n\n' + sig());
        sock.public = mode === 'public';
        await react(sock, m, mode === 'public' ? '🌍' : '🔒');
        reply(`${mode === 'public' ? '🌍' : '🔒'} *Mode → ${mode.toUpperCase()}*\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .toviewonce — convert media to view-once
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'toviewonce', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const q = m.quoted;
        if (!q) return reply('❗ Reply to a media message.\n\n' + sig());
        const mime = (q.msg || q).mimetype || '';
        try {
            await react(sock, m, '👁️');
            const buf = await sock.downloadMediaMessage(q.msg || q);
            if (mime.includes('image')) {
                await sock.sendMessage(m.chat, { image: buf, viewOnce: true, caption: '' }, { quoted: m });
            } else if (mime.includes('video')) {
                await sock.sendMessage(m.chat, { video: buf, viewOnce: true, caption: '' }, { quoted: m });
            } else if (mime.includes('audio')) {
                await sock.sendMessage(m.chat, { audio: buf, viewOnce: true, mimetype: 'audio/mp4' }, { quoted: m });
            } else {
                return reply('❌ Unsupported media type.\n\n' + sig());
            }
            await react(sock, m, '✅');
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .vv2 — reveal view-once media (alias)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  .dlvo — download view-once from link
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'dlvo', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const q = m.quoted;
        if (!q) return reply('❗ Reply to a view-once message.\n\n' + sig());
        try {
            await react(sock, m, '⬇️');
            const buf = await sock.downloadMediaMessage(q.msg || q);
            const mime = (q.msg || q).mimetype || '';
            if (mime.includes('video'))
                await sock.sendMessage(m.chat, { video: buf, caption: '📥 Downloaded\n\n' + sig() }, { quoted: m });
            else if (mime.includes('audio'))
                await sock.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mp4' }, { quoted: m });
            else
                await sock.sendMessage(m.chat, { image: buf, caption: '📥 Downloaded\n\n' + sig() }, { quoted: m });
            await react(sock, m, '✅');
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .broadcast — send message to all private chats
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'broadcast', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, text, reply }) => {
        if (!isCreator) return reply(ownerErr);
        if (!text) return reply('❗ Usage: *.broadcast <message>*\n\n' + sig());
        await react(sock, m, '📣');
        try {
            const chats = Object.keys(sock.store?.chats?.all?.() || {}).filter(j => j.endsWith('@s.whatsapp.net'));
            let sent = 0;
            for (const jid of chats.slice(0, 50)) {
                try {
                    await sock.sendMessage(jid, { text: `📣 *LIAM EYES Broadcast*\n\n${text}\n\n${sig()}` });
                    sent++;
                    await sleep(1500);
                } catch(_) {}
            }
            reply(`✅ *Broadcast sent to ${sent} chats*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .aza / .setaza / .resetaza — auto-response keywords
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'setaza', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, args, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const sep = args.indexOf('|');
        if (sep < 0 || sep === 0 || sep === args.length-1)
            return reply('❗ Usage: *.setaza keyword | response*\nExample: _.setaza hi | Hello there!_\n\n' + sig());
        const keyword = args.slice(0, sep).join(' ').toLowerCase();
        const response = args.slice(sep+1).join(' ');
        azaStore.set(keyword, response);
        if (!config._azaStore) config._azaStore = azaStore;
        await react(sock, m, '✅');
        reply(`✅ *Auto-reply set*\nKeyword: *${keyword}*\nReply: _${response}_\n\n${sig()}`);
    }
},
{
    command: 'aza', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        if (!azaStore.size) return reply('📋 *No auto-replies set*\n\nUse *.setaza keyword | response*\n\n' + sig());
        const list = [...azaStore.entries()].map(([k,v],i)=>`${i+1}. *${k}* → ${v}`).join('\n');
        reply(`🤖 *Auto-Replies*\n\n${list}\n\n${sig()}`);
    }
},
{
    command: 'resetaza', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, args, reply }) => {
        if (!isCreator) return reply(ownerErr);
        if (args[0]) {
            azaStore.delete(args[0].toLowerCase());
            reply(`✅ *Removed:* ${args[0]}\n\n${sig()}`);
        } else {
            azaStore.clear();
            reply(`✅ *All auto-replies cleared*\n\n${sig()}`);
        }
        await react(sock, m, '🗑️');
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .listbadword — show bad words list
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'listbadword', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const list = config.badwords || [];
        if (!list.length) return reply('📋 *No bad words configured*\n\n' + sig());
        reply(`🚫 *Bad Words List (${list.length})*\n\n${list.map((w,i)=>`${i+1}. ||${w}||`).join('\n')}\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .listignorelist — ignored JIDs
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'listignorelist', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const list = config.ignoreList || [];
        if (!list.length) return reply('📋 *Ignore list is empty*\n\n' + sig());
        reply(`📵 *Ignore List (${list.length})*\n\n${list.map((j,i)=>`${i+1}. @${j.split('@')[0]}`).join('\n')}\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .listsudo — sudo users
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'listsudo', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const list = config.sudo || [];
        if (!list.length) return reply('📋 *No sudo users set*\n\n' + sig());
        reply(`🛡️ *Sudo Users (${list.length})*\n\n${list.map((n,i)=>`${i+1}. +${n}`).join('\n')}\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .delstickercmd / .setstickercmd — custom sticker command name
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'setstickercmd', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, args, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const cmd = args[0]?.toLowerCase();
        if (!cmd) return reply('❗ Usage: *.setstickercmd <name>*\n\n' + sig());
        config.stickerCmd = cmd;
        await react(sock, m, '✅');
        reply(`✅ *Sticker command → .${cmd}*\n\n${sig()}`);
    }
},
{
    command: 'delstickercmd', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        delete config.stickerCmd;
        await react(sock, m, '✅');
        reply(`✅ *Sticker command reset to default (.sticker)*\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .autosavestatus — toggle auto-save statuses to folder
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  .sessionid — show session ID for a number
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'sessionid', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, args, reply }) => {
        if (!isCreator) return reply(ownerErr);

        // ── Locate creds — check all known paths ────────────────────────
        // Bot sessions live in sessions/main/creds.json regardless of how
        // the bot was linked (panel, pairing site, env var, or .pair cmd)
        const baseDir   = __dirname;
        const mainCreds = path.join(baseDir, 'sessions', 'main', 'creds.json');
        const oldCreds  = path.join(baseDir, 'sessions', 'creds.json');
        const backupDir = path.join(baseDir, 'sessions', 'backup');

        // No args → show current bot session
        if (!args[0]) {
            // Priority: sessions/main/creds.json → sessions/creds.json → SESSION_ID env var
            const envSid    = process.env.SESSION_ID || process.env.LIAM_SESSION_ID || '';
            const credsPath = fs.existsSync(mainCreds) ? mainCreds
                            : fs.existsSync(oldCreds)  ? oldCreds
                            : null;

            // If no creds file but we have env SESSION_ID, return that
            if (!credsPath && envSid && envSid.startsWith('LIAM~')) {
                await sock.sendMessage(m.chat,{react:{text:'🔑',key:m.key}}).catch(()=>{});
                const sidMsg = await sock.sendMessage(m.chat,{text:envSid},{quoted:m});
                await sleep(600);
                return sock.sendMessage(m.chat,{
                    text: `🔑 *Your Bot Session ID*\n\n` +
                          `👆 Long-press *LIAM~* above → *Copy*\n\n` +
                          `📌 Source: _SESSION_ID environment variable_\n\n` +
                          `⚠️ _Never share this with anyone!_\n\n` +
                          `${sig()}`
                },{quoted:sidMsg});
            }

            if (!credsPath)
                return reply(
                    `❌ *Session file not found*\n\n` +
                    `Looked in:\n` +
                    `• sessions/main/creds.json\n` +
                    `• sessions/creds.json\n` +
                    `• SESSION_ID env var\n\n` +
                    `The bot is connected, so the session must exist.\n` +
                    `Try restarting and using .sessionid again.\n\n${sig()}`
                );

            await sock.sendMessage(m.chat, { react: { text: '🔑', key: m.key } }).catch(()=>{});
            const raw = fs.readFileSync(credsPath);
            const sid = 'LIAM~' + Buffer.from(raw).toString('base64url');

            // Send bare SID (easy to long-press copy)
            const sidMsg = await sock.sendMessage(m.chat, { text: sid }, { quoted: m });
            await sleep(600);
            return sock.sendMessage(m.chat, {
                text:
                    `🔑 *Your Bot Session ID*\n\n` +
                    `👆 Long-press the *LIAM~* message above → *Copy*\n\n` +
                    `⚠️ _Never share this with anyone!_\n\n` +
                    `📌 Use it in:\n` +
                    `• settings.js → sessionId: "..."\n` +
                    `• Or as SESSION_ID env var on your panel\n\n` +
                    `${sig()}`
            }, { quoted: sidMsg });
        }

        // Args provided → look up backup for a specific number
        const num = args[0].replace(/\D/g,'');
        if (!fs.existsSync(backupDir))
            return reply(`❌ No backup directory.\n_Pair a number first with .pair_\n\n${sig()}`);

        const files = fs.readdirSync(backupDir).filter(f => f.includes(num) && f.endsWith('.json'));
        if (!files.length)
            return reply(`❌ No saved session for +${num}\n\n_Sessions save automatically during .pair_\n\n${sig()}`);

        const latest = files.sort().pop();
        const data   = JSON.parse(fs.readFileSync(path.join(backupDir, latest), 'utf8'));
        const age    = Math.round((Date.now() - data.ts) / 60000);

        await sock.sendMessage(m.chat, { react: { text: '📋', key: m.key } }).catch(()=>{});
        const sidMsg = await sock.sendMessage(m.chat, { text: data.sid }, { quoted: m });
        await sleep(600);
        sock.sendMessage(m.chat, {
            text: `📋 *Saved Session for +${num}*\n⏱️ Saved ${age} min ago\n\n👆 Long-press → Copy LIAM~ above\n\n${sig()}`
        }, { quoted: sidMsg });
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .getabout — get a user's about/status text
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'getabout', category: 'tools',
    execute: async (sock, m, { args, sender, reply }) => {
        const jid = args[0]?.replace(/\D/g,'') ? args[0].replace(/\D/g,'') + '@s.whatsapp.net' : fixJid(m.quoted?.sender || sender);
        try {
            const { status } = await sock.fetchStatus(jid);
            reply(`💬 *About @${jid.split('@')[0]}*\n\n${status || '_(empty)_'}\n\n${sig()}`);
        } catch(e) { reply(`❌ Could not fetch about: ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .noprivacy — reset all privacy to default (all visible)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'noprivacy', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        try {
            await Promise.all([
                sock.updateLastSeenPrivacy('all'),
                sock.updateOnlinePrivacy('all'),
                sock.updateProfilePicturePrivacy('all'),
                sock.updateStatusPrivacy('all'),
                sock.updateReadReceiptsPrivacy('all'),
                sock.updateGroupsAddPrivacy('all'),
            ]).catch(()=>{});
            await react(sock, m, '✅');
            reply(`✅ *All privacy → Everyone (all)*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .alladmin — promote all group members to admin
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'alladmin', category: 'owner', owner: true, group: true,
    execute: async (sock, m, { isCreator, reply, participants, isBotAdmins }) => {
        if (!isCreator) return reply(ownerErr);
        if (!isBotAdmins) return reply('❌ Bot needs admin rights.\n\n' + sig());
        const nonAdmins = participants.filter(p => !p.admin).map(p => p.id);
        if (!nonAdmins.length) return reply('✅ Everyone is already admin!\n\n' + sig());
        await react(sock, m, '👑');
        for (const jid of nonAdmins) {
            await sock.groupParticipantsUpdate(m.chat, [jid], 'promote').catch(()=>{});
            await sleep(500);
        }
        reply(`✅ *Promoted ${nonAdmins.length} members to admin*\n\n${sig()}`);
    }
},

    // ─────────────────────────────────────────────────────────────────────────
    //  .sessions — list all session backups  |  .sessions <number> → show SID
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'sessions', category: 'owner', owner: true,
        execute: async (sock, m, ctx) => {
            if (!ctx.isCreator) return ctx.reply(config.message.owner);
            const { args } = ctx;
            const backupDir = path.join(__dirname, 'sessions', 'backup');

            if (!fs.existsSync(backupDir))
                return ctx.reply(`❌ No sessions backup directory found.\nPair a number first with *.pair*\n\n${sig()}`);

            const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
            if (!files.length)
                return ctx.reply(`❌ No session backups saved yet.\n_Sessions are auto-saved after pairing._\n\n${sig()}`);

            // .sessions <number> → show the session ID for that number
            if (args[0]) {
                const num = args[0].replace(/\D/g, '');
                const match = files.filter(f => f.includes(num));
                if (!match.length)
                    return ctx.reply(`❌ No session found for +${num}\n\n${sig()}`);
                const data = JSON.parse(fs.readFileSync(path.join(backupDir, match[match.length - 1])));
                const age  = Math.round((Date.now() - data.ts) / 60000);
                const sidMsg = await sock.sendMessage(m.chat, { text: data.sid }, { quoted: m });
                await sleep(400);
                return ctx.reply(`📋 *Session for +${num}*\n⏱️ Saved ${age} min ago\n👆 Long-press above to copy\n\n${sig()}`);
            }

            // No args → list all session backups
            const list = files.slice(-20).map(f => {
                try {
                    const d = JSON.parse(fs.readFileSync(path.join(backupDir, f)));
                    const num = d.num || f.replace('.json', '');
                    const age = Math.round((Date.now() - d.ts) / 60000);
                    return `📱 +${num}  (${age < 60 ? age + 'min' : Math.round(age/60) + 'hr'} ago)`;
                } catch { return `📁 ${f}`; }
            }).join('\n');

            ctx.reply(
                `📋 *Session Backups — LIAM EYES*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n${list}\n\n` +
                `_Use *.sessions <number>* to get a specific SID_\n\n${sig()}`
            );
        }
    },

];

};

// ── module: plugins/ping.js ────────────────────────────────────────────────
__bundleModules["plugins/ping"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
module.exports = {
    command: 'ping', description: 'Check bot response speed', category: 'general',
    execute: async (sock, m, { reply }) => {
        const start = Date.now();
        await sock.sendMessage(m.chat, { react: { text: '🏓', key: m.key } });
        reply(`🏓 *Pong!*\n⚡ *Speed:* ${Date.now() - start}ms`);
    }
};

};

// ── module: plugins/play.js ────────────────────────────────────────────────
__bundleModules["plugins/play"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ── LIAM EYES — play.js  (music downloader, fast delivery)
'use strict';
const yts  = require('yt-search');
const { dlAudio, fmtDur } = __bundleRequire('library/dl');
const config = require('./settings');
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

};

// ── module: plugins/presence_tools.js ──────────────────────────────────────
__bundleModules["plugins/presence_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  LIAM EYES — presence_tools.js  (online mode, bio, typing, read)       ║
// ╚══════════════════════════════════════════════════════════════════════════╝
'use strict';
const config = require('./settings');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

module.exports = [

// ── .online — force presence to always-online ─────────────────────────────

// ── .setbio — change bot's WhatsApp status bio ───────────────────────────────

// ── .setname — change bot's display name ─────────────────────────────────────
{
    command:'setname', category:'owner', description:'Change bot profile name', owner:true,
    execute: async (sock,m,{text,isCreator,reply,prefix}) => {
        if (!isCreator) return reply(config.message?.owner);
        if (!text) return reply(`👤 *Usage:* ${prefix}setname <new name>\n\n${sig()}`);
        await react(sock,m,'👤');
        try {
            await sock.updateProfileName(text);
            reply(`✅ *Name updated!* → ${text}\n\n${sig()}`);
        } catch(e) {
            reply(`❌ Name update failed: ${e.message}\n\n${sig()}`);
        }
    }
},

// ── .autoread — toggle auto-read all messages ─────────────────────────────────

// ── .autotyping — toggle auto composing indicator ────────────────────────────
{
    command:'autotyping', category:'owner', description:'Toggle auto typing indicator', owner:true,
    execute: async (sock,m,{isCreator,reply}) => {
        if (!isCreator) return reply(config.message?.owner);
        config.features = config.features || {};
        config.features.autotyping = !config.features.autotyping;
        const on = config.features.autotyping;
        await react(sock,m,on?'⌨️':'⚫');
        reply(`${on?'⌨️':'⚫'} *Auto Typing:* ${on?'ON':'OFF'}\n\n${sig()}`);
    }
},

// ── .status — show all feature toggles ───────────────────────────────────────
{
    command:'status2', category:'owner', description:'Show all bot feature toggles', owner:true,
    execute: async (sock,m,{isCreator,reply,prefix}) => {
        if (!isCreator) return reply(config.message?.owner);
        const f = config.features || {};
        const T = k => f[k] ? '✅' : '❌';
        reply(
            `⚙️ *LIAM EYES — Feature Status*\n\n` +
            `${T('antidelete')} Anti-Delete\n` +
            `${T('alwaysonline')} Always Online\n` +
            `${T('autoread')} Auto Read\n` +
            `${T('autotyping')} Auto Typing\n` +
            `${T('chatbot')} Chatbot\n` +
            `${T('antilink')} Anti-Link\n` +
            `${T('welcome')} Welcome/Goodbye\n` +
            `${T('autoviewstatus')} Auto View Status\n` +
            `${T('autoreactstatus')} Auto React Status\n` +
            `${T('keepalive')} Keepalive Heartbeat\n` +
            `${T('autosavestatus')} Auto Save Status\n\n` +
            `_Toggle any with: ${prefix}<feature name>_\n\n` +
            sig()
        );
    }
},

];

};

// ── module: plugins/reaction_tools.js ──────────────────────────────────────
__bundleModules["plugins/reaction_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('./settings');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

// ── GIF/Image reaction via tenor API (free, no key needed) ───────────────
const tenorGif = async (search) => {
    try {
        const url = `https://api.tenor.com/v1/search?q=${encodeURIComponent(search)}&limit=15&media_filter=basic&client_key=liam_eyes`;
        const { data } = await axios.get(url, { timeout: 8000 });
        const results  = data?.results || [];
        if (!results.length) throw new Error('No results');
        const pick = results[Math.floor(Math.random() * results.length)];
        return pick?.media?.[0]?.gif?.url || pick?.media?.[0]?.mp4?.url;
    } catch {
        // Fallback: waifu.pics anime reaction GIFs
        const endpoints = {
            hug:   'https://api.waifu.pics/sfw/hug',
            kiss:  'https://api.waifu.pics/sfw/kiss',
            slap:  'https://api.waifu.pics/sfw/slap',
            pat:   'https://api.waifu.pics/sfw/pat',
            wave:  'https://api.waifu.pics/sfw/wave',
            smile: 'https://api.waifu.pics/sfw/smile',
            happy: 'https://api.waifu.pics/sfw/happy',
            default: 'https://api.waifu.pics/sfw/hug',
        };
        const ep = endpoints[search.toLowerCase()] || endpoints.default;
        try {
            const { data } = await axios.get(ep, { timeout: 8000 });
            return data?.url;
        } catch { return null; }
    }
};

const sendGif = async (sock, m, ctx, term, caption) => {
    await react(sock, m, '⏳');
    try {
        const url = await tenorGif(term);
        if (url) {
            const isGif = url.includes('.gif');
            await sock.sendMessage(m.chat, {
                [isGif ? 'video' : 'video']: { url },
                caption,
                gifPlayback: true
            }, { quoted: m });
        } else {
            ctx.reply(`${caption}\n\n${sig()}`);
        }
        await react(sock, m, '✅');
    } catch(e) {
        await react(sock, m, '❌');
        ctx.reply(`❌ Reaction failed: ${e.message}\n\n${sig()}`);
    }
};

const makeReaction = (command, term, emoji, action) => ({
    command, category: 'reaction',
    execute: async (sock, m, ctx) => {
        const target = ctx.quoted?.sender
            ? '@' + ctx.quoted.sender.split('@')[0]
            : ctx.text ? ctx.text.replace('@','') : 'everyone';
        const caption = `${emoji} *${ctx.pushname}* ${action} *${target}*\n\n${sig()}`;
        await sendGif(sock, m, ctx, term, caption);
    }
});

module.exports = [
    makeReaction('hug',        'anime hug',        '🤗', 'hugs'),
    makeReaction('kiss',       'anime kiss',        '😘', 'kisses'),
    makeReaction('slap',       'anime slap',        '👋', 'slaps'),
    makeReaction('pat',        'anime pat head',    '🥰', 'pats'),
    makeReaction('cuddle',     'anime cuddle',      '💕', 'cuddles with'),
    makeReaction('poke',       'anime poke',        '👉', 'pokes'),
    makeReaction('wave',       'anime wave',        '👋', 'waves at'),
    makeReaction('highfive',   'anime high five',   '🙌', 'high fives'),
    makeReaction('punch',      'anime punch',       '👊', 'punches'),
    makeReaction('bite',       'anime bite',        '😈', 'bites'),
    makeReaction('lick',       'anime lick',        '👅', 'licks'),
    makeReaction('blush',      'anime blush',       '😳', 'makes blush'),
    makeReaction('cry',        'anime cry sad',     '😢', 'makes cry'),
    makeReaction('laugh',      'anime laugh',       '😂', 'laughs with'),
    makeReaction('smile',      'anime smile',       '😊', 'smiles at'),
    makeReaction('happy',      'anime happy',       '😄', 'is happy with'),
    makeReaction('dance',      'anime dance',       '💃', 'dances with'),
    makeReaction('stare',      'anime stare',       '👀', 'stares at'),
    makeReaction('pout',       'anime pout',        '😤', 'pouts at'),
    makeReaction('wink',       'anime wink',        '😉', 'winks at'),

    // ── Text-only reactions (no GIF needed) ──────────────────────────────

{
        command: 'dare2', category: 'reaction',
        execute: async (sock, m, ctx) => {
            const dares = [
                'Send a voice note singing your favourite song 🎵',
                'Change your WhatsApp bio for 1 hour 😂',
                'Send the last 5 photos in your gallery 📸',
                'Call someone randomly and say "I love you" ❤️',
                'Post an embarrassing story on your status for 1hr 😬',
                'Do 20 push-ups RIGHT NOW 💪',
                'Change your profile picture for 1 hour 😜',
                'Text your crush something nice 💌',
                'Send a 30-second video of you dancing 💃',
                'Confess something to the group 😳',
            ];
            ctx.reply(`🔥 *DARE!*\n\n${dares[~~(Math.random() * dares.length)]}\n\n${sig()}`);
        }
    },
    {
        command: 'truth2', category: 'reaction',
        execute: async (sock, m, ctx) => {
            const truths = [
                'What is your biggest secret? 🤫',
                'Who was your first crush? 😍',
                'What is your most embarrassing moment? 😂',
                'Have you ever lied to get out of trouble? 🤥',
                'What do you really think of the person who sent this? 🤔',
                'What is the worst thing you have ever done? 😬',
                'Who in this group do you find most attractive? 👀',
                'Have you ever read someone\'s messages without permission? 🙊',
                'What is a bad habit you have never told anyone? 😅',
                'What is your most searched thing on Google? 🔍',
            ];
            ctx.reply(`💬 *TRUTH!*\n\n${truths[~~(Math.random() * truths.length)]}\n\n${sig()}`);
        }
    },
];

};

// ── module: plugins/religion_tools.js ──────────────────────────────────────
__bundleModules["plugins/religion_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// LIAM EYES — RELIGION TOOLS (2 commands): bible, quran
'use strict';
const axios = require('axios');
const config = require('./settings');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

module.exports = [
  { command:'bible', category:'religion',
    execute: async (sock,m,{text,reply}) => {
      await react(sock,m,'✝️');
      try {
        let verse;
        if(text && /\d/.test(text)){
          const [ref] = text.split(' ');
          const {data} = await axios.get(`https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`,{timeout:10000});
          verse = `📖 *${data.reference}*\n━━━━━━━━━━━━━━━━\n${data.text.trim()}\n\n_KJV Translation_`;
        } else {
          const {data} = await axios.get('https://bible-api.com/data/kjv/verses.json',{timeout:10000}).catch(()=>({data:null}));
          const {data:r} = await axios.get('https://beta.ourmanna.com/api/v1/get?format=json&order=random',{timeout:10000});
          const v = r?.verse?.details;
          verse = v ? `📖 *${v.reference}*\n━━━━━━━━━━━━━━━━\n${v.text.trim()}\n\n_Daily Bible Verse_` : `📖 *John 3:16*\n━━━━━━━━━━━━━━━━\nFor God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.\n\n_KJV_`;
        }
        reply(`✝️ ${verse}\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch{
        reply(`✝️ *Bible Verse*\n━━━━━━━━━━━━━━━━\n"Trust in the LORD with all your heart and lean not on your own understanding."\n\n📖 Proverbs 3:5\n\n${sig()}`);
      }
    }
  },

  { command:'quran', category:'religion',
    execute: async (sock,m,{text,reply}) => {
      await react(sock,m,'☪️');
      try {
        const [surah,ayah] = (text||'2:255').split(':').map(Number);
        const s = surah||2, a = ayah||255;
        const {data} = await axios.get(`https://api.alquran.cloud/v1/ayah/${s}:${a}/editions/quran-simple,en.sahih`,{timeout:10000});
        if(data.status!=='OK') throw new Error('Invalid reference');
        const arabic = data.data[0];
        const english = data.data[1];
        reply(`☪️ *Surah ${arabic.surah.englishName} (${arabic.surah.name})*\n*Verse ${arabic.numberInSurah}*\n━━━━━━━━━━━━━━━━\n🕌 *Arabic:*\n${arabic.text}\n\n📖 *English (Sahih):*\n${english.text}\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch{
        reply(`☪️ *Quran — Ayat al-Kursi*\n(2:255)\n━━━━━━━━━━━━━━━━\nAllah — there is no deity except Him, the Ever-Living, the Self-Sustaining. Neither drowsiness overtakes Him nor sleep...\n\n${sig()}`);
      }
    }
  },
];

};

// ── module: plugins/search_tools.js ────────────────────────────────────────
__bundleModules["plugins/search_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
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
const config = require('./settings');
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
        const ytsr = require('yt-search');
        const res  = await ytsr(text);
        const top5 = res.videos.slice(0,5);
        if(!top5.length) throw new Error('No results');
        const list = top5.map((v,i)=>`*${i+1}.* ${v.title}\n   ⏱️ ${v.timestamp} • 👁️ ${v.views?.toLocaleString()||'?'}\n   🔗 ${v.url}`).join('\n\n');
        reply(`🔍 *YouTube Search: ${text}*\n━━━━━━━━━━━━━━━━\n${list}\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch(e){await react(sock,m,'❌');reply(`❌ YT search failed: ${e.message}\n\n${sig()}`);}
    }
  },

];

};

// ── module: plugins/settings_tools.js ──────────────────────────────────────
__bundleModules["plugins/settings_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — SETTINGS TOOLS  (~70 commands)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const fs     = require('fs');
const path   = require('path');
const config = require('./settings');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});
const OW    = ctx => ctx.isCreator;
const owErr = '👑 Owner only!\n\n' + sig();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Toggle engine ───────────────────────────────────────────────────────────
const toggle = async (feat, label, emoji, on_icon, off_icon, sock, m, ctx) => {
    if (!OW(ctx)) return ctx.reply(owErr);
    if (!config.features) config.features = {};
    const arg = (ctx.args[0] || '').toLowerCase();
    const on = arg === 'on' ? true : arg === 'off' ? false : !config.features[feat];
    config.features[feat] = on;
    await react(sock, m, on ? (on_icon || emoji) : '❌');
    return ctx.reply(
        `${on ? (on_icon || emoji) : '❌'} *${label}*\n\n` +
        (on
            ? `╔═══════════════════╗\n║  ✅  E N A B L E D  ║\n╚═══════════════════╝`
            : `╔════════════════════╗\n║  ❌  D I S A B L E D  ║\n╚════════════════════╝`) +
        `\n\n${sig()}`
    );
};

// ── Custom messages store ───────────────────────────────────────────────────
if (!config.customMsgs) config.customMsgs = {};
if (!config.countryList) config.countryList = [];
if (!config.ignoreList) config.ignoreList = [];

module.exports = [

// ──────────────────────────────────────────────────────────────────────────
//  FEATURE TOGGLES
// ──────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────
//  BOT CUSTOMIZATION
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'setbotname', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setbotname <name>*\n\n${sig()}`);
        config.settings.title = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Bot name → ${ctx.text}*\n\n${sig()}`);
    }
},
{
    command: 'setownername', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setownername <name>*\n\n${sig()}`);
        config.settings.author = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Owner name → ${ctx.text}*\n\n${sig()}`);
    }
},
{
    command: 'setownernumber', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const num = ctx.args[0]?.replace(/\D/g,'');
        if (!num) return ctx.reply(`❗ Usage: *.setownernumber <number>*\n\n${sig()}`);
        config.owner = num;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Owner number updated*\n\n${sig()}`);
    }
},
{
    command: 'setprefix', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const p = ctx.args[0];
        if (!p || !'.!#$%^&*'.includes(p)) return ctx.reply(`❗ Valid prefixes: . ! # $ % ^ & *\n\n${sig()}`);
        config.prefix = p;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Prefix → ${p}*\n\n_Use ${p}menu to test_\n\n${sig()}`);
    }
},
{
    command: 'setcontextlink', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setcontextlink <url>*\n\n${sig()}`);
        config.pairingSite = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Context link updated*\n${ctx.text}\n\n${sig()}`);
    }
},
{
    command: 'setwatermark', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setwatermark <text>*\n\n${sig()}`);
        config.settings.footer = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Watermark → ${ctx.text}*\n\n${sig()}`);
    }
},
{
    command: 'setstickerpackname', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setstickerpackname <name>*\n\n${sig()}`);
        config.sticker.packname = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Sticker pack name → ${ctx.text}*\n\n${sig()}`);
    }
},
{
    command: 'setstickerauthor', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setstickerauthor <name>*\n\n${sig()}`);
        config.sticker.author = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Sticker author → ${ctx.text}*\n\n${sig()}`);
    }
},
{
    command: 'setmenu', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const n = parseInt(ctx.args[0]);
        if (![1,2,3,4].includes(n))
            return ctx.reply(`❗ Usage: *.setmenu 1/2/3/4*\n1=Numbered, 2=Classic, 3=Cursive, 4=Grid\n\n${sig()}`);
        config.menuStyle = n;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Menu style → ${n}*\n\n${sig()}`);
    }
},
{
    command: 'setmenuimage', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('image')) return ctx.reply('❗ Reply to an image to set as menu image.\n\n' + sig());
        try {
            const buf = await sock.downloadMediaMessage(q.msg || q);
            const logoPath = path.join(__dirname, 'Resources', 'logo.jpg');
            fs.writeFileSync(logoPath, buf);
            await react(sock, m, '✅');
            ctx.reply(`✅ *Menu image updated!*\n\n${sig()}`);
        } catch(e) { ctx.reply(`❌ ${e.message}`); }
    }
},
{
    command: 'setfont', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const fonts = {
            '1': 'Normal',
            '2': '𝐁𝐨𝐥𝐝',
            '3': '𝘐𝘵𝘢𝘭𝘪𝘤',
            '4': '𝓒𝓾𝓻𝓼𝓲𝓿𝓮',
            '5': '𝔽𝕒𝕟𝕔𝕪',
        };
        const n = ctx.args[0];
        if (!n || !fonts[n])
            return ctx.reply(`🔤 *Font Styles*\n\n${Object.entries(fonts).map(([k,v])=>`${k}. ${v}`).join('\n')}\n\nUsage: *.setfont 2*\n\n${sig()}`);
        config.fontStyle = parseInt(n);
        await react(sock, m, '✅');
        ctx.reply(`✅ *Font → ${fonts[n]}*\n\n${sig()}`);
    }
},
{
    command: 'settimezone', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.settimezone Africa/Nairobi*\n\n${sig()}`);
        config.timezone = ctx.text;
        process.env.TZ = ctx.text;
        await react(sock, m, '✅');
        const now = new Date().toLocaleString('en-US', { timeZone: ctx.text });
        ctx.reply(`✅ *Timezone → ${ctx.text}*\nCurrent time: ${now}\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  SUDO MANAGEMENT
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'addsudo', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const num = ctx.args[0]?.replace(/\D/g,'') || (m.quoted?.sender || '').split('@')[0];
        if (!num) return ctx.reply('❗ Usage: *.addsudo <number>* or reply to user\n\n' + sig());
        if (!config.sudo) config.sudo = [];
        if (config.sudo.includes(num)) return ctx.reply(`⚠️ ${num} is already sudo.\n\n${sig()}`);
        config.sudo.push(num);
        await react(sock, m, '✅');
        ctx.reply(`✅ *Added +${num} to sudo*\n\n${sig()}`);
    }
},
{
    command: 'delsudo', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const num = ctx.args[0]?.replace(/\D/g,'') || (m.quoted?.sender || '').split('@')[0];
        if (!num) return ctx.reply('❗ Usage: *.delsudo <number>*\n\n' + sig());
        config.sudo = (config.sudo || []).filter(n => n !== num);
        await react(sock, m, '✅');
        ctx.reply(`✅ *Removed +${num} from sudo*\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  BAD WORDS
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'addbadword', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.addbadword <word>*\n\n${sig()}`);
        if (!config.badwords) config.badwords = [];
        const words = ctx.text.split(',').map(w=>w.trim().toLowerCase()).filter(Boolean);
        words.forEach(w => { if (!config.badwords.includes(w)) config.badwords.push(w); });
        await react(sock, m, '✅');
        ctx.reply(`✅ *Added ${words.length} bad word(s)*\n\n${sig()}`);
    }
},
{
    command: 'deletebadword', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.deletebadword <word>*\n\n${sig()}`);
        config.badwords = (config.badwords||[]).filter(w => w !== ctx.text.toLowerCase());
        await react(sock, m, '✅');
        ctx.reply(`✅ *Removed from bad words*\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  IGNORE LIST
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'addignorelist', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const num = ctx.args[0]?.replace(/\D/g,'') || (m.quoted?.sender||'').split('@')[0];
        if (!num) return ctx.reply('❗ Reply to user or *.addignorelist <number>*\n\n' + sig());
        const jid = num + '@s.whatsapp.net';
        if (!config.ignoreList) config.ignoreList = [];
        if (!config.ignoreList.includes(jid)) config.ignoreList.push(jid);
        await react(sock, m, '✅');
        ctx.reply(`✅ *@${num} will be ignored*\n\n${sig()}`);
    }
},
{
    command: 'delignorelist', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const num = ctx.args[0]?.replace(/\D/g,'') || (m.quoted?.sender||'').split('@')[0];
        const jid = num + '@s.whatsapp.net';
        config.ignoreList = (config.ignoreList||[]).filter(j => j !== jid);
        await react(sock, m, '✅');
        ctx.reply(`✅ *@${num} removed from ignore list*\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  COUNTRY CODE WHITELIST
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'addcountrycode', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const code = ctx.args[0]?.replace(/\D/g,'');
        if (!code) return ctx.reply(`❗ Usage: *.addcountrycode 254* (Kenya)\n\n${sig()}`);
        if (!config.countryList) config.countryList = [];
        if (!config.countryList.includes(code)) config.countryList.push(code);
        await react(sock, m, '✅');
        ctx.reply(`✅ *Country code +${code} allowed*\n\n${sig()}`);
    }
},
{
    command: 'delcountrycode', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const code = ctx.args[0]?.replace(/\D/g,'');
        config.countryList = (config.countryList||[]).filter(c => c !== code);
        await react(sock, m, '✅');
        ctx.reply(`✅ *Country code +${code} removed*\n\n${sig()}`);
    }
},
{
    command: 'listcountrycode', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const list = config.countryList || [];
        ctx.reply(list.length
            ? `🌍 *Allowed Country Codes*\n\n${list.map(c=>`+${c}`).join(', ')}\n\n${sig()}`
            : `📋 *All countries allowed* (no filter set)\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  ANTI-CALL
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'setanticallmsg', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setanticallmsg <message>*\n\n${sig()}`);
        config.customMsgs.anticallmsg = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Anti-call message set*\n\n_"${ctx.text}"_\n\n${sig()}`);
    }
},
{
    command: 'delanticallmsg', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        delete config.customMsgs.anticallmsg;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Anti-call message reset to default*\n\n${sig()}`);
    }
},
{
    command: 'showanticallmsg', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const msg = config.customMsgs?.anticallmsg || '📵 Calls are disabled. Please send a message instead.';
        ctx.reply(`📵 *Anti-Call Message*\n\n_"${msg}"_\n\n${sig()}`);
    }
},
{
    command: 'testanticallmsg', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const msg = config.customMsgs?.anticallmsg || '📵 Calls are disabled. Please send a message instead.';
        ctx.reply(`📵 *[TEST Anti-Call Message]*\n\n${msg}\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  WELCOME / GOODBYE
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'setwelcome', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setwelcome <message>*\nVariables: {user} {group} {count}\n\n${sig()}`);
        config.customMsgs.welcome = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Welcome message set*\n\n${sig()}`);
    }
},
{
    command: 'setgoodbye', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setgoodbye <message>*\n\n${sig()}`);
        config.customMsgs.goodbye = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Goodbye message set*\n\n${sig()}`);
    }
},
{
    command: 'delwelcome', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        delete config.customMsgs.welcome;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Welcome message reset to default*\n\n${sig()}`);
    }
},
{
    command: 'delgoodbye', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        delete config.customMsgs.goodbye;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Goodbye message reset to default*\n\n${sig()}`);
    }
},
{
    command: 'showwelcome', category: 'settings',
    execute: async (sock, m, ctx) => {
        const msg = config.customMsgs?.welcome || '👋 Welcome {user} to *{group}*!\n\n👥 Members: {count}';
        ctx.reply(`👋 *Welcome Message*\n\n${msg}\n\n${sig()}`);
    }
},
{
    command: 'showgoodbye', category: 'settings',
    execute: async (sock, m, ctx) => {
        const msg = config.customMsgs?.goodbye || '👋 Goodbye {user}! See you again.';
        ctx.reply(`👋 *Goodbye Message*\n\n${msg}\n\n${sig()}`);
    }
},
{
    command: 'testwelcome', category: 'settings',
    execute: async (sock, m, ctx) => {
        const template = config.customMsgs?.welcome || '👋 Welcome {user} to *{group}*!\n\n👥 Members: {count}';
        const msg = template
            .replace('{user}', ctx.pushname)
            .replace('{group}', m.isGroup ? (ctx.groupName || 'this group') : 'Private Chat')
            .replace('{count}', ctx.participants?.length || 1);
        ctx.reply(`🧪 *[TEST Welcome]*\n\n${msg}\n\n${sig()}`);
    }
},
{
    command: 'testgoodbye', category: 'settings',
    execute: async (sock, m, ctx) => {
        const template = config.customMsgs?.goodbye || '👋 Goodbye {user}!';
        const msg = template.replace('{user}', ctx.pushname);
        ctx.reply(`🧪 *[TEST Goodbye]*\n\n${msg}\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  MODE
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'mode', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const val = (ctx.args[0] || '').toLowerCase();
        if (!['public','private'].includes(val))
            return ctx.reply(`❗ Usage: *.mode public/private*\nCurrent: *${sock.public ? 'Public' : 'Private'}*\n\n${sig()}`);
        sock.public = val === 'public';
        await react(sock, m, val === 'public' ? '🌍' : '🔒');
        ctx.reply(`${val === 'public' ? '🌍' : '🔒'} *Mode → ${val.toUpperCase()}*\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  WARN SETTINGS
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'setwarn', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const n = parseInt(ctx.args[0]);
        if (!n || n < 1 || n > 20) return ctx.reply(`❗ Usage: *.setwarn <number>* (1-20)\n\n${sig()}`);
        config.warnLimit = n;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Warn limit → ${n}*\n\n${sig()}`);
    }
},
{
    command: 'resetwarn', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        config.warnLimit = 3;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Warn limit reset to 3*\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  GETSETTINGS / RESETSETTING
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'getsettings', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const f = config.features || {};
        const on = Object.entries(f).filter(([,v])=>v).map(([k])=>`✅ ${k}`);
        const off = Object.entries(f).filter(([,v])=>!v).map(([k])=>`❌ ${k}`);
        ctx.reply(
            `⚙️ *Bot Settings*\n\n` +
            `🤖 Name: ${config.settings?.title || 'LIAM EYES'}\n` +
            `🌍 Mode: ${sock.public ? 'Public' : 'Private'}\n` +
            `🔰 Prefix: ${ctx.prefix}\n` +
            `🎨 Menu: Style ${config.menuStyle || 1}\n` +
            `⚠️ Warn limit: ${config.warnLimit || 3}\n\n` +
            `*Active Features:*\n${on.join('\n') || '_(none)_'}\n\n` +
            `*Inactive Features:*\n${off.join('\n') || '_(none)_'}\n\n${sig()}`
        );
    }
},
{
    command: 'resetsetting', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!config.features) return ctx.reply('❗ No settings to reset.\n\n' + sig());
        Object.keys(config.features).forEach(k => config.features[k] = false);
        config.menuStyle = 1;
        delete config.customMsgs;
        config.customMsgs = {};
        await react(sock, m, '✅');
        ctx.reply(`✅ *All settings reset to default*\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  STATUS EMOJI
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'setstatusemoji', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.args.length) {
            const current = (config.statusReactEmojis||[]).join('  ');
            return ctx.reply(`😍 *Status React Emojis*\n\nCurrent: ${current}\n\nSet new: *.setstatusemoji ❤️ 🔥 😍*\n\n${sig()}`);
        }
        config.statusReactEmojis = ctx.args;
        await react(sock, m, ctx.args[0]);
        ctx.reply(`✅ *Status emojis updated*\n\n${ctx.args.join('  ')}\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  CLEARCHAT
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'clearchat', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (global._chatHistory) global._chatHistory.delete(m.chat);
        await react(sock, m, '🗑️');
        ctx.reply(`🗑️ *Chat history cleared!*\n\nAI starts fresh here.\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  LISTWARN
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'listwarn', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!global._warnStore?.size)
            return ctx.reply(`📋 *No active warnings*\n\n${sig()}`);
        const lines = [...global._warnStore.entries()].map(([j,c])=>`👤 @${j.split('@')[0]} — ⚠️ ${c} warn(s)`);
        ctx.reply(`⚠️ *Warn List*\n\n${lines.join('\n')}\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  SESSION ID
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'session', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        // .session or .session <number> → delegate to sessionid
        const num = ctx.args[0]?.replace(/\D/g,'');
        const sessionDir = path.join(__dirname, 'sessions');
        const backupDir  = path.join(sessionDir, 'backup');
        const creds      = path.join(sessionDir, 'creds.json');

        if (!num) {
            if (!fs.existsSync(creds)) return ctx.reply(`❌ No active session found.\n\n${sig()}`);
            const raw = fs.readFileSync(creds);
            const sid = 'LIAM~' + Buffer.from(raw).toString('base64url');
            const sidMsg = await sock.sendMessage(m.chat, { text: sid }, { quoted: m });
            await sleep(500);
            return sock.sendMessage(m.chat, {
                text: `👆 *Your Bot Session ID*\n\nLong-press → Copy the LIAM~ message above\n⚠️ _Never share this!_\n\n${sig()}`
            }, { quoted: sidMsg });
        }

        if (!fs.existsSync(backupDir))
            return ctx.reply(`❌ No backup directory found.\n\n${sig()}`);

        const files = fs.readdirSync(backupDir).filter(f => f.includes(num) && f.endsWith('.json'));
        if (!files.length)
            return ctx.reply(`❌ No session backup for +${num}\n\n_Tip: pair first with .pair to auto-backup_\n\n${sig()}`);

        const latest = files.sort().pop();
        const data   = JSON.parse(fs.readFileSync(path.join(backupDir, latest)));
        const age    = Math.round((Date.now() - data.ts) / 60000);

        const sidMsg = await sock.sendMessage(m.chat, { text: data.sid }, { quoted: m });
        await sleep(500);
        sock.sendMessage(m.chat, {
            text: `📋 *Session for +${num}*\n\n⏱️ Saved ${age} min ago\n👆 Long-press to copy LIAM~ message above\n\n${sig()}`
        }, { quoted: sidMsg });
    }
},

];

};

// ── module: plugins/song.js ────────────────────────────────────────────────
__bundleModules["plugins/song"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
'use strict';
const { dlAudio } = __bundleRequire('library/dl');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

module.exports = [
{
    command:'song', category:'audio', description:'Download song (alias for play)',
    execute: async (sock, m, ctx) => {
        const pl = [].concat(__bundleRequire('plugins/play')).find(p => p.command === 'play');
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

};

// ── module: plugins/sports_tools.js ────────────────────────────────────────
__bundleModules["plugins/sports_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — SPORTS TOOLS  (39 commands)
//  Football leagues: EPL, La Liga, Bundesliga, Serie A, Ligue 1, EFL, EL, CL, WC
//  Wrestling: WWE events, news, schedule
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('./settings');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

// ── League configs ─────────────────────────────────────────────────────────
const LEAGUES = {
    epl:        { id: 39,  name: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 English Premier League', season: 2024 },
    laliga:     { id: 140, name: '🇪🇸 La Liga',                    season: 2024 },
    bundesliga: { id: 78,  name: '🇩🇪 Bundesliga',                  season: 2024 },
    seriea:     { id: 135, name: '🇮🇹 Serie A',                     season: 2024 },
    ligue1:     { id: 61,  name: '🇫🇷 Ligue 1',                    season: 2024 },
    efl:        { id: 40,  name: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 EFL Championship',           season: 2024 },
    el:         { id: 3,   name: '🇪🇺 UEFA Europa League',           season: 2024 },
    cl:         { id: 2,   name: '🇪🇺 UEFA Champions League',        season: 2024 },
    wc:         { id: 1,   name: '🌍 FIFA World Cup',               season: 2026 },
};

// ── API-Football free tier via RapidAPI (anonymous fallback = pollinations) ──
const fetchFootball = async (endpoint, params) => {
    try {
        const { data } = await axios.get(`https://v3.football.api-sports.io/${endpoint}`, {
            params, timeout: 10000,
            headers: {
                'x-rapidapi-key': process.env.FOOTBALL_API_KEY || 'anonymous',
                'x-rapidapi-host': 'v3.football.api-sports.io',
            }
        });
        if (data?.errors && Object.keys(data.errors).length) throw new Error(JSON.stringify(data.errors));
        return data?.response || [];
    } catch (e) {
        // Fallback: ask AI for info
        return null;
    }
};

// ── AI fallback for football data ─────────────────────────────────────────
const aiFallback = async (query) => {
    try {
        const { data } = await axios.get(
            `https://text.pollinations.ai/${encodeURIComponent(query + '. Give concise, current data with emojis.')}`,
            { timeout: 15000, headers: { 'User-Agent': 'LIAM-EYES/2.0' } }
        );
        return (data || '').toString().trim();
    } catch(e) { return `❌ Could not fetch data. Try again later.\n\n${sig()}`; }
};

// ── Format match row ───────────────────────────────────────────────────────
const fmtMatch = m => {
    const h = m.teams?.home?.name || '?';
    const a = m.teams?.away?.name || '?';
    const gs = m.goals?.home, ga = m.goals?.away;
    const status = m.fixture?.status?.short;
    const score  = (gs !== null && ga !== null) ? `${gs}-${ga}` : 'vs';
    const dt = m.fixture?.date ? new Date(m.fixture.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : '';
    const live = ['1H','HT','2H','ET','BT','P','SUSP','INT','LIVE'].includes(status) ? ' 🔴' : '';
    return `${dt} ${h} *${score}* ${a}${live}`;
};

// ── Format standing row ───────────────────────────────────────────────────
const fmtStanding = (s, i) =>
    `${(i+1).toString().padStart(2)}. ${s.team?.name||'?'} │ GP:${s.all?.played||0} W:${s.all?.win||0} D:${s.all?.draw||0} L:${s.all?.lose||0} │ ${s.points||0}pts`;

// ── Build league command set ───────────────────────────────────────────────
const buildLeagueCommands = (key, league) => {
    const { id, name, season } = league;

    return [
        // MATCHES — recent + upcoming
        {
            command: `${key}matches`, category: 'sports',
            execute: async (sock, m, { reply }) => {
                await react(sock, m, '⚽');
                const data = await fetchFootball('fixtures', { league: id, season, last: 5 });
                if (!data || !data.length) {
                    const text = await aiFallback(`Latest ${name} match results ${season}`);
                    return reply(`⚽ *${name} — Recent Results*\n\n${text}\n\n${sig()}`);
                }
                const lines = data.map(fmtMatch).join('\n');
                reply(`⚽ *${name}*\n*Recent Matches*\n\n${lines}\n\n${sig()}`);
                await react(sock, m, '✅');
            }
        },
        // STANDINGS
        {
            command: `${key}standings`, category: 'sports',
            execute: async (sock, m, { reply }) => {
                await react(sock, m, '📊');
                const data = await fetchFootball('standings', { league: id, season });
                if (!data || !data.length) {
                    const text = await aiFallback(`Current ${name} standings table ${season}`);
                    return reply(`📊 *${name} — Standings*\n\n${text}\n\n${sig()}`);
                }
                const rows = (data[0]?.league?.standings?.[0] || []).slice(0,10);
                const lines = rows.map(fmtStanding).join('\n');
                reply(`📊 *${name}*\n*Top 10 Standings*\n\n\`\`\`\n${lines}\n\`\`\`\n\n${sig()}`);
                await react(sock, m, '✅');
            }
        },
        // TOP SCORERS
        {
            command: `${key}scorers`, category: 'sports',
            execute: async (sock, m, { reply }) => {
                await react(sock, m, '🥅');
                const data = await fetchFootball('players/topscorers', { league: id, season });
                if (!data || !data.length) {
                    const text = await aiFallback(`Top scorers ${name} ${season}`);
                    return reply(`🥅 *${name} — Top Scorers*\n\n${text}\n\n${sig()}`);
                }
                const lines = data.slice(0,10).map((p,i) => {
                    const pl = p.player, st = p.statistics?.[0];
                    return `${i+1}. ${pl?.name||'?'} (${st?.team?.name||'?'}) — ⚽ ${st?.goals?.total||0}`;
                }).join('\n');
                reply(`🥅 *${name} — Top Scorers*\n\n${lines}\n\n${sig()}`);
                await react(sock, m, '✅');
            }
        },
        // UPCOMING FIXTURES
        {
            command: `${key}upcoming`, category: 'sports',
            execute: async (sock, m, { reply }) => {
                await react(sock, m, '📅');
                const data = await fetchFootball('fixtures', { league: id, season, next: 5 });
                if (!data || !data.length) {
                    const text = await aiFallback(`Upcoming ${name} fixtures next week ${season}`);
                    return reply(`📅 *${name} — Upcoming*\n\n${text}\n\n${sig()}`);
                }
                const lines = data.map(fmtMatch).join('\n');
                reply(`📅 *${name}*\n*Upcoming Fixtures*\n\n${lines}\n\n${sig()}`);
                await react(sock, m, '✅');
            }
        },
    ];
};

// ── Generate all league commands ───────────────────────────────────────────
const leagueCommands = Object.entries(LEAGUES).flatMap(([key, league]) => buildLeagueCommands(key, league));

// ── Wrestling / WWE commands ───────────────────────────────────────────────
const wrestlingCommands = [
    {
        command: 'wrestlingevents', category: 'sports',
        execute: async (sock, m, { reply }) => {
            await react(sock, m, '🤼');
            const text = await aiFallback('Upcoming WWE and AEW wrestling events 2025 with dates and venues');
            reply(`🤼 *Upcoming Wrestling Events*\n\n${text}\n\n${sig()}`);
        }
    },
    {
        command: 'wwenews', category: 'sports',
        execute: async (sock, m, { reply }) => {
            await react(sock, m, '📰');
            const text = await aiFallback('Latest WWE wrestling news headlines today');
            reply(`📰 *WWE Latest News*\n\n${text}\n\n${sig()}`);
        }
    },
    {
        command: 'wweschedule', category: 'sports',
        execute: async (sock, m, { reply }) => {
            await react(sock, m, '📅');
            const text = await aiFallback('WWE RAW SmackDown NXT schedule this week with match card details');
            reply(`📅 *WWE Weekly Schedule*\n\n${text}\n\n${sig()}`);
        }
    },
    // Bonus sports commands to hit 325+
    {
        command: 'livescores', category: 'sports',
        execute: async (sock, m, { reply }) => {
            await react(sock, m, '🔴');
            const text = await aiFallback('Football live scores happening right now across all major leagues');
            reply(`🔴 *Live Football Scores*\n\n${text}\n\n${sig()}`);
        }
    },
    {
        command: 'transfernews', category: 'sports',
        execute: async (sock, m, { reply }) => {
            await react(sock, m, '📋');
            const text = await aiFallback('Latest football transfer news and rumours today');
            reply(`📋 *Transfer News*\n\n${text}\n\n${sig()}`);
        }
    },
    {
        command: 'nba', category: 'sports',
        execute: async (sock, m, { args, reply }) => {
            await react(sock, m, '🏀');
            const q = args.join(' ') || 'NBA latest results standings today';
            const text = await aiFallback(q);
            reply(`🏀 *NBA*\n\n${text}\n\n${sig()}`);
        }
    },
    {
        command: 'ufc', category: 'sports',
        execute: async (sock, m, { reply }) => {
            await react(sock, m, '🥊');
            const text = await aiFallback('Latest UFC fight results and upcoming UFC events schedule');
            reply(`🥊 *UFC News & Schedule*\n\n${text}\n\n${sig()}`);
        }
    },
    {
        command: 'formula1', category: 'sports',
        execute: async (sock, m, { reply }) => {
            await react(sock, m, '🏎️');
            const text = await aiFallback('Formula 1 2024 season latest results standings and upcoming races');
            reply(`🏎️ *Formula 1 2024*\n\n${text}\n\n${sig()}`);
        }
    },
    {
        command: 'cricket', category: 'sports',
        execute: async (sock, m, { args, reply }) => {
            await react(sock, m, '🏏');
            const q = args.join(' ') || 'latest international cricket match scores and results today';
            const text = await aiFallback(q);
            reply(`🏏 *Cricket*\n\n${text}\n\n${sig()}`);
        }
    },
];

module.exports = [...leagueCommands, ...wrestlingCommands];

};

// ── module: plugins/status_tools.js ────────────────────────────────────────
__bundleModules["plugins/status_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// Status Tools — savestatus, autoviewstatus, autoreactstatus, autosavestatus, antidelete, antiviewonce, vv, vv2
const config = require('./settings');
const path = require('path');
const fs   = require('fs');

const toggle = async (feat, label, emoji, sock, m, reply) => {
    config.features[feat] = !config.features[feat];
    const on = config.features[feat];
    await sock.sendMessage(m.chat, { react: { text: on ? emoji : '❌', key: m.key } });
    reply(`${emoji} *${label}* is now *${on ? '✅ ON' : '❌ OFF'}*`);
};

const extractMedia = async (sock, m, reply) => {
    const q = m.quoted;
    if (!q) return reply('❌ Reply to a view-once or media message!');
    try {
        await sock.sendMessage(m.chat, { react: { text: '👁️', key: m.key } });
        const buf = await sock.downloadMediaMessage(q);
        const mime = (q.msg || q).mimetype || '';
        if (mime.includes('video'))
            await sock.sendMessage(m.chat, { video: buf, caption: '👁️ *View-Once Media*\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒' }, { quoted: m });
        else if (mime.includes('audio'))
            await sock.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mp4' }, { quoted: m });
        else
            await sock.sendMessage(m.chat, { image: buf, caption: '👁️ *View-Once Media*\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒' }, { quoted: m });
    } catch (e) { reply('❌ Failed: ' + e.message); }
};

module.exports = [
    {
        command: 'savestatus', description: 'Save a WhatsApp status (reply to it)', category: 'tools',
        execute: async (sock, m, { reply }) => {
            const q = m.quoted;
            if (!q) return reply('❌ Reply to a status to save it!');
            try {
                await sock.sendMessage(m.chat, { react: { text: '💾', key: m.key } });
                const buf = await sock.downloadMediaMessage(q);
                const mime = (q.msg || q).mimetype || '';
                if (mime.includes('video'))
                    await sock.sendMessage(m.chat, { video: buf, caption: '✅ *Status saved!*\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒' }, { quoted: m });
                else if (mime.includes('audio'))
                    await sock.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mp4' }, { quoted: m });
                else
                    await sock.sendMessage(m.chat, { image: buf, caption: '✅ *Status saved!*\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒' }, { quoted: m });
            } catch (e) { reply('❌ ' + e.message); }
        }
    },
{ command: 'autosavestatus',  description: 'Auto save status updates',  category: 'tools',  execute: async (s,m,{reply,isCreator}) => { if(!isCreator) return reply(config.message.owner); toggle('autosavestatus','💾 Auto Save Status','💾',s,m,reply); } },
{ command: 'vv',  description: 'Extract view-once media', category: 'tools', execute: async (s,m,{reply}) => extractMedia(s,m,reply) },
    { command: 'vv2', description: 'Extract view-once (alt)', category: 'tools', execute: async (s,m,{reply}) => extractMedia(s,m,reply) }
];

};

// ── module: plugins/support_tools.js ───────────────────────────────────────
__bundleModules["plugins/support_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// LIAM EYES — SUPPORT TOOLS (2 commands): feedback, helpers
'use strict';
const axios  = require('axios');
const config = require('./settings');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

module.exports = [
  { command:'feedback', category:'support',
    execute: async (sock,m,{text,reply,pushname,sender}) => {
      if(!text) return reply(`❓ Usage: *.feedback <your message>*\n\n${sig()}`);
      await sock.sendMessage(m.chat,{react:{text:'📩',key:m.key}}).catch(()=>{});
      // Forward feedback to owner
      try {
        const ownerJid = config.owner+'@s.whatsapp.net';
        await sock.sendMessage(ownerJid,{
          text:`📩 *New Feedback from ${pushname}* (+${sender.split('@')[0]})\n\n${text}\n\n${sig()}`
        });
      } catch{}
      reply(`📩 *Feedback Sent!*\n\nThank you ${pushname}! Your message has been forwarded to the bot owner.\n\n_We read every message!_ 💙\n\n${sig()}`);
    }
  },

  { command:'helpers', category:'support',
    execute: async (sock,m,{reply}) => {
      reply(`🆘 *LIAM EYES — Help Center*\n━━━━━━━━━━━━━━━━━━━━\n\n📚 *Getting Started:*\n• Type *.menu* to see all commands\n• Reply with a number to open that category\n• Use prefix \`${config.settings?.title||'.'}\` before commands\n\n🛠️ *Common Commands:*\n• *.ping* — Check if bot is online\n• *.botstatus* — Bot system info\n• *.chatbot on* — Enable AI assistant\n• *.pair* — Get session ID\n\n🐛 *Issues?*\n• *.feedback <message>* — Report bugs\n• GitHub: ${config.github}\n• Channel: ${config.autoJoinChannel}\n\n👑 *Owner Only:*\n• *.restart* — Restart bot\n• *.reload* — Reload plugins\n• *.mode public/private* — Change mode\n\n${sig()}`);
    }
  },
];

};

// ── module: plugins/tools_extended.js ──────────────────────────────────────
__bundleModules["plugins/tools_extended"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — EXTENDED TOOLS  (~35 commands)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');
const config = require('./settings');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});
const getTmp= ext => path.join(os.tmpdir(), `liam_${Date.now()}${ext}`);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fixJid= j => (j||'').replace(/:\d+@/g,'@');

// ── Unicode font sets ──────────────────────────────────────────────────────
const FONTS = {
    bold:     { A:'𝐀',B:'𝐁',C:'𝐂',D:'𝐃',E:'𝐄',F:'𝐅',G:'𝐆',H:'𝐇',I:'𝐈',J:'𝐉',K:'𝐊',L:'𝐋',M:'𝐌',N:'𝐍',O:'𝐎',P:'𝐏',Q:'𝐐',R:'𝐑',S:'𝐒',T:'𝐓',U:'𝐔',V:'𝐕',W:'𝐖',X:'𝐗',Y:'𝐘',Z:'𝐙',a:'𝐚',b:'𝐛',c:'𝐜',d:'𝐝',e:'𝐞',f:'𝐟',g:'𝐠',h:'𝐡',i:'𝐢',j:'𝐣',k:'𝐤',l:'𝐥',m:'𝐦',n:'𝐧',o:'𝐨',p:'𝐩',q:'𝐪',r:'𝐫',s:'𝐬',t:'𝐭',u:'𝐮',v:'𝐯',w:'𝐰',x:'𝐱',y:'𝐲',z:'𝐳' },
    italic:   { A:'𝘈',B:'𝘉',C:'𝘊',D:'𝘋',E:'𝘌',F:'𝘍',G:'𝘎',H:'𝘏',I:'𝘐',J:'𝘑',K:'𝘒',L:'𝘓',M:'𝘔',N:'𝘕',O:'𝘖',P:'𝘗',Q:'𝘘',R:'𝘙',S:'𝘚',T:'𝘛',U:'𝘜',V:'𝘝',W:'𝘞',X:'𝘟',Y:'𝘠',Z:'𝘡',a:'𝘢',b:'𝘣',c:'𝘤',d:'𝘥',e:'𝘦',f:'𝘧',g:'𝘨',h:'𝘩',i:'𝘪',j:'𝘫',k:'𝘬',l:'𝘭',m:'𝘮',n:'𝘯',o:'𝘰',p:'𝘱',q:'𝘲',r:'𝘳',s:'𝘴',t:'𝘵',u:'𝘶',v:'𝘷',w:'𝘸',x:'𝘹',y:'𝘺',z:'𝘻' },
    script:   { A:'𝓐',B:'𝓑',C:'𝓒',D:'𝓓',E:'𝓔',F:'𝓕',G:'𝓖',H:'𝓗',I:'𝓘',J:'𝓙',K:'𝓚',L:'𝓛',M:'𝓜',N:'𝓝',O:'𝓞',P:'𝓟',Q:'𝓠',R:'𝓡',S:'𝓢',T:'𝓣',U:'𝓤',V:'𝓥',W:'𝓦',X:'𝓧',Y:'𝓨',Z:'𝓩',a:'𝓪',b:'𝓫',c:'𝓬',d:'𝓭',e:'𝓮',f:'𝓯',g:'𝓰',h:'𝓱',i:'𝓲',j:'𝓳',k:'𝓴',l:'𝓵',m:'𝓶',n:'𝓷',o:'𝓸',p:'𝓹',q:'𝓺',r:'𝓻',s:'𝓼',t:'𝓽',u:'𝓾',v:'𝓿',w:'𝔀',x:'𝔁',y:'𝔂',z:'𝔃' },
    double:   { A:'𝔸',B:'𝔹',C:'ℂ',D:'𝔻',E:'𝔼',F:'𝔽',G:'𝔾',H:'ℍ',I:'𝕀',J:'𝕁',K:'𝕂',L:'𝕃',M:'𝕄',N:'ℕ',O:'𝕆',P:'ℙ',Q:'ℚ',R:'ℝ',S:'𝕊',T:'𝕋',U:'𝕌',V:'𝕍',W:'𝕎',X:'𝕏',Y:'𝕐',Z:'ℤ',a:'𝕒',b:'𝕓',c:'𝕔',d:'𝕕',e:'𝕖',f:'𝕗',g:'𝕘',h:'𝕙',i:'𝕚',j:'𝕛',k:'𝕜',l:'𝕝',m:'𝕞',n:'𝕟',o:'𝕠',p:'𝕡',q:'𝕢',r:'𝕣',s:'𝕤',t:'𝕥',u:'𝕦',v:'𝕧',w:'𝕨',x:'𝕩',y:'𝕪',z:'𝕫' },
    gothic:   { A:'𝔄',B:'𝔅',C:'ℭ',D:'𝔇',E:'𝔈',F:'𝔉',G:'𝔊',H:'ℌ',I:'ℑ',J:'𝔍',K:'𝔎',L:'𝔏',M:'𝔐',N:'𝔑',O:'𝔒',P:'𝔓',Q:'𝔔',R:'ℜ',S:'𝔖',T:'𝔗',U:'𝔘',V:'𝔙',W:'𝔚',X:'𝔛',Y:'𝔜',Z:'ℨ',a:'𝔞',b:'𝔟',c:'𝔠',d:'𝔡',e:'𝔢',f:'𝔣',g:'𝔤',h:'𝔥',i:'𝔦',j:'𝔧',k:'𝔨',l:'𝔩',m:'𝔪',n:'𝔫',o:'𝔬',p:'𝔭',q:'𝔮',r:'𝔯',s:'𝔰',t:'𝔱',u:'𝔲',v:'𝔳',w:'𝔴',x:'𝔵',y:'𝔶',z:'𝔷' },
    flip:     { a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z',A:'∀',B:'q',C:'Ɔ',D:'p',E:'Ǝ',F:'Ⅎ',G:'פ',H:'H',I:'I',J:'ɾ',K:'ʞ',L:'˥',M:'W',N:'N',O:'O',P:'Ԁ',Q:'Q',R:'ɹ',S:'S',T:'┴',U:'∩',V:'Λ',W:'M',X:'X',Y:'⅄',Z:'Z','1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'ㄥ','8':'8','9':'6','0':'0','!':'¡','?':'¿','.':'˙',',': "'", "'": ',', '(': ')', ')': '(' },
};

const convert = (text, map) => text.split('').map(c => map[c] || c).join('');

module.exports = [

// ─────────────────────────────────────────────────────────────────────────────
//  .sticker — image/video to sticker
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'sticker', category: 'tools',
    execute: async (sock, m, { reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime) return reply(`❗ Reply to an image or video to make a sticker.\n\n${sig()}`);
        await react(sock, m, '🎨');
        try {
            const buf = await sock.downloadMediaMessage(q.msg || q);
            if (mime.includes('video')) {
                await sock.sendVideoAsSticker(m.chat, buf, m, { packname: config.sticker?.packname || 'LIAM EYES', author: config.sticker?.author || 'Liam' });
            } else {
                await sock.sendImageAsSticker(m.chat, buf, m, { packname: config.sticker?.packname || 'LIAM EYES', author: config.sticker?.author || 'Liam' });
            }
            await react(sock, m, '✅');
        } catch(e) { await react(sock, m,'❌'); reply(`❌ Sticker failed: ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .toimage — sticker to image
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'toimage', category: 'tools',
    execute: async (sock, m, { reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('webp')) return reply(`❗ Reply to a sticker.\n\n${sig()}`);
        try {
            await react(sock, m, '🖼️');
            const buf = await sock.downloadMediaMessage(q.msg || q);
            await sock.sendMessage(m.chat, { image: buf, caption: `🖼️ *Sticker converted!*\n\n${sig()}` }, { quoted: m });
            await react(sock, m, '✅');
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .fancy — convert text to multiple font styles
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'fancy', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.fancy <text>*\n\n${sig()}`);
        reply(
            `✨ *Fancy Text Converter*\n\n` +
            `🔤 Normal: ${text}\n` +
            `𝐁 Bold: ${convert(text, FONTS.bold)}\n` +
            `𝘐 Italic: ${convert(text, FONTS.italic)}\n` +
            `𝓒 Script: ${convert(text, FONTS.script)}\n` +
            `𝔻 Double: ${convert(text, FONTS.double)}\n` +
            `𝔊 Gothic: ${convert(text, FONTS.gothic)}\n\n${sig()}`
        );
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .fliptext — flip text upside down
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'fliptext', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.fliptext <text>*\n\n${sig()}`);
        const flipped = convert(text, FONTS.flip).split('').reverse().join('');
        reply(`🔄 *Flipped Text*\n\n${flipped}\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .calculate — evaluate math expression
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'calculate', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.calculate <expression>*\nExample: _.calculate 2 + 2 * 10_\n\n${sig()}`);
        try {
            // Safe math eval — only allow safe chars
            if (/[^0-9+\-*/%^.()\s,]/.test(text.replace(/sqrt|abs|pow|log|sin|cos|tan|pi|e/gi,'')))
                return reply(`❌ Invalid characters in expression.\n\n${sig()}`);
            const cleaned = text.replace(/pi/gi,'Math.PI').replace(/e(?!\d)/gi,'Math.E')
                .replace(/sqrt\(/g,'Math.sqrt(').replace(/abs\(/g,'Math.abs(')
                .replace(/pow\(/g,'Math.pow(').replace(/log\(/g,'Math.log(')
                .replace(/sin\(/g,'Math.sin(').replace(/cos\(/g,'Math.cos(')
                .replace(/tan\(/g,'Math.tan(').replace(/\^/g,'**');
            const result = Function('"use strict";return (' + cleaned + ')')();
            reply(`🧮 *Calculator*\n\n📥 Input: \`${text}\`\n📤 Result: *${result}*\n\n${sig()}`);
        } catch(e) { reply(`❌ Invalid expression: ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .qrcode — generate QR code for text/URL
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'qrcode', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.qrcode <text or url>*\n\n${sig()}`);
        await react(sock, m, '🔲');
        try {
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(text)}`;
            await sock.sendMessage(m.chat, {
                image: { url }, caption: `🔲 *QR Code Generated*\n📝 Content: _${text.slice(0,50)}${text.length>50?'…':''}_\n\n${sig()}`,
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .genpass — generate secure password
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'genpass', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const len = Math.min(Math.max(parseInt(args[0]) || 16, 6), 64);
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
        const pass = Array.from(crypto.randomBytes(len)).map(b => charset[b % charset.length]).join('');
        reply(`🔐 *Generated Password (${len} chars)*\n\n\`${pass}\`\n\n⚠️ _Never share passwords!_\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .say — text to speech (TTS via voicerss)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'say', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const lang = args.length > 1 ? args[0] : 'en-us';
        const text = args.length > 1 ? args.slice(1).join(' ') : args.join(' ');
        if (!text) return reply(`❗ Usage: *.say [lang] <text>*\nExample: _.say sw Habari yako_\n\n${sig()}`);
        await react(sock, m, '🗣️');
        try {
            const url = `https://api.streamelements.com/kappa/v2/speech?voice=${lang === 'sw' ? 'Brian' : 'Brian'}&text=${encodeURIComponent(text)}`;
            const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
            await sock.sendMessage(m.chat, {
                audio: Buffer.from(data), mimetype: 'audio/mpeg', ptt: true
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch(e) {
            // Fallback: Google TTS
            try {
                const gtts = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text.slice(0,200))}`;
                const { data } = await axios.get(gtts, { responseType:'arraybuffer', timeout:12000, headers:{'User-Agent':'Mozilla/5.0'} });
                await sock.sendMessage(m.chat, { audio: Buffer.from(data), mimetype:'audio/mpeg', ptt:true }, { quoted: m });
                await react(sock, m, '✅');
            } catch(e2) { await react(sock,m,'❌'); reply(`❌ TTS failed: ${e2.message}\n\n${sig()}`); }
        }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .tinyurl — shorten a URL
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'tinyurl', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const url = args[0];
        if (!url || !url.startsWith('http')) return reply(`❗ Usage: *.tinyurl <url>*\n\n${sig()}`);
        await react(sock, m, '🔗');
        try {
            const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 8000 });
            reply(`🔗 *URL Shortened*\n\n📎 Original: ${url.slice(0,50)}…\n✂️ Short: *${data}*\n\n${sig()}`);
            await react(sock, m, '✅');
        } catch(e) { reply(`❌ ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .ssweb / .sswebpc / .sswebtab — screenshot a website
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'ssweb', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const url = args[0];
        if (!url || !url.startsWith('http')) return reply(`❗ Usage: *.ssweb <url>*\n\n${sig()}`);
        await react(sock, m, '📸');
        try {
            // Try multiple free screenshot APIs
            const ssApis = [
                `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`,
                `https://image.thum.io/get/width/1280/png/${encodeURIComponent(url)}`,
                `https://api2.easy-peasy.ai/screenshot?url=${encodeURIComponent(url)}`,
            ];
            let sent = false;
            for (const ssUrl of ssApis) {
                try {
                    await sock.sendMessage(m.chat, {
                        image: { url: ssUrl }, caption: `📸 *Screenshot*\n🌐 ${url}\n\n${sig()}`,
                    }, { quoted: m });
                    await react(sock, m, '✅');
                    sent = true;
                    break;
                } catch(_) {}
            }
            if (!sent) { await react(sock,m,'❌'); reply(`❌ Screenshot failed for: ${url}\n\n${sig()}`); }
        } catch(e) { await react(sock,m,'❌'); reply(`❌ Screenshot failed: ${e.message}\n\n${sig()}`); }
    }
},
{
    command: 'sswebpc', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const url = args[0];
        if (!url || !url.startsWith('http')) return reply(`❗ Usage: *.sswebpc <url>*\n\n${sig()}`);
        await react(sock, m, '🖥️');
        try {
            const ssUrl = `https://image.thum.io/get/width/1280/png/${encodeURIComponent(url)}`;
            await sock.sendMessage(m.chat,{image:{url:ssUrl},caption:`🖥️ *Desktop Screenshot*\n🌐 ${url}\n\n${sig()}`},{quoted:m});
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},
{
    command: 'sswebtab', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const url = args[0];
        if (!url || !url.startsWith('http')) return reply(`❗ Usage: *.sswebtab <url>*\n\n${sig()}`);
        await react(sock, m, '📱');
        try {
            const ssUrl = `https://image.thum.io/get/width/390/png/${encodeURIComponent(url)}`;
            await sock.sendMessage(m.chat,{image:{url:ssUrl},caption:`📱 *Mobile Screenshot*\n🌐 ${url}\n\n${sig()}`},{quoted:m});
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .gsmarena — phone specs lookup
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'gsmarena', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.gsmarena <phone name>*\nExample: _.gsmarena Samsung Galaxy S24_\n\n${sig()}`);
        await react(sock, m, '📱');
        try {
            const { data } = await axios.get(
                `https://phone-specs-api.vercel.app/search?query=${encodeURIComponent(text)}`,
                { timeout: 10000, headers: { 'X-Api-Key': 'anonymous' } }
            );
            if (!data?.length) {
                // Fallback: GPT description
                const { data: gpt } = await axios.get(
                    `https://text.pollinations.ai/${encodeURIComponent(`Give detailed specs for phone: ${text}. Format nicely with bullet points.`)}`,
                    { timeout: 15000 }
                );
                return reply(`📱 *${text}*\n\n${gpt?.toString()?.trim()}\n\n${sig()}`);
            }
            const p = data[0];
            reply(
                `📱 *${p.name || text}*\n\n` +
                `🔹 Brand: ${p.brand || 'N/A'}\n` +
                `🔹 OS: ${p.os || 'N/A'}\n` +
                `🔹 Display: ${p.display_size || 'N/A'}\n` +
                `🔹 RAM: ${p.memory_internal || 'N/A'}\n` +
                `🔹 Camera: ${p.camera || 'N/A'}\n` +
                `🔹 Battery: ${p.battery || 'N/A'}\n\n${sig()}`
            );
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .device — detect device from user-agent / WhatsApp client info
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'device', category: 'tools',
    execute: async (sock, m, { reply, quoted }) => {
        const target = m.quoted || m;
        const id     = target?.key?.id || '';
        // WhatsApp device detection from message ID prefix
        const device = id.startsWith('3A') ? '📱 iPhone (iOS)' :
                       id.startsWith('3E') ? '🤖 Android' :
                       id.startsWith('BA') ? '💻 Web/Desktop' :
                       id.startsWith('BE') ? '🖥️ WhatsApp Web' :
                       '❓ Unknown Device';
        reply(`🔍 *Device Detection*\n\n${device}\n📩 Msg ID: \`${id.slice(0,10)}…\`\n\n_Note: This is an estimate based on message ID prefix_\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .obfuscate — obfuscate JavaScript code
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'obfuscate', category: 'tools',
    execute: async (sock, m, { text, reply, quoted }) => {
        const input = text || (m.quoted?.message?.conversation) || (m.quoted?.message?.extendedTextMessage?.text) || '';
        if (!input) return reply(`❗ Usage: *.obfuscate <code>* or reply to code\n\n${sig()}`);
        // Simple obfuscation: base64 wrap
        const encoded = Buffer.from(input).toString('base64');
        const obf = `eval(Buffer.from("${encoded}","base64").toString())`;
        reply(`🔒 *Obfuscated Code*\n\n\`\`\`\n${obf}\n\`\`\`\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .tourl — upload media and get URL
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'tourl', category: 'tools',
    execute: async (sock, m, { reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime) return reply(`❗ Reply to any media to get its URL.\n\n${sig()}`);
        await react(sock, m, '🔗');
        try {
            const buf = await sock.downloadMediaMessage(q.msg || q);
            // Upload to catbox.moe (free, no auth)
            const form = new (require('form-data'))();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', buf, { filename: 'media.' + (mime.split('/')[1]||'bin'), contentType: mime });
            const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: form.getHeaders(), timeout: 30000
            });
            if (!data || !data.startsWith('http')) throw new Error('Upload failed');
            reply(`🔗 *Media URL*\n\n${data}\n\n_Link expires after 72h_\n\n${sig()}`);
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ Upload failed: ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .take — take sticker (forward with new pack info)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'take', category: 'tools', owner: true,
    execute: async (sock, m, ctx) => {
        if (!ctx.isCreator) return ctx.reply(`⚠️ Owner only!\n\n${sig()}`);
        const arg = (ctx.args[0] || '').toLowerCase();
        const current = !!config.features?.stickerCollect;
        const on = arg === 'on' ? true : arg === 'off' ? false : !current;
        if (!config.features) config.features = {};
        config.features.stickerCollect = on;
        await react(sock, m, on ? '🎴' : '❌');
        ctx.reply(
            `🎴 *Sticker Collect*\n\n` +
            (on
                ? `╔═══════════════════╗\n║  ✅  E N A B L E D  ║\n╚═══════════════════╝\n\n_Every sticker sent in any chat is saved to .stickerpark_`
                : `╔══════════════════════╗\n║  ❌  D I S A B L E D  ║\n╚══════════════════════╝\n\n_Sticker collection stopped_`
            ) + `\n\n${sig()}`
        );
    }
},
{
    command: 'stickerpark', category: 'tools',
    execute: async (sock, m, ctx) => {
        const fs = require('fs');
        const path = require('path');
        const dir = path.join(__dirname, 'Resources', 'stickerpark');
        if (!fs.existsSync(dir)) return ctx.reply(`📭 Sticker park is empty.\n\nEnable collection with *.take on*\n\n${sig()}`);
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp'));
        if (!files.length) return ctx.reply(`📭 No stickers collected yet.\n\nEnable with *.take on*\n\n${sig()}`);
        await react(sock, m, '🎴');
        await ctx.reply(`🎴 *Sticker Park* — ${files.length} sticker${files.length !== 1 ? 's' : ''}\n\n${sig()}`);
        for (const file of files.slice(0, 20)) {
            const buf = fs.readFileSync(path.join(dir, file));
            await sock.sendMessage(m.chat, { sticker: buf }, { quoted: m }).catch(() => {});
        }
        if (files.length > 20) await ctx.reply(`_Showing 20 of ${files.length}. More stickers saved._\n\n${sig()}`);
        await react(sock, m, '✅');
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .emojimix — mix two emojis
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'emojimix', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        if (args.length < 2) return reply(`❗ Usage: *.emojimix <emoji1> <emoji2>*\nExample: _.emojimix 😀 🔥_\n\n${sig()}`);
        const e1 = args[0], e2 = args[1];
        await react(sock, m, '✨');
        try {
            // Use Google's emoji kitchen API
            const cp1 = [...e1].map(c=>c.codePointAt(0).toString(16).padStart(4,'0')).join('-');
            const cp2 = [...e2].map(c=>c.codePointAt(0).toString(16).padStart(4,'0')).join('-');
            const kitchenUrl = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${cp1}/u${cp1}_u${cp2}.png`;
            const { status } = await axios.head(kitchenUrl, { timeout: 6000 });
            if (status === 200) {
                await sock.sendMessage(m.chat,{image:{url:kitchenUrl},caption:`✨ *${e1} + ${e2}*\n\n${sig()}`},{quoted:m});
                await react(sock, m, '✅');
            } else throw new Error('Combo not found');
        } catch(e){
            reply(`❌ This emoji combination isn't available in Google Kitchen.\nTry different emojis!\n\n${sig()}`);
        }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .texttopdf — convert text to PDF
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'texttopdf', category: 'tools',
    execute: async (sock, m, { text, reply, quoted }) => {
        const input = text || (m.quoted?.message?.conversation) || (m.quoted?.message?.extendedTextMessage?.text) || '';
        if (!input) return reply(`❗ Usage: *.texttopdf <text>* or reply to text\n\n${sig()}`);
        await react(sock, m, '📄');
        try {
            // Use a free PDF API
            const { data } = await axios.post('https://api.pdfshift.io/v3/convert/html', {
                source: `<html><body style="font-family:Arial;font-size:14px;padding:30px;line-height:1.6">${input.replace(/\n/g,'<br>')}`,
                format: 'A4',
            }, { responseType: 'arraybuffer', timeout: 20000,
                 auth: { username: 'api', password: 'sk_free_2024' } });
            const out = getTmp('.pdf');
            fs.writeFileSync(out, data);
            await sock.sendMessage(m.chat, {
                document: Buffer.from(data), mimetype: 'application/pdf', fileName: 'liam-eyes.pdf',
                caption: `📄 *PDF Generated*\n\n${sig()}`
            }, { quoted: m });
            await react(sock, m, '✅');
            try { fs.unlinkSync(out); } catch(_) {}
        } catch(e){ await react(sock,m,'❌'); reply(`❌ PDF generation failed: ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .filtervcf — filter VCF contacts by country code
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'filtervcf', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        const code = args[0]?.replace(/\D/g,'');
        if (!code) return reply(`❗ Usage: *.filtervcf <country_code>* (reply to .vcf)\nExample: _.filtervcf 254_\n\n${sig()}`);
        if (!mime.includes('vcard') && !mime.includes('contacts'))
            return reply(`❗ Reply to a VCF contacts file.\n\n${sig()}`);
        await react(sock, m, '📋');
        try {
            const buf  = await sock.downloadMediaMessage(q.msg || q);
            const text = buf.toString();
            const entries = text.split(/BEGIN:VCARD/g).filter(Boolean).map(e => 'BEGIN:VCARD' + e);
            const filtered = entries.filter(e => e.includes(`+${code}`) || e.includes(`:${code}`));
            if (!filtered.length) return reply(`❌ No contacts found for +${code}\n\n${sig()}`);
            const out = getTmp('.vcf');
            fs.writeFileSync(out, filtered.join(''));
            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(out), mimetype: 'text/vcard', fileName: `filtered_${code}.vcf`,
                caption: `📋 *${filtered.length} contacts with +${code}*\n\n${sig()}`
            }, { quoted: m });
            await react(sock, m, '✅');
            try { fs.unlinkSync(out); } catch(_) {}
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .vcc — generate virtual credit card (test data)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'vcc', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const type = (args[0] || 'visa').toLowerCase();
        const prefixes = { visa: ['4'], mastercard: ['51','52','53','54','55'], amex: ['34','37'] };
        const prefix = prefixes[type]?.[Math.floor(Math.random()*3)] || '4';
        const len = type === 'amex' ? 15 : 16;
        let num = prefix;
        while (num.length < len - 1) num += Math.floor(Math.random()*10);
        // Luhn checksum
        let sum = 0;
        for (let i = num.length - 1; i >= 0; i-=2) sum += parseInt(num[i]);
        for (let i = num.length - 2; i >= 0; i-=2) { let d=parseInt(num[i])*2; sum += d>9?d-9:d; }
        num += ((10 - (sum%10)) % 10);
        const exp = `${(new Date().getMonth()+2).toString().padStart(2,'0')}/${(new Date().getFullYear()+2).toString().slice(-2)}`;
        const cvv = Array.from(crypto.randomBytes(3)).map(b=>b%10).join('');
        reply(
            `💳 *Virtual Test Card (${type.toUpperCase()})*\n\n` +
            `🔢 Number: \`${num.match(/.{4}/g)?.join(' ') || num}\`\n` +
            `📅 Expiry: ${exp}\n` +
            `🔐 CVV: ${cvv}\n\n` +
            `⚠️ _Test data only — not real card_\n\n${sig()}`
        );
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .runeval — safely evaluate expression (owner only)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'runeval', category: 'tools', owner: true,
    execute: async (sock, m, { text, reply, isCreator }) => {
        if (!isCreator) return reply('👑 Owner only!\n\n' + sig());
        if (!text) return reply(`❗ Usage: *.runeval <expression>*\n\n${sig()}`);
        try {
            const result = await Promise.resolve(Function('"use strict";return (' + text + ')')()).catch(e=>e);
            reply(`⚡ *Eval Result*\n\n\`\`\`\n${JSON.stringify(result,null,2)}\n\`\`\`\n\n${sig()}`);
        } catch(e){ reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .browse — AI-powered web search answer
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'browse', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.browse <query>*\n\n${sig()}`);
        await react(sock, m, '🌐');
        try {
            const prompt = `Search and answer this query concisely with facts: ${text}. Include key facts and sources if possible.`;
            const { data } = await axios.get(
                `https://text.pollinations.ai/${encodeURIComponent(prompt)}`,
                { timeout: 18000, headers: { 'User-Agent': 'LIAM-EYES/2.0' } }
            );
            reply(`🌐 *Browse: ${text}*\n\n${(data||'').toString().trim()}\n\n${sig()}`);
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .base64 — encode/decode base64
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'base64', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const mode = (args[0] || 'encode').toLowerCase();
        const text = args.slice(1).join(' ');
        if (!text) return reply(`❗ Usage: *.base64 encode/decode <text>*\n\n${sig()}`);
        try {
            const result = mode === 'decode'
                ? Buffer.from(text, 'base64').toString('utf8')
                : Buffer.from(text).toString('base64');
            reply(`🔐 *Base64 ${mode === 'decode' ? 'Decoded' : 'Encoded'}*\n\n\`${result}\`\n\n${sig()}`);
        } catch(e){ reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .binary — convert text to binary / binary to text
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'binary', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const mode = (args[0] || 'encode').toLowerCase();
        const text = args.slice(1).join(' ');
        if (!text) return reply(`❗ Usage: *.binary encode/decode <text>*\n\n${sig()}`);
        const result = mode === 'decode'
            ? text.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('')
            : text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
        reply(`💻 *Binary ${mode === 'decode' ? 'Decoded' : 'Encoded'}*\n\n\`${result.slice(0,1000)}\`\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .morse — encode/decode morse code
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'morse', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const code = { A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.' };
        const rev  = Object.fromEntries(Object.entries(code).map(([k,v])=>[v,k]));
        const mode = (args[0]||'encode').toLowerCase();
        const text = args.slice(1).join(' ');
        if (!text) return reply(`❗ Usage: *.morse encode/decode <text>*\n\n${sig()}`);
        const result = mode === 'decode'
            ? text.split('  ').map(w => w.split(' ').map(c => rev[c]||'?').join('')).join(' ')
            : text.toUpperCase().split('').map(c => c === ' ' ? '  ' : (code[c]||'?')).join(' ');
        reply(`📡 *Morse ${mode === 'decode' ? 'Decoded' : 'Encoded'}*\n\n${result}\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .md5 — hash text with MD5
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'md5', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.md5 <text>*\n\n${sig()}`);
        const hash = crypto.createHash('md5').update(text).digest('hex');
        reply(`🔐 *MD5 Hash*\n\n📥 Input: \`${text}\`\n🔑 Hash: \`${hash}\`\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .sha256 — hash text with SHA-256
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'sha256', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.sha256 <text>*\n\n${sig()}`);
        const hash = crypto.createHash('sha256').update(text).digest('hex');
        reply(`🔐 *SHA-256 Hash*\n\n📥 Input: \`${text}\`\n🔑 Hash: \`${hash}\`\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .uuid — generate UUID
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'uuid', category: 'tools',
    execute: async (sock, m, { reply }) => {
        const uuid = crypto.randomUUID ? crypto.randomUUID() : [8,4,4,4,12].map(n=>crypto.randomBytes(Math.ceil(n/2)).toString('hex').slice(0,n)).join('-');
        reply(`🔑 *UUID Generated*\n\n\`${uuid}\`\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .ip — get IP info for a host
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'ip', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const host = args[0] || '';
        if (!host) return reply(`❗ Usage: *.ip <domain or IP>*\nExample: _.ip google.com_\n\n${sig()}`);
        await react(sock, m, '🌐');
        try {
            const { data } = await axios.get(`https://ipapi.co/${host}/json/`, { timeout: 8000 });
            if (data.error) throw new Error(data.reason || 'Lookup failed');
            reply(
                `🌐 *IP Lookup: ${host}*\n\n` +
                `🔹 IP: ${data.ip}\n` +
                `🔹 Country: ${data.country_name} ${data.country_flag_emoji||''}\n` +
                `🔹 Region: ${data.region||'N/A'}\n` +
                `🔹 City: ${data.city||'N/A'}\n` +
                `🔹 ISP: ${data.org||'N/A'}\n` +
                `🔹 Timezone: ${data.timezone||'N/A'}\n\n${sig()}`
            );
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .character — count characters in a message
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'character', category: 'tools',
    execute: async (sock, m, { text, reply, quoted }) => {
        const input = text || (m.quoted?.message?.conversation) || (m.quoted?.message?.extendedTextMessage?.text) || '';
        if (!input) return reply(`❗ Usage: *.character <text>* or reply to a message\n\n${sig()}`);
        const words = input.trim().split(/\s+/).filter(Boolean).length;
        const sentences = (input.match(/[.!?]+/g) || []).length;
        reply(
            `📊 *Text Analysis*\n\n` +
            `📝 Characters: *${input.length}*\n` +
            `🔤 Characters (no spaces): *${input.replace(/\s/g,'').length}*\n` +
            `📖 Words: *${words}*\n` +
            `📄 Sentences: *${sentences}*\n` +
            `📑 Lines: *${input.split('\n').length}*\n\n${sig()}`
        );
    }
},

];

};

// ── module: plugins/tostatus_tools.js ──────────────────────────────────────
__bundleModules["plugins/tostatus_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  tostatus_tools.js — FIXED: real statusJidList from contacts           ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const config = require('./settings');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

// ── Helper: fetch real contact JIDs for statusJidList ──────────────────────
// WhatsApp REQUIRES a list of contact JIDs for status to be visible to them.
// Without this, the status posts but nobody sees it.
async function getStatusRecipients(sock) {
    // Must include the LINKED NUMBER (sock.user.id) for status to be visible
    const linked = (sock.user?.id || '').split(':')[0].replace('@s.whatsapp.net','');
    const jids   = new Set();
    if (linked) jids.add(linked + '@s.whatsapp.net');

    // Also add cfg().owner as a target
    const cfg = require('./settings');
    const ownerNum = (cfg.owner || cfg.adminNumber || '').replace(/[^0-9]/g,'');
    if (ownerNum) jids.add(ownerNum + '@s.whatsapp.net');

    // Try contacts cache
    try {
        const store = sock.store || sock._store;
        if (store?.contacts) {
            Object.keys(store.contacts)
                .filter(j => j.endsWith('@s.whatsapp.net') && !j.includes('status'))
                .slice(0, 200)
                .forEach(j => jids.add(j));
        }
    } catch(_) {}

    if (global._waContacts?.length) global._waContacts.slice(0,200).forEach(j => jids.add(j));

    // Minimum: at least the linked number
    return [...jids].filter(Boolean);
}

// ── Build proper status send options ──────────────────────────────────────
async function statusOpts(sock, extra = {}) {
    const recipients = await getStatusRecipients(sock);
    return { statusJidList: recipients, ...extra };
}

module.exports = [
    // ── .togstatus — post replied media/text to status ─────────────────────
    { command:'togstatus', category:'tostatus',
      execute: async (sock,m,{reply,isCreator}) => {
        if(!isCreator) return reply(config.message.owner);
        const q = m.quoted;
        if(!q) return reply(`❗ *Reply to any media or text to post it to your status!*\n\n${sig()}`);
        await react(sock,m,'📤');
        try {
            const mime = (q.msg||q).mimetype||'';
            const opts = await statusOpts(sock);
            if(mime.includes('image')){
                const buf = await sock.downloadMediaMessage(q);
                await sock.sendMessage('status@broadcast',{image:buf,caption:q.text||q.body||'👁️ LIAM EYES',...opts});
            } else if(mime.includes('video')){
                const buf = await sock.downloadMediaMessage(q);
                await sock.sendMessage('status@broadcast',{video:buf,caption:q.text||q.body||'👁️ LIAM EYES',...opts});
            } else {
                const text = q.text||q.body||config.watermark||'👁️ LIAM EYES';
                await sock.sendMessage('status@broadcast',{text,...opts});
            }
            reply(`✅ *Posted to status!*\n\n${sig()}`);
            await react(sock,m,'✅');
        } catch(e){await react(sock,m,'❌');reply(`❌ Failed: ${e.message}\n\n${sig()}`);}
      }
    },

    // ── .tostatus — post text or replied media to status ──────────────────
    { command:'tostatus', category:'tostatus', owner:true,
      execute: async (sock,m,{text,reply,isCreator}) => {
        if(!isCreator) return reply(config.message.owner);
        const q = m.quoted;
        if(!q && !text) return reply(`❗ Reply to media or provide text.\n\n${sig()}`);
        await react(sock,m,'📤');
        try {
            const opts = await statusOpts(sock);
            if(text && !q){
                await sock.sendMessage('status@broadcast',{text:`${text}\n\n${sig()}`,...opts});
            } else {
                const mime = (q?.msg||q)?.mimetype||'';
                const buf  = mime ? await sock.downloadMediaMessage(q).catch(()=>null) : null;
                if(mime.includes('image') && buf)
                    await sock.sendMessage('status@broadcast',{image:buf,caption:text||'👁️ LIAM EYES',...opts});
                else if(mime.includes('video') && buf)
                    await sock.sendMessage('status@broadcast',{video:buf,caption:text||'👁️ LIAM EYES',...opts});
                else
                    await sock.sendMessage('status@broadcast',{text:text||sig(),...opts});
            }
            reply(`✅ *Posted to status!*\n\n${sig()}`);
            await react(sock,m,'✅');
        } catch(e){await react(sock,m,'❌');reply(`❌ Failed: ${e.message}\n\n${sig()}`);}
      }
    },

    // ── .togroupstatus — broadcast to all groups ───────────────────────────
    { command:'togroupstatus', category:'tostatus', owner:true,
      execute: async (sock,m,{text,reply,isCreator}) => {
        if(!isCreator) return reply('⚠️ Owner only!');
        const q = m.quoted;
        if(!text && !q) return reply('❗ Reply to media or provide text.\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒');

        await sock.sendMessage(m.chat,{react:{text:'📢',key:m.key}}).catch(()=>{});
        let groups = [];
        try {
            const all = await sock.groupFetchAllParticipating();
            groups = Object.keys(all);
        } catch(e) { return reply(`❌ Could not fetch groups: ${e.message}`); }

        if(!groups.length) return reply('❌ Bot is not in any groups.');
        await reply(`📢 *Broadcasting to ${groups.length} group(s)…*\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`);

        let sent = 0, failed = 0;
        const sleep = ms => new Promise(r => setTimeout(r,ms));
        const mime = (q?.msg||q)?.mimetype || '';

        for(const gid of groups) {
            try {
                if(q && mime.includes('image')) {
                    const buf = await sock.downloadMediaMessage(q);
                    await sock.sendMessage(gid,{image:buf,caption:text||'👁️ LIAM EYES'});
                } else if(q && mime.includes('video')) {
                    const buf = await sock.downloadMediaMessage(q);
                    await sock.sendMessage(gid,{video:buf,caption:text||'👁️ LIAM EYES'});
                } else {
                    await sock.sendMessage(gid,{text:text||q?.text||'👁️ LIAM EYES'});
                }
                sent++;
            } catch { failed++; }
            await sleep(800);
        }
        reply(`✅ *Broadcast done!*\n📤 Sent: ${sent}\n❌ Failed: ${failed}\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`);
        await sock.sendMessage(m.chat,{react:{text:'✅',key:m.key}}).catch(()=>{});
      }
    },
];

};

// ── module: plugins/translate_tools.js ─────────────────────────────────────
__bundleModules["plugins/translate_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// LIAM EYES — TRANSLATE (1 command): translate
'use strict';
const axios  = require('axios');
const config = require('./settings');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

const LANGS = {sw:'Swahili',en:'English',fr:'French',es:'Spanish',de:'German',pt:'Portuguese',ar:'Arabic',zh:'Chinese',ja:'Japanese',ko:'Korean',hi:'Hindi',ru:'Russian',it:'Italian',nl:'Dutch',tr:'Turkish'};

module.exports = [
  { command:'translate', category:'translate',
    execute: async (sock,m,{args,reply,quoted}) => {
      if(!args[0]) return reply(`❓ Usage: *.translate <lang> <text>* or reply to a message\nExample: _.translate sw Hello friend_\n\n🌍 Languages: ${Object.entries(LANGS).map(([k,v])=>`\`${k}\`=${v}`).join(', ')}\n\n${sig()}`);
      const lang = args[0].toLowerCase();
      const text = args.slice(1).join(' ')||(quoted?.text||'');
      if(!text) return reply(`❗ Provide text to translate.\n\n${sig()}`);
      await react(sock,m,'🌍');
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0,500))}&langpair=autodetect|${lang}`;
        const {data} = await axios.get(url,{timeout:12000});
        if(data.responseStatus!==200) throw new Error('Translation failed');
        const result = data.responseData.translatedText;
        const detected = data.responseData.detectedLanguage||'auto';
        reply(`🌍 *Translation*\n━━━━━━━━━━━━━━━━\n📥 *Original (${detected}):*\n${text}\n\n📤 *${LANGS[lang]||lang}:*\n${result}\n\n${sig()}`);
        await react(sock,m,'✅');
      } catch(e){await react(sock,m,'❌');reply(`❌ Translation failed: ${e.message}\n\n${sig()}`);}
    }
  },
];

};

// ── module: plugins/video.js ───────────────────────────────────────────────
__bundleModules["plugins/video"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ── LIAM EYES — video.js (stable video download)
'use strict';
const yts = require('yt-search');
const { dlVideo, dlAudio, fmtDur, safeName } = __bundleRequire('library/dl');
const cfg = () => require('./settings');
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
        const mod = [].concat(__bundleRequire('plugins/video')).find(p => p.command === 'video');
        return mod?.execute(sock, m, ctx);
    },
},
];

};

// ── module: plugins/video_tools.js ─────────────────────────────────────────
__bundleModules["plugins/video_tools"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — VIDEO TOOLS
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const execP  = promisify(exec);
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const config = require('./settings');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

const getTmp = ext => path.join(os.tmpdir(), `liam_${Date.now()}${ext}`);

// ── ffmpeg audio extraction ────────────────────────────────────────────────
const ffmpegAudio = (input, output, speed = 1) => {
    const atempo = speed !== 1 ? `,atempo=${speed}` : '';
    return new Promise((res, rej) => {
        const cmd = `ffmpeg -y -i "${input}" -vn -ar 44100 -ac 2 -b:a 192k${atempo ? ` -filter:a "atempo=${speed}"` : ''} "${output}" 2>&1`;
        exec(cmd, (err, stdout, stderr) => {
            if (err && !fs.existsSync(output)) rej(new Error('ffmpeg failed: ' + (stderr || err.message).slice(0,200)));
            else res(output);
        });
    });
};

const ffmpegConvert = (input, output, extra = '') => new Promise((res, rej) => {
    exec(`ffmpeg -y -i "${input}" ${extra} "${output}" 2>&1`, (err, _, stderr) => {
        if (err && !fs.existsSync(output)) rej(new Error(stderr.slice(0,200)));
        else res(output);
    });
});

module.exports = [

// ─────────────────────────────────────────────────────────────────────────────
//  .toaudio — extract audio from video
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'toaudio', category: 'video',
    execute: async (sock, m, { reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('video') && !mime.includes('audio'))
            return reply(`❓ *Usage:* Reply to a video message with *.toaudio*\n\n${sig()}`);

        await react(sock, m, '🎵');
        const tmp = getTmp('.mp4'), out = getTmp('.mp3');
        try {
            const buf = await sock.downloadMediaMessage(q.msg || q);
            fs.writeFileSync(tmp, buf);
            await ffmpegAudio(tmp, out);
            const audio = fs.readFileSync(out);
            await sock.sendMessage(m.chat, {
                audio, mimetype: 'audio/mpeg', fileName: 'audio.mp3'
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch (e) {
            await react(sock, m, '❌');
            reply(`❌ Conversion failed: ${e.message}\n\n${sig()}`);
        } finally {
            [tmp, out].forEach(f => { try { fs.unlinkSync(f); } catch(_){} });
        }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .tovideo — convert audio to video (black bg) / convert doc to video
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'tovideo', category: 'video',
    execute: async (sock, m, { reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('audio') && !mime.includes('video'))
            return reply(`❓ *Usage:* Reply to an audio/video with *.tovideo*\n\n${sig()}`);

        await react(sock, m, '🎬');
        const tmp = getTmp(mime.includes('video') ? '.mp4' : '.mp3');
        const out = getTmp('.mp4');
        try {
            const buf = await sock.downloadMediaMessage(q.msg || q);
            fs.writeFileSync(tmp, buf);
            const extra = mime.includes('video')
                ? '-vf scale=1280:720 -c:v libx264 -preset fast -crf 22'
                : '-f lavfi -i color=black:s=640x360 -c:v libx264 -c:a aac -shortest';
            if (mime.includes('audio')) {
                await new Promise((res, rej) => exec(
                    `ffmpeg -y -f lavfi -i color=black:s=640x360:rate=24 -i "${tmp}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest "${out}"`,
                    (err, _, stderr) => err && !fs.existsSync(out) ? rej(new Error(stderr.slice(0,200))) : res()
                ));
            } else {
                await ffmpegConvert(tmp, out, extra);
            }
            const vid = fs.readFileSync(out);
            await sock.sendMessage(m.chat, {
                video: vid, caption: `🎬 *Converted!*\n\n${sig()}`
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch (e) {
            await react(sock, m, '❌');
            reply(`❌ Failed: ${e.message}\n\n${sig()}`);
        } finally {
            [tmp, out].forEach(f => { try { fs.unlinkSync(f); } catch(_){} });
        }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .volvideo — change video volume
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'volvideo', category: 'video',
    execute: async (sock, m, { args, reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('video'))
            return reply(`❓ *Usage:* *.volvideo <volume>* (reply to video)\nExample: _.volvideo 200_ (200% volume)\n\n${sig()}`);

        const vol = parseFloat(args[0]) || 150;
        if (vol < 10 || vol > 800) return reply('❌ Volume must be between 10 and 800%\n\n' + sig());

        await react(sock, m, '🔊');
        const tmp = getTmp('.mp4'), out = getTmp('.mp4');
        try {
            const buf = await sock.downloadMediaMessage(q.msg || q);
            fs.writeFileSync(tmp, buf);
            const factor = (vol / 100).toFixed(2);
            await new Promise((res, rej) => exec(
                `ffmpeg -y -i "${tmp}" -af "volume=${factor}" -c:v copy "${out}"`,
                (err, _, stderr) => err && !fs.existsSync(out) ? rej(new Error(stderr.slice(0,200))) : res()
            ));
            const vid = fs.readFileSync(out);
            await sock.sendMessage(m.chat, {
                video: vid, caption: `🔊 *Volume changed to ${vol}%*\n\n${sig()}`,
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch (e) {
            await react(sock, m, '❌');
            reply(`❌ Failed: ${e.message}\n\n${sig()}`);
        } finally {
            [tmp, out].forEach(f => { try { fs.unlinkSync(f); } catch(_){} });
        }
    }
},

];

};

// ── module: message.js ─────────────────────────────────────────────────────
__bundleModules["message"] = function(module, exports) {
const __dirname = __ROOT_DIRNAME__;
// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot — message.js                              ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';

const config = require('./settings');
const fs     = require('fs');
const path   = require('path');
const chalk  = require('chalk');
const axios  = require('axios');
const os     = require('os');
const moment = require('moment-timezone');

// ── Dominate store (lightweight file-backed, no extra deps) ──────────────────
const _DFILE = path.join(__dirname, 'Resources', 'dominate.json');
const _dLoad = () => { try { return JSON.parse(fs.readFileSync(_DFILE, 'utf8')); } catch { return {}; } };
const _dSave = d  => { try { fs.writeFileSync(_DFILE, JSON.stringify(d, null, 2)); } catch {} };
let _domData = _dLoad();
const domStore = {
    get:    jid     => _domData[jid] || null,
    set: (jid, obj) => { _domData[jid] = obj; _dSave(_domData); },
    del:    jid     => { delete _domData[jid]; _dSave(_domData); },
};

// ── Menu thumbnail ONLY for .menu — no image on regular replies ──────────────
const menuImage = (() => {
    try { return fs.readFileSync(path.join(__dirname, 'Resources', 'logo.jpg')); } catch {
        try { return fs.readFileSync(path.join(__dirname, 'Resources', 'image.jpg')); } catch { return null; }
    }
})();

let _jidNorm;
const loadUtils = async () => {
    if (_jidNorm) return;
    const b = await import('@whiskeysockets/baileys');
    _jidNorm = b.jidNormalizedUser;
};

const _map = (maps, c) => {
    for (const [src, dst] of maps) { const i = src.indexOf(c); if (i >= 0) return [...dst][i]; }
    return c;
};
const script = t => t.split('').map(c => _map([
    ['ABCDEFGHIJKLMNOPQRSTUVWXYZ','𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩'],
    ['abcdefghijklmnopqrstuvwxyz','𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃'],
], c)).join('');

const STAR  = '★★★★★★★★★★★★★';
const BOX_T = `╔${STAR}╗`;
const BOX_B = `╚${STAR}╝`;
const sBox  = (...lines) => [BOX_T, ...lines, BOX_B].join('\n');
const tz    = () => config.settings?.timezone || 'Africa/Nairobi';
const fmt_tz = () => moment().tz(tz()).format('z');

// ── Host Detection ────────────────────────────────────────────────────────────
const detectHost = () => {
    const env = process.env;
    const cwd = process.cwd();
    const home = env.HOME || '';

    // Cloud platforms
    if (env.HEROKU_APP_NAME || env.DYNO)                            return '🟣 Heroku';
    if (env.RENDER || env.RENDER_SERVICE_NAME || env.RENDER_INTERNAL_HOSTNAME) return '🟦 Render';
    if (env.RAILWAY_ENVIRONMENT || env.RAILWAY_PROJECT_ID)          return '🚂 Railway';
    if (env.KOYEB_INSTANCE_ID)                                      return '🟠 Koyeb';
    if (env.FLY_APP_NAME)                                           return '🪁 Fly.io';
    if (env.CYCLIC_URL)                                             return '🟢 Cyclic';
    if (env.VERCEL)                                                 return '▲ Vercel';
    if (env.AWS_LAMBDA_FUNCTION_NAME || env.AWS_REGION)            return '🟡 AWS';
    if (env.GOOGLE_CLOUD_PROJECT || env.GCLOUD_PROJECT)            return '🔵 Google Cloud';
    if (env.REPL_ID || env.REPLIT_CLUSTER || env.REPLIT_DB_URL)   return '🔵 Replit';

    // Panel hosting (Pterodactyl / bot-hosting.net / similar)
    if (env.PTERODACTYL_NODE || env.P_SERVER_UUID || env.SERVER_MEMORY) return '🦅 Pterodactyl Panel';
    if (home.includes('/container') || cwd.includes('/container'))  return '📦 Bot-Hosting Panel';
    if (home.includes('/home/container'))                           return '📦 Bot-Hosting.net';
    if (env.PANEL_HOST || env.BOT_PANEL)                           return '📦 Bot Panel';

    // Mobile / local
    if (env.TERMUX_VERSION || (env.PREFIX||'').includes('termux')) return '📱 Termux';

    // Generic detection (no TTY = likely some kind of server/panel)
    const knownEnvs = ['HEROKU','RENDER','RAILWAY','KOYEB','FLY','CYCLIC','VERCEL','REPL'];
    const hasCloudEnv = Object.keys(env).some(k => knownEnvs.some(h => k.startsWith(h)));
    if (!hasCloudEnv && !process.stdin.isTTY)                      return '🖥️ Hosting Panel';

    return '🖥️ VPS / Local';
};
global._hostName = detectHost();

// ── Bot State ─────────────────────────────────────────────────────────────────
let BOT_PAUSED = false;
global._botPaused = () => BOT_PAUSED;
global._botKill   = () => { BOT_PAUSED = true; };
global._botWake   = () => { BOT_PAUSED = false; };

// ── Plugin Loader ─────────────────────────────────────────────────────────────
class PluginLoader {
    constructor() {
        this.plugins    = new Map();
        this.categories = new Map();
        this.catDef = [
            { key: 'ai',           label: 'AI',           emoji: '🤖' },
            { key: 'audio',        label: 'AUDIO',        emoji: '🎵' },
            { key: 'download',     label: 'DOWNLOAD',     emoji: '⬇️' },
            { key: 'ephoto',       label: 'EPHOTO360',    emoji: '🖼️' },
            { key: 'fun',          label: 'FUN',          emoji: '😂' },
            { key: 'group',        label: 'GROUP',        emoji: '👥' },
            { key: 'image',        label: 'IMAGE',        emoji: '🌄' },
            { key: 'multisession', label: 'MULTISESSION', emoji: '🔗' },
            { key: 'other',        label: 'OTHER',        emoji: '📦' },
            { key: 'owner',        label: 'OWNER',        emoji: '👑' },
            { key: 'reaction',     label: 'REACTION',     emoji: '😍' },
            { key: 'religion',     label: 'RELIGION',     emoji: '🕌' },
            { key: 'search',       label: 'SEARCH',       emoji: '🔍' },
            { key: 'settings',     label: 'SETTINGS',     emoji: '⚙️' },
            { key: 'sports',       label: 'SPORTS',       emoji: '⚽' },
            { key: 'support',      label: 'SUPPORT',      emoji: '🆘' },
            { key: 'tools',        label: 'TOOLS',        emoji: '🛠️' },
            { key: 'video',        label: 'VIDEO',        emoji: '🎬' },
            { key: 'tostatus',     label: 'TOSTATUS',     emoji: '📤' },
            { key: 'translate',    label: 'TRANSLATE',    emoji: '🌍' },
            { key: 'menustyle',    label: 'MENUSTYLE',    emoji: '🎨' },
            { key: 'games',        label: 'GAMES',        emoji: '🎮' },
            { key: 'general',      label: 'OTHERS',       emoji: '✨' },
            { key: 'media',        label: 'MEDIA',        emoji: '🎬' },
            { key: 'utility',      label: 'UTILITY',      emoji: '🔧' },
        ];
        this.catDef.forEach(c => this.categories.set(c.key, []));
        this.load();
    }
    load() {
        this.plugins.clear();
        this.catDef.forEach(c => this.categories.set(c.key, []));
        // Plugins are bundled directly into this file (no plugins/ folder on disk).
        // __pluginIds + __bundleRequire are provided by the bundle runtime below.
        const ids = (typeof __pluginIds !== 'undefined') ? __pluginIds : [];
        for (const id of ids) {
            try {
                __bundleReload(id);
                for (const p of [].concat(__bundleRequire(id))) {
                    if (!p?.command || typeof p.execute !== 'function') continue;
                    const cat = p.category || 'general';
                    if (!this.categories.has(cat)) this.categories.set(cat, []);
                    if (!this.plugins.has(p.command)) this.plugins.set(p.command, p);
                    this.categories.get(cat).push(p.command);
                }
            } catch (e) { console.log(chalk.red(`  [PLUG] ${id}: ${e.message}`)); }
        }
        console.log('');
        console.log(chalk.hex('#00d4ff').bold('  ┌─ 👁️  LIAM EYES — COMMANDS ─────────────────────'));
        let total = 0;
        for (const c of this.catDef) {
            const n = (this.categories.get(c.key) || []).length;
            if (n) { console.log(chalk.hex('#a29bfe')(`  │  ${c.emoji} ${c.label.padEnd(14)} `) + chalk.white(String(n))); total += n; }
        }
        console.log(chalk.hex('#00b894').bold(`  └─ ✔ ${total} commands loaded\n`));
    }
    async run(cmd, sock, m, ctx) {
        const p = this.plugins.get(cmd);
        if (!p) return false;
        try {
            if (p.owner && !ctx.isCreator)                               { await ctx.reply(config.message.owner); return true; }
            if (p.group && !m.isGroup)                                   { await ctx.reply(config.message.group); return true; }
            if (p.admin && m.isGroup && !ctx.isAdmins && !ctx.isCreator) { await ctx.reply(config.message.admin); return true; }
            await p.execute(sock, m, ctx);
        } catch (e) { console.log(chalk.red(`  [CMD:${cmd}] ${e.message}`)); }
        return true;
    }
    primaryCats() { return this.catDef.slice(0, 21).filter(c => (this.categories.get(c.key) || []).length > 0); }
    catByNum(n)   { return this.primaryCats()[n - 1] || null; }
    count()       { return this.plugins.size; }
    reload()      { this.load(); }
    getCmds(key)  { return (this.categories.get(key) || []).sort(); }
    style1_index() { return this.primaryCats().map((c, i) => `_${i+1}._ ${c.emoji} _${c.label}_`).join('\n'); }
    style1_cat(prefix, catKey) {
        const cmds = this.getCmds(catKey);
        const c = this.catDef.find(x => x.key === catKey) || { label: catKey.toUpperCase(), emoji: '📦' };
        if (!cmds.length) return null;
        return [BOX_T, `  ${c.emoji} *${c.label} MENU*`, BOX_B, ...cmds.map(cmd => `│ ${prefix}${cmd}`), '└─────────────────────'].join('\n');
    }
    style2(prefix) {
        const lines = [];
        for (const c of this.catDef) {
            const cmds = this.getCmds(c.key); if (!cmds.length) continue;
            lines.push(`\n${c.emoji} *${c.label} MENU*`); lines.push('─────────────────────────');
            cmds.forEach(cmd => lines.push(`│ ${prefix}${cmd}`));
        }
        return lines.join('\n');
    }
    style3(prefix) {
        const lines = [];
        for (const c of this.catDef) {
            const cmds = this.getCmds(c.key); if (!cmds.length) continue;
            lines.push(`\n╭──『 *${c.emoji} ${c.label}* 』`);
            cmds.forEach(cmd => lines.push(`│  ✦ ${prefix}${cmd}`));
            lines.push('╰' + '─'.repeat(28));
        }
        return lines.join('\n');
    }
    style4(prefix) {
        const bullets = ['✿','❀','✾','❁','✸','✺']; const lines = []; let bi = 0;
        for (const c of this.catDef) {
            const cmds = this.getCmds(c.key); if (!cmds.length) continue;
            lines.push(`\n≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋`); lines.push(`  ${c.emoji} *${script(c.label)}*`); lines.push(`≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋`);
            cmds.forEach(cmd => lines.push(`  ${bullets[bi++ % bullets.length]} _${prefix}${cmd}_`));
        }
        return lines.join('\n');
    }
    menuFancy(prefix) { return this.style5(prefix); }
    style5(prefix) {
        // ── Exact style from spec: small-caps unicode, ⚊ borders ────────────
        const SC_MAP = {
            a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',
            k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',
            u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ',
            A:'ᴀ',B:'ʙ',C:'ᴄ',D:'ᴅ',E:'ᴇ',F:'ғ',G:'ɢ',H:'ʜ',I:'ɪ',J:'ᴊ',
            K:'ᴋ',L:'ʟ',M:'ᴍ',N:'ɴ',O:'ᴏ',P:'ᴘ',Q:'ǫ',R:'ʀ',S:'s',T:'ᴛ',
            U:'ᴜ',V:'ᴠ',W:'ᴡ',X:'x',Y:'ʏ',Z:'ᴢ',
            '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵',
        };
        const S = c => [...(c||'')].map(x=>SC_MAP[x]||x).join('');

        // Category label map (small-caps)
        const LBLS = {
            ai:'ᴀɪ', audio:'ᴀᴜᴅɪᴏ', download:'ᴅᴏᴡɴʟᴏᴀᴅ', fun:'ғᴜɴ & ɢᴀᴍᴇs',
            group:'ɢʀᴏᴜᴘ', image:'ɪᴍᴀɢᴇ', other:'ᴏᴛʜᴇʀ', owner:'ᴏᴡɴᴇʀ',
            reaction:'ʀᴇᴀᴄᴛɪᴏɴ', search:'sᴇᴀʀᴄʜ', settings:'sᴇᴛᴛɪɴɢs',
            tools:'ᴛᴏᴏʟs', video:'ᴠɪᴅᴇᴏ', general:'ɢᴇɴᴇʀᴀʟ',
            media:'ᴍᴇᴅɪᴀ', translate:'ᴛʀᴀɴsʟᴀᴛᴇ', sports:'sᴘᴏʀᴛs',
            religion:'ʀᴇʟɪɢɪᴏɴ', tostatus:'ᴛᴏsᴛᴀᴛᴜs', utility:'ᴜᴛɪʟɪᴛʏ',
            multisession:'ᴍᴜʟᴛɪ-sᴇssɪᴏɴ', ephoto:'ᴇᴘʜᴏᴛᴏ', support:'sᴜᴘᴘᴏʀᴛ',
        };
        // Category icon map
        const ICONS = {
            ai:'◈', audio:'🎵', download:'✦', fun:'✪', group:'✧', image:'●',
            media:'❃', other:'✬', owner:'□', reaction:'❤️', religion:'✬',
            search:'▣', settings:'✥', sports:'⚽', tostatus:'📤', tools:'▣',
            translate:'🌍', video:'🎬', utility:'🔧', general:'✠',
            multisession:'🔗', ephoto:'🖼️', support:'🆘',
        };

        const BRD = '╭⚊⚊⚊⚊⚊⚊⚊⚊⚊⚊⚊⚊╮';
        const END = '╰⚊⚊⚊⚊⚊⚊⚊⚊⚊⚊⚊⚊╯';
        const lines = [];

        for (const c of this.catDef) {
            const cmds = this.getCmds(c.key);
            if (!cmds.length) continue;
            const icon = ICONS[c.key] || '✦';
            const lbl  = LBLS[c.key] || S(c.label);
            const cnt  = cmds.length;
            lines.push(`\n> *${lbl}* (${cnt})`);
            lines.push(BRD);
            cmds.forEach(cmd => lines.push(`┃${icon} *.${S(cmd)}*`));
            lines.push(END);
        }
        return lines.join('\n');
    }
}
const PL = new PluginLoader();

// ── Chatbot ───────────────────────────────────────────────────────────────────
const chatHistory = new Map();
global._chatHistory = chatHistory;
const SYSTEM_PROMPT = `You are LIAM EYES 👁️ — a witty WhatsApp AI by Liam.
RULES:
- Reply in SAME LANGUAGE as the user. Swahili→Swahili. English→English.
- Match their VIBE: chill→relaxed, excited→hype, sad→warm, playful→playful.
- SHORT for casual (1-3 sentences). Detailed only when actually helping.
- NEVER mention OpenAI, ChatGPT, Claude, or Anthropic. You are LIAM EYES by Liam.`;
const getChatHist = jid => {
    if (!chatHistory.has(jid)) chatHistory.set(jid, []);
    const h = chatHistory.get(jid);
    if (h.length > 20) chatHistory.set(jid, h.slice(-20));
    return chatHistory.get(jid);
};
const chatbotReply = async (jid, userText) => {
    const hist = getChatHist(jid);
    hist.push({ role: 'user', content: userText });
    const ctx = hist.slice(-8).map(h => (h.role === 'user' ? 'User: ' : 'LIAM: ') + h.content).join('\n');
    let reply = '';
    try {
        const { data } = await axios.get(
            `https://text.pollinations.ai/${encodeURIComponent(SYSTEM_PROMPT + '\n\n' + ctx + '\nLIAM:')}`,
            { timeout: 10000, headers: { 'User-Agent': 'LIAM-EYES/2.0' } }
        );
        reply = (data?.toString() || '').trim();
    } catch (_) {}
    if (!reply || reply.length < 2) reply = '😅 Brain buffered! Try again.';
    hist.push({ role: 'assistant', content: reply });
    return reply;
};

// ── Console Log ───────────────────────────────────────────────────────────────
const LOG_COLORS = ['#00ff88','#00d4ff','#ff6b9d','#ffd93d','#a29bfe','#fd79a8'];
let _logColorIdx = 0;
const logMsg = (m, body, pushname, senderNum, isGroup, chatId, mtype) => {
    const color = LOG_COLORS[_logColorIdx++ % LOG_COLORS.length];
    const tz_   = fmt_tz();
    const time  = moment().tz(tz()).format('HH:mm:ss');
    const sep   = chalk.hex(color)('─'.repeat(16) + ' 『 ') + chalk.white.bold('LIAM EYES') + chalk.hex(color)(' 』 ' + '─'.repeat(16));
    const row   = (label, val) => chalk.hex(color)('» ') + chalk.hex('#888')(label.padEnd(14)) + chalk.white(val);
    console.log(''); console.log(sep);
    console.log(row('Sent Time:', `${time} ${tz_}`));
    console.log(row('Message Type:', mtype || 'textMessage'));
    console.log(row('Sender:', senderNum));
    console.log(row('Name:', pushname || 'Unknown'));
    console.log(row('Chat ID:', isGroup ? chatId : 'DM'));
    console.log(row('Message:', (body || 'N/A').slice(0, 80)));
    console.log(chalk.hex(color)('─'.repeat(44)));
};

// ── Main Handler ──────────────────────────────────────────────────────────────
module.exports = async (sock, m, chatUpdate, store) => {
    try {
        await loadUtils();
        const mtype = m.mtype || Object.keys(m.message || {})[0] || 'unknown';
        const body = (
            m.body || m.message?.conversation || m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption || m.message?.videoMessage?.caption ||
            m.message?.buttonsResponseMessage?.selectedButtonId ||
            m.message?.listResponseMessage?.singleSelectReply?.selectedRowId || ''
        ).toString().trim();

        const botId     = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net';
        const sender    = m.key.fromMe ? botId : (m.key.participant || m.key.remoteJid);
        const senderNum = sender.split('@')[0];
        const pushname  = m.pushName || 'User';

        const prefixMatch = body.match(/^[.!#$]/);
        const prefix  = prefixMatch ? prefixMatch[0] : (config.prefix || '.');
        const isCmd   = !!prefixMatch;
        const command = isCmd ? body.slice(1).trim().split(/\s+/)[0].toLowerCase() : '';
        const args    = isCmd ? body.trim().split(/\s+/).slice(1) : [];
        const text    = args.join(' ');
        const quoted  = m.quoted || m;
        const mime    = (quoted.msg || quoted).mimetype || '';
        const isMedia = /image|video|sticker|audio/.test(mime);

        const isCreator = (() => {
            try {
                const n1 = (sender || '').split('@')[0].replace(/:\d+/, '');
                const n2 = (config.owner || '').replace(/[^0-9]/g, '');
                return n1 === n2 || (_jidNorm?.(sender) === _jidNorm?.(botId));
            } catch { return false; }
        })();
        const isSudo = isCreator || (config.sudo || []).map(s => s.replace(/\D/, '')).includes(senderNum);

        let groupMetadata = {}, groupName = '', participants = [],
            groupAdmins = [], isBotAdmins = false, isAdmins = false,
            groupOwner = '', isGroupOwner = false;
        if (m.isGroup) {
            // Cache group metadata — refresh every 3 min (prevents per-message WhatsApp calls)
            if (!module.exports._gmCache) module.exports._gmCache = new Map();
            const _gc = module.exports._gmCache;
            const _now = Date.now();
            const _hit = _gc.get(m.chat);
            if (!_hit || (_now - _hit._ts) > 5 * 60 * 1000) {
                groupMetadata = await sock.groupMetadata(m.chat).catch(() => ({}));
                groupMetadata._ts = _now;
                _gc.set(m.chat, groupMetadata);
            } else {
                groupMetadata = _hit;
            }
            groupName    = groupMetadata.subject || '';
            participants = (groupMetadata.participants || []).map(p => ({ id: p.id, admin: p.admin === 'superadmin' ? 'superadmin' : p.admin === 'admin' ? 'admin' : null }));
            groupAdmins  = participants.filter(p => p.admin).map(p => p.id);
            isBotAdmins  = groupAdmins.includes(botId);
            isAdmins     = groupAdmins.includes(sender);
            groupOwner   = groupMetadata.owner || '';
            isGroupOwner = groupOwner === sender;
        }

        logMsg(m, body, pushname, senderNum, m.isGroup, m.chat, mtype);

        if (BOT_PAUSED && !isCreator) return;
        if (BOT_PAUSED && isCmd && command !== 'wake') return;

        // ── reply = PLAIN TEXT only, no image ────────────────────────────────
        const reply = txt => sock.sendMessage(m.chat, { text: txt }, { quoted: m }).catch(() => {});
        // ── replyMenu = with image, ONLY used by .menu ────────────────────────
        const replyMenu = async txt => {
            if (menuImage && menuImage.length > 0) {
                await sock.sendMessage(m.chat, { image: menuImage, caption: txt }, { quoted: m }).catch(() => {});
            } else {
                await sock.sendMessage(m.chat, { text: txt }, { quoted: m }).catch(() => {});
            }
        };

        const ctx = {
            args, text, q: text, quoted, mime, isMedia,
            groupMetadata, groupName, participants, groupOwner,
            groupAdmins, isBotAdmins, isAdmins, isGroupOwner,
            isCreator, isSudo, prefix, reply, config, sender, pushname, senderNum, m,
        };

        // ── Auto-features ─────────────────────────────────────────────────────
        const feat = config.features || {};
        if (feat.autoread && !m.key.fromMe) sock.readMessages([m.key]).catch(() => {});
        // autotyping: show typing indicator on every incoming message
        if (feat.autotyping && !m.key.fromMe) {
            sock.sendPresenceUpdate('composing', m.chat).catch(() => {});
            setTimeout(() => sock.sendPresenceUpdate('paused', m.chat).catch(() => {}), 3000);
        }
        // autorecording: show recording/voice indicator
        if (feat.autorecording && !m.key.fromMe) {
            sock.sendPresenceUpdate('recording', m.chat).catch(() => {});
            setTimeout(() => sock.sendPresenceUpdate('paused', m.chat).catch(() => {}), 3000);
        }
        // autorecordtyping: both composing + recording alternating
        if (feat.autorecordtyping && !m.key.fromMe) {
            sock.sendPresenceUpdate('composing', m.chat).catch(() => {});
            setTimeout(() => sock.sendPresenceUpdate('recording', m.chat).catch(() => {}), 1500);
            setTimeout(() => sock.sendPresenceUpdate('paused', m.chat).catch(() => {}), 4000);
        }
        // alwaysonline: keep presence available
        if (feat.alwaysonline) sock.sendPresenceUpdate('available').catch(() => {});
        if (feat.autoreact && !m.key.fromMe) {
            const pool = config.statusReactEmojis || ['❤️','😂','🔥','👍','😍'];
            sock.sendMessage(m.chat, { react: { text: pool[~~(Math.random() * pool.length)], key: m.key } }).catch(() => {});
        }
        if (feat.antilink && m.isGroup && !isAdmins && !isCreator) {
            if (/(https?:\/\/|wa\.me\/|whatsapp\.com\/)/i.test(body)) {
                sock.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                return reply(`⚠️ @${senderNum} Links are not allowed here!`);
            }
        }
        if (feat.antibadword && m.isGroup && !isAdmins && !isCreator) {
            if ((config.badwords || []).some(w => body.toLowerCase().includes(w.toLowerCase()))) {
                sock.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                return reply(`⚠️ @${senderNum} Watch your language!`);
            }
        }
        if (feat.grouponly   && !m.isGroup) return;
        if (feat.privateonly &&  m.isGroup) return;

        // ── Numeric menu reply 1-21 ───────────────────────────────────────────
        if (!m.key.fromMe && !isCmd) {
            const trimmed = (body || '').replace(/\s+/g, '');
            if (/^\d{1,2}$/.test(trimmed)) {
                const n = parseInt(trimmed, 10);
                if (n >= 1 && n <= 21) {
                    const cat = PL.catByNum(n);
                    if (cat) { const content = PL.style1_cat(prefix, cat.key); if (content) { await reply(content); return; } }
                    return;
                }
            }
        }

        // ── Chatbot ───────────────────────────────────────────────────────────
        if (feat.chatbot && !m.key.fromMe && !isCmd && body.trim().length > 0) {
            try {
                sock.sendPresenceUpdate('composing', m.chat).catch(() => {});
                const botReply = await chatbotReply(m.chat, body.trim());
                sock.sendPresenceUpdate('paused', m.chat).catch(() => {});
                return await reply(botReply);
            } catch (_) { return await reply('😅 Hiccup! Try again.'); }
        }
        // ── Sticker collection (.take on) ─────────────────────────────────────
        if (feat.stickerCollect && !m.key.fromMe) {
            const msgType = Object.keys(m.message || {})[0];
            if (msgType === 'stickerMessage') {
                const _fs = require('fs');
                const _path = require('path');
                const dir = _path.join(__dirname, 'Resources', 'stickerpark');
                if (!_fs.existsSync(dir)) _fs.mkdirSync(dir, { recursive: true });
                const outFile = _path.join(dir, `${Date.now()}_${m.key.id?.slice(-6) || 'stk'}.webp`);
                sock.downloadMediaMessage(m).then(buf => {
                    if (buf) _fs.writeFileSync(outFile, buf);
                }).catch(() => {});
            }
        }

        if (!isCmd) return;

        // ── Dominate — LIAM is sole bot in this group: delete all foreign commands ──
        if (m.isGroup) {
            const dom = domStore.get(m.chat);
            if (dom?.on) {
                const anyPfx   = /^[.!#$\/+~\->@%^&*?]/.test(body);
                if (anyPfx) {
                    const domCmd    = body.slice(1).split(/\s+/)[0].toLowerCase().trim();
                    const watched   = !dom.pfx?.length || dom.pfx.includes(body[0]);
                    const isLiamCmd = PL.plugins.has(domCmd) || ['menu','help','dominate'].includes(domCmd);
                    if (watched && !isLiamCmd) {
                        dom.blocked = (dom.blocked || 0) + 1;
                        domStore.set(m.chat, dom);
                        sock.sendMessage(m.chat, { delete: m.key }).catch(() => {});
                        sock.sendMessage(m.chat, { react: { text: '👁️', key: m.key } }).catch(() => {});
                        return;
                    }
                }
            }
        }

        // ── AFK auto-reply ────────────────────────────────────────────────────────
        if (!m.key.fromMe) {
            const _afk = global._afkUsers;
            if (_afk?.size) {
                const mentioned = (m.mentionedJid||[]).concat(m.quoted?.sender ? [m.quoted.sender] : []);
                for (const [afkJid, afkData] of _afk.entries()) {
                    if (mentioned.includes(afkJid) || (m.chat === afkJid && !m.isGroup)) {
                        const since  = Math.round((Date.now()-afkData.since)/1000);
                        const ago    = since<60?`${since}s`:since<3600?`${~~(since/60)}m`:`${~~(since/3600)}h`;
                        await reply(`💤 *AFK Notice*\n\n_${afkData.reason||'Away'} · ${ago} ago_\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`).catch(()=>{});
                        break;
                    }
                }
            }
            if (!isCmd && _afk?.has(sender)) {
                _afk.delete(sender);
                await reply(`🌟 *Welcome back ${pushname}!* AFK cleared.\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`).catch(()=>{});
            }
        }

        // ── Plugin dispatch ───────────────────────────────────────────────────
        if (await PL.run(command, sock, m, ctx)) return;

        // ── .menu / .help — WITH image thumbnail ─────────────────────────────
        if (command === 'menu' || command === 'help') {
            const style  = parseInt(config.menuStyle) || 5; // default: RAVEN style
            const numArg = parseInt(args[0]);
            if (style === 1) {
                if (numArg >= 1 && numArg <= 21) {
                    const cat = PL.catByNum(numArg);
                    if (cat) { const c = PL.style1_cat(prefix, cat.key); if (c) { await replyMenu(c); return; } }
                }
                if (args[0] && isNaN(args[0])) {
                    const key = args[0].toLowerCase();
                    if (PL.categories.has(key)) { const c = PL.style1_cat(prefix, key); if (c) { await replyMenu(c); return; } }
                }
            }
            const mem     = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0) + 'MB';
            const ramTot  = (os.totalmem() / 1024 / 1024 / 1024).toFixed(0) + 'GB';
            const up      = process.uptime();
            const upStr   = `${~~(up/86400)}d ${~~(up%86400/3600)}h ${~~(up%3600/60)}m`;
            const ping    = Math.max(0, Date.now() - (m.messageTimestamp || 0) * 1000);
            const total   = PL.count();
            const cats    = PL.primaryCats();
            const utype   = isCreator ? 'Owner' : isSudo ? 'Sudo' : isAdmins ? 'Admin' : 'User';
            const botName = config.settings?.title || '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
            const styleIcons = { 1:'🔢 Numbered', 2:'📋 List', 3:'🗂️ Classic', 4:'✒️ Cursive', 5:'⚊ Fancy/RAVEN' };
            const _styleMap  = { fancy:5, raven:5, classic:3, list:2, cursive:4, numbered:1 };
            const curStyle   = (typeof config.menuStyle === 'string' ? _styleMap[config.menuStyle] : parseInt(config.menuStyle)) || 5;
            const curStyleNm = styleIcons[curStyle] || 'Numbered';
            const styleHint  = `\n\n_Style: *.fancy* | *.classic* | *.cursive* | *.numbered*_`;

            const modeStr   = sock.public ? 'ᴘᴜʙʟɪᴄ' : 'ᴘʀɪᴠᴀᴛᴇ';
            const hostStr   = global._hostName || 'pannel';

            const boxHeader = [
                `╔═══════════╗`,
                `╔〚 *${botName}* 〛╗`,
                `║✫ *ᴜsᴇʀ:* ${pushname || utype}`,
                `║✫ *ᴘʀᴇғɪx:* ${prefix}`,
                `║✫ *ᴍᴏᴅᴇ:* ${modeStr}`,
                `║✫ *ᴄᴍᴅs:* ${total}`,
                `║✫ *ᴘɪɴɢ:* ${ping}ᴍs`,
                `║✫ *ʀᴀᴍ:* ${mem}`,
                `║✫ *ᴜᴘ:* ${upStr}`,
                `║✫ *ʜᴏsᴛ:* ${hostStr}`,
                `╚═══════════╝`,
            ].join('\n');

            if (style === 1) {
                const txt = boxHeader + '\n\n' + PL.style1_index() + `\n\n_Reply 1–${cats.length} to open · ${prefix}menu 5 to jump_`;
                await replyMenu(txt); return;
            }
            if (style === 2) { await replyMenu(boxHeader + '\n\n' + PL.style2(prefix) + styleHint); return; }
            if (style === 3) { await replyMenu(boxHeader + '\n\n' + PL.style3(prefix) + styleHint); return; }
            if (style === 4) { await replyMenu(boxHeader + '\n\n' + PL.style4(prefix) + styleHint); return; }
            if (style === 5) {
                await replyMenu(boxHeader + '\n\n' + PL.style5(prefix) + styleHint);
                return;
            }
        }

        if (command === 'kill') {
            if (!isCreator) return reply(config.message.owner);
            BOT_PAUSED = true;
            return reply(`🔴 *Bot Paused*\n\nUse *${prefix}wake* to resume.\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
        if (command === 'wake') {
            if (!isCreator) return reply(config.message.owner);
            BOT_PAUSED = false;
            return reply(`🟢 *Bot Active*\n\nI'm back online!\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }

        const _sW = { numbered:1, list:2, classic:3, cursive:4, raven:5, fancy:5 }; // fancy = raven style
        const _sI = { 1:'🔢 Numbered', 2:'📋 List', 3:'🗂️ Classic', 4:'✒️ Cursive', 5:'⚊ Fancy/RAVEN' };
        if (['menustyle','setmenustyle','numbered','list','classic','cursive','raven','fancy'].includes(command)) {
            if (!isCreator && !isSudo) return reply(config.message.owner);
            if (_sW[command] !== undefined) { config.menuStyle = _sW[command]; return reply(`✅ *Menu style → ${_sI[_sW[command]]}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`); }
            const curSt = parseInt(config.menuStyle) || 1;
            const argN = parseInt(args[0]) || _sW[(args[0]||'').toLowerCase()];
            if (argN >= 1 && argN <= 4) { config.menuStyle = argN; return reply(`✅ *Menu style → ${_sI[argN]}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`); }
            return reply(`🎨 *Menu Style — Current:* ${curSt} (${_sI[curSt]})\n\nUse *.numbered* *.list* *.classic* *.cursive*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
        if (command === 'reload') {
            if (!isCreator) return reply(config.message.owner);
            PL.reload();
            return reply(`✅ *Reloaded* — ${PL.count()} commands\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    } catch (e) { console.log(chalk.red('[MSG ERR] ' + (e.message || e))); }
};

};



const cfg  = () => require('./settings');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const bridge = __bundleRequire('library/bridge');

// ── Web service port binding (Render requires an open port) ─────
// Only the main process binds — child instances (.run) don't need this
if (!process.env.LIAM_INSTANCE_ID) {
    const http = require('http');
    const PORT = process.env.PORT || 3000;
    http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', bot: 'LIAM EYES', uptime: process.uptime() }));
    }).listen(PORT, () => {
        console.log(`[SERVER] Listening on port ${PORT} (Render port scan satisfied)`);
    });
}

// ── Suppress noise ──────────────────────────────────────────────
const IGNORED = ['Socket connection timeout','EKEYTYPE','item-not-found',
    'rate-overlimit','Connection Closed','Timed Out','Value not found','Bad MAC',
    'unexpected server response','write EPIPE','read ECONNRESET'];
process.on('uncaughtException', e => {
    const s = String(e?.message || e);
    if (!IGNORED.some(x => s.includes(x))) console.error('[CRASH] uncaughtException:', e);
    // Do NOT exit — keep the process alive for child instances
});
process.on('unhandledRejection', e => {
    const s = String(e?.message || e?.reason || e);
    if (!IGNORED.some(x => s.includes(x))) console.error('[CRASH] unhandledRejection:', e);
});
const _ce = console.error;
console.error = (m, ...a) => { if (typeof m === 'string' && IGNORED.some(x => m.includes(x))) return; _ce(m, ...a); };

// ── Restart / reconnect guard — prevents cascading reconnects ───
// One reconnect attempt at a time; exponential back-off up to 30s
let _restartPending = false;
let _restartCount   = 0;
// Back-off: 5s, 9s, 14s, 21s … cap 120s — gentler for 50 simultaneous sessions
const _restartDelay = () => Math.min(5000 * Math.pow(1.5, _restartCount), 120000);

// ── Instance mode: child process spawned by .run uses its own session dir ─
const IS_CHILD   = !!process.env.LIAM_INSTANCE_ID;
const INST_ID    = process.env.LIAM_INSTANCE_ID || 'main';
// If running as a child instance, use the isolated session directory
// injected by bridge_run.js; otherwise default to sessions/main
const SESSION_BASE = process.env.LIAM_SESSION_DIR ||
    path.join(__dirname, 'sessions', IS_CHILD ? INST_ID : 'main');

// ── Runtime stats tracker ────────────────────────────────────────
const STATS = { cmdsProcessed: 0, messagesIn: 0, reconnects: 0, startTime: Date.now() };

// ── Timestamp helper ─────────────────────────────────────────────
const ts = () => chalk.hex('#636e72')(`[${new Date().toLocaleTimeString('en-US', { hour12: false })}]`);

// ── Banner ──────────────────────────────────────────────────────
const banner = () => {
    const W = 56;
    const line  = c => chalk.hex(c).bold;
    const cyan  = '#00d4ff';
    const purp  = '#a29bfe';
    const green = '#00b894';
    const div   = chalk.hex('#6c5ce7')('  ' + '═'.repeat(W));

    console.log('');
    console.log(line(cyan)('  ╔' + '═'.repeat(W) + '╗'));
    console.log(line(cyan)('  ║') + chalk.bgHex(cyan).black.bold('  👁️   L I A M   E Y E S   ✦   A l p h a   B o t   ') + chalk.black.bgHex(cyan)(' ') + line(cyan)('║'));
    console.log(line(cyan)('  ║') + chalk.hex(purp)('         👁️  Your Eyes in the WhatsApp World             ') + line(cyan)('║'));
    console.log(line(cyan)('  ║') + chalk.hex('#636e72')('  ' + '─'.repeat(W-2) + '  ') + line(cyan)('║'));
    console.log(line(cyan)('  ║') + chalk.hex('#74b9ff')(` ${'RUNTIME INFO'.padEnd(W)} `) + line(cyan)('║'));
    console.log(line(cyan)('  ║') + chalk.hex('#dfe6e9')(`  ⬡  Node   : ${process.version.padEnd(W - 14)} `) + line(cyan)('║'));
    console.log(line(cyan)('  ║') + chalk.hex('#dfe6e9')(`  ⬡  OS     : ${(os.platform() + ' ' + os.arch()).padEnd(W - 14)} `) + line(cyan)('║'));
    console.log(line(cyan)('  ║') + chalk.hex('#dfe6e9')(`  ⬡  RAM    : ${((os.totalmem()-os.freemem())/1024/1024).toFixed(0)}MB used / ${(os.totalmem()/1024/1024/1024).toFixed(1)}GB total`.padEnd(W - 2) + ' ') + line(cyan)('║'));
    console.log(line(cyan)('  ║') + chalk.hex('#dfe6e9')(`  ⬡  CPU    : ${os.cpus()[0].model.slice(0,35).padEnd(W - 14)} `) + line(cyan)('║'));
    console.log(line(cyan)('  ║') + chalk.hex('#636e72')('  ' + '─'.repeat(W-2) + '  ') + line(cyan)('║'));
    console.log(line(cyan)('  ╚' + '═'.repeat(W) + '╝'));
    console.log('');
    console.log(chalk.hex(green)('  ◈') + chalk.bold(' Pair Site : ') + chalk.hex('#74b9ff').underline('https://liam-scanner.onrender.com/pair'));
    console.log(chalk.hex(green)('  ◈') + chalk.bold(' Channel   : ') + chalk.hex('#74b9ff').underline('https://whatsapp.com/channel/0029VbBeZTc1t90aZjks9v2S'));
    console.log(chalk.hex(green)('  ◈') + chalk.bold(' Creator   : ') + chalk.hex('#fd79a8').bold('Liam'));
    console.log('');
    console.log(div);
    console.log('');
};

// ── Logger ───────────────────────────────────────────────────────
const L = {
    info:  m => console.log(ts() + chalk.hex('#00d4ff').bold(' ◆ INFO  ') + chalk.white(m)),
    ok:    m => console.log(ts() + chalk.hex('#00b894').bold(' ✔ OK    ') + chalk.greenBright(m)),
    warn:  m => console.log(ts() + chalk.hex('#fdcb6e').bold(' ⚠ WARN  ') + chalk.yellow(m)),
    err:   m => console.log(ts() + chalk.hex('#d63031').bold(' ✖ ERR   ') + chalk.red(m)),
    sys:   m => console.log(ts() + chalk.hex('#a29bfe').bold(' ◇ SYS   ') + chalk.hex('#dfe6e9')(m)),
    conn:  m => console.log(ts() + chalk.hex('#74b9ff').bold(' ⟳ CONN  ') + chalk.cyan(m)),
    msg:   (cmd, user, num) => {
        STATS.cmdsProcessed++;
        console.log(
            ts() +
            chalk.hex('#6c5ce7').bold(' ▶ CMD   ') +
            chalk.hex('#fdcb6e').bold(cmd.padEnd(16)) +
            chalk.hex('#00b894')('👤 ') + chalk.white(user.padEnd(14)) +
            chalk.hex('#636e72')('+' + num)
        );
    },
    event: m => console.log(ts() + chalk.hex('#fd79a8').bold(' ◉ EVENT ') + chalk.hex('#fab1a0')(m)),
    stat:  () => {
        const upSec = (Date.now() - STATS.startTime) / 1000;
        const upStr = `${~~(upSec/3600)}h ${~~(upSec%3600/60)}m ${~~(upSec%60)}s`;
        const mem   = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        console.log('');
        console.log(chalk.hex('#6c5ce7').bold('  ┌─ LIAM EYES STATS ──────────────────────────────'));
        console.log(chalk.hex('#a29bfe')(`  │  ⏱  Uptime       : ${upStr}`));
        console.log(chalk.hex('#a29bfe')(`  │  💬 Commands run  : ${STATS.cmdsProcessed}`));
        console.log(chalk.hex('#a29bfe')(`  │  📨 Messages seen : ${STATS.messagesIn}`));
        console.log(chalk.hex('#a29bfe')(`  │  🔄 Reconnects    : ${STATS.reconnects}`));
        console.log(chalk.hex('#a29bfe')(`  │  💾 RAM used      : ${mem}MB`));
        console.log(chalk.hex('#6c5ce7').bold('  └────────────────────────────────────────────────'));
        console.log('');
    },
    pair:  code => {
        console.log('');
        console.log(chalk.hex('#fdcb6e').bold('  ╔' + '═'.repeat(50) + '╗'));
        console.log(chalk.hex('#fdcb6e').bold('  ║') + chalk.bgHex('#fdcb6e').black.bold('   🔑  PAIRING CODE — ENTER THIS IN WHATSAPP      ') + chalk.hex('#fdcb6e').bold('║'));
        console.log(chalk.hex('#fdcb6e').bold('  ║') + '                                                  ' + chalk.hex('#fdcb6e').bold('║'));
        console.log(chalk.hex('#fdcb6e').bold('  ║') + chalk.white.bold(`       ★  ${code}  ★`.padEnd(50)) + chalk.hex('#fdcb6e').bold('║'));
        console.log(chalk.hex('#fdcb6e').bold('  ║') + '                                                  ' + chalk.hex('#fdcb6e').bold('║'));
        console.log(chalk.hex('#fdcb6e').bold('  ╚' + '═'.repeat(50) + '╝'));
        console.log('');
        console.log(chalk.hex('#55efc4').bold('  ➜  WhatsApp  →  Linked Devices  →  Link with Phone Number'));
        console.log('');
    },
    boot: async (steps) => {
        console.log(chalk.hex('#a29bfe').bold('  ◆ Booting LIAM EYES…'));
        for (const [label, delay_ms] of steps) {
            await sleep(delay_ms);
            console.log(chalk.hex('#00b894')('     ✔ ') + chalk.white(label));
        }
        console.log('');
    },
};

// Print periodic stats every 30 minutes
setInterval(L.stat, 30 * 60 * 1000);

const ask = t => new Promise(r => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(t, a => { r(a.trim()); rl.close(); });
});

// ── Main ────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// ── GitHub Fork + Star Gate ───────────────────────────────────────────────────
// Users MUST fork AND star the repo before the bot will start.
// ══════════════════════════════════════════════════════════════════════════════
const _ghCheck = async () => {
    const s = cfg();
    if (!s.githubGate) return; // gate disabled (dev/test mode)

    const username = (s.githubUsername || process.env.GITHUB_USERNAME || '').trim();
    if (!username) {
        console.log('');
        console.log(chalk.bgRed.white.bold('  ╔══════════════════════════════════════════════════════╗  '));
        console.log(chalk.bgRed.white.bold('  ║  🔐  GITHUB GATE — SETUP REQUIRED                   ║  '));
        console.log(chalk.bgRed.white.bold('  ╚══════════════════════════════════════════════════════╝  '));
        console.log('');
        console.log(chalk.yellow('  To deploy LIAM EYES you must:'));
        console.log(chalk.cyan(`  1. Fork  → https://github.com/${s.githubOwner}/${s.githubRepo}`));
        console.log(chalk.cyan(`  2. Star  → https://github.com/${s.githubOwner}/${s.githubRepo}`));
        console.log(chalk.yellow('  3. Set your GitHub username in settings.js → githubUsername'));
        console.log(chalk.yellow('     Or set env var: GITHUB_USERNAME=yourname'));
        console.log('');
        process.exit(1);
    }

    const owner = s.githubOwner || 'Dialmw';
    const repo  = s.githubRepo  || 'LIAM-EYES-';
    const hdrs  = { 'User-Agent': 'LIAM-EYES-Bot', Accept: 'application/vnd.github.v3+json' };

    let forked = false, starred = false;

    // ── Check fork: the user's forked repo will exist and have fork:true ──────
    try {
        const forkRes = await require('axios').get(
            `https://api.github.com/repos/${username}/${repo}`,
            { headers: hdrs, timeout: 10000 }
        );
        if (forkRes.data?.fork === true && forkRes.data?.parent?.full_name === `${owner}/${repo}`) {
            forked = true;
        }
    } catch (_) {}

    // ── Check star: scan first 3 pages of stargazers (300 users) ─────────────
    if (!starred) {
        for (let page = 1; page <= 3 && !starred; page++) {
            try {
                const sRes = await require('axios').get(
                    `https://api.github.com/repos/${owner}/${repo}/stargazers?per_page=100&page=${page}`,
                    { headers: { ...hdrs, Accept: 'application/vnd.github.v3.star+json' }, timeout: 10000 }
                );
                if (!sRes.data?.length) break;
                if (sRes.data.some(s => s?.user?.login?.toLowerCase() === username.toLowerCase())) {
                    starred = true;
                }
            } catch (_) { break; }
        }
    }

    if (!forked || !starred) {
        console.log('');
        console.log(chalk.bgRed.white.bold('  ╔══════════════════════════════════════════════════════╗  '));
        console.log(chalk.bgRed.white.bold('  ║  🔐  GITHUB GATE — REQUIREMENTS NOT MET             ║  '));
        console.log(chalk.bgRed.white.bold('  ╚══════════════════════════════════════════════════════╝  '));
        console.log('');
        console.log(chalk.white(`  GitHub Username: ${chalk.cyan(username)}`));
        console.log(chalk.white(`  Repository    : ${chalk.cyan(`https://github.com/${owner}/${repo}`)}`));
        console.log('');
        console.log(chalk.white(`  Fork  : ${forked  ? chalk.green('✅ Done') : chalk.red('❌ Required — Fork the repo first!')}`));
        console.log(chalk.white(`  Star  : ${starred ? chalk.green('✅ Done') : chalk.red('❌ Required — Star the repo first!')}`));
        console.log('');
        console.log(chalk.yellow(`  Complete both steps at: https://github.com/${owner}/${repo}`));
        console.log('');
        process.exit(1);
    }

    console.log(chalk.green(`  ✔ GitHub gate: @${username} — fork ✅  star ✅`));
};

// Expose logger globally for plugins
global._L = {
    ok:   m => console.log(`  ✔ ${m}`),
    warn: m => console.log(`  ⚠ ${m}`),
    err:  m => console.error(`  ✖ ${m}`),
    info: m => console.log(`  ℹ ${m}`),
};

const clientstart = async () => {
    // Only show banner for main bot (not child instances)
    if (!IS_CHILD) banner();
    if (!IS_CHILD) await _ghCheck();

    // ── Detect session source before boot display ──────────────
    const _envSid = process.env.SESSION_ID || process.env.LIAM_SESSION_ID || '';
    const _envNum = process.env.PAIR_NUMBER || process.env.PHONE_NUMBER || '';
    const _cfgSid = cfg().sessionId || '';
    const _hasCreds = require('fs').existsSync(path.join(SESSION_BASE, 'creds.json'));

    const _sessionSrc =
        _hasCreds                                          ? 'Sessions folder (creds.json)' :
        (_envSid && _envSid.startsWith('LIAM:~'))           ? 'SESSION_ID env var' :
        (_cfgSid && _cfgSid !== 'LIAM:~paste_your_session_id_here') ? 'settings.js sessionId' :
        _envNum                                            ? 'PAIR_NUMBER env var → will request code' :
        (process.stdin.isTTY)                              ? 'Interactive terminal (local)' :
        '⚠️  NOT SET — will show instructions';

    await L.boot([
        ['Loading configuration…',       80],
        ['Initialising plugin system…',  80],
        ['Preparing session manager…',   80],
        ['Session source: ' + _sessionSrc, 80],
        ['Connecting to WhatsApp…',       80],
    ]);

    const {
        default: makeWASocket,
        useMultiFileAuthState,
        fetchLatestBaileysVersion,
        DisconnectReason,
        makeCacheableSignalKeyStore,
        Browsers,
        delay,
        downloadContentFromMessage,
        jidDecode,
        jidNormalizedUser,
    } = await import('@whiskeysockets/baileys');

    const sessionDir = SESSION_BASE;
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    // ── Restore from settings.js sessionId ──────────────────────
    const sid = cfg().sessionId;
    if (sid && sid.startsWith('LIAM:~') && sid !== 'LIAM:~paste_your_session_id_here') {
        const cp = path.join(sessionDir, 'creds.json');
        try {
            const decoded = Buffer.from(sid.replace(/^LIAM:~/, ''), 'base64').toString('utf8');
            JSON.parse(decoded); // validate JSON
            fs.writeFileSync(cp, decoded); // ALWAYS overwrite — ensures latest session is used
            L.ok('Session restored from settings.js');
        } catch (e) { L.warn('Session restore failed: ' + e.message); }
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version }          = await fetchLatestBaileysVersion();

    // ── SESSION MENU — shown only if NOT already registered ─────
    let pairNum    = null;
    let sessionStr = null;

    // ── CHILD INSTANCE: skip ALL session setup — creds pre-written by bridge_run ─
    // Child process env vars (LIAM_SESSION_DIR, LIAM_INSTANCE_ID) mean the
    // isolated creds.json was already placed in SESSION_BASE. Skip directly to
    // socket creation. Never use parent's SESSION_ID in a child.
    if (IS_CHILD) {
        if (!fs.existsSync(path.join(sessionDir, 'creds.json'))) {
            L.err(`[${INST_ID}] creds.json not found in session dir — aborting.`);
            process.exit(1);
        }
        // Fall through to socket creation below — no session setup needed
    } else if (!state.creds.registered) {
        // ═══════════════════════════════════════════════════════════════════
        //  PANEL-SAFE SESSION STARTUP
        //  Priority order:
        //  1. SESSION_ID env var  (set in panel environment variables)
        //  2. PAIR_NUMBER env var (set in panel → auto-request pairing code)
        //  3. settings.js sessionId (already restored above if present)
        //  4. Interactive terminal prompt (local dev only, non-panel)
        // ═══════════════════════════════════════════════════════════════════

        const envSid = process.env.SESSION_ID || process.env.LIAM_SESSION_ID || '';
        const envNum = process.env.PAIR_NUMBER || process.env.PHONE_NUMBER || '';

        if (envSid && envSid.startsWith('LIAM:~')) {
            // ── Env var: SESSION_ID ──────────────────────────────
            L.info('Session ID found in environment variable — restoring…');
            const cp = path.join(sessionDir, 'creds.json');
            try {
                fs.writeFileSync(cp, Buffer.from(envSid.replace(/^LIAM:~/, ''), 'base64'));
                L.ok('Session restored from SESSION_ID env var');
                return clientstart(); // restart to pick up new creds
            } catch (e) {
                L.err('Failed to restore session from env: ' + e.message);
                process.exit(1);
            }

        } else if (envNum) {
            // ── Env var: PAIR_NUMBER ─────────────────────────────
            pairNum = envNum.replace(/\D/g, '');
            if (!pairNum || pairNum.length < 7) {
                L.err('PAIR_NUMBER env var is invalid. Set a valid number with country code.');
                process.exit(1);
            }
            L.info('Pairing number from env var: +' + pairNum);

        } else if (process.stdin.isTTY) {
            // ── Interactive terminal (local dev) ─────────────────
            console.log('');
            console.log(chalk.hex('#00d4ff').bold('  ┌─────────────────────────────────────────────────────┐'));
            console.log(chalk.hex('#00d4ff').bold('  │') + chalk.bgHex('#00d4ff').black.bold('   🔐  SESSION SETUP — Choose an option              ') + chalk.hex('#00d4ff').bold(' │'));
            console.log(chalk.hex('#00d4ff').bold('  ├─────────────────────────────────────────────────────┤'));
            console.log(chalk.hex('#00d4ff').bold('  │') + chalk.hex('#74b9ff')('  ▣  1  › Enter phone number (get pairing code)      ') + chalk.hex('#00d4ff').bold(' │'));
            console.log(chalk.hex('#00d4ff').bold('  │') + chalk.hex('#a29bfe')('  ▣  2  › Paste Session ID  (skip pairing)           ') + chalk.hex('#00d4ff').bold(' │'));
            console.log(chalk.hex('#00d4ff').bold('  └─────────────────────────────────────────────────────┘'));
            console.log('');

            const choice = await ask(chalk.hex('#fdcb6e').bold('  ▣ Enter choice (1 or 2) ➜  '));

            if (choice === '2') {
                console.log('');
                console.log(chalk.hex('#a29bfe')('  Paste your LIAM:~ session ID below and press Enter:'));
                const raw = await ask(chalk.hex('#a29bfe').bold('  ▣ Session ID ➜  '));
                if (!raw || !raw.startsWith('LIAM:~')) {
                    L.err('Invalid session ID — must start with LIAM:~. Restart.');
                    process.exit(1);
                }
                const cp = path.join(sessionDir, 'creds.json');
                try {
                    fs.writeFileSync(cp, Buffer.from(raw.replace(/^LIAM:~/, ''), 'base64'));
                    L.ok('Session ID saved — connecting…');
                } catch (e) {
                    L.err('Failed to save session: ' + e.message);
                    process.exit(1);
                }
                return clientstart();
            } else {
                console.log('');
                console.log(chalk.hex('#00d4ff').bold('  ┌─ PHONE PAIRING ──────────────────────────────────────'));
                console.log(chalk.hex('#74b9ff')(  '  │  Enter your number with country code. No + or spaces.'));
                console.log(chalk.hex('#74b9ff')(  '  │  Examples: 254XXXXXXXXX   2348012345678   12025550000'));
                console.log(chalk.hex('#00d4ff').bold('  └────────────────────────────────────────────────────\n'));
                const n = await ask(chalk.hex('#fdcb6e').bold('  ▣ Phone Number ➜  '));
                pairNum = n.replace(/\D/g, '');
                if (!pairNum || pairNum.length < 7) { L.err('Invalid number. Restart.'); process.exit(1); }
                L.info('Starting socket for +' + pairNum + '…');
            }

        } else {
            // ── Non-TTY panel with no env vars — cannot continue ─
            // Child instances should NEVER reach here (they always have LIAM_SESSION_DIR set)
            if (IS_CHILD) {
                L.err(`[${INST_ID}] Child instance has no session — exiting.`);
                process.exit(1);
            }
            L.warn('');
            L.warn('╔═══════════════════════════════════════════════════════╗');
            L.warn('║  ⚠️  NO SESSION CONFIGURED — BOT CANNOT START        ║');
            L.warn('╠═══════════════════════════════════════════════════════╣');
            L.warn('║  You must set one of these in your panel:            ║');
            L.warn('║                                                       ║');
            L.warn('║  Option A — Set environment variable:                ║');
            L.warn('║    SESSION_ID = LIAM:~your_session_id_here            ║');
            L.warn('║                                                       ║');
            L.warn('║  Option B — Edit settings/settings.js:               ║');
            L.warn('║    sessionId: "LIAM:~your_session_id_here"            ║');
            L.warn('║                                                       ║');
            L.warn('║  Option C — Set phone number to pair:                ║');
            L.warn('║    PAIR_NUMBER = 254712345678                        ║');
            L.warn('║                                                       ║');
            L.warn('║  Get a Session ID: https://liam-scanner.onrender.com  ║');
            L.warn('╚═══════════════════════════════════════════════════════╝');
            L.warn('');
            // Wait 60s then exit — panel will restart after this.
            // Use exit(1) so Render/pm2 treat it as a crash and restart automatically.
            await sleep(60000);
            process.exit(1);
        }
    } // end else if (!state.creds.registered)

    // ── Socket ──────────────────────────────────────────────────
    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        logger:                         pino({ level: 'silent' }),
        printQRInTerminal:              false,
        browser:                        Browsers.macOS('Safari'),
        syncFullHistory:                false,
        generateHighQualityLinkPreview: false,
        // ── Stability tuning for 50+ sessions ──────────────────────────────
        connectTimeoutMs:               60000,   // was 30s — more time for slow links
        keepAliveIntervalMs:            25000,   // was 10s — less noise on server
        defaultQueryTimeoutMs:          20000,   // was 5s — avoid spurious timeouts
        retryRequestDelayMs:            250,     // was 50ms — reduce burst retries
        maxMsgRetryCount:               5,       // cap message retry storms
        fireInitQueries:                true,    // ensure session fully hydrated
        emitOwnEvents:                  true,    // consistent event stream
        markOnlineOnConnect:            false,   // avoids presence storms on mass connect
        transactionOpts:                { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
        getMessage:                     async (key) => msgs.get(`${key.remoteJid}:${key.id}`)?.message || undefined,
    });

    // ── Store ───────────────────────────────────────────────────
    const msgs       = new Map();
    const nameCache  = new Map(); // senderNum → pushName for anti-delete
    const mediaCache = new Map(); // msgKey → Buffer (pre-downloaded media for anti-delete)
    const loadMessage = async (jid, id) => msgs.get(`${jid}:${id}`) || null;

    // Helper — download & cache media for anti-delete
    const preCacheMedia = async (mek) => {
        const msgType = Object.keys(mek.message || {})[0];
        const mediaTypes = ['imageMessage','videoMessage','audioMessage','stickerMessage'];
        if (!mediaTypes.includes(msgType)) return;
        const cacheKey = `${mek.key.remoteJid}:${mek.key.id}`;
        if (mediaCache.has(cacheKey)) return; // already cached
        try {
            const buf = await sock.downloadMediaMessage(mek).catch(() => null);
            if (buf) mediaCache.set(cacheKey, { buf, type: msgType });
            // Keep cache under 200 entries to avoid memory bloat
            if (mediaCache.size > 200) {
                const firstKey = mediaCache.keys().next().value;
                mediaCache.delete(firstKey);
            }
        } catch (_) {}
    };

    // ── creds.update — register BEFORE requestPairingCode ───────
    let credsWritten = false;
    sock.ev.on('creds.update', async () => {
        await saveCreds();
        credsWritten = true;
    });

    // ── Request pairing code AFTER events registered ─────────
    if (pairNum && !state.creds.registered) {
        await delay(1500);
        try {
            const code = await sock.requestPairingCode(pairNum);
            L.pair(code?.match(/.{1,4}/g)?.join('-') || code);
        } catch (e) { L.err('Pairing code failed: ' + e.message); }
    }

    // ── Connection ──────────────────────────────────────────────
    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {

        if (connection === 'connecting') {
            L.conn('Establishing secure connection to WhatsApp servers…');
        }

        if (connection === 'open') {
            _restartCount = 0; // reset backoff counter on successful connect
            const rawNum = (sock.user?.id || '').replace(/:\d+@.*/, '');
            const jid    = rawNum + '@s.whatsapp.net';
            // Store linked number globally — used by antidelete and other features
            global._linkedJid = jid;
            global._linkedNum = rawNum;
            const name   = sock.user?.name || 'User';
            const mem    = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

            // ── If this is a child instance, report success to parent ──
            if (IS_CHILD && process.send) {
                process.send({ type: 'CONNECTED', number: rawNum, instanceId: INST_ID });
            }

            console.log('');
            console.log(chalk.hex('#00b894').bold('  ╔' + '═'.repeat(52) + '╗'));
            console.log(chalk.hex('#00b894').bold('  ║') + chalk.bgHex('#00b894').black.bold('   ✅   LIAM EYES IS NOW ONLINE                        ') + chalk.hex('#00b894').bold('║'));
            console.log(chalk.hex('#00b894').bold('  ║') + chalk.hex('#dfe6e9')(`     👤  ${name.padEnd(20)}  📱 +${rawNum}`.padEnd(54)) + chalk.hex('#00b894').bold('║'));
            console.log(chalk.hex('#00b894').bold('  ║') + chalk.hex('#dfe6e9')(`     💾  RAM: ${mem}MB         🔰 Mode: ${cfg().status?.public ? 'Public' : 'Private'}`.padEnd(54)) + chalk.hex('#00b894').bold('║'));
            console.log(chalk.hex('#00b894').bold('  ╚' + '═'.repeat(52) + '╝'));
            console.log('');

            try { await sock.newsletterFollow(cfg().autoJoinChannel); } catch (_) {}

            // ── Send session ID after pairing ──────────────────
            if (pairNum) {
                let waited = 0;
                while (!credsWritten && waited < 15000) { await sleep(200); waited += 200; }
                await sleep(500);

                const cp = path.join(sessionDir, 'creds.json');
                let raw = null;
                for (let i = 0; i < 20; i++) {
                    try {
                        if (fs.existsSync(cp)) {
                            const b = fs.readFileSync(cp);
                            if (b.length > 50) { raw = b; break; }
                        }
                    } catch (_) {}
                    await sleep(300);
                }

                if (raw) {
                    const sessionId = 'LIAM:~' + Buffer.from(raw).toString('base64');

                    // ── Backup before sending (in case WhatsApp DM fails) ──
                    const bDir = path.join('./sessions/backup');
                    if (!fs.existsSync(bDir)) fs.mkdirSync(bDir, { recursive: true });
                    const bId  = 'startup_' + rawNum + '_' + Date.now();
                    try { fs.writeFileSync(path.join(bDir, bId + '.json'), JSON.stringify({ sid: sessionId, num: rawNum, ts: Date.now() })); } catch(_) {}
                    L.ok('Session backed up → sessions/backup/' + bId + '.json');

                    L.ok('Sending session ID to +' + rawNum);
                    try {
                        await sock.sendMessage(jid, { text: sessionId });
                        await sleep(600);
                        await sock.sendMessage(jid, {
                            text:
                                `╔════════════════════════════════╗\n` +
                                `║  👁️ *𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒* — Session Ready  ║\n` +
                                `╚════════════════════════════════╝\n\n` +
                                `✅ Session ID sent above ↑ — copy it!\n` +
                                `⚠️ *Never share it with anyone*\n\n` +
                                `📌 *Steps:*\n` +
                                `1️⃣ Copy the LIAM:~ text above\n` +
                                `2️⃣ Open \`settings/settings.js\`\n` +
                                `3️⃣ Paste into \`sessionId: "..."\`\n` +
                                `4️⃣ Restart — \`npm start\`\n\n` +
                                `👁️ _Your Eyes in the WhatsApp World_`,
                            contextInfo: { externalAdReply: {
                                title: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — Alpha',
                                body: '👁️ Your Eyes in the WhatsApp World',
                                thumbnailUrl: cfg().thumbUrl,
                                sourceUrl: cfg().autoJoinChannel,
                                mediaType: 1,
                            }}
                        });
                        L.ok('Session ID sent ✅');
                    } catch (e) { L.err('Session send failed: ' + e.message); }
                } else {
                    L.err('creds.json not found — session ID not sent');
                }
                pairNum = null;
            }

            // Online notification
            sock.sendMessage(jid, {
                text: `👁️ *𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒* is Online!\n\n> 👤 ${name}\n> 🌍 ${cfg().status?.public ? 'Public' : 'Private'} mode\n> 💬 _Your Eyes in the WhatsApp World_\n\n📡 ${cfg().autoJoinChannel}`,
                contextInfo: { externalAdReply: {
                    title: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — Alpha',
                    body: '👁️ Your Eyes in the WhatsApp World',
                    thumbnailUrl: cfg().thumbUrl,
                    sourceUrl: cfg().autoJoinChannel,
                    mediaType: 1,
                }}
            }).catch(() => {});
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            STATS.reconnects++;

            // ── Fatal codes — session is dead, do not reconnect ──────────────
            const FATAL = new Set([
                DisconnectReason.loggedOut,       // 401 — user logged out
                DisconnectReason.badSession,      // 403 — corrupted/banned session
                DisconnectReason.connectionReplaced, // 500 — another device took over
            ]);

            if (FATAL.has(code)) {
                if (code === DisconnectReason.loggedOut) {
                    L.err(`Logged out (401). Delete ${SESSION_BASE}/ and re-pair.`);
                } else if (code === DisconnectReason.badSession) {
                    L.err(`Bad session (403). Delete ${SESSION_BASE}/ and re-pair.`);
                } else {
                    L.err(`Connection replaced (500) — another session took over. Exiting.`);
                }
                process.exit(1);
                return;
            }

            L.err(`Disconnected — code ${code} (reconnect #${STATS.reconnects})`);

            // ── Restart guard: only one reconnect attempt at a time ──────────
            if (_restartPending) {
                L.warn('Reconnect already scheduled — skipping duplicate.');
                return;
            }
            _restartPending = true;
            _restartCount++;
            const delay_ms = _restartDelay();
            L.warn(`Reconnecting in ${(delay_ms/1000).toFixed(1)}s… (attempt #${_restartCount})`);

            setTimeout(() => {
                _restartPending = false;
                // ── Clean up old socket before spawning new one ──────────────
                try { sock.ev.removeAllListeners(); } catch (_) {}
                try { sock.ws?.close(); } catch (_) {}
                try { sock.end(undefined); } catch (_) {}

                // Hard restart after 15 consecutive failures (child exits; parent pm2/render restarts)
                if (_restartCount > 15) {
                    L.warn('15 consecutive reconnect failures — hard restart');
                    process.exit(1);
                }
                clientstart().catch(e => {
                    L.err('clientstart threw: ' + (e?.message || e));
                    setTimeout(() => process.exit(1), 1000);
                });
            }, delay_ms);
        }
    });

    // ── Messages ─────────────────────────────────────────────────
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
            STATS.messagesIn++;
            const mek = messages[0];
            // Allow status broadcasts through even without message body
            if (!mek?.message && mek.key?.remoteJid !== 'status@broadcast') return;

            if (mek.message && Object.keys(mek.message)[0] === 'ephemeralMessage')
                mek.message = mek.message.ephemeralMessage.message;

            if (mek.key?.remoteJid && mek.key?.id) {
                msgs.set(`${mek.key.remoteJid}:${mek.key.id}`, mek);
                // Cache sender's pushName for anti-delete name display
                if (mek.pushName) {
                    const sNum = (mek.key.participant || mek.key.remoteJid || '').split('@')[0];
                    if (sNum) nameCache.set(sNum, mek.pushName);
                }
                // Pre-download media so anti-delete can forward it even after deletion
                const f = cfg().features || {};
                if (f.antidelete || cfg().antiDelete) {
                    preCacheMedia(mek).catch(() => {});
                }
            }

            if (mek.key?.remoteJid === 'status@broadcast') {
                const f = cfg().features || {};
                console.log(`[STATUS] from ${mek.key.participant} | autoreactstatus=${!!f.autoreactstatus} | autoviewstatus=${!!f.autoviewstatus}`);
                // linked number = the phone that scanned
                const ownerJid = ((sock.user?.id||'').split(':')[0].replace('@s.whatsapp.net','') || (cfg().owner||cfg().adminNumber||'').replace(/[^0-9]/g,'')) + '@s.whatsapp.net';
                const num = mek.key.participant?.split('@')[0] || '?';

                // Auto-view status (must happen first so react is allowed)
                if (f.autoviewstatus) {
                    sock.readMessages([mek.key]).catch(() => {});
                }

                // Auto-react to status
                // statusJidList must include BOTH the poster AND the bot's own JID
                if (f.autoreactstatus) {
                    const pool = cfg().statusReactEmojis || ['😍','🔥','💯','😘','🤩','❤️','👀','✨','🎯'];
                    const emoji = pool[~~(Math.random()*pool.length)];
                    const botJid = (sock.user?.id || '').replace(/:\d+@/, '@');
                    const posterJid = mek.key.participant;
                    const jidList = [posterJid, botJid].filter(Boolean);
                    // Always mark as read first — required for react to work on unseen statuses
                    // Use 1500ms delay to allow read-receipt to fully register server-side
                    sock.readMessages([mek.key]).catch(() => {});
                    setTimeout(() => {
                        sock.readMessages([mek.key]).catch(() => {});
                        setTimeout(() => {
                            sock.sendMessage('status@broadcast',
                                { react: { text: emoji, key: mek.key } },
                                { statusJidList: jidList }
                            ).then(() => {
                                console.log(`[STATUS] reacted ${emoji} to ${posterJid}`);
                            }).catch(err => {
                                console.log(`[STATUS] react FAILED for ${posterJid}:`, err?.message || err);
                            });
                        }, 1000);
                    }, 500);
                }

                // Always cache status messages (needed for anti-delete)
                msgs.set(`status:${mek.key.id}:${mek.key.participant}`, mek);
                // Also cache the sender name for anti-delete status display
                if (mek.pushName && mek.key.participant) {
                    const sn = mek.key.participant.split('@')[0];
                    if (sn) nameCache.set(sn, mek.pushName);
                }

                // Forward status content to owner DM
                if (f.autosavestatus || f.autoviewstatus) {
                    const msgType = Object.keys(mek.message || {})[0];
                    const caption = `📸 *[Status from +${num}]*`;
                    try {
                        if (msgType === 'imageMessage') {
                            const buf = await sock.downloadMediaMessage(mek).catch(() => null);
                            if (buf) sock.sendMessage(ownerJid, { image: buf, caption }).catch(() => {});
                        } else if (msgType === 'videoMessage') {
                            const buf = await sock.downloadMediaMessage(mek).catch(() => null);
                            if (buf) sock.sendMessage(ownerJid, { video: buf, caption }).catch(() => {});
                        } else if (msgType === 'audioMessage') {
                            const buf = await sock.downloadMediaMessage(mek).catch(() => null);
                            if (buf) sock.sendMessage(ownerJid, { audio: buf, mimetype: 'audio/mp4', caption }).catch(() => {});
                        } else if (msgType === 'conversation' || msgType === 'extendedTextMessage') {
                            const txt = mek.message.conversation || mek.message.extendedTextMessage?.text || '';
                            if (txt) sock.sendMessage(ownerJid, { text: `📸 *[Status from +${num}]*\n\n${txt}` }).catch(() => {});
                        }
                    } catch (_) {}
                }
                return;
            }

            if (!sock.public && !mek.key.fromMe && type === 'notify') return;

            const { smsg } = __bundleRequire('library/serialize');
            const m = await smsg(sock, mek, { loadMessage });
            __bundleRequire('message')(sock, m, { messages, type }, { loadMessage });
        } catch (e) { if (!IGNORED.some(x => String(e).includes(x))) console.error(e); }
    });

    // ── Anti-delete  +  Anti-edit ─────────────────────────────────
    sock.ev.on('messages.update', async updates => {
        const f = cfg().features || {};
        const adEnabled = f.antidelete || cfg().antiDelete;
        const aeEnabled = f.antiedit;
        const adsEnabled = f.antideletestatus;
        if (!adEnabled && !aeEnabled && !adsEnabled) return;

        // antiDeleteTarget: "owner"|"same"|"private"|"group"|"both"
        const adTarget = cfg().antiDeleteTarget || 'owner';
        // LINKED NUMBER — the phone that scanned/paired this session
        // Priority: global stored on connect > sock.user.id > settings fallback
        const ownerJid = global._linkedJid
            || ((sock.user?.id || '').replace(/:\d+@.*/, '') + '@s.whatsapp.net')
            || ((cfg().owner || cfg().adminNumber || '').replace(/[^0-9]/g,'') + '@s.whatsapp.net');

        for (const u of updates) {
            const { key, update } = u;

            // ── Detect deleted message (stub type 1) ───────────────────
            // Baileys signals deletion via messageStubType=1 OR protocolMessage REVOKE (type 0)
            const isRevoke = (update?.messageStubType === 1) ||
                (update?.message?.protocolMessage?.type === 0);
            if (isRevoke && adEnabled) {
                // ── Scope filtering: private vs group ──────────────────
                const isGroup   = key.remoteJid?.endsWith('@g.us');
                const isPrivate = !isGroup && key.remoteJid !== 'status@broadcast';
                if (adTarget === 'private' && !isPrivate) continue;
                if (adTarget === 'group'   && !isGroup)   continue;

                // Check if it was a status
                if (key.remoteJid === 'status@broadcast' && adsEnabled) {
                    const skey = `status:${key.id}:${key.participant}`;
                    const del  = msgs.get(skey);
                    if (del?.message) {
                        const num     = (key.participant || '?').replace(/[:\d]+@.*/, '').replace('@s.whatsapp.net','');
                        const name    = del.pushName || `+${num}`;
                        const msgType = Object.keys(del.message)[0];
                        const tz_     = cfg().settings?.timezone || 'Africa/Nairobi';
                        const mtime   = require('moment-timezone')(del.messageTimestamp ? del.messageTimestamp*1000 : Date.now()).tz(tz_);
                        const statusAlert =
                            `🚨 *DELETED STATUS!* 🚨\n\n` +
                            `👤 *AUTHOR:* ${name}\n` +
                            `🕐 *TIME:* ${mtime.format('HH:mm')} ${mtime.format('z')}\n` +
                            `📅 *DATE:* ${mtime.format('DD/MM/YYYY')}\n\n` +
                            `THIS STATUS WAS DELETED!`;
                        try {
                            if (msgType === 'imageMessage') {
                                const buf = await sock.downloadMediaMessage(del).catch(() => null);
                                if (buf) {
                                    // Status image WITH alert caption
                                    await sock.sendMessage(ownerJid, { image: buf, caption: statusAlert }).catch(() => {});
                                } else {
                                    sock.sendMessage(ownerJid, { text: statusAlert + '\n\n🖼️ [Image — download failed]' }).catch(() => {});
                                }
                            } else if (msgType === 'videoMessage') {
                                const buf = await sock.downloadMediaMessage(del).catch(() => null);
                                if (buf) {
                                    await sock.sendMessage(ownerJid, { video: buf, caption: statusAlert }).catch(() => {});
                                } else {
                                    sock.sendMessage(ownerJid, { text: statusAlert + '\n\n🎥 [Video — download failed]' }).catch(() => {});
                                }
                            } else {
                                const txt = del.message.conversation || del.message.extendedTextMessage?.text || '';
                                const alertMsg = await sock.sendMessage(ownerJid, { text: statusAlert }).catch(() => null);
                                if (txt && alertMsg) {
                                    sock.sendMessage(ownerJid, { text: `"${txt}"` }, { quoted: alertMsg }).catch(() => {});
                                }
                            }
                        } catch (_) {}
                    }
                    continue;
                }

                const del = msgs.get(`${key.remoteJid}:${key.id}`);
                if (!del?.message) continue;

                // Resolve target chat based on antiDeleteTarget setting
                let tgt;
                if (adTarget === 'same') {
                    tgt = key.remoteJid; // reply in the same chat
                } else if (adTarget === 'group' && isGroup) {
                    tgt = ownerJid; // group-only mode → notify owner
                } else if (adTarget === 'private' && isPrivate) {
                    tgt = ownerJid; // private-only mode → notify owner
                } else {
                    tgt = ownerJid; // default: always owner DM
                }
                const deleter  = key.participant || key.remoteJid;
                const delNum   = deleter.replace(/[:\d]+@.*/, '').replace('@s.whatsapp.net','');
                const sendJid  = del.key?.participant || del.key?.remoteJid || '';
                const sendNum  = sendJid.replace(/[:\d]+@.*/, '').replace('@s.whatsapp.net','');
                // Get sender name from cache (stored when message arrived), fallback to number
                const senderName  = del.pushName || nameCache.get(sendNum) || `+${sendNum}`;
                const deleterName = nameCache.get(delNum) || `+${delNum}`;
                const msgType  = Object.keys(del.message)[0];
                const tz_      = cfg().settings?.timezone || 'Africa/Nairobi';
                const mtime    = require('moment-timezone')(del.messageTimestamp ? del.messageTimestamp*1000 : Date.now()).tz(tz_);

                // Alert header — name/number only, no chat ID
                const alertHdr =
                    `🚨 *DELETED MESSAGE!* 🚨\n\n` +
                    `👤 *FROM:* ${senderName}\n` +
                    `🗑️ *DELETED BY:* ${deleterName}\n` +
                    `🕐 *TIME:* ${mtime.format('HH:mm')} ${mtime.format('z')}\n` +
                    `📅 *DATE:* ${mtime.format('DD/MM/YYYY')}`;

                // Use pre-cached media buffer first, fallback to live download
                const cacheKey    = `${key.remoteJid}:${key.id}`;
                const cachedMedia = mediaCache.get(cacheKey);
                const getMedia    = async () => {
                    if (cachedMedia?.buf) return cachedMedia.buf;
                    // Try downloading from the stored message
                    try { return await sock.downloadMediaMessage(del); } catch(_) {}
                    // Try with just the message key (some Baileys versions need this)
                    try { return await sock.downloadMediaMessage({ key, message: del.message }); } catch(_) {}
                    return null;
                };

                try {
                    if (msgType === 'conversation' || msgType === 'extendedTextMessage') {
                        const txt = (
                            del.message?.conversation ||
                            del.message?.extendedTextMessage?.text ||
                            del.message?.extendedTextMessage?.matchedText ||
                            del.body || ''
                        );
                        // Send alert first, then reply to it with the deleted text content
                        const alertMsg = await sock.sendMessage(tgt, { text: alertHdr }).catch(() => null);
                        if (alertMsg && txt) {
                            sock.sendMessage(tgt, { text: `💬 "${txt}"` }, { quoted: alertMsg }).catch(() => {});
                        } else if (alertMsg && !txt) {
                            sock.sendMessage(tgt, { text: '_[Message content unavailable — may have been a reply]_' }, { quoted: alertMsg }).catch(() => {});
                        }
                    } else if (msgType === 'imageMessage') {
                        const buf = await getMedia();
                        const origCaption = del.message.imageMessage?.caption || '';
                        if (buf) {
                            // Image with alert as its caption so they arrive together
                            const mediaMsg = await sock.sendMessage(tgt, {
                                image: buf,
                                caption: alertHdr + (origCaption ? `\n\n📝 "${origCaption}"` : '')
                            }).catch(() => null);
                        } else {
                            sock.sendMessage(tgt, { text: alertHdr + '\n\n🖼️ [Image — could not retrieve]' }).catch(() => {});
                        }
                    } else if (msgType === 'videoMessage') {
                        const buf = await getMedia();
                        const origCaption = del.message.videoMessage?.caption || '';
                        if (buf) {
                            const mediaMsg = await sock.sendMessage(tgt, {
                                video: buf,
                                caption: alertHdr + (origCaption ? `\n\n📝 "${origCaption}"` : '')
                            }).catch(() => null);
                        } else {
                            sock.sendMessage(tgt, { text: alertHdr + '\n\n🎥 [Video — could not retrieve]' }).catch(() => {});
                        }
                    } else if (msgType === 'audioMessage') {
                        const buf = await getMedia();
                        // Send alert text, then reply to it with audio
                        const alertMsg = await sock.sendMessage(tgt, { text: alertHdr + '\n\n🎵 [Voice/Audio]' }).catch(() => null);
                        if (buf && alertMsg) {
                            sock.sendMessage(tgt, { audio: buf, mimetype: 'audio/mp4', ptt: !!del.message.audioMessage?.ptt }, { quoted: alertMsg }).catch(() => {});
                        }
                    } else if (msgType === 'stickerMessage') {
                        const buf = await getMedia();
                        const alertMsg = await sock.sendMessage(tgt, { text: alertHdr + '\n\n🎭 [Sticker]' }).catch(() => null);
                        if (buf && alertMsg) {
                            sock.sendMessage(tgt, { sticker: buf }, { quoted: alertMsg }).catch(() => {});
                        }
                    } else if (msgType === 'documentMessage') {
                        const fname = del.message.documentMessage?.fileName || 'file';
                        sock.sendMessage(tgt, { text: alertHdr + `\n\n📎 [Document: ${fname}]` }).catch(() => {});
                    } else {
                        sock.sendMessage(tgt, { text: alertHdr + `\n\n[${msgType}]` }).catch(() => {});
                    }
                } catch (_) {}
            }

            // ── Detect edited message ──────────────────────────────────
            if (aeEnabled && update?.editedMessage) {
                const editedText = update.editedMessage?.conversation || update.editedMessage?.extendedTextMessage?.text || '';
                const orig = msgs.get(`${key.remoteJid}:${key.id}`);
                const origText = orig?.message?.conversation || orig?.message?.extendedTextMessage?.text || '';
                const num = (key.participant || key.remoteJid).split('@')[0];
                if (editedText)
                    sock.sendMessage(ownerJid, {
                        text: `✏️ *[LIAM EYES — Edited Message]*\n👤 +${num}\n\n❌ *Before:* ${origText || '[unknown]'}\n\n✅ *After:* ${editedText}`
                    }).catch(() => {});
            }
        }
    });

    // ── Welcome / Goodbye ─────────────────────────────────────────
    sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
        if (!cfg().features?.welcome) return;
        try {
            const meta = await sock.groupMetadata(id);
            const custom = cfg().customMsgs || {};
            for (const jid of participants) {
                const n = jid.split('@')[0];
                if (action === 'add') {
                    const template = custom.welcome || '👋 Welcome @{mention} to *{group}*!\n\n👥 Members: {count}\n\n_👁️ LIAM EYES_';
                    const text = template
                        .replace('{mention}', n)
                        .replace(/{mention}/g, n)
                        .replace('{group}', meta.subject)
                        .replace('{count}', meta.participants.length)
                        .replace('{date}', new Date().toLocaleDateString());
                    sock.sendMessage(id, { text, mentions: [jid] }).catch(() => {});
                } else if (action === 'remove') {
                    const template = custom.goodbye || '👋 Goodbye @{mention}! See you next time.\n\n_👁️ LIAM EYES_';
                    const text = template
                        .replace('{mention}', n)
                        .replace(/{mention}/g, n)
                        .replace('{group}', meta.subject)
                        .replace('{count}', meta.participants.length);
                    sock.sendMessage(id, { text, mentions: [jid] }).catch(() => {});
                }
            }
        } catch (_) {}
    });

    // ── Always online ─────────────────────────────────────────────
    setInterval(() => {
        if (cfg().features?.alwaysonline) sock.sendPresenceUpdate('available').catch(() => {});
    }, 15000);

    // ── Auto Bio (every 5 min) ────────────────────────────────────
    setInterval(async () => {
        const f = cfg();
        if (!f.features?.autobio && !f.autoBio) return;
        const text = (f.autoBioText || '👁️ LIAM EYES | {time}')
            .replace('{time}', new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: f.timezone || 'Africa/Nairobi' }))
            .replace('{date}', new Date().toLocaleDateString('en-GB'));
        sock.updateProfileStatus(text).catch(() => {});
    }, 5 * 60 * 1000);

    // ── Anti-call — auto-reject incoming calls ────────────────────
    sock.ev.on('call', async calls => {
        if (!cfg().features?.anticall) return;
        for (const call of calls) {
            if (call.status === 'offer') {
                await sock.rejectCall(call.id, call.from).catch(() => {});
                const ownerJid = ((sock.user?.id||'').split(':')[0].replace('@s.whatsapp.net','') || (cfg().owner||cfg().adminNumber||'').replace(/[^0-9]/g,'')) + '@s.whatsapp.net';
                const num = call.from.split('@')[0];
                sock.sendMessage(call.from, {
                    text: `📵 *Auto-Rejected Call*

Sorry +${num}, LIAM EYES has anti-call mode enabled.
Call the owner directly if needed.

👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`
                }).catch(() => {});
                sock.sendMessage(ownerJid, {
                    text: `📵 *[Incoming Call Rejected]*

📱 From: +${num}
🕐 Time: ${new Date().toLocaleTimeString()}

_Anti-call is ON. Turn off with .anticall off_

👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`
                }).catch(() => {});
            }
        }
    });

    // ── Auto-block non-contacts who DM ───────────────────────────
    // (checked per message in messages.upsert flow via message.js)

    // ── Bridge: register socket + start HTTP bridge server ────────
    bridge.setSock(sock);
    bridge.startBridge();

    // ── Auto-updater: check GitHub on startup + scheduled (parent only) ──
    if (!IS_CHILD) {
        const { startChecker } = __bundleRequire('library/updater');
        startChecker(sock);
    }

    // ── Helpers ───────────────────────────────────────────────────
    sock.public = cfg().status?.public ?? true;

    // ── Always-online interval: send presence every 60s when feature is ON ──
    if (global._alwaysOnlineTimer) clearInterval(global._alwaysOnlineTimer);
    global._alwaysOnlineTimer = setInterval(() => {
        if (cfg().features?.alwaysonline) sock.sendPresenceUpdate('available').catch(() => {});
    }, 60 * 1000);

    sock.downloadMediaMessage = async msg => {
        const mime   = (msg.msg || msg).mimetype || '';
        const type   = msg.mtype ? msg.mtype.replace(/Message/gi,'') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(msg, type);
        let buf = Buffer.from([]);
        for await (const c of stream) buf = Buffer.concat([buf, c]);
        return buf;
    };

    const { getBuffer } = __bundleRequire('library/function');
    const { videoToWebp, writeExifImg, writeExifVid, addExif } = __bundleRequire('library/exif');

    sock.sendImageAsSticker = async (jid, p, quoted, opts = {}) => {
        const buff = Buffer.isBuffer(p) ? p : /^https?:\/\//.test(p) ? await getBuffer(p) : fs.readFileSync(p);
        const out  = (opts?.packname || opts?.author) ? await writeExifImg(buff, opts) : await addExif(buff);
        return sock.sendMessage(jid, { sticker: { url: out }, ...opts }, { quoted });
    };

    sock.sendVideoAsSticker = async (jid, p, quoted, opts = {}) => {
        const buff = Buffer.isBuffer(p) ? p : /^https?:\/\//.test(p) ? await getBuffer(p) : fs.readFileSync(p);
        const out  = (opts?.packname || opts?.author) ? await writeExifVid(buff, opts) : await videoToWebp(buff);
        return sock.sendMessage(jid, { sticker: { url: out }, ...opts }, { quoted });
    };

    sock.sendText = (jid, text, q, opts) => sock.sendMessage(jid, { text, ...opts }, { quoted: q });

    sock.downloadAndSaveMediaMessage = async (message, filename, ext = true) => {
        const q      = message.msg || message;
        const mime   = (message.msg || message).mimetype || '';
        const mtype  = message.mtype ? message.mtype.replace(/Message/gi,'') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(q, mtype);
        let buf = Buffer.from([]);
        for await (const c of stream) buf = Buffer.concat([buf, c]);
        const ft    = await FileType.fromBuffer(buf);
        const fname = ext && ft ? `${filename}.${ft.ext}` : filename;
        fs.writeFileSync(fname, buf);
        return fname;
    };

    sock.decodeJid = jid => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) { const d = jidDecode(jid)||{}; return d.user&&d.server ? `${d.user}@${d.server}` : jid; }
        return jid;
    };

    return sock;
};

clientstart();

