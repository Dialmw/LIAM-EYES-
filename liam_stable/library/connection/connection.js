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
