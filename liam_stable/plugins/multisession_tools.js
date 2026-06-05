// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const fs     = require('fs');
const path   = require('path');
const config = require('../settings/config');
const auth   = require('../library/auth');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OW    = ctx => ctx.isCreator;

const BACKUP = () => path.join(__dirname, '..', 'sessions', 'backup');
const SESSION = () => path.join(__dirname, '..', 'sessions');

module.exports = [

// ─────────────────────────────────────────────────────────────────────────
//  .sessionid — get current bot session ID / session for a number
// ─────────────────────────────────────────────────────────────────────────
{
    command: 'mysession', category: 'multisession', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(config.message.owner);
        const sessionDir = SESSION();
        const creds = path.join(sessionDir, 'creds.json');
        if (!fs.existsSync(creds)) return ctx.reply(`❌ No active session found.\n\n${sig()}`);
        const raw = fs.readFileSync(creds);
        const sid = 'LIAM~' + Buffer.from(raw).toString('base64url');
        await react(sock, m, '🔑');
        const sidMsg = await sock.sendMessage(m.chat, { text: sid }, { quoted: m });
        await sleep(500);
        sock.sendMessage(m.chat, {
            text: `🔑 *Your Current Bot Session ID*\n\n👆 Long-press the LIAM~ message above → *Copy*\n\n⚠️ _Never share this with anyone!_\n\n${sig()}`
        }, { quoted: sidMsg });
    }
},

// ─────────────────────────────────────────────────────────────────────────
//  .getsession <number> — retrieve saved session ID for a number
// ─────────────────────────────────────────────────────────────────────────
{
    command: 'getsession', category: 'multisession', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(config.message.owner);
        const num = (ctx.args[0] || '').replace(/\D/g, '');
        if (!num) return ctx.reply(`❓ Usage: *.getsession <number>*\nExample: _.getsession 254712345678_\n\n${sig()}`);

        const bDir = BACKUP();
        if (!fs.existsSync(bDir)) return ctx.reply(`❌ No backup directory.\n_Pair a number first._\n\n${sig()}`);

        const files = fs.readdirSync(bDir).filter(f => f.includes(num) && f.endsWith('.json'));
        if (!files.length) return ctx.reply(`❌ No saved session for +${num}\n\n_Sessions are auto-saved after .pair_\n\n${sig()}`);

        const data = JSON.parse(fs.readFileSync(path.join(bDir, files.sort().pop()), 'utf8'));
        const age  = Math.round((Date.now() - data.ts) / 60000);

        await react(sock, m, '🔑');
        const sidMsg = await sock.sendMessage(m.chat, { text: data.sid }, { quoted: m });
        await sleep(500);
        sock.sendMessage(m.chat, {
            text: `📋 *Session for +${num}*\n⏱️ Saved ${age} min ago\n\n👆 Long-press → Copy LIAM~ above\n\n${sig()}`
        }, { quoted: sidMsg });
    }
},

// ─────────────────────────────────────────────────────────────────────────
//  .listsessions — list all saved session backups
// ─────────────────────────────────────────────────────────────────────────
{
    command: 'listsessions', category: 'multisession', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(config.message.owner);
        const bDir = BACKUP();
        if (!fs.existsSync(bDir)) return ctx.reply(`❌ No backup directory.\n\n${sig()}`);

        const files = fs.readdirSync(bDir).filter(f => f.endsWith('.json'));
        if (!files.length) return ctx.reply(`📋 *No saved sessions yet.*\n_Pair a number with .pair to save one._\n\n${sig()}`);

        const list = files.slice(-20).map((f, i) => {
            try {
                const d = JSON.parse(fs.readFileSync(path.join(bDir, f), 'utf8'));
                const num = d.num || f.split('_')[1] || '?';
                const age = Math.round((Date.now() - d.ts) / 60000);
                return `${i + 1}. 📱 +${num}  ⏱️ ${age < 60 ? age + 'min' : Math.round(age/60) + 'hr'} ago`;
            } catch { return `${i+1}. 📁 ${f}`; }
        }).join('\n');

        ctx.reply(`📋 *Saved Session Backups*\n━━━━━━━━━━━━━━━━\n${list}\n\n_Use .getsession <number> to retrieve_\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────
//  .delsession <number> — delete a saved session backup
// ─────────────────────────────────────────────────────────────────────────
{
    command: 'delsession', category: 'multisession', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(config.message.owner);
        const num = (ctx.args[0] || '').replace(/\D/g, '');
        if (!num) return ctx.reply(`❓ Usage: *.delsession <number>*\n\n${sig()}`);

        const bDir = BACKUP();
        if (!fs.existsSync(bDir)) return ctx.reply(`❌ No backup directory.\n\n${sig()}`);

        const files = fs.readdirSync(bDir).filter(f => f.includes(num) && f.endsWith('.json'));
        if (!files.length) return ctx.reply(`❌ No session found for +${num}\n\n${sig()}`);

        files.forEach(f => { try { fs.unlinkSync(path.join(bDir, f)); } catch (_) {} });
        await react(sock, m, '🗑️');
        ctx.reply(`🗑️ *Deleted ${files.length} session backup(s) for +${num}*\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────
//  .activesessions — how many linked devices / active WA sessions
// ─────────────────────────────────────────────────────────────────────────
{
    command: 'activesessions', category: 'multisession', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(config.message.owner);
        try {
            const devices = await sock.getLinkedDevices?.() || [];
            // Session limit is looked up per-number, hidden from display
            const limit   = auth.getSessionLimit(ctx.senderNum, config.sessionLimits?.default || 3);
            ctx.reply(
                `📱 *Active Sessions — LIAM EYES*\n\n` +
                `🔗 Linked Devices: *${devices.length || 1}*\n` +
                `📊 Session Limit: *${limit}*\n` +
                `📶 Status: *Online*\n\n` +
                `${sig()}`
            );
        } catch {
            ctx.reply(`📱 *Active Sessions*\n\n🔗 Session: *Active (connected)*\n\n${sig()}`);
        }
    }
},

// ─────────────────────────────────────────────────────────────────────────
//  .setlimit <n> — set session limit for regular users
// ─────────────────────────────────────────────────────────────────────────
{
    command: 'setlimit', category: 'multisession', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(config.message.owner);
        const n = parseInt(ctx.args[0]);
        if (!n || n < 1 || n > 10) return ctx.reply(`❓ Usage: *.setlimit <1-10>*\nCurrent: *${config.sessionLimits?.default || 3}*\n\n${sig()}`);
        if (!config.sessionLimits) config.sessionLimits = {};
        config.sessionLimits.default = n;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Session limit set to ${n}*\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────
//  .getlink — get invite link for the pairing site
// ─────────────────────────────────────────────────────────────────────────
{
    command: 'getlink', category: 'multisession', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(config.message.owner);
        ctx.reply(
            `🔗 *LIAM EYES — Pairing Site*\n\n` +
            `${config.pairingSite}\n\n` +
            `_Share this with anyone who wants to pair a number_\n\n` +
            `${sig()}`
        );
    }
},

];
