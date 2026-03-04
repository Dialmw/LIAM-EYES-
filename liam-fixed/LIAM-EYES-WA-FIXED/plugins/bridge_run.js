// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — bridge_run.js                                         ║
// ║  .run <sessionId>     — spawn a second bot instance on a new session   ║
// ║  .bridge <tg_token>   — connect Telegram bot ↔ WA bot                 ║
// ║  .webconnect <url>    — connect website to WA+TG bridge                ║
// ║  .runstop <id>        — stop a running bot instance                    ║
// ║  .runlist             — list all running instances                     ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const fs     = require('fs');
const path   = require('path');
const { fork } = require('child_process');
const config = require('../settings/config');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat, { react:{text:e,key:m.key} }).catch(()=>{});

// ── Global instance registry (survives hot-reload via global) ──────────────
if (!global._liamInstances) global._liamInstances = new Map();
// bridge: { token, tgChatId, waBridgeUrl }
if (!global._liamBridge) global._liamBridge = { token: '', connected: false, wsClients: new Set() };
// webconnect: Set of connected website URLs
if (!global._liamWebConnect) global._liamWebConnect = { url: '', connected: false };

const instances = global._liamInstances;
const bridge    = global._liamBridge;

// ── Restore bridgeToken from settings at startup ──────────────────────────
if (!bridge.token && config.bridgeToken) {
    bridge.token = config.bridgeToken;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SESSION DECODE — accept LIAM:~ format (same as pair site)
// ─────────────────────────────────────────────────────────────────────────────
function decodeSession(sessionId) {
    const s = (sessionId || '').trim();
    // Format: LIAM:~<base64>  or  LIAM~<base64>
    const b64 = s.replace(/^LIAM:?~/i, '');
    if (!b64 || b64 === s) return null;
    // Try standard base64 first (used by index.js when generating session IDs)
    // then fallback to base64url (used by some pair sites)
    let parsed = null;
    for (const enc of ['base64', 'base64url']) {
        try {
            const text = Buffer.from(b64, enc).toString('utf8');
            // Validate it's actually JSON with expected Baileys creds fields
            const obj = JSON.parse(text);
            if (obj && (obj.noiseKey || obj.signedIdentityKey || obj.me || obj.registered !== undefined)) {
                parsed = obj;
                break;
            }
        } catch { /* try next encoding */ }
    }
    return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
//  .run <sessionId> — spawn a second fully functional bot instance
// ─────────────────────────────────────────────────────────────────────────────
async function runInstance(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);

    const raw = ctx.args[0] || ctx.text;
    if (!raw) {
        return ctx.reply(
            `❓ *Usage:* \`.run <session_id>\`\n\n` +
            `Paste a session ID to spawn a second bot instance.\n` +
            `Get session IDs from: https://liam-scanner.onrender.com/pair\n\n${sig()}`
        );
    }

    const decoded = decodeSession(raw);
    if (!decoded) {
        return ctx.reply(
            `❌ *Invalid session ID format.*\n\n` +
            `Expected: \`LIAM:~...\`\n\n` +
            `Get a session ID from: https://liam-scanner.onrender.com/pair\n\n` +
            `⚠️ You need a *DIFFERENT* phone number — not the same number this bot is running on.\n\n` +
            `${sig()}`
        );
    }

    // ── Guard: prevent running the same number as the main bot ────────────
    const mainNum  = (sock.user?.id || '').replace(/:\d+@.*/, '');
    const childNum = (decoded?.me?.id || decoded?.me?.phone || '').replace(/:\d+@.*/, '').replace('@s.whatsapp.net', '');
    if (childNum && mainNum && childNum === mainNum) {
        return ctx.reply(
            `❌ *Cannot run the same number twice!*\n\n` +
            `This session ID belongs to *+${mainNum}* — the same number as the main bot.\n\n` +
            `👉 You need to pair a *DIFFERENT* phone number:\n` +
            `1. Open: https://liam-scanner.onrender.com/pair\n` +
            `2. Enter a *different* phone number\n` +
            `3. Copy the LIAM:~ session ID\n` +
            `4. Run \`.run LIAM:~...\`\n\n` +
            `${sig()}`
        );
    }

    // ── Session limit check ────────────────────────────────────────────
    // 254743285563 and 254705483052 → max 6 sessions
    // Any other number              → max 3 sessions
    const auth          = require('../library/auth');
    const senderNum     = (ctx.senderNum || '').replace(/\D/g,'');
    const maxSessions   = auth.getSessionLimit(senderNum, config.sessionLimits?.default || 3);
    const currentCount  = instances.size; // running sub-instances (main bot = not counted)

    if (currentCount >= maxSessions) {
        return ctx.reply(
            `🚫 *Session Limit Reached*\n\n` +
            `You can run a maximum of *${maxSessions} session(s)*.\n` +
            `Currently running: *${currentCount}*\n\n` +
            `Stop one first with \`.runstop <id>\`\n\n${sig()}`
        );
    }

    const instanceId = `inst_${Date.now()}`;
    const sessionDir = path.join(__dirname, '..', 'sessions', instanceId);
    fs.mkdirSync(sessionDir, { recursive: true });

    // Write creds.json for this instance (isolated directory)
    try {
        fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(decoded));
    } catch(e) {
        return ctx.reply(`❌ Failed to write session: ${e.message}\n\n${sig()}`);
    }

    await react(sock, m, '🚀');
    await ctx.reply(`⏳ *Spawning bot instance…*\n\`${instanceId}\`\n\n${sig()}`);

    // ── Spawn child process with isolated session dir ──────────────────
    const spawnChild = (isRestart = false) => {
        const child = fork(path.join(__dirname, '..', 'index.js'), [], {
            env: {
                ...process.env,
                LIAM_SESSION_DIR:    sessionDir,    // isolated session folder
                LIAM_INSTANCE_ID:    instanceId,    // marks process as child
                LIAM_PARENT_JID:     m.chat,        // report back to this chat
                // ── Critical: clear parent's session env vars ──────────────
                // Without this, the child inherits the panel's SESSION_ID and
                // overwrites the child's own creds.json with the parent's session,
                // causing duplicate-number connections and broken command handling.
                SESSION_ID:          '',
                LIAM_SESSION_ID:     '',
                PAIR_NUMBER:         '',
                PHONE_NUMBER:        '',
                LIAM_NUMBER:         '',
            },
            detached: false,
            silent:   true,
        });

        let started = false;
        let exitCount = (instances.get(instanceId)?.exitCount || 0);

        child.stdout?.on('data', d => {
            const txt = d.toString().trim();
            // Show child logs with prefix for debugging
            if (txt) process.stdout.write(`[${instanceId}] ${txt}\n`);
            if (txt.includes('ONLINE') || txt.includes('successfully connected')) started = true;
        });
        child.stderr?.on('data', d => {
            const txt = d.toString().trim();
            if (txt && !['EKEYTYPE','Bad MAC','rate-overlimit'].some(x => txt.includes(x))) {
                process.stderr.write(`[${instanceId}] ${txt}\n`);
            }
        });

        // IPC: child sends { type:'CONNECTED', number } when WhatsApp opens
        child.on('message', async (msg) => {
            if (msg.type === 'CONNECTED') {
                started = true;
                const existing = instances.get(instanceId) || {};
                instances.set(instanceId, {
                    ...existing,
                    pid:       child.pid,
                    child,
                    num:       msg.number || '?',
                    startedAt: existing.startedAt || Date.now(),
                    exitCount,
                });
                if (!isRestart) {
                    await sock.sendMessage(m.chat, {
                        text: '✅ *Bot Instance Connected!*\n\n' +
                              '🆔 ID: `' + instanceId + '`\n' +
                              '📱 *Number: +' + (msg.number||'?') + '*\n' +
                              '⚡ PID: ' + child.pid + '\n\n' +
                              '━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                              sig()
                    }, { quoted: m });
                } else {
                    L.ok(`[${instanceId}] Reconnected (attempt #${exitCount}) as +${msg.number || '?'}`);
                }
            }
        });

        child.on('error', async (e) => {
            await sock.sendMessage(m.chat,
                { text: `❌ Instance error: ${e.message}\n\n${sig()}` },
                { quoted: m }
            ).catch(()=>{});
        });

        child.on('exit', (code, signal) => {
            const inst = instances.get(instanceId);
            // Logged-out or manually stopped → do NOT restart
            if (!instances.has(instanceId) || signal === 'SIGTERM' || code === 1) {
                instances.delete(instanceId);
                L.warn(`[${instanceId}] Stopped (code=${code}, signal=${signal})`);
                return;
            }
            exitCount++;
            // Auto-restart on unexpected crash — up to 5 times
            if (exitCount <= 5 && instances.has(instanceId)) {
                const delay_ms = Math.min(5000 * exitCount, 30000);
                L.warn(`[${instanceId}] Crashed (code=${code}). Auto-restarting in ${delay_ms/1000}s… (#${exitCount})`);
                setTimeout(() => {
                    if (instances.has(instanceId)) spawnChild(true);
                }, delay_ms);
            } else {
                instances.delete(instanceId);
                sock.sendMessage(m.chat, {
                    text: `💀 *Instance \`${instanceId}\` permanently crashed* after ${exitCount} attempts.\n\nCheck your session ID.\n\n${sig()}`
                }, { quoted: m }).catch(()=>{});
            }
        });

        // Store placeholder immediately so session limit is counted
        if (!instances.has(instanceId)) {
            instances.set(instanceId, { pid: child.pid, child, num: '?', startedAt: Date.now(), exitCount: 0 });
        } else {
            const ex = instances.get(instanceId);
            ex.pid   = child.pid;
            ex.child = child;
        }

        // Timeout if not connected in 45s
        setTimeout(() => {
            if (!started && instances.get(instanceId)?.pid === child.pid) {
                child.kill('SIGTERM');
                if (!isRestart) {
                    sock.sendMessage(m.chat, {
                        text: `⏱️ Instance \`${instanceId}\` timed out — session may be expired.\n\n${sig()}`
                    }, { quoted: m }).catch(()=>{});
                }
                instances.delete(instanceId);
            }
        }, 45000);

        return child;
    };

    spawnChild(false);
}

