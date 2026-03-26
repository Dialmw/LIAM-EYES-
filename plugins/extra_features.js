// Extra Cool Features — 8ball, ship, roast, tictactoe, poll, broadcast, lyrics, gpt-style, hug, slap
const config = require('../settings/config');
const axios  = require('axios');

module.exports = [

{
        command: 'dare', description: 'Random dare challenge', category: 'fun',
        execute: async (sock, m, { reply }) => {
            const dares = [
                'Send a voice note singing the chorus of any song 🎤',
                'Change your WhatsApp status to "I lost a dare" for 1 hour 😂',
                'Send a selfie with the silliest face you can make 🤪',
                'Tag 3 people and tell them something nice 💛',
                'Write a 3-sentence story using only emojis 📖',
                'Send a GIF that describes your personality perfectly 🎭',
                'Guess the first name of everyone in this chat 🔍',
                'Do 10 pushups and send proof 💪'
            ];
            await sock.sendMessage(m.chat, { react: { text: '😈', key: m.key } });
            reply(`😈 *DARE*\n\n${dares[~~(Math.random() * dares.length)]}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },
    {
        command: 'truth', description: 'Random truth question', category: 'fun',
        execute: async (sock, m, { reply }) => {
            const truths = [
                'What\'s the most embarrassing thing you\'ve Googled? 🔍',
                'Have you ever lied to get out of plans? Be honest! 😅',
                'What\'s your biggest fear you haven\'t told anyone? 😨',
                'What\'s the last lie you told? 🤥',
                'Who in this chat would you call at 3AM? 📞',
                'What\'s something you pretend to like but actually don\'t? 🙂',
                'What\'s the weirdest thing you do when you\'re alone? 🤷',
                'Have you ever blamed someone else for something you did? 😬'
            ];
            await sock.sendMessage(m.chat, { react: { text: '🎯', key: m.key } });
            reply(`🎯 *TRUTH*\n\n${truths[~~(Math.random() * truths.length)]}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐓 👁️`);
        }
    },
{
        command: 'rps', description: 'Rock Paper Scissors vs bot', category: 'fun',
        execute: async (sock, m, { text, prefix, reply }) => {
            const choices = ['rock', 'paper', 'scissors'];
            const emojis  = { rock: '🪨', paper: '📄', scissors: '✂️' };
            const pick = (text || '').toLowerCase().trim();
            if (!choices.includes(pick)) return reply(`✂️ Usage: *${prefix}rps rock* | *paper* | *scissors*`);
            const bot = choices[~~(Math.random() * 3)];
            let result;
            if (pick === bot) result = "🤝 It's a tie!";
            else if ((pick==='rock'&&bot==='scissors')||(pick==='paper'&&bot==='rock')||(pick==='scissors'&&bot==='paper')) result = '🏆 You win!';
            else result = '🤖 Bot wins!';
            await sock.sendMessage(m.chat, { react: { text: result.includes('You') ? '🏆' : result.includes('tie') ? '🤝' : '🤖', key: m.key } });
            reply(`✂️ *Rock Paper Scissors*\n\n👤 You: ${emojis[pick]} *${pick}*\n🤖 Bot: ${emojis[bot]} *${bot}*\n\n*${result}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },
{
        command: 'number', description: 'Random number between range', category: 'fun',
        execute: async (sock, m, { args, prefix, reply }) => {
            const min = parseInt(args[0]) || 1;
            const max = parseInt(args[1]) || 100;
            if (min >= max) return reply(`❓ Usage: *${prefix}number 1 100*`);
            const rand = ~~(Math.random() * (max - min + 1)) + min;
            reply(`🔢 *Random Number*\n\nRange: ${min}–${max}\nResult: *${rand}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },
{
        command: 'rate', description: 'Bot rates something or someone /100', category: 'fun',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text) return reply(`⭐ Usage: *${prefix}rate your cooking*`);
            const score = ~~(Math.random() * 101);
            const stars = '⭐'.repeat(Math.ceil(score/20));
            const comment = score >= 90 ? 'Legendary! 🔥' : score >= 70 ? 'Pretty solid! 💛' : score >= 50 ? 'Could be better 😅' : score >= 30 ? 'Needs work... 🤔' : 'Absolutely not 💀';
            reply(`⭐ *LIAM EYES Rating*\n\n"${text}" — *${score}/100*\n${stars}\n\n${comment}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },
    {
        command: 'aesthetic', description: 'Convert text to aesthetic style', category: 'fun',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text) return reply(`✨ Usage: *${prefix}aesthetic liam eyes*`);
            const map = 'abcdefghijklmnopqrstuvwxyz';
            const aes = 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ';
            const out = text.toLowerCase().split('').map(c => {
                const i = map.indexOf(c);
                return i >= 0 ? aes[i] : c === ' ' ? '　' : c;
            }).join('');
            reply(`✨ *Aesthetic*\n\n${out}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },
    {
        command: 'hug', description: 'Send a virtual hug', category: 'fun',
        execute: async (sock, m, { reply, sender }) => {
            const num = sender.split('@')[0];
            const hugs = ['(っ˘̩╭╮˘̩)っ', 'づ｡◕‿‿◕｡づ', '(づ￣ ³￣)づ', '⊂(•‿•⊂)', '(⊃｡•́‿•̀｡)⊃'];
            const hug = hugs[~~(Math.random() * hugs.length)];
            await sock.sendMessage(m.chat, { react: { text: '🤗', key: m.key } });
            reply(`🤗 *Virtual Hug!*\n\n${hug}\n\nSending warmth to everyone! 💛\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    }
];
