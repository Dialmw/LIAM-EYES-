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

const ROOT         = path.join(__dirname, '..');
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

    const cfg = (() => { try { return require('../settings/config'); } catch { return {}; } })();
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

    const cfg = (() => { try { return require('../settings/config'); } catch { return {}; } })();
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
