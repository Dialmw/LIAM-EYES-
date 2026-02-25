// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — FUN + GAMES  (7+3 = 10 commands)
//  fact, jokes, memes, quotes, trivia, truthdetector, xxqc
//  dare, truth, truthordare
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('../settings/config');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (sock, m, e) => sock.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {});
const rand  = arr => arr[Math.floor(Math.random() * arr.length)];

// ── Static fallback data ─────────────────────────────────────────────────
const QUOTES = [
    ['The only way to do great work is to love what you do.','Steve Jobs'],
    ['Stay hungry, stay foolish.','Steve Jobs'],
    ['In the middle of every difficulty lies opportunity.','Albert Einstein'],
    ['It does not matter how slowly you go as long as you do not stop.','Confucius'],
    ['The secret of getting ahead is getting started.','Mark Twain'],
    ['Life is what happens when you are busy making other plans.','John Lennon'],
    ['You miss 100% of the shots you do not take.','Wayne Gretzky'],
    ['Whether you think you can or think you cannot — you are right.','Henry Ford'],
    ['The future belongs to those who believe in the beauty of their dreams.','Eleanor Roosevelt'],
    ['Hardships often prepare ordinary people for extraordinary destiny.','C.S. Lewis'],
    ['Jifunze kwa bidii, kwa sababu elimu ni ufunguo wa mafanikio.','Methali ya Kiswahili'],
    ['Umoja ni nguvu, utengano ni udhaifu.','Methali ya Afrika'],
];
const TRUTHS = [
    'What is the most embarrassing thing you have ever done?',
    'Have you ever lied to get out of trouble?',
    'What is your biggest fear?',
    'Who is your secret crush?',
    'What is the worst thing you have eaten?',
    'Have you ever cheated on a test?',
    'What is your biggest pet peeve?',
    'What is something you have never told anyone?',
    'Have you ever stolen anything?',
    'What is your most used emoji and why?',
    'Ni nani unayempenda zaidi katika maisha yako?',
    'Je, umewahi kudanganya mtu unayempenda?',
];
const DARES = [
    'Send a voice note singing any song for 15 seconds',
    'Change your WhatsApp profile photo for 1 hour',
    'Send a screenshot of your most recent Google search',
    'Send an ugly selfie',
    'Write a love poem to the last person you texted',
    'Send a voice note saying "I love you" in 5 different languages',
    'Change your display name to LIAM EYES BOT for 30 minutes',
    'Send a voice note doing your best impression of an animal',
    'Share your most embarrassing photo',
    'Text your crush "hey stranger 👀" right now',
];
const TRIVIA = [
    { q: 'What planet is closest to the sun?', a: 'Mercury' },
    { q: 'How many sides does a hexagon have?', a: '6' },
    { q: 'What is the capital of Kenya?', a: 'Nairobi' },
    { q: 'Who wrote Romeo and Juliet?', a: 'William Shakespeare' },
    { q: 'What is H₂O commonly known as?', a: 'Water' },
    { q: 'Which animal is the fastest on land?', a: 'Cheetah' },
    { q: 'How many continents are there?', a: '7' },
    { q: 'What year did the Titanic sink?', a: '1912' },
    { q: 'What is the largest ocean on Earth?', a: 'Pacific Ocean' },
    { q: 'Who painted the Mona Lisa?', a: 'Leonardo da Vinci' },
    { q: 'Nchi gani ndiyo kubwa zaidi barani Afrika?', a: 'Algeria' },
    { q: 'What is the national language of Brazil?', a: 'Portuguese' },
];

