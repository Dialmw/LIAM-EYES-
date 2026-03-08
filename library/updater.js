// ╔══════════════════════════════════════════════════════════════════╗
// ║  LIAM EYES — Auto Updater (stable, never kills server)          ║
// ╚══════════════════════════════════════════════════════════════════╝
'use strict';

const axios  = require('axios');
const fs     = require('fs');
const path   = require('path');
const { exec, execSync } = require('child_process');
const { promisify } = require('util');
const execP  = promisify(exec);

const ROOT         = path.join(__dirname, '..');
const VERSION_FILE = path.join(ROOT, '.liam_version');
const REPO_API     = 'https://api.github.com/repos/Dialmw/LIAM-EYES-/commits/main';
const REPO_ZIP     = 'https://github.com/Dialmw/LIAM-EYES-/archive/refs/heads/main.zip';
const CHECK_MS     = 4 * 60 * 60 * 1000;
const sig          = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

const isGit = () => {
    try { execSync('git -C "' + ROOT + '" rev-parse HEAD', { stdio:'ignore' }); return true; }
    catch { return false; }
};

const isPm2 = () => {
    try { execSync('pm2 -v', { stdio:'ignore' }); return true; }
    catch { return false; }
};

const isNodemon = () => !!process.env.NODEMON || !!process.env.NODE_APP_INSTANCE;

const getLocalSha = () => {
    try {
        if (fs.existsSync(VERSION_FILE)) return fs.readFileSync(VERSION_FILE,'utf8').trim().slice(0,7);
        if (isGit()) return execSync('git -C "' + ROOT + '" rev-parse HEAD', {encoding:'utf8'}).trim().slice(0,7);
    } catch(_) {}
    return null;
};

const setLocalSha = sha => { try { fs.writeFileSync(VERSION_FILE, sha.slice(0,7)); } catch(_) {} };

const getRemoteSha = async () => {
    const { data } = await axios.get(REPO_API, {
        timeout: 15000,
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'LIAM-EYES-Bot' }
    });
    return {
        sha:     data.sha.slice(0,7),
        fullSha: data.sha,
        msg:     (data.commit?.message || '').split('\n')[0].slice(0,80),
    };
};

const gitPull = async () => {
    const { stdout, stderr } = await execP(`git -C "${ROOT}" pull --rebase origin main 2>&1`);
    return (stdout + stderr).trim().slice(0,300);
};

const zipUpdate = async () => {
    const os_  = require('os');
    const tmpZ = path.join(os_.tmpdir(), 'liam_eyes_upd.zip');
    const tmpD = path.join(os_.tmpdir(), 'liam_eyes_upd_ext');

    const { data } = await axios.get(REPO_ZIP, {
        responseType: 'arraybuffer', timeout: 90000,
        headers: { 'User-Agent': 'LIAM-EYES-Bot' }
    });
    fs.writeFileSync(tmpZ, Buffer.from(data));

    if (fs.existsSync(tmpD)) await execP(`rm -rf "${tmpD}"`).catch(()=>{});
    fs.mkdirSync(tmpD, { recursive: true });
    await execP(`unzip -o "${tmpZ}" -d "${tmpD}" 2>&1`);

    const extracted = fs.readdirSync(tmpD).find(d => /LIAM.EYES/i.test(d));
    if (!extracted) throw new Error('Extracted folder not found');
    const srcDir = path.join(tmpD, extracted);

    const SKIP = new Set(['sessions','settings','.liam_version','README.md','PANEL_SETUP.md','.env']);
    const copyDir = (src, dst) => {
        fs.mkdirSync(dst, { recursive: true });
        for (const item of fs.readdirSync(src)) {
            if (SKIP.has(item)) continue;
            const s = path.join(src,item), d = path.join(dst,item);
            fs.statSync(s).isDirectory() ? copyDir(s,d) : fs.copyFileSync(s,d);
        }
    };
    copyDir(srcDir, ROOT);
    await execP(`rm -rf "${tmpD}" "${tmpZ}"`).catch(()=>{});
    return 'ZIP swapped';
};

const npmInstall = async () => {
    const { stdout } = await execP(`npm install --prefix "${ROOT}" --no-audit --no-fund 2>&1`);
    return stdout.slice(0,100);
};

