// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — OWNER CONTROLS  (~44 commands)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const { exec } = require('child_process');
const config = require('../settings/config');
const { encrypt } = require('../library/liam');

const sig     = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react   = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});
const OW      = ctx => ctx.isCreator;
const ownerErr= '👑 This command is for the bot owner only!\n\n' + sig();
const getTmp  = ext => path.join(os.tmpdir(), `liam_${Date.now()}${ext}`);
const sleep   = ms => new Promise(r => setTimeout(r, ms));
const fixJid  = j  => (j||'').replace(/:\d+@/g,'@');

// ── Warn system (in-memory) ────────────────────────────────────────────────
const warnStore = new Map(); // jid → count
const getWarn = jid => warnStore.get(jid) || 0;
const addWarn = jid => { warnStore.set(jid, (warnStore.get(jid)||0)+1); return warnStore.get(jid); };
const resetWarn = jid => warnStore.set(jid, 0);

// ── AZA store (auto-reply) ─────────────────────────────────────────────────
const azaStore = new Map(); // keyword → reply text

module.exports = [

// ─────────────────────────────────────────────────────────────────────────────
//  .owner — show owner contact card
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'owner', category: 'owner',
    execute: async (sock, m, { reply }) => {
        const num = config.owner || '';
        await sock.sendMessage(m.chat, {
            contacts: {
                displayName: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 Owner',
                contacts: [{ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:LIAM EYES Owner\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD` }]
            }
        }, { quoted: m });
        reply(`👑 *Bot Owner*\n\n📞 +${num}\n👁️ LIAM EYES Alpha\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .block / .unblock — block/unblock a user
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'block', category: 'owner', owner: true,
    execute: async (sock, m, { reply, isCreator, quoted }) => {
        if (!isCreator) return reply(ownerErr);
        const jid = fixJid(quoted?.sender || m.quoted?.sender || '');
        if (!jid) return reply('❗ Reply to a message from the user to block.\n\n' + sig());
        await react(sock, m, '🚫');
        await sock.updateBlockStatus(jid, 'block').catch(() => {});
        reply(`🚫 *Blocked* @${jid.split('@')[0]}\n\n${sig()}`);
    }
},
{
    command: 'unblock', category: 'owner', owner: true,
    execute: async (sock, m, { args, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        const num = args[0]?.replace(/\D/g,'');
        if (!num) return reply('❗ Usage: *.unblock <number>*\n\n' + sig());
        const jid = num + '@s.whatsapp.net';
        await sock.updateBlockStatus(jid, 'unblock').catch(() => {});
        await react(sock, m, '✅');
        reply(`✅ *Unblocked* @${num}\n\n${sig()}`);
    }
},
{
    command: 'unblockall', category: 'owner', owner: true,
    execute: async (sock, m, { reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        await react(sock, m, '⏳');
        try {
            const blocked = await sock.fetchBlocklist();
            for (const jid of blocked) {
                await sock.updateBlockStatus(jid, 'unblock').catch(()=>{});
                await sleep(800);
            }
            reply(`✅ *Unblocked ${blocked.length} users*\n\n${sig()}`);
        } catch(e) { reply('❌ ' + e.message); }
    }
},
{
    command: 'listblocked', category: 'owner', owner: true,
    execute: async (sock, m, { reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        try {
            const list = await sock.fetchBlocklist();
            if (!list.length) return reply('📋 *No blocked users*\n\n' + sig());
            reply(`🚫 *Blocked Users (${list.length})*\n\n${list.map((j,i)=>`${i+1}. +${j.split('@')[0]}`).join('\n')}\n\n${sig()}`);
        } catch(e) { reply('❌ ' + e.message); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .join / .leave — join/leave groups
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'join', category: 'owner', owner: true,
    execute: async (sock, m, { args, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        const link = args[0];
        if (!link) return reply('❗ Usage: *.join <invite_link>*\n\n' + sig());
        const code = link.split('/').pop();
        try {
            await react(sock, m, '🔗');
            await sock.groupAcceptInvite(code);
            reply(`✅ *Joined group!*\n\n${sig()}`);
        } catch(e) { reply(`❌ Join failed: ${e.message}\n\n${sig()}`); }
    }
},
{
    command: 'leave', category: 'owner', owner: true,
    execute: async (sock, m, { args, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        const gid = args[0] || (m.isGroup ? m.chat : '');
        if (!gid) return reply('❗ Use in group or: *.leave <groupId>*\n\n' + sig());
        try {
            await react(sock, m, '👋');
            await sock.groupLeave(gid);
            reply(`✅ Left group!\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .delete — delete a replied-to message
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'delete', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, quoted, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const q = m.quoted;
        if (!q) return reply('❗ Reply to a message to delete it.\n\n' + sig());
        await sock.sendMessage(m.chat, { delete: q.key }).catch(() => {});
        await react(sock, m, '🗑️');
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .setbio — change bot's WhatsApp bio/about
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'setbio', category: 'owner', owner: true,
    execute: async (sock, m, { text, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        if (!text) return reply('❗ Usage: *.setbio <text>*\n\n' + sig());
        try {
            await sock.updateProfileStatus(text);
            await react(sock, m, '✅');
            reply(`✅ *Bio updated!*\n\n_"${text}"_\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .setprofilepic — change bot's WhatsApp profile picture
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'setprofilepic', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('image')) return reply('❗ Reply to an image.\n\n' + sig());
        try {
            await react(sock, m, '🖼️');
            const buf = await sock.downloadMediaMessage(q.msg || q);
            await sock.updateProfilePicture(sock.user.id, buf);
            await react(sock, m, '✅');
            reply(`✅ *Profile picture updated!*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .getpp — get profile picture of a user
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'getpp', category: 'tools',
    execute: async (sock, m, { args, reply, quoted, sender }) => {
        const jid = args[0]?.includes('@')
            ? args[0]
            : args[0]?.replace(/\D/g,'') ? args[0].replace(/\D/g,'') + '@s.whatsapp.net'
            : fixJid(m.quoted?.sender || sender);
        try {
            await react(sock, m, '🖼️');
            const url = await sock.profilePictureUrl(jid, 'image');
            await sock.sendMessage(m.chat, {
                image: { url }, caption: `🖼️ *Profile Picture*\n👤 @${jid.split('@')[0]}\n\n${sig()}`,
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch(e) { reply(`❌ No profile pic found\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .ppprivacy / .lastseen / .readreceipts / .online — WA privacy settings
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'ppprivacy', category: 'owner', owner: true,
    execute: async (sock, m, { args, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        const val = args[0] || 'contacts';
        const valid = ['all','contacts','contact_blacklist','none'];
        if (!valid.includes(val)) return reply(`❗ Options: ${valid.join(', ')}\n\nUsage: *.ppprivacy contacts*\n\n${sig()}`);
        try {
            await sock.updateProfilePicturePrivacy(val);
            await react(sock, m, '✅');
            reply(`✅ *Profile pic visibility → ${val}*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},
{
    command: 'lastseen', category: 'owner', owner: true,
    execute: async (sock, m, { args, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        const val = args[0] || 'contacts';
        try {
            await sock.updateLastSeenPrivacy(val);
            await react(sock, m, '✅');
            reply(`✅ *Last Seen → ${val}*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},
{
    command: 'readreceipts', category: 'owner', owner: true,
    execute: async (sock, m, { args, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        const val = args[0] || 'all';
        try {
            await sock.updateReadReceiptsPrivacy(val);
            await react(sock, m, '✅');
            reply(`✅ *Read Receipts → ${val}*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},
{
    command: 'online', category: 'owner', owner: true,
    execute: async (sock, m, { args, isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const on = (args[0] || 'toggle') !== 'off';
        await sock.sendPresenceUpdate(on ? 'available' : 'unavailable').catch(()=>{});
        config.features.alwaysonline = on;
        await react(sock, m, on ? '🟢' : '🔴');
        reply(`${on ? '🟢' : '🔴'} *Always Online → ${on ? 'ON' : 'OFF'}*\n\n${sig()}`);
    }
},
{
    command: 'gcaddprivacy', category: 'owner', owner: true,
    execute: async (sock, m, { args, reply, isCreator }) => {
        if (!isCreator) return reply(ownerErr);
        const val = args[0] || 'contacts';
        try {
            await sock.updateGroupsAddPrivacy(val);
            await react(sock, m, '✅');
            reply(`✅ *Group Add Privacy → ${val}*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .disk — disk usage info
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'disk', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        exec('df -h /', (err, stdout) => {
            const lines = stdout?.trim().split('\n');
            const info  = lines?.[1]?.split(/\s+/) || [];
            reply(
                `💾 *Disk Usage*\n\n` +
                `Total:  ${info[1]||'N/A'}\n` +
                `Used:   ${info[2]||'N/A'} (${info[4]||'?'})\n` +
                `Free:   ${info[3]||'N/A'}\n\n${sig()}`
            );
        });
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .hostip — get server public IP
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'hostip', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        try {
            const { data } = await axios.get('https://api.ipify.org?format=json', { timeout: 6000 });
            const loc = await axios.get(`https://ipapi.co/${data.ip}/json/`, { timeout: 6000 });
            reply(
                `🌐 *Server Info*\n\n` +
                `🔹 IP: \`${data.ip}\`\n` +
                `🔹 Country: ${loc.data?.country_name || 'N/A'}\n` +
                `🔹 City: ${loc.data?.city || 'N/A'}\n` +
                `🔹 ISP: ${loc.data?.org || 'N/A'}\n` +
                `🔹 Platform: ${os.platform()} ${os.arch()}\n` +
                `🔹 Node: ${process.version}\n\n${sig()}`
            );
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .groupid — get current group JID
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'groupid', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        if (!m.isGroup) return reply('❗ Use in a group.\n\n' + sig());
        reply(`📋 *Group ID*\n\n\`${m.chat}\`\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .listgroups — list all groups bot is in
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'listgroups', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        try {
            const allChats = Object.keys(sock.store?.chats?.all?.() || {});
            const groups   = allChats.filter(j => j.endsWith('@g.us'));
            if (!groups.length) return reply('📋 Not in any groups yet.\n\n' + sig());
            const lines = [];
            for (const g of groups.slice(0, 30)) {
                const meta = await sock.groupMetadata(g).catch(() => null);
                if (meta) lines.push(`▸ ${meta.subject} (${meta.participants.length} members)`);
            }
            reply(`👥 *Groups (${groups.length})*\n\n${lines.join('\n')}\n\n${sig()}`);
        } catch(e) { reply('❌ ' + e.message); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .react — react to a message
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'react', category: 'owner', owner: true,
    execute: async (sock, m, { args, isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const emoji = args[0];
        if (!emoji) return reply('❗ Usage: *.react <emoji>* (reply to a message)\n\n' + sig());
        const target = m.quoted || m;
        await sock.sendMessage(m.chat, { react: { text: emoji, key: target.key } }).catch(() => {});
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .warn / .listwarn / .resetwarn — warn system
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'warn', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, text, reply, quoted, groupAdmins, isBotAdmins }) => {
        if (!isCreator) return reply(ownerErr);
        const jid = fixJid(m.quoted?.sender || '');
        if (!jid) return reply('❗ Reply to a user\'s message.\n\n' + sig());
        const num = addWarn(jid);
        const limit = config.warnLimit || 3;
        await react(sock, m, '⚠️');
        const reason = text || 'No reason given';
        let msg = `⚠️ *Warning ${num}/${limit}*\n\n👤 @${jid.split('@')[0]}\n📝 Reason: ${reason}\n\n`;
        if (num >= limit) {
            msg += '🔴 *LIMIT REACHED — Taking action!*';
            if (m.isGroup && isBotAdmins) {
                await sock.groupParticipantsUpdate(m.chat, [jid], 'remove').catch(()=>{});
            }
            resetWarn(jid);
        } else {
            msg += `_${limit - num} warning(s) left before action_`;
        }
        msg += `\n\n${sig()}`;
        await sock.sendMessage(m.chat, { text: msg, mentions: [jid] }, { quoted: m });
    }
},
{
    command: 'warnlist', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        if (!warnStore.size) return reply('📋 *No active warnings*\n\n' + sig());
        const lines = [...warnStore.entries()].map(([j,c]) => `👤 @${j.split('@')[0]} — ⚠️ ${c} warn(s)`);
        reply(`⚠️ *Active Warnings*\n\n${lines.join('\n')}\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .restart — restart the bot
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'restart', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        await react(sock, m, '🔄');
        await reply(`🔄 *Restarting LIAM EYES...*\n\nBe back in a moment!\n\n${sig()}`);
        await sleep(2000);
        process.exit(0);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .update — check for updates
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'update', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        try {
            const { data } = await axios.get('https://api.github.com/repos/Dialmw/LIAM-EYES-/commits/main', { timeout: 10000 });
            const sha = data?.sha?.slice(0,7) || 'unknown';
            const msg = data?.commit?.message || 'No message';
            const date = data?.commit?.committer?.date?.split('T')[0] || 'N/A';
            reply(
                `🔄 *Latest GitHub Commit*\n\n` +
                `🔹 SHA: \`${sha}\`\n` +
                `🔹 Date: ${date}\n` +
                `🔹 Message: ${msg}\n\n` +
                `📌 ${config.github}\n\n${sig()}`
            );
        } catch(e) { reply(`❌ Could not check GitHub: ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .repo — show bot repository info
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'repo', category: 'owner',
    execute: async (sock, m, { reply }) => {
        const gh = config.github || 'https://github.com/Dialmw/LIAM-EYES-';
        let latestSha = '', latestMsg = '', latestDate = '', stars = 0, forks = 0;
        try {
            const { default: nodeFetch } = await import('node-fetch');
            const [commitRes, repoRes] = await Promise.all([
                nodeFetch(`https://api.github.com/repos/Dialmw/LIAM-EYES-/commits/main`,
                    { headers: { 'User-Agent': 'LIAM-EYES' }, signal: AbortSignal.timeout(8000) }),
                nodeFetch(`https://api.github.com/repos/Dialmw/LIAM-EYES-`,
                    { headers: { 'User-Agent': 'LIAM-EYES' }, signal: AbortSignal.timeout(8000) }),
            ]);
            if (commitRes.ok) {
                const d = await commitRes.json();
                latestSha  = d?.sha?.slice(0,7) || '';
                latestMsg  = d?.commit?.message?.split('\n')[0] || '';
                latestDate = d?.commit?.committer?.date?.split('T')[0] || '';
            }
            if (repoRes.ok) {
                const r = await repoRes.json();
                stars = r?.stargazers_count || 0;
                forks = r?.forks_count || 0;
            }
        } catch (_) {}

        reply(
            `🐙 *LIAM EYES — Repository*\n\n` +
            `📦 *Repo:* ${gh}\n` +
            (latestSha  ? `🔹 *Latest commit:* \`${latestSha}\` — ${latestMsg}\n` : '') +
            (latestDate ? `📅 *Date:* ${latestDate}\n` : '') +
            (stars      ? `⭐ *Stars:* ${stars}   🍴 *Forks:* ${forks}\n` : '') +
            `\n` +
            `📌 *How to deploy:*\n` +
            `1️⃣ Fork the repo on GitHub\n` +
            `2️⃣ Get your Session ID from: ${config.pairingSite}\n` +
            `3️⃣ Add SESSION_ID env var on Render/panel\n` +
            `4️⃣ Deploy and enjoy 🚀\n\n` +
            `${sig()}`
        );
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .deljunk / .cleartemp — clear temp files
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'deljunk', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const tmpDir = os.tmpdir();
        let count = 0;
        try {
            const files = fs.readdirSync(tmpDir).filter(f => f.startsWith('liam_'));
            files.forEach(f => {
                try { fs.unlinkSync(path.join(tmpDir, f)); count++; } catch(_) {}
            });
            await react(sock, m, '🗑️');
            reply(`🗑️ *Cleaned ${count} temp files*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .modestatus — toggle public/private mode
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'modestatus', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply, args }) => {
        if (!isCreator) return reply(ownerErr);
        const mode = (args[0] || (sock.public ? 'private' : 'public')).toLowerCase();
        if (!['public','private'].includes(mode)) return reply('❗ Usage: *.modestatus public/private*\n\n' + sig());
        sock.public = mode === 'public';
        await react(sock, m, mode === 'public' ? '🌍' : '🔒');
        reply(`${mode === 'public' ? '🌍' : '🔒'} *Mode → ${mode.toUpperCase()}*\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .toviewonce — convert media to view-once
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'toviewonce', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const q = m.quoted;
        if (!q) return reply('❗ Reply to a media message.\n\n' + sig());
        const mime = (q.msg || q).mimetype || '';
        try {
            await react(sock, m, '👁️');
            const buf = await sock.downloadMediaMessage(q.msg || q);
            if (mime.includes('image')) {
                await sock.sendMessage(m.chat, { image: buf, viewOnce: true, caption: '' }, { quoted: m });
            } else if (mime.includes('video')) {
                await sock.sendMessage(m.chat, { video: buf, viewOnce: true, caption: '' }, { quoted: m });
            } else if (mime.includes('audio')) {
                await sock.sendMessage(m.chat, { audio: buf, viewOnce: true, mimetype: 'audio/mp4' }, { quoted: m });
            } else {
                return reply('❌ Unsupported media type.\n\n' + sig());
            }
            await react(sock, m, '✅');
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .vv2 — reveal view-once media (alias)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'vv2', category: 'owner',
    execute: async (sock, m, { reply }) => {
        const q = m.quoted;
        if (!q) return reply('❗ Reply to a view-once message.\n\n' + sig());
        const mime = (q.msg || q).mimetype || '';
        try {
            await react(sock, m, '👁️');
            const buf = await sock.downloadMediaMessage(q.msg || q);
            if (mime.includes('video'))
                await sock.sendMessage(m.chat, { video: buf, caption: '👁️ View-Once Revealed\n\n' + sig() }, { quoted: m });
            else if (mime.includes('audio'))
                await sock.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mp4' }, { quoted: m });
            else
                await sock.sendMessage(m.chat, { image: buf, caption: '👁️ View-Once Revealed\n\n' + sig() }, { quoted: m });
            await react(sock, m, '✅');
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .dlvo — download view-once from link
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'dlvo', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const q = m.quoted;
        if (!q) return reply('❗ Reply to a view-once message.\n\n' + sig());
        try {
            await react(sock, m, '⬇️');
            const buf = await sock.downloadMediaMessage(q.msg || q);
            const mime = (q.msg || q).mimetype || '';
            if (mime.includes('video'))
                await sock.sendMessage(m.chat, { video: buf, caption: '📥 Downloaded\n\n' + sig() }, { quoted: m });
            else if (mime.includes('audio'))
                await sock.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mp4' }, { quoted: m });
            else
                await sock.sendMessage(m.chat, { image: buf, caption: '📥 Downloaded\n\n' + sig() }, { quoted: m });
            await react(sock, m, '✅');
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .broadcast — send message to all private chats
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'broadcast', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, text, reply }) => {
        if (!isCreator) return reply(ownerErr);
        if (!text) return reply('❗ Usage: *.broadcast <message>*\n\n' + sig());
        await react(sock, m, '📣');
        try {
            const chats = Object.keys(sock.store?.chats?.all?.() || {}).filter(j => j.endsWith('@s.whatsapp.net'));
            let sent = 0;
            for (const jid of chats.slice(0, 50)) {
                try {
                    await sock.sendMessage(jid, { text: `📣 *LIAM EYES Broadcast*\n\n${text}\n\n${sig()}` });
                    sent++;
                    await sleep(1500);
                } catch(_) {}
            }
            reply(`✅ *Broadcast sent to ${sent} chats*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .aza / .setaza / .resetaza — auto-response keywords
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'setaza', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, args, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const sep = args.indexOf('|');
        if (sep < 0 || sep === 0 || sep === args.length-1)
            return reply('❗ Usage: *.setaza keyword | response*\nExample: _.setaza hi | Hello there!_\n\n' + sig());
        const keyword = args.slice(0, sep).join(' ').toLowerCase();
        const response = args.slice(sep+1).join(' ');
        azaStore.set(keyword, response);
        if (!config._azaStore) config._azaStore = azaStore;
        await react(sock, m, '✅');
        reply(`✅ *Auto-reply set*\nKeyword: *${keyword}*\nReply: _${response}_\n\n${sig()}`);
    }
},
{
    command: 'aza', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        if (!azaStore.size) return reply('📋 *No auto-replies set*\n\nUse *.setaza keyword | response*\n\n' + sig());
        const list = [...azaStore.entries()].map(([k,v],i)=>`${i+1}. *${k}* → ${v}`).join('\n');
        reply(`🤖 *Auto-Replies*\n\n${list}\n\n${sig()}`);
    }
},
{
    command: 'resetaza', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, args, reply }) => {
        if (!isCreator) return reply(ownerErr);
        if (args[0]) {
            azaStore.delete(args[0].toLowerCase());
            reply(`✅ *Removed:* ${args[0]}\n\n${sig()}`);
        } else {
            azaStore.clear();
            reply(`✅ *All auto-replies cleared*\n\n${sig()}`);
        }
        await react(sock, m, '🗑️');
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .listbadword — show bad words list
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'listbadword', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const list = config.badwords || [];
        if (!list.length) return reply('📋 *No bad words configured*\n\n' + sig());
        reply(`🚫 *Bad Words List (${list.length})*\n\n${list.map((w,i)=>`${i+1}. ||${w}||`).join('\n')}\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .listignorelist — ignored JIDs
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'listignorelist', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const list = config.ignoreList || [];
        if (!list.length) return reply('📋 *Ignore list is empty*\n\n' + sig());
        reply(`📵 *Ignore List (${list.length})*\n\n${list.map((j,i)=>`${i+1}. @${j.split('@')[0]}`).join('\n')}\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .listsudo — sudo users
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'listsudo', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const list = config.sudo || [];
        if (!list.length) return reply('📋 *No sudo users set*\n\n' + sig());
        reply(`🛡️ *Sudo Users (${list.length})*\n\n${list.map((n,i)=>`${i+1}. +${n}`).join('\n')}\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .delstickercmd / .setstickercmd — custom sticker command name
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'setstickercmd', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, args, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const cmd = args[0]?.toLowerCase();
        if (!cmd) return reply('❗ Usage: *.setstickercmd <name>*\n\n' + sig());
        config.stickerCmd = cmd;
        await react(sock, m, '✅');
        reply(`✅ *Sticker command → .${cmd}*\n\n${sig()}`);
    }
},
{
    command: 'delstickercmd', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        delete config.stickerCmd;
        await react(sock, m, '✅');
        reply(`✅ *Sticker command reset to default (.sticker)*\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .autosavestatus — toggle auto-save statuses to folder
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'autosavestatus', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, args, reply }) => {
        if (!isCreator) return reply(ownerErr);
        const on = (args[0] || '').toLowerCase() !== 'off';
        config.features.autosavestatus = on;
        await react(sock, m, on ? '💾' : '❌');
        reply(`${on ? '💾' : '❌'} *Auto Save Status → ${on ? 'ON' : 'OFF'}*\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .sessionid — show session ID for a number
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'sessionid', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, args, reply }) => {
        if (!isCreator) return reply(ownerErr);

        // ── Locate creds — check all known paths ────────────────────────
        // Bot sessions live in sessions/main/creds.json regardless of how
        // the bot was linked (panel, pairing site, env var, or .pair cmd)
        const baseDir   = path.join(__dirname, '..');
        const mainCreds = path.join(baseDir, 'sessions', 'main', 'creds.json');
        const oldCreds  = path.join(baseDir, 'sessions', 'creds.json');
        const backupDir = path.join(baseDir, 'sessions', 'backup');

        // No args → show current bot session
        if (!args[0]) {
            // Priority: sessions/main/creds.json → sessions/creds.json → SESSION_ID env var
            const envSid    = process.env.SESSION_ID || process.env.LIAM_SESSION_ID || '';
            const credsPath = fs.existsSync(mainCreds) ? mainCreds
                            : fs.existsSync(oldCreds)  ? oldCreds
                            : null;

            // If no creds file but we have env SESSION_ID, return that
            if (!credsPath && envSid && envSid.startsWith('LIAM~')) {
                await sock.sendMessage(m.chat,{react:{text:'🔑',key:m.key}}).catch(()=>{});
                const sidMsg = await sock.sendMessage(m.chat,{text:envSid},{quoted:m});
                await sleep(600);
                return sock.sendMessage(m.chat,{
                    text: `🔑 *Your Bot Session ID*\n\n` +
                          `👆 Long-press *LIAM~* above → *Copy*\n\n` +
                          `📌 Source: _SESSION_ID environment variable_\n\n` +
                          `⚠️ _Never share this with anyone!_\n\n` +
                          `${sig()}`
                },{quoted:sidMsg});
            }

            if (!credsPath)
                return reply(
                    `❌ *Session file not found*\n\n` +
                    `Looked in:\n` +
                    `• sessions/main/creds.json\n` +
                    `• sessions/creds.json\n` +
                    `• SESSION_ID env var\n\n` +
                    `The bot is connected, so the session must exist.\n` +
                    `Try restarting and using .sessionid again.\n\n${sig()}`
                );

            await sock.sendMessage(m.chat, { react: { text: '🔑', key: m.key } }).catch(()=>{});
            const raw = fs.readFileSync(credsPath);
            const sid = 'LIAM~' + Buffer.from(raw).toString('base64url');

            // Send bare SID (easy to long-press copy)
            const sidMsg = await sock.sendMessage(m.chat, { text: sid }, { quoted: m });
            await sleep(600);
            return sock.sendMessage(m.chat, {
                text:
                    `🔑 *Your Bot Session ID*\n\n` +
                    `👆 Long-press the *LIAM~* message above → *Copy*\n\n` +
                    `⚠️ _Never share this with anyone!_\n\n` +
                    `📌 Use it in:\n` +
                    `• settings/settings.js → sessionId: "..."\n` +
                    `• Or as SESSION_ID env var on your panel\n\n` +
                    `${sig()}`
            }, { quoted: sidMsg });
        }

        // Args provided → look up backup for a specific number
        const num = args[0].replace(/\D/g,'');
        if (!fs.existsSync(backupDir))
            return reply(`❌ No backup directory.\n_Pair a number first with .pair_\n\n${sig()}`);

        const files = fs.readdirSync(backupDir).filter(f => f.includes(num) && f.endsWith('.json'));
        if (!files.length)
            return reply(`❌ No saved session for +${num}\n\n_Sessions save automatically during .pair_\n\n${sig()}`);

        const latest = files.sort().pop();
        const data   = JSON.parse(fs.readFileSync(path.join(backupDir, latest), 'utf8'));
        const age    = Math.round((Date.now() - data.ts) / 60000);

        await sock.sendMessage(m.chat, { react: { text: '📋', key: m.key } }).catch(()=>{});
        const sidMsg = await sock.sendMessage(m.chat, { text: data.sid }, { quoted: m });
        await sleep(600);
        sock.sendMessage(m.chat, {
            text: `📋 *Saved Session for +${num}*\n⏱️ Saved ${age} min ago\n\n👆 Long-press → Copy LIAM~ above\n\n${sig()}`
        }, { quoted: sidMsg });
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .getabout — get a user's about/status text
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'getabout', category: 'tools',
    execute: async (sock, m, { args, sender, reply }) => {
        const jid = args[0]?.replace(/\D/g,'') ? args[0].replace(/\D/g,'') + '@s.whatsapp.net' : fixJid(m.quoted?.sender || sender);
        try {
            const { status } = await sock.fetchStatus(jid);
            reply(`💬 *About @${jid.split('@')[0]}*\n\n${status || '_(empty)_'}\n\n${sig()}`);
        } catch(e) { reply(`❌ Could not fetch about: ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .noprivacy — reset all privacy to default (all visible)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'noprivacy', category: 'owner', owner: true,
    execute: async (sock, m, { isCreator, reply }) => {
        if (!isCreator) return reply(ownerErr);
        try {
            await Promise.all([
                sock.updateLastSeenPrivacy('all'),
                sock.updateOnlinePrivacy('all'),
                sock.updateProfilePicturePrivacy('all'),
                sock.updateStatusPrivacy('all'),
                sock.updateReadReceiptsPrivacy('all'),
                sock.updateGroupsAddPrivacy('all'),
            ]).catch(()=>{});
            await react(sock, m, '✅');
            reply(`✅ *All privacy → Everyone (all)*\n\n${sig()}`);
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .alladmin — promote all group members to admin
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'alladmin', category: 'owner', owner: true, group: true,
    execute: async (sock, m, { isCreator, reply, participants, isBotAdmins }) => {
        if (!isCreator) return reply(ownerErr);
        if (!isBotAdmins) return reply('❌ Bot needs admin rights.\n\n' + sig());
        const nonAdmins = participants.filter(p => !p.admin).map(p => p.id);
        if (!nonAdmins.length) return reply('✅ Everyone is already admin!\n\n' + sig());
        await react(sock, m, '👑');
        for (const jid of nonAdmins) {
            await sock.groupParticipantsUpdate(m.chat, [jid], 'promote').catch(()=>{});
            await sleep(500);
        }
        reply(`✅ *Promoted ${nonAdmins.length} members to admin*\n\n${sig()}`);
    }
},

    // ─────────────────────────────────────────────────────────────────────────
    //  .sessions — list all session backups  |  .sessions <number> → show SID
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'sessions', category: 'owner', owner: true,
        execute: async (sock, m, ctx) => {
            if (!ctx.isCreator) return ctx.reply(config.message.owner);
            const { args } = ctx;
            const backupDir = path.join(__dirname, '..', 'sessions', 'backup');

            if (!fs.existsSync(backupDir))
                return ctx.reply(`❌ No sessions backup directory found.\nPair a number first with *.pair*\n\n${sig()}`);

            const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
            if (!files.length)
                return ctx.reply(`❌ No session backups saved yet.\n_Sessions are auto-saved after pairing._\n\n${sig()}`);

            // .sessions <number> → show the session ID for that number
            if (args[0]) {
                const num = args[0].replace(/\D/g, '');
                const match = files.filter(f => f.includes(num));
                if (!match.length)
                    return ctx.reply(`❌ No session found for +${num}\n\n${sig()}`);
                const data = JSON.parse(fs.readFileSync(path.join(backupDir, match[match.length - 1])));
                const age  = Math.round((Date.now() - data.ts) / 60000);
                const sidMsg = await sock.sendMessage(m.chat, { text: data.sid }, { quoted: m });
                await sleep(400);
                return ctx.reply(`📋 *Session for +${num}*\n⏱️ Saved ${age} min ago\n👆 Long-press above to copy\n\n${sig()}`);
            }

            // No args → list all session backups
            const list = files.slice(-20).map(f => {
                try {
                    const d = JSON.parse(fs.readFileSync(path.join(backupDir, f)));
                    const num = d.num || f.replace('.json', '');
                    const age = Math.round((Date.now() - d.ts) / 60000);
                    return `📱 +${num}  (${age < 60 ? age + 'min' : Math.round(age/60) + 'hr'} ago)`;
                } catch { return `📁 ${f}`; }
            }).join('\n');

            ctx.reply(
                `📋 *Session Backups — LIAM EYES*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n${list}\n\n` +
                `_Use *.sessions <number>* to get a specific SID_\n\n${sig()}`
            );
        }
    },

];
