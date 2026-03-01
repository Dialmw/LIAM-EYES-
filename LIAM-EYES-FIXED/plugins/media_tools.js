// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
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
    //  Creates a dedicated secondary Baileys socket for the target number,
    //  requests a pairing code directly from WhatsApp, sends it to the chat.
    //  When linked, saves creds as session ID and sends it to paired number DM.
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
                    `📱 *LIAM EYES — Pair a Number*\n\n` +
                    `Usage: *${prefix}pair 254712345678*\n\n` +
                    `Enter full number with country code, no + or spaces.\n\n` +
                    `Or visit: ${config.pairingSite}\n\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
            await reply(`⏳ _Requesting pairing code for +${num}… please wait._`);

            try {
                const pino     = require('pino');
                const os       = require('os');
                const fs2      = require('fs');
                const pathMod  = require('path');
                const {
                    default: makeWASocket,
                    useMultiFileAuthState,
                    fetchLatestBaileysVersion,
                    Browsers,
                    makeCacheableSignalKeyStore,
                    DisconnectReason,
                    delay,
                } = await import('@whiskeysockets/baileys');

                // Use a fresh temp session dir per number
                const tmpDir = pathMod.join(os.tmpdir(), 'liam_pair_' + num + '_' + Date.now());
                fs2.mkdirSync(tmpDir, { recursive: true });

                const { state: pairState, saveCreds: pairSave } = await useMultiFileAuthState(tmpDir);
                const { version } = await fetchLatestBaileysVersion();

                const pairSock = makeWASocket({
                    version,
                    auth: {
                        creds: pairState.creds,
                        keys: makeCacheableSignalKeyStore(pairState.keys, pino({ level: 'silent' })),
                    },
                    logger: pino({ level: 'silent' }),
                    printQRInTerminal: false,
                    browser: Browsers.macOS('Safari'),
                    syncFullHistory: false,
                    connectTimeoutMs: 60000,
                    keepAliveIntervalMs: 10000,
                });

                pairSock.ev.on('creds.update', pairSave);

                // Wait for socket to be ready then request code
                let codeRequested = false;
                let sessionSent   = false;
                let pairSockDone  = false;

                await new Promise((resolve) => {
                    const timeout = setTimeout(() => resolve(), 55000);

                    pairSock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
                        if (connection === 'open' && !sessionSent) {
                            sessionSent = true;
                            clearTimeout(timeout);

                            // Build session ID and send to paired number's DM
                            await delay(800);
                            const credsFile = pathMod.join(tmpDir, 'creds.json');
                            if (fs2.existsSync(credsFile)) {
                                const raw = fs2.readFileSync(credsFile);
                                const sessionId = 'LIAM:~' + Buffer.from(raw).toString('base64');
                                const pairedJid = num + '@s.whatsapp.net';

                                // Send session ID to paired number DM
                                await pairSock.sendMessage(pairedJid, { text: sessionId }).catch(() => {});
                                await delay(500);
                                await pairSock.sendMessage(pairedJid, {
                                    text:
                                        `╔══════════════════════════════╗\n` +
                                        `║  👁️ *𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒* Session Ready  ║\n` +
                                        `╚══════════════════════════════╝\n\n` +
                                        `✅ Your Session ID is above ↑\n` +
                                        `⚠️ *Keep it secret — never share it!*\n\n` +
                                        `📌 *To deploy the bot:*\n` +
                                        `1️⃣ Copy the LIAM:~ text above\n` +
                                        `2️⃣ Panel → Startup → set SESSION_ID\n` +
                                        `3️⃣ Restart the bot\n\n` +
                                        `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                                }).catch(() => {});

                                // Also notify in the original chat
                                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                                await sock.sendMessage(m.chat, {
                                    text:
                                        `✅ *+${num} paired successfully!*\n\n` +
                                        `📩 Session ID has been sent to *+${num}'s* WhatsApp DM.\n\n` +
                                        `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                                }, { quoted: m }).catch(() => {});
                            }

                            // Cleanup temp socket after delay
                            setTimeout(() => {
                                try { pairSock.end(); } catch (_) {}
                                try { fs2.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
                            }, 5000);

                            pairSockDone = true;
                            resolve();
                        }

                        if (connection === 'close') {
                            const code = lastDisconnect?.error?.output?.statusCode;
                            if (!sessionSent && !pairSockDone) {
                                clearTimeout(timeout);
                                try { fs2.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
                                resolve();
                            }
                        }
                    });

                    // Request pairing code once socket initialises
                    setTimeout(async () => {
                        if (!codeRequested) {
                            codeRequested = true;
                            try {
                                const code = await pairSock.requestPairingCode(num);
                                const formatted = code?.match(/.{1,4}/g)?.join('-') || code;

                                await sock.sendMessage(m.chat, { react: { text: '🔑', key: m.key } }).catch(() => {});

                                const codeMsg = await sock.sendMessage(m.chat, {
                                    text: `*${formatted}*`,
                                    contextInfo: { externalAdReply: {
                                        title: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — Pairing Code',
                                        body: `📱 +${num}  •  ⏱️ Valid 60 seconds`,
                                        thumbnailUrl: config.thumbUrl,
                                        sourceUrl: config.pairingSite,
                                        mediaType: 1,
                                    }}
                                }, { quoted: m }).catch(() => null);

                                await sock.sendMessage(m.chat, {
                                    text:
                                        `📲 *How to link +${num}:*\n` +
                                        `1️⃣ Open WhatsApp on that phone\n` +
                                        `2️⃣ Tap ⋮ Menu → *Linked Devices*\n` +
                                        `3️⃣ Tap *Link with Phone Number*\n` +
                                        `4️⃣ Enter the code ↑ within 60 seconds\n\n` +
                                        `📩 After linking, session ID will be sent to *+${num}* DM automatically.\n\n` +
                                        `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                                }, { quoted: codeMsg || m }).catch(() => {});

                            } catch (e) {
                                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                                await sock.sendMessage(m.chat, {
                                    text:
                                        `❌ *Pairing code failed*\n\n` +
                                        `Reason: ${e.message}\n\n` +
                                        `*Fixes:*\n` +
                                        `• Make sure +${num} has no active WhatsApp Web sessions\n` +
                                        `• Disconnect all linked devices on that number first\n` +
                                        `• Then try .pair again\n\n` +
                                        `Or use the web: ${config.pairingSite}\n\n` +
                                        `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                                }, { quoted: m }).catch(() => {});
                                try { pairSock.end(); } catch (_) {}
                                try { fs2.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
                                resolve();
                            }
                        }
                    }, 1500);
                });

            } catch (e) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                await reply(`❌ *Pair error:* ${e.message}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`).catch(() => {});
            }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .share <sessionId>
    //  Takes a LIAM:~ session ID and connects the bot to that paired number.
    //  Saves the session, restarts the connection. Does NOT change settings.js.
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'share',
        category: 'owner',
        owner: true,
        execute: async (sock, m, { args, reply, isCreator, prefix }) => {
            if (!isCreator) return reply(config.message.owner);

            const raw = args.join(' ').trim();
            if (!raw) {
                return reply(
                    `📤 *LIAM EYES — Share/Deploy Session*\n\n` +
                    `*Usage:* \`${prefix}share LIAM:~your_session_id_here\`\n\n` +
                    `This command connects the bot to the number linked to the given session ID.\n\n` +
                    `*Steps:*\n` +
                    `1️⃣ Get Session ID from: ${config.pairingSite}\n` +
                    `2️⃣ Send: \`.share LIAM:~xxxxx\`\n` +
                    `3️⃣ Bot restarts connected to your number\n\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            }

            if (!raw.startsWith('LIAM:~')) {
                return reply(
                    `❌ *Invalid session ID format*\n\n` +
                    `Session ID must start with \`LIAM:~\`\n\n` +
                    `Get one from: ${config.pairingSite}\n\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});
            await reply(`⏳ _Saving session and reconnecting bot to paired number..._`);

            const fs   = require('fs');
            const path = require('path');

            // Decode and save the new session creds
            const sessionDir = path.join(__dirname, '..', 'sessions', 'main');
            const credsPath  = path.join(sessionDir, 'creds.json');
            const backupDir  = path.join(__dirname, '..', 'sessions', 'backup');

            try {
                // Backup old session if exists
                if (fs.existsSync(credsPath)) {
                    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
                    const bk = path.join(backupDir, 'before_share_' + Date.now() + '.json');
                    fs.copyFileSync(credsPath, bk);
                }

                // Write new session
                const decoded = Buffer.from(raw.replace(/^LIAM:~/, ''), 'base64');
                if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
                fs.writeFileSync(credsPath, decoded);

                // Update settings.js sessionId so it persists on restart
                const settingsPath = path.join(__dirname, '..', 'settings', 'settings.js');
                if (fs.existsSync(settingsPath)) {
                    let settingsContent = fs.readFileSync(settingsPath, 'utf8');
                    settingsContent = settingsContent.replace(
                        /sessionId:\s*["'][^"']*["']/,
                        'sessionId: "' + raw + '"'
                    );
                    fs.writeFileSync(settingsPath, settingsContent, 'utf8');
                }

                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                await reply(
                    `✅ *Session saved successfully!*\n\n` +
                    `🔄 Bot is now restarting and will connect to the paired number.\n\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );

                // Give time for reply to send, then restart
                await sleep(2500);
                process.exit(0); // Panel auto-restarts the process
            } catch (e) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                return reply(`❌ *Failed to save session*\n\nError: ${e.message}\n\n> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`);
            }
        }
    },

    {
        command: 'poststatus',
        category: 'tostatus',
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

];