const gracefulRestart = async (sock, reply, appName) => {
    if (isPm2()) {
        try {
            await execP(`pm2 restart "${appName || 'LIAM-EYES'}" 2>&1`);
            await reply(`✅ *Update done!*\n🔄 pm2 restarting...\n\n${sig()}`);
            return;
        } catch {
            await reply(`✅ *Update done!*\n🔄 Restarting...\n\n${sig()}`);
            setTimeout(() => process.exit(0), 1500);
            return;
        }
    }
    if (isNodemon()) {
        await reply(`✅ *Update done!*\n🔄 Nodemon restarting...\n\n${sig()}`);
        setTimeout(() => process.kill(process.pid, 'SIGUSR2'), 800);
        return;
    }
    // No process manager — keep alive, tell user to restart
    await reply(
        `✅ *Update files applied!*\n\n` +
        `⚠️ *Restart required to activate:*\n` +
        `• pm2: \`pm2 restart LIAM-EYES\`\n` +
        `• Termux: Ctrl+C → \`npm start\`\n` +
        `• Render/Heroku: Redeploy\n\n` +
        `_Bot stays online on old version until restart._\n\n${sig()}`
    );
};

let _lastNotifiedSha = null, _notifyTime = 0, _failCount = 0;

const checkAndNotify = async (sock) => {
    const ownerJid = (sock?.user?.id||'').split(':')[0].split('@')[0] + '@s.whatsapp.net';
    if (!ownerJid || ownerJid === '@s.whatsapp.net') return;
    try {
        const remote   = await getRemoteSha();
        const localSha = getLocalSha();
        _failCount = 0;
        if (localSha && (localSha === remote.sha || remote.fullSha.startsWith(localSha))) return;
        if (_lastNotifiedSha === remote.sha && Date.now() - _notifyTime < 60*60*1000) return;
        _lastNotifiedSha = remote.sha;
        _notifyTime      = Date.now();
        sock.sendMessage(ownerJid, {
            text:
                `🔔 *LIAM EYES Update!*\n\n` +
                `📦 New: \`${remote.sha}\`  Current: \`${localSha||'?'}\`\n` +
                `📝 ${remote.msg}\n\n` +
                `*.update* to auto-update\n\n${sig()}`
        }).catch(()=>{});
        console.log(`[UPDATER] Update ${remote.sha} available`);
    } catch(e) {
        _failCount++;
        console.log(`[UPDATER] Check failed (${_failCount}): ${e.message}`);
        if (_failCount >= 3) {
            _failCount = 0;
            sock.sendMessage(ownerJid, {
                text: `⚠️ *LIAM EYES update check failed 3x*\nManually: \`git pull && npm install\`\n\n${sig()}`
            }).catch(()=>{});
        }
    }
};

const startChecker = (sock) => {
    setTimeout(() => checkAndNotify(sock).catch(()=>{}), 45000);
    setInterval(() => checkAndNotify(sock).catch(()=>{}), CHECK_MS);
};

const doUpdate = async (sock, m, reply) => {
    await reply(`🔍 *Checking GitHub...*\n\n${sig()}`);

    let remote;
    try { remote = await getRemoteSha(); }
    catch(e) { return reply(`❌ *GitHub unreachable*\n${e.message}\n\n${sig()}`); }

    const localSha = getLocalSha();
    if (localSha && (localSha === remote.sha || remote.fullSha.startsWith(localSha)))
        return reply(`✅ *Up to date!* v\`${localSha}\`\n\n${sig()}`);

    await reply(`📦 *Update found!*\nCurrent: \`${localSha||'?'}\` → Latest: \`${remote.sha}\`\n📝 ${remote.msg}\n\n⏳ Downloading...\n\n${sig()}`);

    let method = '', log = '';
    try {
        if (isGit()) { log = await gitPull(); method = 'git'; }
        else throw new Error('not git');
    } catch(gitErr) {
        try { log = await zipUpdate(); method = 'zip'; }
        catch(zipErr) {
            return reply(`❌ *Auto-update failed!*\nGit: ${gitErr.message}\nZIP: ${zipErr.message}\n\nManual: \`git pull && npm install\`\n\n${sig()}`);
        }
    }

    try { await reply(`📦 *Installing deps...*\n\n${sig()}`); await npmInstall(); }
    catch(e) { console.log('[UPDATER] npm non-fatal:', e.message); }

    setLocalSha(remote.sha);
    await gracefulRestart(sock, reply, process.env.PM2_APP_NAME || 'LIAM-EYES');
};

module.exports = { checkAndNotify, startChecker, doUpdate, getLocalSha, getRemoteSha };
