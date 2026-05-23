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
const config  = require('../settings/config');

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
const MAX_INSTANCES = 20;

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

// ── Spawn one child instance ───────────────────────────────────────────────
function spawnChild(opts) {
    const {
        sock,          // parent WA socket (for DM feedback)
        m,             // parent message (for DM feedback)
        instanceId,
        sessionDir,
        isRestart = false,
    } = opts;

    const child = fork(path.join(__dirname, '..', 'index.js'), [], {
        env: {
            ...process.env,
            LIAM_SESSION_DIR: sessionDir,
            LIAM_INSTANCE_ID: instanceId,
            LIAM_PARENT_JID:  m?.chat || '',
            // Clear parent session vars so child never inherits them
            SESSION_ID:       '',
            LIAM_SESSION_ID:  '',
            PAIR_NUMBER:      '',
            PHONE_NUMBER:     '',
            LIAM_NUMBER:      '',
        },
        detached: false,
        silent:   true,
    });

    const inst = instances.get(instanceId) || {};
    let started   = false;
    let exitCount = inst.exitCount || 0;
    let startTimer;

    // ── stdout pipe ──────────────────────────────────────────────────────
    child.stdout?.on('data', d => {
        const txt = d.toString().trim();
        if (txt) process.stdout.write(`[${instanceId}] ${txt}\n`);
        if (!started && (txt.includes('ONLINE') || txt.includes('successfully connected')))
            started = true;
    });
    child.stderr?.on('data', d => {
        const txt = d.toString().trim();
        const NOISE = ['EKEYTYPE','Bad MAC','rate-overlimit','item-not-found','Socket connection timeout'];
        if (txt && !NOISE.some(x => txt.includes(x)))
            process.stderr.write(`[${instanceId}] ${txt}\n`);
    });

    // ── IPC: child reports CONNECTED ──────────────────────────────────────
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
            }, { quoted: m }).catch(()=>{});
        } else if (isRestart) {
            L.ok(`[${instanceId}] Reconnected (#${exitCount}) as +${msg.number || '?'}`);
        }
    });

    // ── child error ───────────────────────────────────────────────────────
    child.on('error', async e => {
        L.err(`[${instanceId}] fork error: ${e.message}`);
        if (!isRestart && sock && m)
            sock.sendMessage(m.chat, { text:`❌ Instance error: ${e.message}\n\n${sig()}` }, { quoted: m }).catch(()=>{});
    });

    // ── child exit ────────────────────────────────────────────────────────
    child.on('exit', (code, signal) => {
        clearTimeout(startTimer);
        const inst = instances.get(instanceId);

        // Manual stop via SIGTERM or .runstop
        if (!instances.has(instanceId) || signal === 'SIGTERM') {
            instances.delete(instanceId);
            L.warn(`[${instanceId}] Stopped cleanly (code=${code} sig=${signal})`);
            return;
        }

        exitCount++;
        instances.set(instanceId, { ...inst, status:'crashed', exitCount, child: null, pid: null });

        // Auto-restart with exponential back-off — up to 8 attempts
        const MAX_RESTARTS = 8;
        if (exitCount <= MAX_RESTARTS) {
            const delay_ms = Math.min(2000 * Math.pow(1.8, exitCount - 1), 60000);
            L.warn(`[${instanceId}] Exited (code=${code}). Restart in ${(delay_ms/1000).toFixed(1)}s (attempt ${exitCount}/${MAX_RESTARTS})`);
            setTimeout(() => {
                if (instances.has(instanceId)) {
                    instances.set(instanceId, { ...instances.get(instanceId), status:'restarting' });
                    spawnChild({ sock, m, instanceId, sessionDir, isRestart: true });
                }
            }, delay_ms);
        } else {
            instances.delete(instanceId);
            L.err(`[${instanceId}] Permanently failed after ${exitCount} restarts`);
            if (sock && m)
                sock.sendMessage(m.chat, {
                    text: `💀 *Instance \`${instanceId}\` permanently crashed*\n\nAfter ${exitCount} restart attempts — check your session.\n\n${sig()}`
                }, { quoted: m }).catch(()=>{});
        }
    });

    // Update registry immediately
    instances.set(instanceId, {
        ...(instances.get(instanceId) || {}),
        pid:        child.pid,
        child,
        num:        inst.num || '?',
        startedAt:  inst.startedAt || Date.now(),
        sessionDir,
        exitCount,
        status:     'starting',
    });

    // Timeout if not connected in 60s
    startTimer = setTimeout(() => {
        if (!started) {
            child.kill('SIGTERM');
            instances.delete(instanceId);
            if (!isRestart && sock && m)
                sock.sendMessage(m.chat, {
                    text: `⏱️ Instance \`${instanceId}\` timed out — session may be expired.\n\n${sig()}`
                }, { quoted: m }).catch(()=>{});
        }
    }, 60000);

    return child;
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
    const sessionDir = path.join(__dirname, '..', 'sessions', instanceId);
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
        const sp = path.join(__dirname, '..', 'settings', 'settings.js');
        let src = fs.readFileSync(sp, 'utf8');
        src = src.replace(/bridgeToken:\s*["'][^"']*["']/, `bridgeToken: "${token}"`);
        fs.writeFileSync(sp, src);
    } catch(_) {}
    try { const br = require('../library/bridge'); if (br.setToken) br.setToken(token); } catch(_) {}
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