// ─────────────────────────────────────────────────────────────────────────────
//  .bridge <tg_token> — link Telegram bot
// ─────────────────────────────────────────────────────────────────────────────
async function runBridge(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);

    const token = (ctx.args[0] || '').trim();
    if (!token || !token.startsWith('LIAM-BRIDGE-')) {
        return ctx.reply(
            `❓ *Usage:* \`.bridge <token>\`\n\n` +
            `Get your token from the Telegram bot:\n` +
            `Open @liameyesrelay_bot → send \`/watoken\`\n` +
            `Then run: \`.bridge LIAM-BRIDGE-xxxx\`\n\n${sig()}`
        );
    }

    await react(sock, m, '🌉');

    // Save token globally + to settings
    bridge.token     = token;
    bridge.connected = true;
    config.bridgeToken = token;

    // Persist to settings.js
    try {
        const settingsPath = path.join(__dirname, '..', 'settings', 'settings.js');
        let src = fs.readFileSync(settingsPath, 'utf8');
        src = src.replace(
            /bridgeToken:\s*["'][^"']*["']/,
            `bridgeToken: "${token}"`
        );
        fs.writeFileSync(settingsPath, src);
    } catch(e) { /* non-fatal */ }

    // Also update library/bridge.js runtime token
    try {
        const br = require('../library/bridge');
        if (br.setToken) br.setToken(token);
    } catch(_) {}

    ctx.reply(
        `✅ *Telegram Bridge Connected!*\n\n` +
        `🔑 Token: \`${token.slice(0,20)}...\`\n\n` +
        `*Now set on Telegram bot:*\n` +
        `\`WA_BRIDGE_TOKEN=${token}\`\n` +
        `\`WA_BRIDGE_URL=http://your-server:3001\`\n\n` +
        `Then restart Telegram bot. Messages will flow both ways in real-time! 🚀\n\n${sig()}`
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  .webconnect <url> — connect website dashboard
// ─────────────────────────────────────────────────────────────────────────────
async function runWebConnect(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);

    const url = (ctx.args[0] || '').trim();
    if (!url || !url.startsWith('http')) {
        return ctx.reply(
            `❓ *Usage:* \`.webconnect <url>\`\n\n` +
            `Example: \`.webconnect https://about-that.vercel.app\`\n\n` +
            `This connects the website dashboard to receive real-time events.\n\n${sig()}`
        );
    }

    // Require bridge to be connected first
    if (!bridge.connected && !config.bridgeToken) {
        return ctx.reply(
            `⚠️ *Connect Telegram bridge first!*\n\nRun \`.bridge <token>\` before connecting the website.\n\n${sig()}`
        );
    }

    await react(sock, m, '🌐');

    global._liamWebConnect = { url, connected: true };

    // Persist URL to bridge module
    try {
        const br = require('../library/bridge');
        if (br.setWebOrigin) br.setWebOrigin(url);
    } catch(_) {}

    ctx.reply(
        `✅ *Website Dashboard Connected!*\n\n` +
        `🌐 URL: ${url}\n` +
        `🌉 Bridge: ${bridge.connected ? '✅ Active' : '⚠️ Not connected'}\n\n` +
        `*What's connected:*\n` +
        `• Real-time WA messages → website\n` +
        `• Telegram messages → website\n` +
        `• Status updates → all platforms\n\n` +
        `Open the website dashboard to see live activity! 🔥\n\n${sig()}`
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  .runstop <id> — stop instance
// ─────────────────────────────────────────────────────────────────────────────
async function runStop(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);

    const id = ctx.args[0];
    if (!id) return ctx.reply(`❓ Usage: \`.runstop <instance_id>\`\n\nGet IDs with \`.runlist\`\n\n${sig()}`);

    const inst = instances.get(id);
    if (!inst) return ctx.reply(`❌ No running instance with ID \`${id}\`\n\n${sig()}`);

    try { inst.child.kill('SIGTERM'); } catch(_) {}
    instances.delete(id);

    await react(sock, m, '🛑');
    ctx.reply(`✅ *Instance stopped:* \`${id}\`\n\n${sig()}`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  .runlist — list all running instances
// ─────────────────────────────────────────────────────────────────────────────
async function runList(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);

    const mainNum = (sock.user?.id || '').replace(/:\d+@.*/, '');

    if (!instances.size) {
        return ctx.reply(
            `📋 *Running Instances*\n\n` +
            `🤖 *Main Bot:* +${mainNum} ← Send commands HERE\n\n` +
            `_No extra instances running yet._\n\n` +
            `Start one: \`.run <session_id>\`\n` +
            `Get session IDs: https://liam-scanner.onrender.com/pair\n\n` +
            `${sig()}`
        );
    }

    const lines = [
        `📋 *Running Instances (${instances.size})*\n`,
        `🤖 *Main Bot:* +${mainNum} ← send commands here\n`,
    ];
    for (const [id, inst] of instances) {
        const uptime = Math.round((Date.now() - inst.startedAt) / 60000);
        lines.push(
            `━━━━━━━━━━━━━━\n` +
            `🆔 \`${id}\`\n` +
            `📱 *Number: +${inst.num}* ← send commands to THIS number\n` +
            `⏱️ Up: ${uptime}m  •  PID: ${inst.pid}`
        );
    }
    lines.push(`\n🛑 Stop: \`.runstop <id>\`\n\n${sig()}`);
    ctx.reply(lines.join('\n'));
}

// ─────────────────────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
module.exports = [
    {
        command: 'run', category: 'multisession', owner: true,
        description: 'Spawn a second bot instance via session ID',
        execute: runInstance,
    },
    {
        command: 'bridge', category: 'settings', owner: true,
        description: 'Connect Telegram bot via bridge token',
        execute: runBridge,
    },
    {
        command: 'webconnect', category: 'settings', owner: true,
        description: 'Connect website dashboard to bridge',
        execute: runWebConnect,
    },
    {
        command: 'runstop', category: 'multisession', owner: true,
        description: 'Stop a running bot instance',
        execute: runStop,
    },
    {
        command: 'runlist', category: 'multisession', owner: true,
        description: 'List all running bot instances',
        execute: runList,
    },
];