module.exports = [

    // ═════════════ FUN COMMANDS ═════════════

    { command: 'fact', category: 'fun',
      execute: async (sock, m, { reply }) => {
        await react(sock, m, '💡');
        try {
            const { data } = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en', { timeout: 6000 });
            reply(`💡 *Random Fact*\n━━━━━━━━━━━━━━━━\n${data.text}\n\n${sig()}`);
        } catch {
            const facts = [
                "Honey never spoils — 3000-year-old honey was found in Egyptian tombs and was still edible!",
                "A group of flamingos is called a 'flamboyance'.",
                "Bananas are berries, but strawberries are not.",
                "The Eiffel Tower grows by 15cm in summer due to thermal expansion.",
                "Octopuses have three hearts and blue blood.",
            ];
            reply(`💡 *Random Fact*\n━━━━━━━━━━━━━━━━\n${rand(facts)}\n\n${sig()}`);
        }
      }
    },

    { command: 'jokes', category: 'fun',
      execute: async (sock, m, { reply }) => {
        await react(sock, m, '😂');
        try {
            const { data } = await axios.get('https://official-joke-api.appspot.com/random_joke', { timeout: 6000 });
            reply(`😂 *Joke Time!*\n━━━━━━━━━━━━━━━━\n*${data.setup}*\n\n${data.punchline} 😆\n\n${sig()}`);
        } catch {
            const jokes = [
                ['Why don\'t scientists trust atoms?', 'Because they make up everything! 😂'],
                ['Why did the scarecrow win an award?', 'Because he was outstanding in his field! 🌾'],
                ['I told my wife she was drawing her eyebrows too high.', 'She looked surprised. 😮'],
                ['Nikamwambia mtu "Unaonekana mchoka". Akasema "Ndio, nimechoka na wewe!" 😂', ''],
            ];
            const [setup, punch] = rand(jokes);
            reply(`😂 *Joke Time!*\n━━━━━━━━━━━━━━━━\n*${setup}*\n${punch ? '\n' + punch : ''}\n\n${sig()}`);
        }
      }
    },

    { command: 'quotes', category: 'fun',
      execute: async (sock, m, { reply }) => {
        await react(sock, m, '💭');
        try {
            const { data } = await axios.get('https://api.quotable.io/random', { timeout: 6000 });
            reply(`💭 *Quote of the Moment*\n━━━━━━━━━━━━━━━━\n_"${data.content}"_\n\n— *${data.author}*\n\n${sig()}`);
        } catch {
            const [quote, author] = rand(QUOTES);
            reply(`💭 *Quote of the Moment*\n━━━━━━━━━━━━━━━━\n_"${quote}"_\n\n— *${author}*\n\n${sig()}`);
        }
      }
    },

    { command: 'memes', category: 'fun',
      execute: async (sock, m, { reply }) => {
        await react(sock, m, '😆');
        try {
            const { data } = await axios.get('https://meme-api.com/gimme', { timeout: 10000 });
            if (!data?.url) throw new Error('No meme');
            await sock.sendMessage(m.chat, {
                image: { url: data.url },
                caption: `😆 *${data.title}*\n📌 r/${data.subreddit} • 👍 ${data.ups}\n\n${sig()}`,
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch {
            reply(`😆 *Meme Time!*\n━━━━━━━━━━━━━━━━\n_When you run .memes but the API is down_ 😂\n\nVisit: reddit.com/r/memes\n\n${sig()}`);
        }
      }
    },

    { command: 'trivia', category: 'fun',
      execute: async (sock, m, { reply }) => {
        await react(sock, m, '🧠');
        try {
            const { data } = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', { timeout: 8000 });
            if (data.response_code === 0) {
                const q = data.results[0];
                const allAnswers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
                const letters = ['A','B','C','D'];
                const opts = allAnswers.map((a, i) => `${letters[i]}. ${a.replace(/&amp;/g,'&').replace(/&#039;/g,"'")}`).join('\n');
                reply(`🧠 *Trivia Question!*\n━━━━━━━━━━━━━━━━\n📂 ${q.category}\n\n❓ ${q.question.replace(/&amp;/g,'&').replace(/&#039;/g,"'")}\n\n${opts}\n\n_Reply with the letter! Answer in 30 seconds!_\n\n${sig()}`);
            } else throw new Error('API limit');
        } catch {
            const item = rand(TRIVIA);
            reply(`🧠 *Trivia Question!*\n━━━━━━━━━━━━━━━━\n❓ ${item.q}\n\n_Reply with your answer! Hint: it starts with "${item.a[0]}"_\n\n||Answer: ${item.a}||\n\n${sig()}`);
        }
      }
    },

    { command: 'truthdetector', category: 'fun',
      execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❓ Usage: *.truthdetector <statement>*\nExample: _.truthdetector I love studying_\n\n${sig()}`);
        await react(sock, m, '🔍');
        const percent = Math.floor(Math.random() * 101);
        const verdict = percent > 70 ? '✅ TRUE' : percent > 40 ? '🤔 HALF TRUE' : '❌ LIE DETECTED';
        reply(`🔍 *LIAM Truth Detector™*\n━━━━━━━━━━━━━━━━\n📋 Statement: _"${text}"_\n\n${'█'.repeat(Math.floor(percent/10))}${'░'.repeat(10-Math.floor(percent/10))} ${percent}%\n\n*Verdict: ${verdict}*\n\n_Results are scientifically accurate* 😂_\n*(not really)\n\n${sig()}`);
      }
    },

    { command: 'xxqc', category: 'fun',
      execute: async (sock, m, { reply, pushname }) => {
        await react(sock, m, '💝');
        const percent = Math.floor(Math.random() * 101);
        const hearts = '❤️'.repeat(Math.min(5, Math.ceil(percent/20)));
        const level = percent > 80 ? 'DEEPLY IN LOVE 💘' : percent > 60 ? 'CRUSHING HARD 💕' : percent > 40 ? 'STARTING TO FEEL IT 💓' : percent > 20 ? 'JUST FRIENDS 🤝' : 'NO SPARKS YET 💔';
        reply(`💝 *LIAM Love Meter™*\n━━━━━━━━━━━━━━━━\n👤 ${pushname}\n\n${hearts} ${percent}%\n\n*Status: ${level}*\n\n_Results certified by LIAM EYES dating algorithm™ 😂_\n\n${sig()}`);
      }
    },

    // ═════════════ GAMES COMMANDS ═════════════

    { command: 'truth', category: 'games',
      execute: async (sock, m, { args, reply, pushname }) => {
        const t = rand(TRUTHS);
        reply(`🎮 *TRUTH or DARE — Truth!*\n━━━━━━━━━━━━━━━━\n👤 ${pushname}, your truth is:\n\n*"${t}"*\n\n_You must answer honestly!_\n\n${sig()}`);
      }
    },

    { command: 'dare', category: 'games',
      execute: async (sock, m, { reply, pushname }) => {
        const d = rand(DARES);
        reply(`🎮 *TRUTH or DARE — Dare!*\n━━━━━━━━━━━━━━━━\n👤 ${pushname}, your dare is:\n\n*"${d}"*\n\n_You must do this or say "I chicken out!" 🐔_\n\n${sig()}`);
      }
    },

    { command: 'truthordare', category: 'games',
      execute: async (sock, m, { reply, pushname }) => {
        const isTruth = Math.random() > 0.5;
        if (isTruth) {
            const t = rand(TRUTHS);
            reply(`🎮 *TRUTH or DARE — You got TRUTH!*\n━━━━━━━━━━━━━━━━\n👤 ${pushname}:\n\n*"${t}"*\n\n_Answer honestly! No lying allowed 🤞_\n\n${sig()}`);
        } else {
            const d = rand(DARES);
            reply(`🎮 *TRUTH or DARE — You got DARE!*\n━━━━━━━━━━━━━━━━\n👤 ${pushname}:\n\n*"${d}"*\n\n_Do it or be forever shamed! 😤_\n\n${sig()}`);
        }
      }
    },

];
