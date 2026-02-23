// ─────────────────────────────────────────────────────────────────────────────
//  LIAM EYES — Media & Identity Tools
//  .pair  .share  .tostatus  .toprofile  .tomenuimg
//  .autobio  .menustyle
// ─────────────────────────────────────────────────────────────────────────────
const config = require('../settings/config');
const fs     = require('fs');
const path   = require('path');
const pino   = require('pino');

// ── Fancy bold-sans font ─────────────────────────────────────────────────────
function fancy(text) {
    const map = {
        A:'𝗔',B:'𝗕',C:'𝗖',D:'𝗗',E:'𝗘',F:'𝗙',G:'𝗚',H:'𝗛',I:'𝗜',J:'𝗝',K:'𝗞',L:'𝗟',
        M:'𝗠',N:'𝗡',O:'𝗢',P:'𝗣',Q:'𝗤',R:'𝗥',S:'𝗦',T:'𝗧',U:'𝗨',V:'𝗩',W:'𝗪',X:'𝗫',
        Y:'𝗬',Z:'𝗭',
        a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',
        m:'𝗺',n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',
        y:'𝘆',z:'𝘇',
        '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵',
    };
    return text.split('').map(c => map[c] || c).join('');
}

// ── Auto-bio interval handle ─────────────────────────────────────────────────
let _bioClock = null;

