// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — bridge_run.js  (FIXED & ENHANCED)                    ║
// ║  .bridgemenu          — show bridge setup menu (.1 .2 .3)              ║
// ║  .bridge <tg_token>   — connect Telegram bot ↔ WA bot (.1)            ║
// ║  .initiate            — start cross-posting after bridge (.2)          ║
// ║  .webconnect <url>    — connect website dashboard (.3)                 ║
// ║  .tostore             — send replied media to Telegram store           ║
// ║  .run <sessionId>     — spawn a second bot instance                    ║
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

// ── Global state (survives hot-reload via global) ──────────────────────────
if (!global._liamInstances)  global._liamInstances  = new Map();
if (!global._liamBridge)     global._liamBridge     = { token:'', connected:false, connectedAt:null, wsClients:new Set() };
if (!global._liamWebConnect) global._liamWebConnect = { url:'', connected:false };
if (!global._liamInitiate)   global._liamInitiate   = { active:false, platforms:[] };

const instances = global._liamInstances;
const bridge    = global._liamBridge;

// Restore bridgeToken from settings at startup
if (!bridge.token && config.bridgeToken) {
    bridge.token     = config.bridgeToken;
    bridge.connected = !!config.bridgeToken;
}

// ── Token expiry warning — auto-warn owner on day 5 (expires day 6) ───────
function scheduleTokenExpiryWarning(sock, ownerJid, tokenSetAt) {
    const msPerDay = 86400000;
    const warnAt   = tokenSetAt + (5 * msPerDay);
    const delay    = warnAt - Date.now();
    const doWarn   = () => {
        sock.sendMessage(ownerJid, {
            text: `⚠️ *BRIDGE TOKEN EXPIRY WARNING*\n\n` +
                  `Your bridge token expires in less than *24 hours!*\n\n` +
                  `🔑 Token: \`${(bridge.token||'').slice(0,22)}...\`\n\n` +
                  `*Renew now:*\n` +
                  `Open @liameyesrelay_bot → send \`/watoken\`\n` +
                  `Then run: \`.bridge LIAM-BRIDGE-<newtoken>\`\n\n` +
                  `${sig()}`
        }).catch(() => {});
    };
    if (delay <= 0) { doWarn(); }
    else            { setTimeout(doWarn, delay); }
}

