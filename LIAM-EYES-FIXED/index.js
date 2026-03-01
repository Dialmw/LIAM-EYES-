// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// LIAM EYES Bot — index.js
console.clear();

const fs       = require('fs');
const path     = require('path');
const pino     = require('pino');
const chalk    = require('chalk');
const readline = require('readline');
const FileType = require('file-type');
const { Boom } = require('@hapi/boom');
const os       = require('os');

const cfg  = () => require('./settings/config');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Suppress noise ──────────────────────────────────────────────
const IGNORED = ['Socket connection timeout','EKEYTYPE','item-not-found',
    'rate-overlimit','Connection Closed','Timed Out','Value not found','Bad MAC',
    'unexpected server response','write EPIPE','read ECONNRESET'];
process.on('uncaughtException',  e => { if (!IGNORED.some(x => String(e).includes(x))) console.error(e); });
process.on('unhandledRejection', e => { if (!IGNORED.some(x => String(e).includes(x))) {} });
const _ce = console.error;
console.error = (m, ...a) => { if (typeof m === 'string' && IGNORED.some(x => m.includes(x))) return; _ce(m, ...a); };

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
    console.log(chalk.hex(green)('  ◈') + chalk.bold(' Pair Site : ') + chalk.hex('#74b9ff').underline('https://liam-pannel.onrender.com/pair'));
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
        console.log(chalk.hex('#00ff88').bold('[LIAM-EYES] Booting LIAM EYES...'));
        for (const [label, delay_ms] of steps) {
            await sleep(delay_ms);
            console.log(chalk.hex('#00ff88').bold('[LIAM-EYES]') + chalk.white(' ✔ ' + label));
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
const clientstart = async () => {
    banner();

    // ── Detect session source before boot display ──────────────
    const _envSid = process.env.SESSION_ID || process.env.LIAM_SESSION_ID || '';
    const _envNum = process.env.PAIR_NUMBER || process.env.PHONE_NUMBER || '';
    const _cfgSid = cfg().sessionId || '';
    const _hasCreds = require('fs').existsSync('./sessions/main/creds.json');

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

    const sessionDir = './sessions/main';
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    // ── Restore from settings.js sessionId ──────────────────────
    const sid = cfg().sessionId;
    if (sid && sid !== 'LIAM:~paste_your_session_id_here') {
        const cp = path.join(sessionDir, 'creds.json');
        if (!fs.existsSync(cp)) {
            try {
                fs.writeFileSync(cp, Buffer.from(sid.replace(/^LIAM:~/, ''), 'base64'));
                console.log(chalk.hex('#00ff88').bold('[LIAM-EYES]') + chalk.white(' Session saved from Base64'));
            } catch (e) { L.warn('Session restore failed: ' + e.message); }
        }
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version }          = await fetchLatestBaileysVersion();

    // ── SESSION SETUP — shown only if NOT already registered ────
    let pairNum = null;

    if (!state.creds.registered) {
        // ═══════════════════════════════════════════════════════════════════
        //  STARTUP PRIORITY ORDER:
        //  1. SESSION_ID  env var  → restore creds from base64
        //  2. PAIR_NUMBER env var  → auto request pairing code (panel use)
        //  3. settings.js sessionId already decoded above → already handled
        //  4. LIAM_NUMBER env var  → same as PAIR_NUMBER (alias)
        //  5. Interactive console  → show 2-option menu (local / panel)
        // ═══════════════════════════════════════════════════════════════════

        const envSid = (process.env.SESSION_ID || process.env.LIAM_SESSION_ID || '').trim();
        const envNum = (process.env.PAIR_NUMBER || process.env.PHONE_NUMBER || process.env.LIAM_NUMBER || '').trim();

        if (envSid && envSid.startsWith('LIAM:~')) {
            // ── Option A: SESSION_ID env var ─────────────────────
            console.log(chalk.hex('#00ff88').bold('[LIAM-EYES]') + chalk.white(' Restoring session... Please wait...'));
            const cp = path.join(sessionDir, 'creds.json');
            try {
                fs.writeFileSync(cp, Buffer.from(envSid.replace(/^LIAM:~/, ''), 'base64'));
                console.log(chalk.hex('#00ff88').bold('[LIAM-EYES]') + chalk.white(' Session saved  from Base64'));
                return clientstart();
            } catch (e) {
                L.err('Failed to restore session: ' + e.message);
                process.exit(1);
            }

        } else if (envNum) {
            // ── Option B: PAIR_NUMBER env var ────────────────────
            pairNum = envNum.replace(/\D/g, '');
            if (!pairNum || pairNum.length < 7) {
                L.err('PAIR_NUMBER is invalid — use full number with country code e.g. 254712345678');
                process.exit(1);
            }
            console.log(chalk.hex('#00ff88').bold('[LIAM-EYES]') + chalk.white(' Connecting...'));

        } else {
            // ── Option C: Interactive 2-option menu ──────────────
            // Works on panel (env var input) AND local terminal (stdin).
            // Shows the choice box, then waits for LIAM_CHOICE env var OR
            // stdin input (whichever comes first within 90 seconds).
            console.log('');
            console.log(chalk.hex('#00d4ff').bold('  ╔══════════════════════════════════════════════════════╗'));
            console.log(chalk.hex('#00d4ff').bold('  ║') + chalk.bgHex('#00d4ff').black.bold(' 🔐  LIAM EYES — SESSION SETUP                        ') + chalk.hex('#00d4ff').bold('║'));
            console.log(chalk.hex('#00d4ff').bold('  ╠══════════════════════════════════════════════════════╣'));
            console.log(chalk.hex('#00d4ff').bold('  ║') + chalk.hex('#74b9ff')('  [ 1 ]  Enter phone number → get pairing code        ') + chalk.hex('#00d4ff').bold('║'));
            console.log(chalk.hex('#00d4ff').bold('  ║') + chalk.hex('#a29bfe')('  [ 2 ]  Paste Session ID   → connect instantly        ') + chalk.hex('#00d4ff').bold('║'));
            console.log(chalk.hex('#00d4ff').bold('  ╠══════════════════════════════════════════════════════╣'));
            console.log(chalk.hex('#00d4ff').bold('  ║') + chalk.hex('#636e72')('  Panel users: set env var then Restart:              ') + chalk.hex('#00d4ff').bold('║'));
            console.log(chalk.hex('#00d4ff').bold('  ║') + chalk.hex('#fdcb6e')('    PAIR_NUMBER = 254712345678                         ') + chalk.hex('#00d4ff').bold('║'));
            console.log(chalk.hex('#00d4ff').bold('  ║') + chalk.hex('#636e72')('    — OR —                                            ') + chalk.hex('#00d4ff').bold('║'));
            console.log(chalk.hex('#00d4ff').bold('  ║') + chalk.hex('#fdcb6e')('    SESSION_ID  = LIAM:~xxxxxxxxxxxxx                  ') + chalk.hex('#00d4ff').bold('║'));
            console.log(chalk.hex('#00d4ff').bold('  ║') + chalk.hex('#636e72')('  Get session: https://liam-pannel.onrender.com/pair   ') + chalk.hex('#00d4ff').bold('║'));
            console.log(chalk.hex('#00d4ff').bold('  ╚══════════════════════════════════════════════════════╝'));
            console.log('');

            // Try stdin input (works in real local terminal)
            const choice = await Promise.race([
                // Listen on stdin for 90 seconds
                new Promise(res => {
                    if (!process.stdin.readable) return res('');
                    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                    rl.question(chalk.hex('#fdcb6e').bold('  ▣ Enter choice [ 1 or 2 ] ➜  '), ans => {
                        rl.close(); res((ans || '').trim());
                    });
                    setTimeout(() => { try { rl.close(); } catch(_){} res(''); }, 90000);
                }),
                // Also poll env vars in case panel user sets them while running
                new Promise(res => {
                    const poll = setInterval(() => {
                        const s = (process.env.SESSION_ID || '').trim();
                        const n = (process.env.PAIR_NUMBER || process.env.LIAM_NUMBER || '').trim();
                        if (s.startsWith('LIAM:~')) { clearInterval(poll); res('env_sid:' + s); }
                        if (n.replace(/\D/g,'').length >= 7) { clearInterval(poll); res('env_num:' + n); }
                    }, 2000);
                    setTimeout(() => { clearInterval(poll); res(''); }, 90000);
                }),
            ]);

            if (choice.startsWith('env_sid:')) {
                // Panel set SESSION_ID while we were waiting
                const sid2 = choice.replace('env_sid:', '');
                const cp = path.join(sessionDir, 'creds.json');
                fs.writeFileSync(cp, Buffer.from(sid2.replace(/^LIAM:~/, ''), 'base64'));
                console.log(chalk.hex('#00ff88').bold('[LIAM-EYES]') + chalk.white(' Session saved  from Base64'));
                return clientstart();

            } else if (choice.startsWith('env_num:')) {
                pairNum = choice.replace('env_num:', '').replace(/\D/g, '');
                console.log(chalk.hex('#00ff88').bold('[LIAM-EYES]') + chalk.white(' Connecting...'));

            } else if (choice === '1') {
                // User typed 1 — ask for phone number
                console.log('');
                console.log(chalk.hex('#74b9ff')('  Enter phone number with country code (no + or spaces):'));
                console.log(chalk.hex('#636e72')('  Example: 254712345678   2348012345678   12025550000'));
                console.log('');
                const numInput = await new Promise(res => {
                    const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
                    rl2.question(chalk.hex('#fdcb6e').bold('  ▣ Phone Number ➜  '), ans => { rl2.close(); res((ans||'').trim()); });
                    setTimeout(() => { try { rl2.close(); } catch(_){} res(''); }, 60000);
                });
                pairNum = numInput.replace(/\D/g, '');
                if (!pairNum || pairNum.length < 7) {
                    L.err('Invalid number. Restart and try again.');
                    process.exit(1);
                }
                console.log(chalk.hex('#00ff88').bold('[LIAM-EYES]') + chalk.white(' Connecting...'));

            } else if (choice === '2') {
                // User typed 2 — ask for session ID
                console.log('');
                console.log(chalk.hex('#a29bfe')('  Paste your LIAM:~ session ID and press Enter:'));
                console.log('');
                const sidInput = await new Promise(res => {
                    const rl3 = readline.createInterface({ input: process.stdin, output: process.stdout });
                    rl3.question(chalk.hex('#fdcb6e').bold('  ▣ Session ID ➜  '), ans => { rl3.close(); res((ans||'').trim()); });
                    setTimeout(() => { try { rl3.close(); } catch(_){} res(''); }, 120000);
                });
                if (!sidInput || !sidInput.startsWith('LIAM:~')) {
                    L.err('Invalid session ID — must start with LIAM:~. Restart.');
                    process.exit(1);
                }
                const cp = path.join(sessionDir, 'creds.json');
                try {
                    fs.writeFileSync(cp, Buffer.from(sidInput.replace(/^LIAM:~/, ''), 'base64'));
                    console.log(chalk.hex('#00ff88').bold('[LIAM-EYES]') + chalk.white(' Session saved  from Base64'));
                } catch (e) { L.err('Save failed: ' + e.message); process.exit(1); }
                return clientstart();

            } else {
                // Timeout or empty — show instructions and exit
                console.log('');
                console.log(chalk.hex('#ffcc00').bold('[LIAM-EYES] ⚠  No input received. Set env vars and Restart:'));
                console.log(chalk.white('  PAIR_NUMBER = 254712345678   (to pair a number)'));
                console.log(chalk.white('  SESSION_ID  = LIAM:~xxx      (to use saved session)'));
                console.log(chalk.hex('#636e72')('  Get session: https://liam-pannel.onrender.com/pair'));
                console.log('');
                await sleep(5000);
                process.exit(0);
            }
        }
    }

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
        connectTimeoutMs:               60000,
        keepAliveIntervalMs:            5000,
        defaultQueryTimeoutMs:          10000,
        retryRequestDelayMs:            100,
    });

    // ── Store ───────────────────────────────────────────────────
    const msgs       = new Map();
    const nameCache  = new Map(); // phone → pushName
    const mediaCache = new Map(); // cacheKey → { buf, type }
    const vvpCache   = new Map(); // cacheKey → { buf, type, senderName, senderNum, ts }

    // Normalise JID: strip :N device suffix so lookups are consistent
    const normJid = j => (j || '').replace(/:\d+(?=@)/, '');

    const loadMessage = async (jid, id) => {
        return msgs.get(`${normJid(jid)}:${id}`)
            || msgs.get(`${jid}:${id}`)
            || null;
    };

    // ── Unwrap message object through all wrappers ───────────────
    const unwrapMsg = (msgObj) => {
        if (!msgObj) return {};
        const wrappers = [
            'ephemeralMessage','viewOnceMessage','viewOnceMessageV2',
            'viewOnceMessageV2Extension','documentWithCaptionMessage',
        ];
        let m = msgObj;
        for (const w of wrappers) {
            if (m[w]) m = m[w].message || m[w];
        }
        return m;
    };

    // ── Download media from a message object ─────────────────────
    const dlMedia = async (msgObj) => {
        const mediaTypes = ['imageMessage','videoMessage','audioMessage','stickerMessage','documentMessage'];
        const mimeMap    = {
            imageMessage:'image', videoMessage:'video',
            audioMessage:'audio', stickerMessage:'sticker', documentMessage:'document',
        };
        for (const mt of mediaTypes) {
            if (!msgObj[mt]) continue;
            try {
                const stream = await downloadContentFromMessage(msgObj[mt], mimeMap[mt]);
                let buf = Buffer.from([]);
                for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
                if (buf.length > 100) return { buf, type: mt };
            } catch (_) {}
        }
        return null;
    };

    // ── Pre-cache media for anti-delete (runs on every message) ──
    const preCacheMedia = async (mek) => {
        try {
            const cacheKey = `${normJid(mek.key.remoteJid)}:${mek.key.id}`;
            if (mediaCache.has(cacheKey)) return;
            const unwrapped = unwrapMsg(mek.message || {});
            const result    = await dlMedia(unwrapped);
            if (result) {
                mediaCache.set(cacheKey, result);
                if (mediaCache.size > 400) mediaCache.delete(mediaCache.keys().next().value);
            }
        } catch (_) {}
    };

    // ── Pre-cache VIEW ONCE media immediately on arrival ─────────
    const preCacheViewOnce = async (mek) => {
        try {
            const msgObj  = mek.message || {};
            const vvTypes = ['viewOnceMessage','viewOnceMessageV2','viewOnceMessageV2Extension'];
            const hasVV   = vvTypes.some(t => msgObj[t]);
            if (!hasVV) return;

            const cacheKey  = `${normJid(mek.key.remoteJid)}:${mek.key.id}`;
            if (vvpCache.has(cacheKey)) return;

            const senderNum  = normJid(mek.key.participant || mek.key.remoteJid || '').split('@')[0];
            const senderName = mek.pushName || `+${senderNum}`;

            const unwrapped = unwrapMsg(msgObj);
            const result    = await dlMedia(unwrapped);
            if (result) {
                vvpCache.set(cacheKey, { ...result, senderName, senderNum, ts: Date.now() });
                if (vvpCache.size > 100) vvpCache.delete(vvpCache.keys().next().value);
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
            console.log(chalk.hex('#00d4ff').bold('[LIAM-EYES]') + chalk.cyan(' Connecting...'));
        }

        if (connection === 'open') {
            console.log(chalk.hex('#00ff88').bold('[LIAM-EYES]') + chalk.white(' Connected'));
            const rawNum = (sock.user?.id || '').replace(/:\d+@.*/, '');
            const jid    = rawNum + '@s.whatsapp.net';
            const name   = sock.user?.name || 'User';
            const mem    = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

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
            L.err(`Disconnected — code ${code} (reconnect #${STATS.reconnects})`);
            if (code !== DisconnectReason.loggedOut) {
                L.warn('Reconnecting in 3s…');
                setTimeout(clientstart, 3000);
            } else {
                L.err('Logged out. Delete sessions/main/ and restart.');
                process.exit(1);
            }
        }
    });

    // ── Messages ─────────────────────────────────────────────────
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
            STATS.messagesIn++;
            const mek = messages[0];
            if (!mek?.message) return;

            if (Object.keys(mek.message)[0] === 'ephemeralMessage')
                mek.message = mek.message.ephemeralMessage.message;

            if (mek.key?.remoteJid && mek.key?.id) {
                // Store with normalised JID so anti-delete lookups always match
                const nJid = normJid(mek.key.remoteJid);
                msgs.set(`${nJid}:${mek.key.id}`, mek);
                msgs.set(`${mek.key.remoteJid}:${mek.key.id}`, mek); // also store raw JID as fallback

                // Cache sender pushName
                if (mek.pushName) {
                    const sNum = normJid(mek.key.participant || mek.key.remoteJid || '').split('@')[0];
                    if (sNum) nameCache.set(sNum, mek.pushName);
                }

                const f = cfg().features || {};

                // Always pre-cache media (needed for anti-delete to forward media)
                preCacheMedia(mek).catch(() => {});

                // Pre-cache view-once immediately (before WA marks it read)
                if (!mek.key.fromMe) preCacheViewOnce(mek).catch(() => {});

                // Auto-VVP mode: forward view-once to owner DM automatically
                if (f.vvpmode && !mek.key.fromMe) {
                    const msgKeys = Object.keys(mek.message || {});
                    const vvTypes = ['viewOnceMessage','viewOnceMessageV2','viewOnceMessageV2Extension'];
                    if (msgKeys.some(k => vvTypes.includes(k))) {
                        setTimeout(async () => {
                            try {
                                const cacheKey  = `${nJid}:${mek.key.id}`;
                                const cached    = vvpCache.get(cacheKey);
                                if (!cached) return;
                                const ownerJid  = normJid(cfg().owner) + '@s.whatsapp.net';
                                const alertText = `👁️ *[AUTO VVP — View Once]*

👤 *From:* ${cached.senderName}
🕐 ${new Date().toLocaleTimeString('en-US', { hour12: false })} • ${new Date().toLocaleDateString('en-GB')}

> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`;
                                if (cached.type === 'videoMessage') {
                                    await sock.sendMessage(ownerJid, { video: cached.buf, caption: alertText }).catch(() => {});
                                } else {
                                    await sock.sendMessage(ownerJid, { image: cached.buf, caption: alertText }).catch(() => {});
                                }
                            } catch (_) {}
                        }, 2000); // slight delay to ensure pre-cache completes
                    }
                }
            }

            if (mek.key?.remoteJid === 'status@broadcast') {
                const f = cfg().features || {};
                const ownerJid = cfg().owner + '@s.whatsapp.net';
                const num = mek.key.participant?.split('@')[0] || '?';

                // Auto-read/view status — mark as seen so the contact sees their status was viewed
                if (f.autoviewstatus) {
                    // Read the status message to mark it as viewed
                    sock.readMessages([mek.key]).catch(() => {});
                    // Also send a read receipt to the status broadcaster
                    const statusJid = mek.key.participant || mek.key.remoteJid;
                    if (statusJid) {
                        sock.sendReadReceipt('status@broadcast', statusJid, [mek.key.id]).catch(() => {});
                    }
                }

                // Auto-react to status — react with random emoji
                if (f.autoreactstatus) {
                    const pool = cfg().statusReactEmojis || ['😍','🔥','💯','😘','🤩','❤️','👀','✨','🎯'];
                    const emoji = pool[~~(Math.random()*pool.length)];
                    const statusJid = mek.key.participant || mek.key.remoteJid;
                    // Try both methods for compatibility
                    sock.sendMessage('status@broadcast',
                        { react: { text: emoji, key: mek.key } },
                        { statusJidList: [statusJid].filter(Boolean) }
                    ).catch(() => {
                        // Fallback: send reaction directly
                        if (statusJid) {
                            sock.sendMessage(statusJid,
                                { react: { text: emoji, key: mek.key } }
                            ).catch(() => {});
                        }
                    });
                }

                // Cache status with ALL key formats so deletion lookup always hits
                const statusParticipant = mek.key.participant || mek.key.remoteJid || '';
                const normSP = normJid(statusParticipant);
                const sNum_  = normSP.split('@')[0];
                // Store under every possible key format
                msgs.set(`status:${mek.key.id}:${statusParticipant}`, mek);
                msgs.set(`status:${mek.key.id}:${normSP}`, mek);
                msgs.set(`status:${mek.key.id}:${sNum_}`, mek);
                msgs.set(`status@broadcast:${mek.key.id}`, mek);
                msgs.set(`${mek.key.remoteJid}:${mek.key.id}`, mek);
                // Cache sender name
                if (sNum_) {
                    const name_ = mek.pushName || nameCache.get(sNum_);
                    if (name_) nameCache.set(sNum_, name_);
                }
                // Pre-cache status media immediately for anti-delete
                preCacheMedia(mek).catch(() => {});

                // Forward status content to owner DM (when autosavestatus OR antideletestatus enabled)
                if (f.autosavestatus || f.autoviewstatus || f.antideletestatus) {
                    const msgType = Object.keys(mek.message || {})[0];
                    const caption = `📸 *[Status from +${num}]*`;
                    try {
                        const name_  = mek.pushName || nameCache.get(num) || `+${num}`;
                        const ts_    = mek.messageTimestamp ? new Date(mek.messageTimestamp * 1000) : new Date();
                        const hh     = String(ts_.getHours()).padStart(2,'0');
                        const mn     = String(ts_.getMinutes()).padStart(2,'0');
                        const cap2   = `📸 *Status from ${name_}* (+${num})\n🕐 ${hh}:${mn}\n\n> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`;
                        if (msgType === 'imageMessage' || msgType === 'videoMessage' || msgType === 'audioMessage' || msgType === 'stickerMessage') {
                            const res = await dlMedia(mek.message || {});
                            if (res && res.buf) {
                                if (res.type === 'videoMessage') sock.sendMessage(ownerJid, { video: res.buf, caption: cap2 }).catch(() => {});
                                else if (res.type === 'audioMessage') sock.sendMessage(ownerJid, { audio: res.buf, mimetype: 'audio/mp4', ptt: false, caption: cap2 }).catch(() => {});
                                else if (res.type === 'stickerMessage') { sock.sendMessage(ownerJid, { text: cap2 }).catch(() => {}); sock.sendMessage(ownerJid, { sticker: res.buf }).catch(() => {}); }
                                else sock.sendMessage(ownerJid, { image: res.buf, caption: cap2 }).catch(() => {});
                            }
                        } else if (msgType === 'conversation' || msgType === 'extendedTextMessage') {
                            const txt = mek.message.conversation || mek.message.extendedTextMessage?.text || '';
                            if (txt) sock.sendMessage(ownerJid, { text: `${cap2}\n\n💬 _"${txt}"_` }).catch(() => {});
                        }
                    } catch (_) {}
                }
                return;
            }

            if (!sock.public && !mek.key.fromMe && type === 'notify') return;

            const { smsg } = require('./library/serialize');
            const m = await smsg(sock, mek, { loadMessage });
            require('./message')(sock, m, { messages, type }, { loadMessage });
        } catch (e) { if (!IGNORED.some(x => String(e).includes(x))) console.error(e); }
    });

    // ── Anti-delete  +  Anti-edit ─────────────────────────────────
    sock.ev.on('messages.update', async updates => {
        const f          = cfg().features || {};
        const adEnabled  = f.antidelete  || cfg().antiDelete;
        const aeEnabled  = f.antiedit;
        const adsEnabled = f.antideletestatus;
        if (!adEnabled && !aeEnabled && !adsEnabled) return;

        // Native date formatter — no moment-timezone needed
        const fmtTime = (ts) => {
            const d = new Date(ts || Date.now());
            const hh = String(d.getHours()).padStart(2,'0');
            const mm = String(d.getMinutes()).padStart(2,'0');
            const dd = String(d.getDate()).padStart(2,'0');
            const mo = String(d.getMonth()+1).padStart(2,'0');
            const yy = d.getFullYear();
            return { time: `${hh}:${mm}`, date: `${dd}/${mo}/${yy}` };
        };
        const ownerNum = normJid(cfg().owner || (sock.user?.id || '').split(':')[0]);
        const ownerJid = ownerNum + '@s.whatsapp.net';
        const botSelf  = normJid(sock.user?.id || '') + '@s.whatsapp.net';
        const _adTgt   = cfg().antiDeleteTarget || 'owner';

        // Resolve media from cache or live download
        const resolveMedia = async (del, cacheKey) => {
            for (const ck of [cacheKey, normJid(cacheKey.split(':')[0]) + ':' + cacheKey.split(':').slice(1).join(':')]) {
                const c = mediaCache.get(ck);
                if (c && c.buf && c.buf.length > 100) return c;
            }
            return await dlMedia(unwrapMsg(del.message || {}));
        };

        // Send alert header + deleted content to target
        const sendAlert = async (tgt, del, header, cacheKey) => {
            const raw   = unwrapMsg(del.message || {});
            const mtype = Object.keys(raw)[0] || '';
            if (mtype === 'conversation' || mtype === 'extendedTextMessage') {
                const txt = raw.conversation || raw.extendedTextMessage?.text || '';
                const hdr = await sock.sendMessage(tgt, { text: header }).catch(() => null);
                if (hdr) sock.sendMessage(tgt, { text: txt ? `\ud83d\udcac _"${txt}"_` : '_[No text content]_' }, { quoted: hdr }).catch(() => {});
            } else if (mtype === 'imageMessage') {
                const res = await resolveMedia(del, cacheKey);
                const cap = raw.imageMessage?.caption || '';
                if (res && res.buf) await sock.sendMessage(tgt, { image: res.buf, caption: header + (cap ? `\n\n\ud83d\udcdd _"${cap}"_` : '') }).catch(() => {});
                else sock.sendMessage(tgt, { text: header + '\n\n\ud83d\uddbc\ufe0f _[Image — could not retrieve]_' }).catch(() => {});
            } else if (mtype === 'videoMessage') {
                const res = await resolveMedia(del, cacheKey);
                const cap = raw.videoMessage?.caption || '';
                if (res && res.buf) await sock.sendMessage(tgt, { video: res.buf, caption: header + (cap ? `\n\n\ud83d\udcdd _"${cap}"_` : '') }).catch(() => {});
                else sock.sendMessage(tgt, { text: header + '\n\n\ud83c\udfa5 _[Video — could not retrieve]_' }).catch(() => {});
            } else if (mtype === 'audioMessage') {
                const res = await resolveMedia(del, cacheKey);
                const hdr = await sock.sendMessage(tgt, { text: header + '\n\n\ud83c\udfb5 _[Voice/Audio]_' }).catch(() => null);
                if (res && res.buf && hdr) sock.sendMessage(tgt, { audio: res.buf, mimetype: 'audio/mp4', ptt: !!raw.audioMessage?.ptt }, { quoted: hdr }).catch(() => {});
            } else if (mtype === 'stickerMessage') {
                const res = await resolveMedia(del, cacheKey);
                const hdr = await sock.sendMessage(tgt, { text: header + '\n\n\ud83c\udfad _[Sticker]_' }).catch(() => null);
                if (res && res.buf && hdr) sock.sendMessage(tgt, { sticker: res.buf }, { quoted: hdr }).catch(() => {});
            } else if (mtype === 'documentMessage') {
                const fname = raw.documentMessage?.fileName || 'document';
                sock.sendMessage(tgt, { text: header + `\n\n\ud83d\udcce _[Document: ${fname}]_` }).catch(() => {});
            } else if (mtype && mtype !== 'reactionMessage' && mtype !== 'protocolMessage') {
                sock.sendMessage(tgt, { text: header + `\n\n\ud83d\udce6 _[${mtype}]_` }).catch(() => {});
            }
        };

        for (const u of updates) {
            const { key, update } = u;
            const protoMsg = update?.message?.protocolMessage;
            const isProto  = protoMsg?.type === 0;
            const isStub   = update?.messageStubType === 1;
            const isRevoke = isProto || isStub;
            if (!isRevoke && !update?.editedMessage) continue;

            // The key of the ACTUALLY deleted message (not the revoke wrapper)
            const delKey = (isProto && protoMsg?.key) ? protoMsg.key : key;

            if (isRevoke && (adEnabled || adsEnabled)) {
                const isStatus = delKey.remoteJid === 'status@broadcast'
                              || key.remoteJid    === 'status@broadcast';

                // ── DELETED STATUS ────────────────────────────────────
                if (isStatus && adsEnabled) {
                    const msgId = delKey.id || key.id || '';
                    const part  = delKey.participant || key.participant || delKey.remoteJid || '';
                    const normP = normJid(part);
                    const sNum  = normP.split('@')[0];
                    const tryKeys = [
                        `status:${msgId}:${part}`,
                        `status:${msgId}:${normP}`,
                        `status:${msgId}:${sNum}`,
                        `status@broadcast:${msgId}`,
                        `${delKey.remoteJid}:${msgId}`,
                        `${key.remoteJid}:${msgId}`,
                    ];
                    let del = null;
                    for (const sk of tryKeys) { del = msgs.get(sk); if (del && del.message) break; }
                    if (!del || !del.message) continue;

                    const name  = del.pushName || nameCache.get(sNum) || `+${sNum}`;
                    const _fmted = fmtTime(del.messageTimestamp ? del.messageTimestamp * 1000 : Date.now());
                    const header =
                        `\ud83d\udea8 *DELETED STATUS!* \ud83d\udea8\n\n` +
                        `\ud83d\udc64 *AUTHOR:* ${name}\n` +
                        `\ud83d\udcf1 *NUMBER:* +${sNum}\n` +
                        `\ud83d\udd50 *TIME:* ${_fmted.time}\n` +
                        `\ud83d\udcc5 *DATE:* ${_fmted.date}\n\n` +
                        `\ud83d\uddd1\ufe0f _This status was deleted!_`;
                    await sendAlert(ownerJid, del, header, `status@broadcast:${msgId}`).catch(() => {});
                    continue;
                }

                if (!adEnabled) continue;

                // ── DELETED DM / GROUP MESSAGE ────────────────────────
                const nDelJid = normJid(delKey.remoteJid || '');
                const nEvJid  = normJid(key.remoteJid    || '');
                const msgId   = delKey.id || key.id || '';
                const tryKeys = [
                    `${nDelJid}:${msgId}`,
                    `${delKey.remoteJid}:${msgId}`,
                    `${nEvJid}:${msgId}`,
                    `${key.remoteJid}:${msgId}`,
                ];
                let del = null;
                for (const dk of tryKeys) { del = msgs.get(dk); if (del && del.message) break; }
                if (!del || !del.message) continue;
                if (del.key && del.key.fromMe && (delKey.fromMe || key.fromMe)) continue;

                const tgt = _adTgt === 'same' ? (key.remoteJid || ownerJid)
                          : _adTgt === 'bot'  ? botSelf
                          : ownerJid;

                const deleterJid = key.participant || key.remoteJid || '';
                const delNum     = normJid(deleterJid).split('@')[0];
                const senderJid  = (del.key && (del.key.participant || del.key.remoteJid)) || '';
                const sendNum    = normJid(senderJid).split('@')[0];
                const senderName = del.pushName || nameCache.get(sendNum) || `+${sendNum}`;
                const delName    = delNum === sendNum ? senderName : (nameCache.get(delNum) || `+${delNum}`);
                const _fmted     = fmtTime(del.messageTimestamp ? del.messageTimestamp * 1000 : Date.now());
                const chatType   = (key.remoteJid || '').endsWith('@g.us') ? '\ud83d\udc65 *Group*' : '\ud83d\udcac *DM*';

                const header =
                    `\ud83d\udea8 *DELETED MESSAGE!* \ud83d\udea8\n\n` +
                    `\ud83d\udc64 *FROM:* ${senderName}\n` +
                    `\ud83d\uddd1\ufe0f *DELETED BY:* ${delName}\n` +
                    `\ud83d\udccd ${chatType}\n` +
                    `\ud83d\udd50 *TIME:* ${_fmted.time}\n` +
                    `\ud83d\udcc5 *DATE:* ${_fmted.date}`;

                await sendAlert(tgt, del, header, `${nDelJid}:${msgId}`).catch(() => {});
            }

            // ── Edited message ────────────────────────────────────────
            if (aeEnabled && update && update.editedMessage) {
                const editedText = (update.editedMessage.conversation)
                                || (update.editedMessage.extendedTextMessage && update.editedMessage.extendedTextMessage.text) || '';
                const orig = msgs.get(`${normJid(key.remoteJid)}:${key.id}`) || msgs.get(`${key.remoteJid}:${key.id}`);
                const origText = (orig && orig.message && (orig.message.conversation || (orig.message.extendedTextMessage && orig.message.extendedTextMessage.text))) || '';
                const num = normJid(key.participant || key.remoteJid || '').split('@')[0];
                if (editedText) {
                    sock.sendMessage(ownerJid, {
                        text: `\u270f\ufe0f *EDITED MESSAGE*\n\n\ud83d\udc64 +${num}\n\n\u274c *Before:* ${origText || '_[unknown]_'}\n\n\u2705 *After:* ${editedText}\n\n> \ud83d\udc41\ufe0f \uD835\uDC0B\uD835\uDC08\uD835\uDC00\uD835\uDC0C \uD835\uDC04\uD835\uDC18\uD835\uDC04\uD835\uDC12`
                    }).catch(() => {});
                }
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
                const ownerJid = cfg().owner + '@s.whatsapp.net';
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

    // ── Helpers ───────────────────────────────────────────────────
    sock.public = cfg().status?.public ?? true;

    // Expose vvpCache so plugins (.vvp command) can read from it
    sock._vvpCache = vvpCache;

    sock.downloadMediaMessage = async msg => {
        const mime   = (msg.msg || msg).mimetype || '';
        const type   = msg.mtype ? msg.mtype.replace(/Message/gi,'') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(msg, type);
        let buf = Buffer.from([]);
        for await (const c of stream) buf = Buffer.concat([buf, c]);
        return buf;
    };

    const { getBuffer } = require('./library/function');
    const { videoToWebp, writeExifImg, writeExifVid, addExif } = require('./library/exif');

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

let _f = require.resolve(__filename);
require('fs').watchFile(_f, () => { delete require.cache[_f]; });
