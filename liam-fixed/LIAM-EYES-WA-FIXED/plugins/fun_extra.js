// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';

// ── .flirt ────────────────────────────────────────────────────────────────────
const flirts = [
    "If you were a vegetable, you'd be a cute-cumber 🥒😏",
    "Are you a magician? Because whenever I look at you, everyone else disappears ✨",
    "Do you have a name, or can I call you mine? 💕",
    "Are you a parking ticket? Because you've got 'Fine' written all over you 😂",
    "Is your name Google? Because you have everything I've been searching for 🔍❤️",
    "If beauty were time, you'd be an eternity 😍",
    "Do you believe in love at first chat, or should I message you again? 💬💖",
    "Are you a wifi password? Because I feel a strong connection 📶❤️",
    "You must be a broom because you swept me off my feet 🧹😘",
    "If you were a fruit, you'd be a fineapple 🍍👑",
    "Are you the sun? Because you light up my world ☀️🌍",
    "If my heart was a house, you'd be home 🏡❤️",
    "Do you have a map? I keep getting lost in your eyes 🗺️😍",
    "Are you made of copper and tellurium? Because you're CuTe 🧪💕",
    "I must be a snowflake because I've fallen for you ❄️💖",
    "If kisses were raindrops, I'd send you a storm 🌧️💋",
    "You're the reason I check my phone every 5 seconds 📱😏",
    "Is this real or am I dreaming? Either way, don't wake me up 😴💕",
    "You must be tired — you've been running through my mind all day 🏃❤️",
    "Even in a parallel universe, I'd still choose you 🌌💖",
];

// ── .kill and .wake are in message.js as built-ins (use global state) ─────────

module.exports = [
    // ── .flirt ───────────────────────────────────────────────────────────────
    {
        command: 'flirt',
        category: 'fun',
        execute: async (sock, m, ctx) => {
            const target = ctx.quoted?.sender
                ? `@${ctx.quoted.sender.split('@')[0]}`
                : ctx.text
                    ? ctx.text
                    : `@${ctx.senderNum}`;
            const line   = flirts[~~(Math.random() * flirts.length)];
            ctx.reply(`😍 *To: ${target}*\n\n💌 ${line}\n\n${sig()}`);
        }
    },

    // ── .kill (proxy — real logic in message.js global) ──────────────────────
    {
        command: 'kill',
        category: 'owner',
        owner: true,
        execute: async (sock, m, ctx) => {
            // Handled as built-in in message.js — this entry just ensures it
            // appears in the OWNER MENU command list
            if (!ctx.isCreator) return ctx.reply(config.message.owner);
            if (global._botKill) global._botKill();
            ctx.reply(`🔴 *Bot Paused*\n\nNo longer responding to others.\nUse *.wake* to resume.\n\n${sig()}`);
        }
    },

    // ── .wake ─────────────────────────────────────────────────────────────────
    {
        command: 'wake',
        category: 'owner',
        owner: true,
        execute: async (sock, m, ctx) => {
            if (!ctx.isCreator) return ctx.reply(config.message.owner);
            if (global._botWake) global._botWake();
            ctx.reply(`🟢 *Bot Active*\n\nBack online! 🚀\n\n${sig()}`);
        }
    },

    // ── .menustyle (category=menustyle so it appears in menu 21) ─────────────
    {
        command: 'menustyle',
        category: 'menustyle',
        execute: async (sock, m, ctx) => {
            // Actual logic is in message.js built-in handler
            // This entry ensures it shows in the MENU STYLE category (item 21)
            const n = parseInt(ctx.args[0]);
            if (!ctx.isCreator && !ctx.isSudo) return ctx.reply(config.message.owner);
            if (!n || n < 1 || n > 4) {
                const curr  = config.menuStyle || 1;
                const icons = { 1:'🔢 Numbered', 2:'📋 List', 3:'🗂️ Classic', 4:'✒️ Cursive' };
                return ctx.reply(
                    `🎨 *Menu Style*\n\n` +
                    `*Current:* Style ${curr} — ${icons[curr]}\n\n` +
                    `*Styles:*\n` +
                    `│ *1* — Numbered _(reply with number)_\n` +
                    `│ *2* — List _(all commands visible)_\n` +
                    `│ *3* — Classic _(box headers)_\n` +
                    `│ *4* — Cursive _(flower/script)_\n\n` +
                    `*Usage:*\n` +
                    `  *.numbered*  *.list*  *.classic*  *.cursive*\n\n${sig()}`
                );
            }
            config.menuStyle = n;
            const names = { 1:'Numbered', 2:'List', 3:'Classic', 4:'Cursive' };
            ctx.reply(`✅ Menu style → *${n} (${names[n]})*\n\nType *.menu* to see it.\n\n${sig()}`);
        }
    },

    // ── .setmenustyle (alias) ─────────────────────────────────────────────────
    {
        command: 'setmenustyle',
        category: 'menustyle',
        execute: async (sock, m, ctx) => {
            // Same as .menustyle
            const n = parseInt(ctx.args[0]);
            if (!ctx.isCreator && !ctx.isSudo) return ctx.reply(config.message.owner);
            if (!n || n < 1 || n > 4) return ctx.reply(`Usage: *.setmenustyle 1/2/3/4*\n\n${sig()}`);
            config.menuStyle = n;
            const names = { 1:'Numbered', 2:'List', 3:'Classic', 4:'Cursive' };
            ctx.reply(`✅ Menu style → *${n} (${names[n]})*\n\nType *.menu* to see it.\n\n${sig()}`);
        }
    },

    // ── .showstyle ────────────────────────────────────────────────────────────
    {
        command: 'showstyle',
        category: 'menustyle',
        execute: async (sock, m, ctx) => {
            const curr  = config.menuStyle || 1;
            const names = { 1:'Numbered', 2:'List', 3:'Classic', 4:'Cursive' };
            ctx.reply(`🎨 *Current Menu Style:* ${curr} — *${names[curr]}*\n\n${sig()}`);
        }
    },
];
