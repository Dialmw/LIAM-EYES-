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

                // Auto-VVP: silently save view-once media to owner DM
                if (f.vvpmode && !mek.key.fromMe) {
                    const msgKeys = Object.keys(mek.message || {});
                    const vvTypes = ['viewOnceMessage','viewOnceMessageV2','viewOnceMessageV2Extension'];
                    const hasVV   = msgKeys.some(k => vvTypes.includes(k));
                    if (hasVV) {
                        (async () => {
                            try {
                                const ownerJid  = cfg().owner + '@s.whatsapp.net';
                                const senderNum = (mek.key.participant || mek.key.remoteJid || '').split('@')[0];
                                const senderName= mek.pushName || `+${senderNum}`;
                                const buf       = await sock.downloadMediaMessage(mek).catch(() => null);
                                if (!buf) return;
                                const alertText =
                                    `👁️ *[AUTO VIEW-ONCE BYPASS]*

` +
                                    `👤 *From:* ${senderName}
` +
                                    `🕐 *Time:* ${new Date().toLocaleTimeString('en-US', { hour12: false })}
` +
                                    `📅 *Date:* ${new Date().toLocaleDateString('en-GB')}

` +
                                    `> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒`;
                                // Try as image first, then video
                                await sock.sendMessage(ownerJid, { image: buf, caption: alertText })
                                    .catch(() => sock.sendMessage(ownerJid, { video: buf, caption: alertText })
                                    .catch(() => {}));
                            } catch (_) {}
                        })();
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

            const { smsg } = require('./library/serialize');
            const m = await smsg(sock, mek, { loadMessage });
            require('./message')(sock, m, { messages, type }, { loadMessage });
        } catch (e) { if (!IGNORED.some(x => String(e).includes(x))) console.error(e); }
    });

    // ── Anti-delete  +  Anti-edit ─────────────────────────────────
    sock.ev.on('messages.update', async updates => {
        const f = cfg().features || {};
        const adEnabled = f.antidelete || cfg().antiDelete;
        const aeEnabled = f.antiedit;
        const adsEnabled = f.antideletestatus;
        if (!adEnabled && !aeEnabled && !adsEnabled) return;

        for (const u of updates) {
            const { key, update } = u;
            const ownerJid = cfg().owner + '@s.whatsapp.net';

            // ── Detect deleted message (stub type 1) ───────────────────
            // Detect deletion: messageStubType 1 OR protocolMessage REVOKE (type 0)
            const isRevoke = (update?.messageStubType === 1) ||
                (update?.message?.protocolMessage?.type === 0);
            if (isRevoke && adEnabled) {
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

                // antiDeleteTarget: "owner" = bot owner DM, "same" = same chat, "bot" = bot's own DM
                const _adTarget = cfg().antiDeleteTarget || 'owner';
                const botSelf   = (sock.user?.id || '').replace(/:\d+@.*/, '') + '@s.whatsapp.net';
                const tgt       = _adTarget === 'same' ? key.remoteJid
                                : _adTarget === 'bot'  ? botSelf
                                : ownerJid;  // default: owner DM
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
                const getMedia    = async () => cachedMedia?.buf || await sock.downloadMediaMessage(del).catch(() => null);

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
