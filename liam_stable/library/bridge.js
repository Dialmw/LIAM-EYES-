// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — bridge.js                                             ║
// ║  Real-time HTTP bridge between WhatsApp bot ↔ Telegram bot ↔ Website  ║
// ║  Uses Server-Sent Events (SSE) for realtime push to website            ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';

const http = require('http');
const config = require('../settings/config');

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