// ── Media download helper ────────────────────────────────────────────────────
const dlMedia = async (sock, q) => {
    const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
    const mime   = (q.msg || q).mimetype || '';
    const type   = q.mtype ? q.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(q.msg || q, type);
    let buf = Buffer.from([]);
    for await (const c of stream) buf = Buffer.concat([buf, c]);
    return buf;
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = [

    // ─────────────────────────────────────────────────────────────────────────
    //  .pair <number>
    //  Spawns a temporary socket, gets a pairing code, sends the bare code
    //  first (easy copy), then replies to it with step-by-step instructions.
    //  When the number pairs, sends bare Session ID first, then instructions.
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'pair',
        category: 'owner',
        owner: true,
        execute: async (sock, m, { args, reply, isCreator, prefix }) => {
            if (!isCreator) return reply(config.message.owner);

            const num = (args[0] || '').replace(/\D/g, '');
            if (!num || num.length < 7) {
                return reply(
                    `📱 *${fancy('LIAM EYES')} — Pair a Number*\n\n` +
                    `Usage: *${prefix}pair 254712345678*\n\n` +
                    `Enter number with country code, no + or spaces.\n` +
                    `• 254712345678 _(Kenya)_\n` +
                    `• 2348012345678 _(Nigeria)_\n` +
                    `• 12025550000 _(USA)_\n\n` +
                    `Or visit: ${config.pairingSite}\n\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
            await reply(`⏳ _Requesting pairing code for +${num}…_`);

            try {
                const {
                    default: makeWASocket,
                    useMultiFileAuthState,
                    fetchLatestBaileysVersion,
                    makeCacheableSignalKeyStore,
                    Browsers,
                } = await import('@whiskeysockets/baileys');

                const tmpDir = path.join(__dirname, '..', 'sessions', `tmp_${num}_${Date.now()}`);
                fs.mkdirSync(tmpDir, { recursive: true });

                const { state, saveCreds } = await useMultiFileAuthState(tmpDir);
                const { version }          = await fetchLatestBaileysVersion();
                const logger               = pino({ level: 'silent' });

                const tmpSock = makeWASocket({
                    version,
                    auth: {
                        creds: state.creds,
                        keys:  makeCacheableSignalKeyStore(state.keys, logger),
                    },
                    logger,
                    browser:             Browsers.macOS('Safari'),
                    printQRInTerminal:   false,
                    syncFullHistory:     false,
                    connectTimeoutMs:    30000,
                    keepAliveIntervalMs: 20000,
                });

                let credsReady = false;
                tmpSock.ev.on('creds.update', async () => { await saveCreds(); credsReady = true; });

                // ── Get the pairing code (retry up to 3 times) ───────────
                await sleep(400); // minimal wait for event listener
                let code = null, lastErr = '';
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        code = await tmpSock.requestPairingCode(num);
                        break;
                    } catch (e) {
                        lastErr = e.message;
                        if (attempt < 3) await sleep(700);
                    }
                }

                if (!code) {
                    try { tmpSock.end(); } catch (_) {}
                    fs.rmSync(tmpDir, { recursive: true, force: true });
                    return reply(`❌ *Could not get pairing code*\n\n${lastErr}\n\nTry again or visit: ${config.pairingSite}`);
                }

                const formatted = code.match(/.{1,4}/g)?.join('-') || code;
                await sock.sendMessage(m.chat, { react: { text: '🔑', key: m.key } });

                // ── Message 1: bare code — easy to select and copy ────────
                const codeMsg = await sock.sendMessage(m.chat, {
                    text: `*${formatted}*`,
                    contextInfo: { externalAdReply: {
                        title: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — Pairing Code',
                        body:  `📱 +${num}  •  ⏱️ Valid 60 seconds`,
                        thumbnailUrl: config.thumbUrl,
                        sourceUrl:    config.pairingSite,
                        mediaType:    1,
                    }}
                }, { quoted: m });

                // ── Message 2: reply to the code with instructions ─────────
                await sock.sendMessage(m.chat, {
                    text:
                        `📲 *How to enter this code in WhatsApp:*\n\n` +
                        `1️⃣ Open WhatsApp on *+${num}*\n` +
                        `2️⃣ Tap ⋮ Menu → *Linked Devices*\n` +
                        `3️⃣ Tap *Link with Phone Number*\n` +
                        `4️⃣ Copy the code above ↑ and enter it\n\n` +
                        `⏱️ _Code expires in 60 seconds — act fast!_\n\n` +
                        `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                }, { quoted: codeMsg });

                // ── Listen for successful pairing → send Session ID ────────
                let done = false;
                tmpSock.ev.on('connection.update', async ({ connection }) => {
                    if (connection === 'open' && !done) {
                        done = true;

                        // Wait for creds to be fully written
                        let waited = 0;
                        while (!credsReady && waited < 10000) { await sleep(200); waited += 200; }
                        await sleep(400);

                        const cp = path.join(tmpDir, 'creds.json');
                        let raw = null;
                        for (let i = 0; i < 20; i++) {
                            try {
                                if (fs.existsSync(cp)) {
                                    const b = fs.readFileSync(cp);
                                    if (b.length > 50) { raw = b; break; }
                                }
                            } catch (_) {}
                            await sleep(300);
                        }

                        if (raw) {
                            const sid = 'LIAM~' + raw.toString('base64url');

                            // ── Backup session ID to disk first ─────────────
                            const backupDir = path.join(__dirname, '..', 'sessions', 'backup');
                            fs.mkdirSync(backupDir, { recursive: true });
                            const backupId = `pair_${num}_${Date.now()}`;
                            try {
                                fs.writeFileSync(
                                    path.join(backupDir, backupId + '.json'),
                                    JSON.stringify({ sid, num, ts: Date.now() })
                                );
                            } catch (_) {}

                            // ── Send bare Session ID first — easy to copy ──
                            const sidMsg = await sock.sendMessage(m.chat, {
                                text: sid,
                                contextInfo: { externalAdReply: {
                                    title: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — Session ID',
                                    body:  `✅ Paired: +${num}  |  Long-press to copy`,
                                    thumbnailUrl: config.thumbUrl,
                                    sourceUrl:    config.pairingSite,
                                    mediaType:    1,
                                }}
                            });

                            // ── Reply to it with save instructions ─────────
                            await sock.sendMessage(m.chat, {
                                text:
                                    `✅ *${fancy('Pairing Successful!')}*\n\n` +
                                    `📱 Number: *+${num}*\n\n` +
                                    `📋 *How to use this Session ID:*\n` +
                                    `1️⃣ Long-press the LIAM~ message above ↑\n` +
                                    `2️⃣ Tap *Copy*\n` +
                                    `3️⃣ Open *settings/settings.js*\n` +
                                    `4️⃣ Paste into \`sessionId: "..."\`\n` +
                                    `5️⃣ Save & run *npm start* 🚀\n\n` +
                                    `⚠️ _Never share your Session ID!_\n\n` +
                                    `🔄 *Backup ID:* \`${backupId}\`\n` +
                                    `_If you lose the ID above, check sessions/backup/${backupId}.json_\n\n` +
                                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                            }, { quoted: sidMsg });
                        }

                        try { tmpSock.end(); } catch (_) {}
                        setTimeout(() => fs.rmSync(tmpDir, { recursive: true, force: true }), 10000);
                    }

                    if (connection === 'close' && !done) {
                        setTimeout(() => fs.rmSync(tmpDir, { recursive: true, force: true }), 60000);
                    }
                });

            } catch (e) {
                reply(`❌ *Pairing failed:* ${e.message}\n\nVisit: ${config.pairingSite}`);
            }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .share — share bot card with logo image
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'share',
        category: 'owner',
        execute: async (sock, m, { reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '📤', key: m.key } });
            const logoPath  = path.join(__dirname, '..', 'thumbnail', 'logo.jpg');
            const logoExists = fs.existsSync(logoPath);
            const caption =
                `╔══════════════════════════════╗\n` +
                `║  👁️  ${fancy('LIAM EYES')} — ${fancy('Alpha Bot')}  ║\n` +
                `╚══════════════════════════════╝\n\n` +
                `_"${fancy('Your Eyes in the WhatsApp World')}"_\n\n` +
                `🔗 *${fancy('Pair your bot')}*\n${config.pairingSite}\n\n` +
                `📡 *${fancy('Join Channel')}*\n${config.autoJoinChannel}\n\n` +
                `💻 *${fancy('GitHub')}*\n${config.github || 'https://github.com/Dialmw/LIAM-EYES'}\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️ — by ${fancy('Liam')}`;

            if (logoExists) {
                await sock.sendMessage(m.chat, {
                    image: fs.readFileSync(logoPath),
                    caption,
                    contextInfo: { externalAdReply: {
                        title: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒',
                        body: '👁️ Get your own bot!',
                        thumbnailUrl: config.thumbUrl,
                        sourceUrl:    config.pairingSite,
                        mediaType:    1,
                    }}
                }, { quoted: m });
            } else {
                await reply(caption);
            }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .tostatus — reply to an image/video → post as WA status
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'tostatus',
        category: 'media',
        owner: true,
        execute: async (sock, m, { reply, isCreator }) => {
            if (!isCreator) return reply(config.message.owner);
            const q    = m.quoted || m;
            const mime = (q.msg || q).mimetype || '';
            if (!mime.includes('image') && !mime.includes('video'))
                return reply('❗ *Reply to an image or video* to post it as your status!');

            await sock.sendMessage(m.chat, { react: { text: '📤', key: m.key } });
            try {
                const buf = await dlMedia(sock, q);
                const payload = mime.includes('video')
                    ? { video: buf, caption: config.tagline }
                    : { image: buf, caption: config.tagline };
                await sock.sendMessage('status@broadcast', payload);
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                reply(`✅ *${fancy('Posted to Status!')}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
            } catch (e) { reply(`❌ Failed: ${e.message}`); }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .toprofile — reply to an image → set as BOT's profile picture
    //  (strips the :0 device suffix from sock.user.id before calling updateProfilePicture)
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'toprofile',
        category: 'media',
        owner: true,
        execute: async (sock, m, { reply, isCreator }) => {
            if (!isCreator) return reply(config.message.owner);
            const q    = m.quoted || m;
            const mime = (q.msg || q).mimetype || '';
            if (!mime.includes('image'))
                return reply('❗ *Reply to an image* to set it as the bot\'s profile picture!');

            await sock.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } });
            try {
                const buf    = await dlMedia(sock, q);
                // Baileys returns id like "254712345678:0@s.whatsapp.net" — strip device suffix
                const botJid = (sock.user?.id || '').replace(/:\d+@/, '@');
                await sock.updateProfilePicture(botJid, buf);
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                reply(`✅ *${fancy('Bot Profile Pic Updated!')}*\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
            } catch (e) { reply(`❌ Failed: ${e.message}\n_Ensure bot has permission to update its profile._`); }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .tomenuimg — reply to an image → replace .menu thumbnail
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'tomenuimg',
        category: 'media',
        owner: true,
        execute: async (sock, m, { reply, isCreator }) => {
            if (!isCreator) return reply(config.message.owner);
            const q    = m.quoted || m;
            const mime = (q.msg || q).mimetype || '';
            if (!mime.includes('image'))
                return reply('❗ *Reply to an image* to set it as the menu thumbnail!');

            await sock.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } });
            try {
                const buf     = await dlMedia(sock, q);
                const imgPath = path.join(__dirname, '..', 'thumbnail', 'image.jpg');
                fs.writeFileSync(imgPath, buf);
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                reply(`✅ *${fancy('Menu Image Updated!')}*\n\n_Type .menu to see the new look!_\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
            } catch (e) { reply(`❌ Failed: ${e.message}`); }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .autobio on | off | set <text>
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'autobio',
        category: 'tools',
        owner: true,
        execute: async (sock, m, { args, reply, isCreator }) => {
            if (!isCreator) return reply(config.message.owner);
            const sub = (args[0] || '').toLowerCase();

            if (sub === 'set') {
                const newText = args.slice(1).join(' ');
                if (!newText) return reply(`✏️ Usage: *.autobio set Your text {time}*\n_Use {time} as a live clock placeholder._`);
                config.autoBioText = newText;
                return reply(`✅ *${fancy('Auto Bio Text Set!')}*\n\n_"${newText}"_\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
            }

            if (sub === 'on' || sub === 'off' || sub === '') {
                const on = sub === 'on' ? true : sub === 'off' ? false : !config.autoBio;
                config.autoBio = on;

                if (on) {
                    if (_bioClock) clearInterval(_bioClock);
                    const updateBio = async () => {
                        try {
                            const t = new Date().toLocaleTimeString('en-US', { hour12: true });
                            await sock.updateProfileStatus(
                                (config.autoBioText || '👁️ LIAM EYES | {time}').replace('{time}', t)
                            );
                        } catch (_) {}
                    };
                    await updateBio();
                    _bioClock = setInterval(updateBio, 5 * 60 * 1000);
                } else {
                    if (_bioClock) { clearInterval(_bioClock); _bioClock = null; }
                }

                await sock.sendMessage(m.chat, { react: { text: on ? '✍️' : '❌', key: m.key } });
                return reply(
                    `✍️ *${fancy('Auto Bio')}*\n\n` +
                    `${on
                        ? '╔═══════════════════╗\n║  ✅  E N A B L E D  ║\n╚═══════════════════╝\n\n_Updates every 5 min_'
                        : '╔════════════════════╗\n║  ❌  D I S A B L E D  ║\n╚════════════════════╝'
                    }\n\n` +
                    `> Template: _"${config.autoBioText}"_\n` +
                    `> Change: *.autobio set Your text {time}*\n\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            }

            reply(
                `✍️ *${fancy('Auto Bio')} — Help*\n\n` +
                `*.autobio on* — Enable\n` +
                `*.autobio off* — Disable\n` +
                `*.autobio set Text {time}* — Set template\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .menustyle 1|2|3|4
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'menustyle',
        category: 'settings',
        owner: true,
        execute: async (sock, m, { args, reply, isCreator }) => {
            if (!isCreator) return reply(config.message.owner);
            const n = parseInt(args[0]);
            const labels = {
                1: '📋 Numbered  — reply with number to open a section',
                2: '🗂️ Classic   — boxed categories, all commands listed',
                3: '🌸 Cursive   — fancy script font, flower bullets',
                4: '💎 Grid      — bold-italic headers, two-column layout',
            };
            if (![1, 2, 3, 4].includes(n)) {
                return reply(
                    `🎨 *${fancy('Menu Styles')}*\n\n` +
                    Object.entries(labels).map(([k, v]) => `*${k}* — ${v}`).join('\n') +
                    `\n\nUsage: *.menustyle 3*\n` +
                    `Active: *Style ${config.menuStyle || 1}*\n\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            }
            config.menuStyle = n;
            await sock.sendMessage(m.chat, { react: { text: '🎨', key: m.key } });
            reply(
                `🎨 *${fancy('Menu Style')} → ${n}*\n\n` +
                `${labels[n]} activated!\n\n` +
                `_Type .menu to see the new layout_\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .setstatusemoji  — customize auto-react emojis for statuses
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'setstatusemoji',
        category: 'settings',
        owner: true,
        execute: async (sock, m, { args, reply, isCreator }) => {
            if (!isCreator) return reply(config.message.owner);

            // No args → show current list
            if (!args.length) {
                const current = (config.statusReactEmojis || []).join('  ');
                return reply(
                    `😍 *${fancy('Status React Emojis')}*\n\n` +
                    `Current: ${current}\n\n` +
                    `To change, send the emojis separated by spaces:\n` +
                    `*.setstatusemoji ❤️ 🔥 😍 🤩 💯*\n\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            }

            // Set new list — each arg should be a single emoji
            const newEmojis = args.filter(a => a.trim().length > 0);
            if (!newEmojis.length) return reply('❗ Provide at least one emoji.');

            config.statusReactEmojis = newEmojis;
            await sock.sendMessage(m.chat, { react: { text: newEmojis[0], key: m.key } });
            reply(
                `✅ *${fancy('Status Emojis Updated!')}*\n\n` +
                `New pool: ${newEmojis.join('  ')}\n\n` +
                `Bot will randomly pick from these when auto-reacting to statuses.\n\n` +
                `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            );
        }
    },

];
