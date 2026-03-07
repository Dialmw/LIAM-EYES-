// ─────────────────────────────────────────────────────────────────
//  LIAM EYES — Advanced Features Plugin
//  Commands: password, encode, decode, bmi, currency, trivia,
//            advice, cat, dog, color, morse, binary, qr,
//            emojimix, avatar, joke2, wyr, compliment2, reverse,
//            poll, remindme, serverinfo
// ─────────────────────────────────────────────────────────────────
const axios  = require('axios');
const crypto = require('crypto');
const config = require('../settings/config');
const os     = require('os');

// ── Shared reply card helper ─────────────────────────────────────
const card = (sock, m, text) => sock.sendMessage(m.chat, {
    text
}, { quoted: m });

module.exports = [

    // ── 🔑 Password Generator ──────────────────────────────────────
    {
        command: 'password',
        description: 'Generate a secure random password',
        category: 'utility',
        execute: async (sock, m, { args, prefix, reply }) => {
            const len = Math.min(Math.max(parseInt(args[0]) || 16, 6), 64);
            const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}';
            const bytes = crypto.randomBytes(len);
            const pwd   = Array.from(bytes).map(b => charset[b % charset.length]).join('');
            const strength = len >= 20 ? '🟢 Strong' : len >= 12 ? '🟡 Medium' : '🔴 Weak';
            await sock.sendMessage(m.chat, { react: { text: '🔑', key: m.key } });
            reply(
                `🔑 *Password Generator*\n\n` +
                `\`\`\`${pwd}\`\`\`\n\n` +
                `> 📏 Length: ${len}\n` +
                `> 💪 Strength: ${strength}\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ── 🔐 Base64 Encode ───────────────────────────────────────────
    {
        command: 'encode',
        description: 'Encode text to Base64',
        category: 'utility',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text) return reply(`🔐 Usage: *${prefix}encode Hello World*`);
            const encoded = Buffer.from(text).toString('base64');
            reply(`🔐 *Base64 Encode*\n\nInput: \`${text.slice(0, 60)}\`\n\nOutput:\n\`\`\`${encoded}\`\`\`\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },

    // ── 🔓 Base64 Decode ───────────────────────────────────────────
    {
        command: 'decode',
        description: 'Decode Base64 text',
        category: 'utility',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text) return reply(`🔓 Usage: *${prefix}decode SGVsbG8gV29ybGQ=*`);
            try {
                const decoded = Buffer.from(text.trim(), 'base64').toString('utf8');
                reply(`🔓 *Base64 Decode*\n\nInput: \`${text.slice(0, 60)}\`\n\nOutput:\n\`\`\`${decoded}\`\`\`\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
            } catch { reply('❌ Invalid Base64 string!'); }
        }
    },

    // ── 💪 BMI Calculator ──────────────────────────────────────────
    {
        command: 'bmi',
        description: 'Calculate Body Mass Index',
        category: 'utility',
        execute: async (sock, m, { args, prefix, reply }) => {
            const weight = parseFloat(args[0]);
            const height = parseFloat(args[1]);
            if (!weight || !height) return reply(`⚖️ Usage: *${prefix}bmi 70 1.75* (weight kg, height m)`);
            const bmi = (weight / (height * height)).toFixed(1);
            const cat =
                bmi < 18.5 ? '🔵 Underweight' :
                bmi < 25   ? '🟢 Normal weight' :
                bmi < 30   ? '🟡 Overweight' :
                             '🔴 Obese';
            reply(
                `⚖️ *BMI Calculator*\n\n` +
                `> ⚖️ Weight: ${weight} kg\n` +
                `> 📏 Height: ${height} m\n` +
                `> 🔢 BMI: *${bmi}*\n` +
                `> 📊 Category: ${cat}\n\n` +
                `━━━━━━━━━━━━━━\n` +
                `< 18.5  Underweight\n` +
                `18.5–24.9  Normal\n` +
                `25–29.9  Overweight\n` +
                `30+  Obese\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ── 💱 Currency Converter ──────────────────────────────────────
    {
        command: 'currency',
        description: 'Convert currency (e.g. .currency 100 USD KES)',
        category: 'utility',
        execute: async (sock, m, { args, prefix, reply }) => {
            if (args.length < 3) return reply(`💱 Usage: *${prefix}currency 100 USD KES*`);
            const amount = parseFloat(args[0]);
            const from   = args[1].toUpperCase();
            const to     = args[2].toUpperCase();
            if (isNaN(amount)) return reply('❌ Invalid amount!');
            await sock.sendMessage(m.chat, { react: { text: '💱', key: m.key } });
            try {
                const { data } = await axios.get(
                    `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`,
                    { timeout: 6000 }
                );
                const result = data.rates[to];
                reply(
                    `💱 *Currency Converter*\n\n` +
                    `> ${amount.toLocaleString()} ${from}\n` +
                    `> = *${result?.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}*\n\n` +
                    `> Rate via Frankfurter API\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            } catch { reply(`❌ Conversion failed. Check currency codes (e.g. USD, EUR, KES, GBP)`); }
        }
    },

    // ── 🎓 Trivia ──────────────────────────────────────────────────
    {
        command: 'trivia',
        description: 'Random trivia question',
        category: 'fun',
        execute: async (sock, m, { reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '🧠', key: m.key } });
            try {
                const { data } = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', { timeout: 6000 });
                const q = data.results[0];
                const all = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
                const letters = ['🅐', '🅑', '🅒', '🅓'];
                const opts = all.map((a, i) => `${letters[i]} ${a.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&')}`).join('\n');
                const question = q.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
                const answer = q.correct_answer.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
                reply(
                    `🧠 *Trivia Time!*\n\n` +
                    `📚 Category: _${q.category}_\n` +
                    `⚡ Difficulty: _${q.difficulty}_\n\n` +
                    `❓ *${question}*\n\n${opts}\n\n` +
                    `||✅ Answer: *${answer}*||\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            } catch { reply(`🧠 *Trivia*\n\nWhat planet is called the Red Planet?\n🅐 Venus\n🅑 Mars\n🅒 Jupiter\n🅓 Saturn\n\n||✅ Mars!||\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`); }
        }
    },

    // ── 🌟 Random Advice ──────────────────────────────────────────
    {
        command: 'advice',
        description: 'Get a random piece of advice',
        category: 'fun',
        execute: async (sock, m, { reply }) => {
            try {
                const { data } = await axios.get('https://api.adviceslip.com/advice', { timeout: 5000 });
                reply(`🌟 *Advice*\n\n_"${data.slip.advice}"_\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
            } catch { reply(`🌟 *Advice*\n\n_"The best time to start was yesterday. The second best time is now."_\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`); }
        }
    },

    // ── 🐱 Random Cat Image ────────────────────────────────────────
    {
        command: 'cat',
        description: 'Random cat image',
        category: 'fun',
        execute: async (sock, m, { reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '🐱', key: m.key } });
            try {
                const { data } = await axios.get('https://api.thecatapi.com/v1/images/search', { timeout: 5000 });
                const url = data[0]?.url;
                if (!url) throw new Error('no url');
                await sock.sendMessage(m.chat, { image: { url }, caption: `🐱 *Random Cat!*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️` }, { quoted: m });
            } catch { reply('❌ Could not fetch cat image right now.'); }
        }
    },

    // ── 🐶 Random Dog Image ───────────────────────────────────────
    {
        command: 'dog',
        description: 'Random dog image',
        category: 'fun',
        execute: async (sock, m, { reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '🐶', key: m.key } });
            try {
                const { data } = await axios.get('https://dog.ceo/api/breeds/image/random', { timeout: 5000 });
                await sock.sendMessage(m.chat, { image: { url: data.message }, caption: `🐶 *Random Dog!*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️` }, { quoted: m });
            } catch { reply('❌ Could not fetch dog image right now.'); }
        }
    },

    // ── 🔵 Random Color ────────────────────────────────────────────
    {
        command: 'color',
        description: 'Generate a random color with hex/rgb',
        category: 'utility',
        execute: async (sock, m, { args, reply }) => {
            let hex;
            if (args[0]?.startsWith('#')) {
                hex = args[0].replace('#','').toUpperCase();
            } else {
                hex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase();
            }
            const r = parseInt(hex.slice(0,2),16);
            const g = parseInt(hex.slice(2,4),16);
            const b = parseInt(hex.slice(4,6),16);
            const hsl = rgbToHsl(r,g,b);
            const name = colorName(r,g,b);
            reply(
                `🎨 *Color Info*\n\n` +
                `> 🔵 HEX: #${hex}\n` +
                `> 🟢 RGB: rgb(${r}, ${g}, ${b})\n` +
                `> 🌈 HSL: hsl(${hsl[0]}°, ${hsl[1]}%, ${hsl[2]}%)\n` +
                `> 🏷️ Name: _${name}_\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ── ·–· Morse Code ────────────────────────────────────────────
    {
        command: 'morse',
        description: 'Convert text to Morse code',
        category: 'utility',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text) return reply(`·–· Usage: *${prefix}morse Hello World*`);
            const M = {
                a:'·–',b:'–···',c:'–·–·',d:'–··',e:'·',f:'··–·',g:'––·',
                h:'····',i:'··',j:'·–––',k:'–·–',l:'·–··',m:'––',n:'–·',
                o:'–––',p:'·––·',q:'––·–',r:'·–·',s:'···',t:'–',u:'··–',
                v:'···–',w:'·––',x:'–··–',y:'–·––',z:'––··',
                '0':'–––––','1':'·––––','2':'··–––','3':'···––','4':'····–',
                '5':'·····','6':'–····','7':'––···','8':'–––··','9':'––––·',
            };
            const out = text.toLowerCase().split('').map(c => c === ' ' ? '/' : (M[c] || '?')).join(' ');
            reply(`·–· *Morse Code*\n\nInput: \`${text}\`\n\nOutput:\n\`\`\`${out}\`\`\`\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },

    // ── 01 Binary Converter ───────────────────────────────────────
    {
        command: 'binary',
        description: 'Convert text to binary or binary to text',
        category: 'utility',
        execute: async (sock, m, { args, text, prefix, reply }) => {
            if (!text) return reply(`01 Usage: *${prefix}binary Hello* or *${prefix}binary 01001000*`);
            // Detect if input is binary
            if (/^[01\s]+$/.test(text.trim())) {
                try {
                    const out = text.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
                    reply(`01 *Binary → Text*\n\nInput: \`${text.slice(0,40)}\`\n\nOutput: \`${out}\`\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
                } catch { reply('❌ Invalid binary input.'); }
            } else {
                const out = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
                reply(`01 *Text → Binary*\n\nInput: \`${text}\`\n\nOutput:\n\`\`\`${out}\`\`\`\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
            }
        }
    },

    // ── 🔄 Reverse Text ───────────────────────────────────────────
    {
        command: 'reverse',
        description: 'Reverse any text',
        category: 'fun',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text) return reply(`🔄 Usage: *${prefix}reverse Hello World*`);
            const rev = text.split('').reverse().join('');
            reply(`🔄 *Reversed*\n\nOriginal: \`${text}\`\nReversed: \`${rev}\`\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },

    // ── 🤔 Would You Rather ───────────────────────────────────────
    {
        command: 'wyr',
        description: 'Would you rather…?',
        category: 'fun',
        execute: async (sock, m, { reply }) => {
            const questions = [
                ['Never use social media again', 'Never watch TV or movies again'],
                ['Have super speed', 'Have super strength'],
                ['Always have to sing instead of talk', 'Always have to dance instead of walk'],
                ['Know when you will die', 'Know how you will die'],
                ['Be always 10 minutes early', 'Be always 20 minutes late'],
                ['Have a photographic memory', 'Be able to forget anything on demand'],
                ['Live without music', 'Live without movies'],
                ['Be invisible', 'Be able to read minds'],
                ['Never feel cold', 'Never feel hot'],
                ['Lose all your money', 'Lose all your photos and memories'],
            ];
            const [a, b] = questions[~~(Math.random() * questions.length)];
            await sock.sendMessage(m.chat, { react: { text: '🤔', key: m.key } });
            reply(`🤔 *Would You Rather…?*\n\n🅐 ${a}\n\n   ——— OR ———\n\n🅑 ${b}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },

    // ── 🖥️ Server / Bot Info ──────────────────────────────────────
    {
        command: 'serverinfo',
        description: 'Detailed bot server information',
        category: 'general',
        execute: async (sock, m, { reply }) => {
            const mem  = process.memoryUsage();
            const up   = process.uptime();
            const upStr = `${~~(up/86400)}d ${~~(up%86400/3600)}h ${~~(up%3600/60)}m ${~~(up%60)}s`;
            const cpus = os.cpus();
            const load = os.loadavg();

            reply(
                `🖥️ *LIAM EYES — Server Info*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `> 🟢 Status: Online\n` +
                `> ⏱️ Uptime: ${upStr}\n` +
                `> 🔖 Node: ${process.version}\n` +
                `> 💻 OS: ${os.type()} ${os.arch()}\n` +
                `> 🖥️ CPU: ${cpus[0].model.slice(0,32)}\n` +
                `> ⚙️ Cores: ${cpus.length}\n` +
                `> 📊 Load: ${load.map(l=>l.toFixed(2)).join(' | ')}\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `> 💾 Heap Used: ${(mem.heapUsed/1024/1024).toFixed(1)}MB\n` +
                `> 💾 Heap Total: ${(mem.heapTotal/1024/1024).toFixed(1)}MB\n` +
                `> 💾 RSS: ${(mem.rss/1024/1024).toFixed(1)}MB\n` +
                `> 🖥️ Total RAM: ${(os.totalmem()/1024/1024/1024).toFixed(2)}GB\n` +
                `> 🆓 Free RAM: ${(os.freemem()/1024/1024/1024).toFixed(2)}GB\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ── 🔢 Hash Generator ─────────────────────────────────────────
    {
        command: 'hash',
        description: 'Generate MD5/SHA256 hash of text',
        category: 'utility',
        execute: async (sock, m, { args, text, prefix, reply }) => {
            if (!text) return reply(`#️⃣ Usage: *${prefix}hash Hello World*`);
            const md5    = crypto.createHash('md5').update(text).digest('hex');
            const sha256 = crypto.createHash('sha256').update(text).digest('hex');
            reply(
                `#️⃣ *Hash Generator*\n\n` +
                `Input: \`${text.slice(0,50)}\`\n\n` +
                `> 🔷 MD5:\n\`${md5}\`\n\n` +
                `> 🔶 SHA256:\n\`${sha256}\`\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ── ✂️ Text Tools ─────────────────────────────────────────────
    {
        command: 'textcount',
        description: 'Count words, chars, lines in text',
        category: 'utility',
        execute: async (sock, m, { text, prefix, reply }) => {
            const q = m.quoted?.text || m.quoted?.caption || text;
            if (!q) return reply(`📊 Usage: *${prefix}textcount* (reply to a message) or *${prefix}textcount some text here*`);
            const chars   = q.length;
            const words   = q.trim().split(/\s+/).filter(Boolean).length;
            const lines   = q.split('\n').length;
            const sentences = (q.match(/[.!?]+/g) || []).length;
            reply(
                `📊 *Text Analysis*\n\n` +
                `> 🔤 Characters: ${chars}\n` +
                `> 📝 Words: ${words}\n` +
                `> 📄 Lines: ${lines}\n` +
                `> ❓ Sentences: ${sentences}\n` +
                `> ⏱️ Read time: ~${Math.ceil(words/200)} min\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ── 🎯 Dare Extreme Edition ────────────────────────────────────
    {
        command: 'challenge',
        description: 'Random challenge for groups',
        category: 'fun',
        execute: async (sock, m, { reply }) => {
            const challenges = [
                '📸 Post a photo of your current screen wallpaper!',
                '🎤 Send a 5-second voice note of you beatboxing.',
                '📝 Share the last photo in your gallery (pg-13 only!).',
                '🤳 Send a selfie taken RIGHT NOW, no filter!',
                '🎶 Name 3 songs from your most recently played playlist.',
                '⏱️ You have 60 seconds — type the alphabet backwards and send it!',
                '💌 Send your most used emoji to this chat.',
                '🧠 Quick! Name 5 countries starting with the letter "A" in 30 seconds.',
                '🤝 Tag someone in this chat and say one genuine nice thing about them.',
                '🎭 Describe your personality in exactly 5 emojis.',
            ];
            await sock.sendMessage(m.chat, { react: { text: '🎯', key: m.key } });
            reply(`🎯 *Group Challenge!*\n\n${challenges[~~(Math.random() * challenges.length)]}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },

    // ── 🌐 IP/URL Lookup ──────────────────────────────────────────
    {
        command: 'ipinfo',
        description: 'Look up IP address geolocation',
        category: 'utility',
        execute: async (sock, m, { args, prefix, reply }) => {
            const ip = args[0];
            if (!ip) return reply(`🌐 Usage: *${prefix}ipinfo 8.8.8.8*`);
            await sock.sendMessage(m.chat, { react: { text: '🌐', key: m.key } });
            try {
                const { data } = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 6000 });
                if (data.error) return reply(`❌ ${data.reason || 'Invalid IP'}`);
                reply(
                    `🌐 *IP Info — ${ip}*\n` +
                    `━━━━━━━━━━━━━━━━━━\n` +
                    `> 🌍 Country: ${data.country_name} ${data.country_code}\n` +
                    `> 🏙️ City: ${data.city || 'N/A'}\n` +
                    `> 📍 Region: ${data.region || 'N/A'}\n` +
                    `> ⏰ Timezone: ${data.timezone || 'N/A'}\n` +
                    `> 🌐 ISP: ${data.org || 'N/A'}\n` +
                    `> 🗺️ Coords: ${data.latitude}, ${data.longitude}\n` +
                    `━━━━━━━━━━━━━━━━━━\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            } catch { reply('❌ IP lookup failed. Try again.'); }
        }
    },

    // ── ⏰ Age Calculator ─────────────────────────────────────────
    {
        command: 'age',
        description: 'Calculate exact age from birthdate',
        category: 'utility',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text) return reply(`🎂 Usage: *${prefix}age 2000-06-15* (YYYY-MM-DD)`);
            const birth = new Date(text.trim());
            if (isNaN(birth)) return reply('❌ Invalid date. Use format: YYYY-MM-DD');
            const now    = new Date();
            let years    = now.getFullYear() - birth.getFullYear();
            let months   = now.getMonth()    - birth.getMonth();
            let days     = now.getDate()     - birth.getDate();
            if (days   < 0) { months--; days   += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
            if (months < 0) { years--;  months += 12; }
            const totalDays = Math.floor((now - birth) / 86400000);
            const nextBday  = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
            if (nextBday < now) nextBday.setFullYear(now.getFullYear() + 1);
            const daysLeft = Math.ceil((nextBday - now) / 86400000);

            reply(
                `🎂 *Age Calculator*\n\n` +
                `> 📅 Born: ${birth.toDateString()}\n` +
                `> 🎉 Age: *${years} years, ${months} months, ${days} days*\n` +
                `> 📆 Total days lived: ${totalDays.toLocaleString()}\n` +
                `> 🎁 Next birthday in: ${daysLeft} days\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ── 📡 Uptime Monitor ─────────────────────────────────────────
    {
        command: 'uptime',
        description: 'Show detailed bot uptime stats',
        category: 'general',
        execute: async (sock, m, { reply }) => {
            const up = process.uptime();
            const d  = ~~(up/86400), h = ~~(up%86400/3600), min = ~~(up%3600/60), s = ~~(up%60);
            const pct = ((up / (up + 1)) * 100).toFixed(4);
            reply(
                `📡 *LIAM EYES Uptime*\n\n` +
                `> ⏱️ Running: *${d}d ${h}h ${min}m ${s}s*\n` +
                `> 📊 Session uptime: ${pct}%\n` +
                `> 🔄 Bot version: Alpha v8\n` +
                `> 💾 RAM: ${(process.memoryUsage().heapUsed/1024/1024).toFixed(1)}MB\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ── 🎲 Spin Wheel ─────────────────────────────────────────────
    {
        command: 'spin',
        description: 'Spin a wheel between options',
        category: 'fun',
        execute: async (sock, m, { text, prefix, reply }) => {
            if (!text || !text.includes(',')) return reply(`🎡 Usage: *${prefix}spin Option1, Option2, Option3*`);
            const opts = text.split(',').map(o => o.trim()).filter(Boolean);
            if (opts.length < 2) return reply('❗ Provide at least 2 options.');
            await sock.sendMessage(m.chat, { react: { text: '🎡', key: m.key } });
            const pick = opts[~~(Math.random() * opts.length)];
            const wheel = opts.map((o, i) => o === pick ? `> 🏆 *${o}* ◀` : `   ${o}`).join('\n');
            reply(`🎡 *Wheel Spin*\n\n${wheel}\n\n🎯 Result: *${pick}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
        }
    },

];

// ── Helpers ───────────────────────────────────────────────────────
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [~~(h*360), ~~(s*100), ~~(l*100)];
}

function colorName(r, g, b) {
    const colors = [
        [[255,0,0],'Red'],[[0,255,0],'Lime'],[[0,0,255],'Blue'],
        [[255,255,0],'Yellow'],[[0,255,255],'Cyan'],[[255,0,255],'Magenta'],
        [[255,165,0],'Orange'],[[128,0,128],'Purple'],[[255,192,203],'Pink'],
        [[165,42,42],'Brown'],[[0,0,0],'Black'],[[255,255,255],'White'],
        [[128,128,128],'Gray'],[[0,128,0],'Green'],[[0,0,128],'Navy'],
        [[64,224,208],'Turquoise'],[[255,215,0],'Gold'],[[192,192,192],'Silver'],
    ];
    let best = 'Unknown', bestD = Infinity;
    for (const [[cr,cg,cb], name] of colors) {
        const d = Math.sqrt((r-cr)**2+(g-cg)**2+(b-cb)**2);
        if (d < bestD) { bestD = d; best = name; }
    }
    return best;
}
