// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — start.js  (never-stop supervisor)                     ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ════════════════════════════════════════════════════════════════════════════
// Run THIS file (npm start). It launches index.js as a child process and keeps
// it running forever:
//   • restarts it whenever it exits, crashes, or is killed by the OS (out of memory)
//   • watches a heartbeat from the bot — if the bot freezes (alive but not
//     responding) it is killed and restarted automatically
//   • sizes Node's memory to the container so small hosts (256 MB) don't get
//     OOM-killed
//   • never gives up: back-off is 2s → 30s, and 5 min after a real WhatsApp
//     logout (so it doesn't hammer WhatsApp with a dead session)
'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

const ENTRY       = process.env.LIAM_ENTRY || path.join(__dirname, 'index.js');
const MIN_DELAY   = 2000;
const MAX_DELAY   = 30000;
const LOGOUT_WAIT = 5 * 60 * 1000;
const STABLE_AFTER = 60000;
const BOOT_GRACE  = Number(process.env.HB_BOOT_MS)    || 90 * 1000;     // time allowed before the first heartbeat
const HB_TIMEOUT  = Number(process.env.HB_TIMEOUT_MS) || 4 * 60 * 1000; // silence longer than this = frozen

function memLimitMB() {
    try {
        for (const p of ['/sys/fs/cgroup/memory.max', '/sys/fs/cgroup/memory/memory.limit_in_bytes']) {
            const v = fs.readFileSync(p, 'utf8').trim(); const n = Number(v) / 1048576;
            if (v && v !== 'max' && n > 32 && n < 65536) return n;
        }
    } catch (_) {}
    return Math.min(os.totalmem() / 1048576, 4096);
}
const heapMB = () => Number(process.env.NODE_HEAP_MB) ||
    Math.max(96, Math.min(1536, Math.floor(memLimitMB() * 0.55)));

let restartDelay = MIN_DELAY;
let restarts = 0;
let shuttingDown = false;
let current = null;

function launch() {
    const startedAt = Date.now();
    let lastBeat = startedAt + BOOT_GRACE;
    console.log(`\x1b[36m[SUPERVISOR]\x1b[0m Starting index.js (restart #${restarts}, heap ${heapMB()}MB of ${Math.round(memLimitMB())}MB)`);

    const child = spawn(process.execPath, [`--max-old-space-size=${heapMB()}`, '--expose-gc', ENTRY], {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        env: process.env,
    });
    current = child;

    child.on('message', msg => { if (msg && msg.type === 'HEARTBEAT') lastBeat = Date.now(); });

    const watchdog = setInterval(() => {
        if (Date.now() - lastBeat > HB_TIMEOUT) {
            console.log(`\x1b[33m[SUPERVISOR]\x1b[0m No heartbeat for ${Math.round((Date.now() - lastBeat) / 1000)}s — bot is frozen, restarting it`);
            try { child.kill('SIGKILL'); } catch (_) {}
        }
    }, 15000);

    child.on('exit', (code, signal) => {
        clearInterval(watchdog);
        current = null;
        if (shuttingDown) return;
        const aliveFor = Date.now() - startedAt;
        console.log(`\x1b[33m[SUPERVISOR]\x1b[0m index.js exited (code=${code}, signal=${signal}) after ${Math.round(aliveFor / 1000)}s`);

        if (code === 3) {                                   // WhatsApp logged this session out
            restartDelay = LOGOUT_WAIT;
            console.log('\x1b[31m[SUPERVISOR]\x1b[0m Session was logged out — re-pair the number. Will retry in 5 min.');
        } else if (aliveFor > STABLE_AFTER) {
            restartDelay = MIN_DELAY;                       // it was stable — restart fast
        } else {
            restartDelay = Math.min(restartDelay * 2, MAX_DELAY);
        }
        restarts++;
        console.log(`\x1b[36m[SUPERVISOR]\x1b[0m Restarting in ${restartDelay / 1000}s...`);
        setTimeout(launch, restartDelay);
    });

    child.on('error', err => {
        console.error('[SUPERVISOR] Failed to spawn index.js:', err.message);
    });
}

// The supervisor itself must never die from a stray error.
process.on('uncaughtException',  e => console.error('[SUPERVISOR] uncaught error (ignored):', e && e.message || e));
process.on('unhandledRejection', e => console.error('[SUPERVISOR] unhandled rejection (ignored):', e && e.message || e));

function shutdown(sig) {
    console.log(`[SUPERVISOR] ${sig} received, shutting down.`);
    shuttingDown = true;
    if (current) { try { current.kill('SIGTERM'); } catch (_) {} setTimeout(() => process.exit(0), 4000); }
    else process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

launch();