// ── SESSION DECODE — accept LIAM:~ format ─────────────────────────────────
function decodeSession(sessionId) {
    const s   = (sessionId || '').trim();
    const b64 = s.replace(/^LIAM:?~/i, '');
    if (!b64 || b64 === s) return null;
    for (const enc of ['base64', 'base64url']) {
        try {
            const obj = JSON.parse(Buffer.from(b64, enc).toString('utf8'));
            if (obj && (obj.noiseKey || obj.signedIdentityKey || obj.me || obj.registered !== undefined))
                return obj;
        } catch { /* try next */ }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  .bridgemenu — show numbered bridge setup menu
// ─────────────────────────────────────────────────────────────────────────────
async function bridgeMenu(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);
    await react(sock, m, '🌉');

    const tgSt  = bridge.connected && bridge.token
        ? `✅ Connected · \`${bridge.token.slice(0,22)}...\``
        : '❌ Not connected';
    const webSt = global._liamWebConnect?.connected
        ? `✅ ${global._liamWebConnect.url}`
        : '❌ Not connected';
    const initSt = global._liamInitiate?.active
        ? `✅ Active`
        : '❌ Not started';

    ctx.reply(
        `╔${'═'.repeat(36)}╗\n` +
        `║   🌉  *LIAM EYES BRIDGE MENU*   👁️   ║\n` +
        `╚${'═'.repeat(36)}╝\n\n` +

        `📌 *Run these steps in order:*\n\n` +

        `*_.1_* 🔵 *.bridge <token>*\n` +
        `   Connect Telegram bot (get token from @liameyesrelay_bot → \`/watoken\`)\n` +
        `   Status: ${tgSt}\n\n` +

        `*_.2_* 🚀 *.initiate*\n` +
        `   Start cross-posting to all platforms\n` +
        `   Posts to: Telegram → WhatsApp Status → Groups → Channels → Website\n` +
        `   Status: ${initSt}\n\n` +

        `*_.3_* 🌐 *.webconnect <url>*\n` +
        `   Connect your website (requires .1 and .2 first)\n` +
        `   Example: \`.webconnect https://yoursite.vercel.app\`\n` +
        `   Status: ${webSt}\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 *Other Commands:*\n` +
        `  • \`.tostore\` — send media to Telegram store channel\n` +
        `  • \`.tostatus\` — post to WhatsApp status\n` +
        `  • \`.togroupstatus\` — broadcast to all WA groups\n` +
        `  • \`.run <sid>\` — spawn extra bot instance\n` +
        `  • \`.runlist\` / \`.runstop <id>\` — manage instances\n\n` +
        `⏰ *Token valid 6 days — auto-warns you on day 5 to renew!*\n\n` +
        `${sig()}`
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  .bridge <tg_token> — link Telegram bot (.1)
// ─────────────────────────────────────────────────────────────────────────────
async function runBridge(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);

    const token = (ctx.args[0] || '').trim();
    if (!token || !token.startsWith('LIAM-BRIDGE-')) {
        return ctx.reply(
            `❓ *Usage:* \`.bridge <token>\`  _(Step .1)_\n\n` +
            `Get token: @liameyesrelay_bot → send \`/watoken\`\n\n` +
            `💡 Run \`.bridgemenu\` for full setup guide.\n\n${sig()}`
        );
    }

    await react(sock, m, '🌉');

    bridge.token       = token;
    bridge.connected   = true;
    bridge.connectedAt = Date.now();
    config.bridgeToken = token;

    // Persist to settings.js
    try {
        const settingsPath = path.join(__dirname, '..', 'settings', 'settings.js');
        let src = fs.readFileSync(settingsPath, 'utf8');
        src = src.replace(/bridgeToken:\s*["'][^"']*["']/, `bridgeToken: "${token}"`);
        fs.writeFileSync(settingsPath, src);
    } catch(e) { /* non-fatal */ }

    try { const br = require('../library/bridge'); if (br.setToken) br.setToken(token); } catch(_) {}

    // Schedule day-5 expiry warning
    const ownerRaw = (sock.user?.id || config.owner || '').split(':')[0].split('@')[0];
    scheduleTokenExpiryWarning(sock, ownerRaw + '@s.whatsapp.net', Date.now());

    ctx.reply(
        `✅ *Telegram Bridge Connected! (.1 ✓)*\n\n` +
        `🔑 Token: \`${token.slice(0,22)}...\`\n\n` +
        `⏰ *Token expires in 6 days* — I'll warn you on day 5 to renew!\n\n` +
        `*Next step (.2):*  Run \`.initiate\` to start cross-posting\n\n` +
        `💡 Run \`.bridgemenu\` to see all steps.\n\n${sig()}`
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  .initiate — start cross-posting after bridge is connected (.2)
// ─────────────────────────────────────────────────────────────────────────────
async function initiatePosting(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);

    if (!bridge.connected || !bridge.token) {
        return ctx.reply(
            `⚠️ *Bridge not connected!*\n\nRun \`.bridge <token>\` first (.1)\n\n💡 Run \`.bridgemenu\` for setup steps.\n\n${sig()}`
        );
    }

    await react(sock, m, '🚀');

    global._liamInitiate = {
        active: true,
        platforms: ['Telegram', 'WA Status', 'WA Groups', 'WA Channels', 'Website'],
        startedAt: Date.now(),
    };

    try { const br = require('../library/bridge'); if (br.setInitiated) br.setInitiated(true); } catch(_) {}

    ctx.reply(
        `🚀 *Cross-Posting INITIATED! (.2 ✓)*\n\n` +
        `Content posting order:\n` +
        `  🔵 *.1* → Telegram (bridge)\n` +
        `  📤 *.2* → WhatsApp Status\n` +
        `  👥 *.2* → WhatsApp Groups\n` +
        `  📣 *.2* → WhatsApp Channels\n` +
        `  🌐 *.3* → Website (via .webconnect)\n\n` +
        `*Commands to post content:*\n` +
        `  • \`.tostatus\` — post to WA status\n` +
        `  • \`.togroupstatus\` — broadcast to all groups\n` +
        `  • \`.tostore\` — send media to TG store\n\n` +
        `*Next step (.3):* Run \`.webconnect <url>\` to add your website\n\n` +
        `${sig()}`
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  .webconnect <url> — connect website dashboard (.3)
// ─────────────────────────────────────────────────────────────────────────────
async function runWebConnect(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);

    const url = (ctx.args[0] || '').trim();
    if (!url || !url.startsWith('http')) {
        return ctx.reply(
            `❓ *Usage:* \`.webconnect <url>\`  _(Step .3)_\n\n` +
            `Example: \`.webconnect https://mysite.vercel.app\`\n\n` +
            `⚠️ Complete steps .1 and .2 first!\n💡 Run \`.bridgemenu\` for guide.\n\n${sig()}`
        );
    }

    if (!bridge.connected && !config.bridgeToken) {
        return ctx.reply(`⚠️ *Connect bridge first (.1)!*\nRun: \`.bridge <token>\`\n\n${sig()}`);
    }
    if (!global._liamInitiate?.active) {
        return ctx.reply(`⚠️ *Run \`.initiate\` first (.2)!*\nOrder: \`.bridge\` → \`.initiate\` → \`.webconnect\`\n\n${sig()}`);
    }

    await react(sock, m, '🌐');
    global._liamWebConnect = { url, connected: true };

    try { const br = require('../library/bridge'); if (br.setWebOrigin) br.setWebOrigin(url); } catch(_) {}

    ctx.reply(
        `✅ *Website Connected! (.3 ✓)*\n\n` +
        `🌐 URL: ${url}\n\n` +
        `*🎉 All 3 steps complete!*\n\n` +
        `Posting order:\n` +
        `  🔵 Telegram (.1) → first\n` +
        `  📤 WA Status/Groups/Channels (.2) → second\n` +
        `  🌐 Website (.3) → third\n\n` +
        `Real-time events now flow to all platforms! 🔥\n\n${sig()}`
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  .tostore — send replied media to Telegram store channel
// ─────────────────────────────────────────────────────────────────────────────
async function toStore(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);

    if (!bridge.connected || !bridge.token) {
        return ctx.reply(`⚠️ *Bridge not connected!*\nRun \`.bridge <token>\` first.\n\n${sig()}`);
    }

    const q = m.quoted;
    if (!q) {
        return ctx.reply(
            `❗ *Reply to media to send it to Telegram store!*\n\n` +
            `Usage: Reply to image/video/audio + \`.tostore <optional caption>\`\n\n${sig()}`
        );
    }

    await react(sock, m, '📦');

    const caption = ctx.text || q.text || q.body || '👁️ LIAM EYES Store';
    const mime    = (q.msg || q)?.mimetype || '';
    const msgType = Object.keys(q.message || {})[0] || '';

    try {
        const buf = await sock.downloadMediaMessage(q).catch(() => null);
        if (!buf) {
            await react(sock, m, '❌');
            return ctx.reply(`❌ Failed to download media.\n\n${sig()}`);
        }

        // Get Telegram credentials
        let tgToken = process.env.TELEGRAM_BOT_TOKEN || '';
        let chatId  = process.env.TELEGRAM_STORE_CHAT || process.env.TELEGRAM_CHAT_ID || '';

        try {
            const br = require('../library/bridge');
            if (br.getTgToken)    tgToken = br.getTgToken()  || tgToken;
            if (br.getStoreChatId) chatId  = br.getStoreChatId() || chatId;
        } catch(_) {}

        if (!tgToken || !chatId) {
            await react(sock, m, '⚠️');
            return ctx.reply(
                `⚠️ *Telegram store not configured!*\n\n` +
                `Set these environment variables:\n` +
                `  \`TELEGRAM_BOT_TOKEN=<bot_token>\`\n` +
                `  \`TELEGRAM_STORE_CHAT=<channel_id>\`\n\n` +
                `Then restart the bot.\n\n${sig()}`
            );
        }

        const FormData = require('form-data');
        const axios_   = require('axios');
        const form     = new FormData();
        form.append('chat_id', chatId);
        form.append('caption', `${caption}\n\n👁️ LIAM EYES Store`);

        let endpoint;
        if (mime.includes('image') || msgType === 'imageMessage') {
            form.append('photo',    buf, { filename:'media.jpg', contentType:'image/jpeg' });
            endpoint = `https://api.telegram.org/bot${tgToken}/sendPhoto`;
        } else if (mime.includes('video') || msgType === 'videoMessage') {
            form.append('video',    buf, { filename:'media.mp4', contentType:'video/mp4' });
            endpoint = `https://api.telegram.org/bot${tgToken}/sendVideo`;
        } else if (mime.includes('audio') || msgType === 'audioMessage') {
            form.append('audio',    buf, { filename:'media.mp3', contentType:'audio/mpeg' });
            endpoint = `https://api.telegram.org/bot${tgToken}/sendAudio`;
        } else {
            form.append('document', buf, { filename:'media.bin' });
            endpoint = `https://api.telegram.org/bot${tgToken}/sendDocument`;
        }

        const resp = await axios_.post(endpoint, form, { headers: form.getHeaders(), timeout: 30000 });

        if (resp.data?.ok) {
            await react(sock, m, '✅');
            ctx.reply(`✅ *Sent to Telegram Store!*\n\n📦 Caption: ${caption}\n\n${sig()}`);
        } else {
            throw new Error(resp.data?.description || 'Telegram API error');
        }
    } catch(e) {
        await react(sock, m, '❌');
        ctx.reply(`❌ *Failed:* ${e.message}\n\n${sig()}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  .run <sessionId> — spawn a second fully functional bot instance
// ─────────────────────────────────────────────────────────────────────────────
async function runInstance(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);
    const raw = ctx.args[0] || ctx.text;
    if (!raw) return ctx.reply(`❓ *Usage:* \`.run <session_id>\`\n\nGet session: https://liam-scanner.onrender.com/pair\n\n${sig()}`);

    const decoded = decodeSession(raw);
    if (!decoded) return ctx.reply(`❌ *Invalid session format.*\nExpected: \`LIAM:~...\`\n\nGet one at: https://liam-scanner.onrender.com/pair\n\n${sig()}`);

    const mainNum  = (sock.user?.id || '').replace(/:\d+@.*/, '');
    const childNum = (decoded?.me?.id || decoded?.me?.phone || '').replace(/:\d+@.*/, '').replace('@s.whatsapp.net', '');
    if (childNum && mainNum && childNum === mainNum)
        return ctx.reply(`❌ *Cannot run the same number twice!*\n\nThis session belongs to *+${mainNum}* — same as main bot.\n\nPair a DIFFERENT number.\n\n${sig()}`);

    const auth         = require('../library/auth');
    const senderNum    = (ctx.senderNum || '').replace(/\D/g,'');
    const maxSessions  = auth.getSessionLimit(senderNum, config.sessionLimits?.default || 3);
    if (instances.size >= maxSessions)
        return ctx.reply(`🚫 *Session limit reached* (max ${maxSessions})\n\nStop one: \`.runstop <id>\`\n\n${sig()}`);

    const instanceId = `inst_${Date.now()}`;
    const sessionDir = path.join(__dirname, '..', 'sessions', instanceId);
    fs.mkdirSync(sessionDir, { recursive: true });

    try { fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(decoded)); }
    catch(e) { return ctx.reply(`❌ Failed to write session: ${e.message}\n\n${sig()}`); }

    await react(sock, m, '🚀');
    await ctx.reply(`⏳ *Spawning bot instance…*\n\`${instanceId}\`\n\n${sig()}`);

    const spawnChild = (isRestart = false) => {
        const child = fork(path.join(__dirname, '..', 'index.js'), [], {
            env: { ...process.env, LIAM_SESSION_DIR:sessionDir, LIAM_INSTANCE_ID:instanceId, LIAM_PARENT_JID:m.chat,
                   SESSION_ID:'', LIAM_SESSION_ID:'', PAIR_NUMBER:'', PHONE_NUMBER:'', LIAM_NUMBER:'' },
            detached: false, silent: true,
        });
        let started = false, exitCount = (instances.get(instanceId)?.exitCount || 0);

        child.stdout?.on('data', d => { const t = d.toString().trim(); if(t) process.stdout.write(`[${instanceId}] ${t}\n`); if(t.includes('ONLINE')||t.includes('connected')) started=true; });
        child.stderr?.on('data', d => { const t = d.toString().trim(); if(t&&!['EKEYTYPE','Bad MAC','rate-overlimit'].some(x=>t.includes(x))) process.stderr.write(`[${instanceId}] ${t}\n`); });

        child.on('message', async msg => {
            if (msg.type === 'CONNECTED') {
                started = true;
                const ex = instances.get(instanceId)||{};
                instances.set(instanceId, { ...ex, pid:child.pid, child, num:msg.number||'?', startedAt:ex.startedAt||Date.now(), exitCount });
                if (!isRestart) {
                    await sock.sendMessage(m.chat, {
                        text:`✅ *Bot Instance Connected!*\n\n🆔 ID: \`${instanceId}\`\n📱 *Number: +${msg.number||'?'}*\n⚡ PID: ${child.pid}\n\n${sig()}`
                    }, { quoted:m });
                }
            }
        });

        child.on('error', async e => { await sock.sendMessage(m.chat,{text:`❌ Instance error: ${e.message}\n\n${sig()}`},{quoted:m}).catch(()=>{}); });

        child.on('exit', (code, signal) => {
            if (!instances.has(instanceId) || signal==='SIGTERM' || code===1) { instances.delete(instanceId); return; }
            exitCount++;
            if (exitCount <= 5 && instances.has(instanceId)) setTimeout(() => { if(instances.has(instanceId)) spawnChild(true); }, Math.min(5000*exitCount,30000));
            else { instances.delete(instanceId); sock.sendMessage(m.chat,{text:`💀 Instance \`${instanceId}\` crashed after ${exitCount} attempts.\n\n${sig()}`},{quoted:m}).catch(()=>{}); }
        });

        if (!instances.has(instanceId)) instances.set(instanceId, { pid:child.pid, child, num:'?', startedAt:Date.now(), exitCount:0 });
        else { const ex=instances.get(instanceId); ex.pid=child.pid; ex.child=child; }

        setTimeout(() => {
            if (!started && instances.get(instanceId)?.pid===child.pid) {
                child.kill('SIGTERM');
                if (!isRestart) sock.sendMessage(m.chat,{text:`⏱️ Instance \`${instanceId}\` timed out — session may be expired.\n\n${sig()}`},{quoted:m}).catch(()=>{});
                instances.delete(instanceId);
            }
        }, 45000);

        return child;
    };
    spawnChild(false);
}

// ─────────────────────────────────────────────────────────────────────────────
//  .runstop / .runlist
// ─────────────────────────────────────────────────────────────────────────────
async function runStop(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);
    const id = ctx.args[0];
    if (!id) return ctx.reply(`❓ Usage: \`.runstop <id>\`  Get IDs with \`.runlist\`\n\n${sig()}`);
    const inst = instances.get(id);
    if (!inst) return ctx.reply(`❌ No instance with ID \`${id}\`\n\n${sig()}`);
    try { inst.child.kill('SIGTERM'); } catch(_) {}
    instances.delete(id);
    await react(sock, m, '🛑');
    ctx.reply(`✅ *Stopped:* \`${id}\`\n\n${sig()}`);
}

async function runList(sock, m, ctx) {
    if (!ctx.isCreator) return ctx.reply(config.message.owner);
    const mainNum = (sock.user?.id || '').replace(/:\d+@.*/, '');
    if (!instances.size) return ctx.reply(`📋 *No extra instances running*\n\n🤖 Main: +${mainNum}\n\nStart one: \`.run <session_id>\`\n\n${sig()}`);
    const lines = [`📋 *Instances (${instances.size})*\n🤖 Main: +${mainNum}\n`];
    for (const [id, inst] of instances) {
        const up = Math.round((Date.now()-inst.startedAt)/60000);
        lines.push(`━━━━━━━━━━━━━━\n🆔 \`${id}\`\n📱 +${inst.num}  •  ⏱️ ${up}m  •  PID ${inst.pid}`);
    }
    lines.push(`\n🛑 Stop: \`.runstop <id>\`\n\n${sig()}`);
    ctx.reply(lines.join('\n'));
}

// ─────────────────────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
module.exports = [
    { command:'bridgemenu', category:'settings',     owner:true, description:'Show bridge setup menu (.1 .2 .3)',              execute:bridgeMenu      },
    { command:'bridge',     category:'settings',     owner:true, description:'Connect Telegram bot via bridge token (.1)',     execute:runBridge       },
    { command:'initiate',   category:'settings',     owner:true, description:'Start cross-posting after bridge (.2)',          execute:initiatePosting },
    { command:'webconnect', category:'settings',     owner:true, description:'Connect website dashboard (.3)',                 execute:runWebConnect   },
    { command:'tostore',    category:'settings',     owner:true, description:'Send replied media to Telegram store channel',  execute:toStore         },
    { command:'run',        category:'multisession', owner:true, description:'Spawn a second bot instance',                   execute:runInstance     },
    { command:'runstop',    category:'multisession', owner:true, description:'Stop a running bot instance',                   execute:runStop         },
    { command:'runlist',    category:'multisession', owner:true, description:'List all running bot instances',                execute:runList         },
];
