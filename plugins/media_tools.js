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
                    `📱 *LIAM EYES — Pair a Number*\n\n` +
                    `Usage: *${prefix}pair 254712345678*\n\n` +
                    `Enter full number with country code, no + or spaces.\n\n` +
                    `Or use the pairing site: ${config.pairingSite}\n\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
            await reply(`⏳ _Connecting to pairing server for +${num}… (may take 20s if server is waking)_`);

            // ── Use pairing site API ──────────────────────────────────────────
            // The pairing site creates a dedicated socket that stays alive
            // until the user enters the code AND the session is saved.
            // Direct socket from bot conflicts on panel hosting.
            const siteBase = (config.pairingSite || 'https://liam-pannel.onrender.com/pair')
                .replace(/\/pair\b.*$/, '');

            // Step 1: Wake the server with a health ping first
            try {
                const healthUrl = siteBase + '/ping';
                const hU = new URL(healthUrl);
                await new Promise(res => {
                    const req = (hU.protocol === 'https:' ? require('https') : require('http'))
                        .get({ hostname: hU.hostname, path: '/ping', timeout: 5000 }, res);
                    req.on('error', () => res());
                    req.on('timeout', () => { req.destroy(); res(); });
                });
            } catch (_) {}

            // Step 2: Request pairing code
            let code = null, pairSid = null, apiError = null;
            try {
                const apiUrl = siteBase + '/code?number=' + encodeURIComponent(num);
                const u = new URL(apiUrl);
                const resp = await new Promise((resolve, reject) => {
                    const req = (u.protocol === 'https:' ? require('https') : require('http'))
                        .get(
                            { hostname: u.hostname, path: u.pathname + u.search,
                              timeout: 30000, headers: { 'User-Agent': 'LIAM-EYES/1.0' } },
                            (res) => {
                                let data = '';
                                res.on('data', d => data += d);
                                res.on('end', () => {
                                    try { resolve(JSON.parse(data)); }
                                    catch { resolve({ error: 'Bad response: ' + data.slice(0,80) }); }
                                });
                            }
                        );
                    req.on('error', reject);
                    req.on('timeout', () => { req.destroy(); reject(new Error('Pairing server timeout — it may still be waking. Try again in 30 seconds.')); });
                });
                if (resp.error) apiError = resp.error;
                else if (resp.code) { code = resp.code; pairSid = resp.sid; }
                else apiError = 'No code in response';
            } catch (e) { apiError = e.message; }

            if (!code) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply(
                    `❌ *Could not get pairing code*\n\n` +
                    `Reason: ${apiError || 'Unknown'}\n\n` +
                    `*Fixes:*\n` +
                    `• Log out all WhatsApp Web sessions on +${num}\n` +
                    `• Wait 30s (server may be waking) then try again\n` +
                    `• Use the site directly: ${config.pairingSite}\n\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
                );
            }

            // ── Send the code ─────────────────────────────────────────────────
            await sock.sendMessage(m.chat, { react: { text: '🔑', key: m.key } });

            const codeMsg = await sock.sendMessage(m.chat, {
                text: `*${code}*`,
                contextInfo: { externalAdReply: {
                    title: '𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 — Pairing Code',
                    body: `📱 +${num}  •  ⏱️ Valid 60 seconds`,
                    thumbnailUrl: config.thumbUrl, sourceUrl: config.pairingSite, mediaType: 1,
                }}
            }, { quoted: m });

            await sock.sendMessage(m.chat, {
                text:
                    `📲 *How to link:*\n` +
                    `1️⃣ Open WhatsApp on *+${num}*\n` +
                    `2️⃣ Tap ⋮ Menu → *Linked Devices*\n` +
                    `3️⃣ Tap *Link with Phone Number*\n` +
                    `4️⃣ Enter the code above ↑\n\n` +
                    `⏱️ _Code expires in 60 seconds!_\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `📦 *After linking:*\n` +
                    `A session ID (LIAM~...) will be sent to *+${num}'s* WhatsApp DM.\n\n` +
                    `1️⃣ Copy the LIAM~ message\n` +
                    `2️⃣ Panel → Startup/Env → set *SESSION_ID = LIAM~...*\n` +
                    `3️⃣ Click *Start/Restart*\n\n` +
                    `⚠️ _This code links a new session — set SESSION_ID to deploy!_\n\n` +
                    `> 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒 👁️`
            }, { quoted: codeMsg });
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

];
