// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — AI TOOLS  (15 commands)
//  analyze, blackbox, code, dalle, deepseek, doppleai, gemini, generate,
//  gpt, programming, recipe, story, summarize, teach, translate2
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('../settings/config');

const H   = config.api.baseurl;
const KEY = config.api.apikey;
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── AI text via pollinations (free, no key) ───────────────────────────────
const aiText = async (prompt, system = '') => {
    const full = system ? system + '\n\n' + prompt : prompt;
    const { data } = await axios.get(
        `https://text.pollinations.ai/${encodeURIComponent(full)}`,
        { timeout: 20000, headers: { 'User-Agent': 'LIAM-EYES/2.0' } }
    );
    return (data?.toString() || '').trim() || 'No response received.';
};

// ── AI image via pollinations ────────────────────────────────────────────
const aiImg = async (prompt) =>
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&enhance=true&seed=${Date.now()}`;

// ── React + execute helper ────────────────────────────────────────────────
const run = async (sock, m, emoji, fn, reply) => {
    await sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } }).catch(() => {});
    try {
        const res = await fn();
        await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
        return res;
    } catch (e) {
        await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
        reply(`❌ *Error:* ${e.message}\n\n${sig()}`);
        return null;
    }
};

// ── Box formatter ─────────────────────────────────────────────────────────
const box = (icon, title, q, answer) =>
    `${icon} *${title}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🔍 *Query:* ${q.length > 80 ? q.slice(0, 80) + '…' : q}\n\n` +
    `💬 *Answer:*\n${answer}\n\n${sig()}`;

module.exports = [

    // ── .gpt ────────────────────────────────────────────────────────────────
    {
        command: 'gpt', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.gpt <question>*\nExample: _.gpt explain black holes_\n\n${sig()}`);
            await run(sock, m, '🤔', async () => {
                const ans = await aiText(text);
                reply(box('🤖', 'GPT', text, ans));
            }, reply);
        }
    },

    // ── .gemini ──────────────────────────────────────────────────────────────
    {
        command: 'gemini', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.gemini <question>*\n\n${sig()}`);
            await run(sock, m, '♊', async () => {
                const ans = await aiText('Answer this as Google Gemini would: ' + text);
                reply(box('♊', 'Gemini', text, ans));
            }, reply);
        }
    },

    // ── .blackbox ────────────────────────────────────────────────────────────
    {
        command: 'blackbox', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.blackbox <question/code task>*\n\n${sig()}`);
            await run(sock, m, '⬛', async () => {
                const ans = await aiText('Answer as Blackbox AI code assistant: ' + text);
                reply(box('⬛', 'Blackbox AI', text, ans));
            }, reply);
        }
    },

    // ── .deepseek ─────────────────────────────────────────────────────────
    {
        command: 'deepseek', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.deepseek <question>*\n\n${sig()}`);
            await run(sock, m, '🔵', async () => {
                const ans = await aiText('Answer this with DeepSeek-level depth and reasoning: ' + text);
                reply(box('🔵', 'DeepSeek', text, ans));
            }, reply);
        }
    },

    // ── .doppleai ─────────────────────────────────────────────────────────
    {
        command: 'doppleai', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.doppleai <persona> <message>*\nExample: _.doppleai Elon Musk tell me about Mars_\n\n${sig()}`);
            const parts = text.split(' ');
            const persona = parts.slice(0, 2).join(' ');
            const msg     = parts.slice(2).join(' ') || text;
            await run(sock, m, '🎭', async () => {
                const ans = await aiText(msg, `You are ${persona}. Respond exactly as ${persona} would. Stay fully in character.`);
                reply(box('🎭', `DoppleAI — ${persona}`, msg, ans));
            }, reply);
        }
    },

    // ── .analyze ─────────────────────────────────────────────────────────
    {
        command: 'analyze', category: 'ai',
        execute: async (sock, m, { text, reply, quoted }) => {
            const input = text || quoted?.text || '';
            if (!input) return reply(`❓ Usage: *.analyze <text>* or reply to a message\n\n${sig()}`);
            await run(sock, m, '🔬', async () => {
                const ans = await aiText(
                    `Analyze this text deeply. Cover: tone, intent, key themes, sentiment, and any notable patterns.\n\nText: "${input}"`
                );
                reply(box('🔬', 'Text Analysis', input.slice(0, 60) + '…', ans));
            }, reply);
        }
    },

    // ── .summarize ───────────────────────────────────────────────────────
    {
        command: 'summarize', category: 'ai',
        execute: async (sock, m, { text, reply, quoted }) => {
            const input = text || quoted?.text || '';
            if (!input) return reply(`❓ Usage: *.summarize <text>* or reply to a message\n\n${sig()}`);
            await run(sock, m, '📝', async () => {
                const ans = await aiText(`Summarize this in 3-5 concise bullet points:\n\n${input}`);
                reply(box('📝', 'Summary', input.slice(0, 50) + '…', ans));
            }, reply);
        }
    },

    // ── .code ────────────────────────────────────────────────────────────
    {
        command: 'code', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.code <description>*\nExample: _.code python fibonacci_\n\n${sig()}`);
            await run(sock, m, '💻', async () => {
                const ans = await aiText(`Write clean, well-commented code for: ${text}\nInclude the code and a brief explanation.`);
                reply(box('💻', 'Code AI', text, ans));
            }, reply);
        }
    },

    // ── .programming ─────────────────────────────────────────────────────
    {
        command: 'programming', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.programming <question>*\nExample: _.programming what is recursion_\n\n${sig()}`);
            await run(sock, m, '🖥️', async () => {
                const ans = await aiText(`Answer this programming/CS question with examples:\n\n${text}`);
                reply(box('🖥️', 'Programming', text, ans));
            }, reply);
        }
    },

    // ── .generate / .dalle ───────────────────────────────────────────────
    {
        command: 'generate', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.generate <image description>*\nExample: _.generate neon city at night_\n\n${sig()}`);
            await sock.sendMessage(m.chat, { react: { text: '🎨', key: m.key } }).catch(() => {});
            try {
                const url = await aiImg(text);
                await sleep(2500);
                await sock.sendMessage(m.chat, {
                    image: { url },
                    caption: `🎨 *AI Image*\n🖼️ *Prompt:* ${text}\n\n${sig()}`,
                    contextInfo: { externalAdReply: {
                        title: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — AI Art', body: '👁️ Generated with AI',
                        thumbnailUrl: config.thumbUrl, sourceUrl: config.pairingSite, mediaType: 1,
                    }}
                }, { quoted: m });
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
            } catch (e) { reply(`❌ Generation failed: ${e.message}\n\n${sig()}`); }
        }
    },
    {
        command: 'dalle', category: 'ai',
        execute: async (sock, m, ctx) => {
            const p = ctx.text;
            if (!p) return ctx.reply(`❓ Usage: *.dalle <prompt>*\n\n${sig()}`);
            ctx.args[0] = 'generate'; // reuse generate
            const gen = module.exports.find(c => c.command === 'generate');
            return gen.execute(sock, m, ctx);
        }
    },

    // ── .story ───────────────────────────────────────────────────────────
    {
        command: 'story', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.story <theme/characters>*\nExample: _.story a brave lion and a clever fox_\n\n${sig()}`);
            await run(sock, m, '📖', async () => {
                const ans = await aiText(`Write a short, engaging story (200-300 words) about: ${text}. Make it entertaining with a clear beginning, middle, and end.`);
                reply(`📖 *Story Time*\n━━━━━━━━━━━━━━━━\n${ans}\n\n${sig()}`);
            }, reply);
        }
    },

    // ── .recipe ──────────────────────────────────────────────────────────
    {
        command: 'recipe', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.recipe <dish name>*\nExample: _.recipe ugali with beef stew_\n\n${sig()}`);
            await run(sock, m, '🍳', async () => {
                const ans = await aiText(`Give me a detailed recipe for: ${text}\nInclude: ingredients (with amounts), step-by-step instructions, cooking time, and serving tips.`);
                reply(`🍳 *Recipe: ${text}*\n━━━━━━━━━━━━━━━━\n${ans}\n\n${sig()}`);
            }, reply);
        }
    },

    // ── .teach ───────────────────────────────────────────────────────────
    {
        command: 'teach', category: 'ai',
        execute: async (sock, m, { text, reply }) => {
            if (!text) return reply(`❓ Usage: *.teach <topic>*\nExample: _.teach photosynthesis_\n\n${sig()}`);
            await run(sock, m, '📚', async () => {
                const ans = await aiText(`Explain "${text}" as a patient teacher would to a curious student. Use simple language, analogies, and examples. Include key points to remember.`);
                reply(box('📚', 'Teaching Mode', text, ans));
            }, reply);
        }
    },

    // ── .translate2 ──────────────────────────────────────────────────────
    {
        command: 'translate2', category: 'ai',
        execute: async (sock, m, { args, reply }) => {
            if (args.length < 2) return reply(`❓ Usage: *.translate2 <lang> <text>*\nExample: _.translate2 swahili Hello friend_\n\n${sig()}`);
            const lang = args[0];
            const txt  = args.slice(1).join(' ');
            await run(sock, m, '🌍', async () => {
                const ans = await aiText(`Translate this to ${lang}. Reply ONLY with the translation, nothing else:\n"${txt}"`);
                reply(`🌍 *Translation → ${lang}*\n━━━━━━━━━━━━━━━━\n*Original:* ${txt}\n*Translated:* ${ans}\n\n${sig()}`);
            }, reply);
        }
    },

];
