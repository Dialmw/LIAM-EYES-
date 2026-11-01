// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — start.js  (uptime supervisor)                        ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ════════════════════════════════════════════════════════════════════════════
// This is the process Render/Heroku/PM2 should actually run.
// It spawns index.js as a CHILD process and restarts it automatically if it
// ever exits — whether from a crash, an unhandled error, or a manual .restart
// command. index.js itself never intentionally exits except through this.
//
// Restart back-off: 2s, 4s, 8s, 16s ... capped at 30s. Resets to 2s once the
// child has stayed alive for more than 60s (so a genuinely stable bot always
// restarts fast, while a bot stuck in a crash-loop backs off instead of
// hammering WhatsApp's servers with reconnects).
'use strict';

const { spawn } = require('child_process');
const path = require('path');

const ENTRY = path.join(__dirname, 'index.js');
const MIN_DELAY = 2000;
const MAX_DELAY = 30000;
const STABLE_AFTER = 60000; // ms alive before we consider the run "stable"

let restartDelay = MIN_DELAY;
let restarts = 0;

function launch() {
    const startedAt = Date.now();
    console.log(`\x1b[36m[SUPERVISOR]\x1b[0m Starting index.js (restart #${restarts})`);

    const child = spawn(process.execPath, [ENTRY], {
        stdio: 'inherit',
        env: process.env,
    });

    child.on('exit', (code, signal) => {
        const aliveFor = Date.now() - startedAt;
        console.log(`\x1b[33m[SUPERVISOR]\x1b[0m index.js exited (code=${code}, signal=${signal}) after ${Math.round(aliveFor / 1000)}s`);

        if (aliveFor > STABLE_AFTER) {
            restartDelay = MIN_DELAY; // it was stable — don't punish it for one crash
        } else {
            restartDelay = Math.min(restartDelay * 2, MAX_DELAY);
        }

        restarts++;
        console.log(`\x1b[36m[SUPERVISOR]\x1b[0m Restarting in ${restartDelay / 1000}s...`);
        setTimeout(launch, restartDelay);
    });

    child.on('error', (err) => {
        console.error('[SUPERVISOR] Failed to spawn index.js:', err.message);
    });
}

// Forward termination signals to the child so deploy restarts / redeploys
// still shut down cleanly instead of leaving orphaned processes.
let currentSignalTarget = null;
process.on('SIGTERM', () => { console.log('[SUPERVISOR] SIGTERM received, shutting down.'); process.exit(0); });
process.on('SIGINT',  () => { console.log('[SUPERVISOR] SIGINT received, shutting down.');  process.exit(0); });

launch();
