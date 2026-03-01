// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES-                         ║
// ════════════════════════════════════════════════════════════════════════════
// ── NEW FEATURES ─────────────────────────────────────────────────────────────
//  .vvp      — bypass view-once: forward to owner DM
//  .steal    — steal a sticker and repack with custom name
//  .pin      — pin a message in group (bot must be admin)
//  .rules    — set / show group rules
//  .warn     — warn a user (3 warns = auto kick)
//  .clearwarn— clear warnings for a user
//  .tagall   — tag all group members
//  .ghost    — go offline mode temporarily (invisible online)
//  .clearchat— clear bot's chat history display (fake clear)
//  .profile  — view someone's profile picture by tag/number
// ─────────────────────────────────────────────────────────────────────────────
'use strict';
const config = require('../settings/config');
const fs     = require('fs');
const path   = require('path');
const axios  = require('axios');

const sig  = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Warning store (in-memory, resets on restart) ──────────────────────────────
const warnStore = new Map(); // key: `${chatId}:${number}` → count

module.exports = [

    // ─────────────────────────────────────────────────────────────────────────
    //  .vvp — View Once Bypass
    //  Reply to a view-once message → bot forwards the media to owner DM
    //  so the sender never knows it was saved.
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'vvp',
        category: 'tools',
        description: 'Bypass view-once — saves media to your DM',
        execute: async (sock, m, { reply }) => {
            // The bot pre-downloads view-once immediately on arrival into sock._vvpCache.
            // Reply to any 🔴 view-once message then type .vvp to retrieve it.
            const ownerJid = (config.owner || '').split('@')[0].split(':')[0] + '@s.whatsapp.net';

            if (!m.quoted) {
                return reply(
                    `❗ *Reply to a view-once message then type .vvp*\n\n` +
                    `💡 The bot captures view-once photos/videos automatically as they arrive.\n` +
                    `Just reply to the 🔴 view-once bubble with *.vvp* and it gets sent to your DM.\n\n` +
                    `Or type *.vvpmode on* to auto-save ALL view-once without needing .vvp.\n\n${sig()}`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '👁️', key: m.key } }).catch(() => {});

            try {
                const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');

                // Normalise a JID (strip device suffix)
                const normQ = j => (j || '').replace(/:\d+(?=@)/, '');

                // The ID of the quoted message
                const quotedId  = m.quoted.id || (m.quoted.key && m.quoted.key.id) || '';
                const quotedJid = normQ(m.quoted.chat || (m.quoted.key && m.quoted.key.remoteJid) || m.chat || '');
                const chatJid   = normQ(m.chat || '');

                // Build all possible cache keys
                const cacheKeys = quotedId ? [
                    `${quotedJid}:${quotedId}`,
                    `${chatJid}:${quotedId}`,
                    `${m.chat}:${quotedId}`,
                ] : [];

                // Check sock._vvpCache (pre-downloaded on arrival)
                let cached = null;
                const vvpC = sock._vvpCache;
                if (vvpC) {
                    for (const ck of cacheKeys) {
                        cached = vvpC.get(ck);
                        if (cached && cached.buf && cached.buf.length > 50) break;
                        cached = null;
                    }
                }

                let mediaBuf   = cached ? cached.buf  : null;
                let mediaType  = cached ? cached.type : null;
                let senderName = cached ? cached.senderName : (m.quoted.pushName || m.pushName || 'Unknown');

                // Fallback: try downloading from the quoted message's raw content
                if (!mediaBuf && quotedId) {
                    // Try via the fakeObj (Baileys serialized form)
                    const fakeMsg = (m.quoted.fakeObj && m.quoted.fakeObj.message) || {};
                    const vvTypes = ['viewOnceMessage','viewOnceMessageV2','viewOnceMessageV2Extension'];
                    let inner = fakeMsg;
                    for (const t of vvTypes) { if (fakeMsg[t]) { inner = fakeMsg[t].message || fakeMsg[t]; break; } }

                    const MMAP = { imageMessage:'image', videoMessage:'video', audioMessage:'audio', stickerMessage:'sticker' };
                    const candidates = [inner, fakeMsg];
                    outer: for (const obj of candidates) {
                        for (const [mt, dlType] of Object.entries(MMAP)) {
                            if (!obj[mt]) continue;
                            try {
                                const stream = await downloadContentFromMessage(obj[mt], dlType);
                                let buf = Buffer.from([]);
                                for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
                                if (buf.length > 50) { mediaBuf = buf; mediaType = mt; break outer; }
                            } catch (_) {}
                        }
                    }
                }

                if (!mediaBuf || mediaBuf.length < 50) {
                    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                    return reply(
                        `❌ *Could not retrieve view-once media*\n\n` +
                        `_It may have expired or already been cleared by WhatsApp._\n\n` +
                        `💡 Enable *.vvpmode on* so the bot automatically saves all view-once as they arrive — no command needed.\n\n${sig()}`
                    );
                }

                const alertText =
                    `👁️ *[VIEW ONCE BYPASS]* 🔓\n\n` +
                    `👤 *From:* ${senderName}\n` +
                    `🕐 *Time:* ${new Date().toLocaleTimeString('en-US', { hour12: false })}\n` +
                    `📅 *Date:* ${new Date().toLocaleDateString('en-GB')}\n\n` +
                    `${sig()}`;

                if (mediaType === 'videoMessage') {
                    await sock.sendMessage(ownerJid, { video: mediaBuf, caption: alertText }).catch(() => {});
                } else if (mediaType === 'audioMessage') {
                    const hdrMsg = await sock.sendMessage(ownerJid, { text: alertText }).catch(() => null);
                    sock.sendMessage(ownerJid, { audio: mediaBuf, mimetype: 'audio/mp4', ptt: true },
                        hdrMsg ? { quoted: hdrMsg } : {}).catch(() => {});
                } else {
                    await sock.sendMessage(ownerJid, { image: mediaBuf, caption: alertText }).catch(() => {});
                }

                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                await reply(`✅ *View-once saved to your DM!* 📩\n\n${sig()}`);

            } catch (e) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {});
                reply(`❌ VVP error: ${e.message}\n\n${sig()}`);
            }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .steal — Steal a sticker and repack it with bot's pack name
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'steal',
        category: 'tools',
        description: 'Steal a sticker and repack it with custom name',
        execute: async (sock, m, { args, reply }) => {
            const q    = m.quoted || m;
            const mime = (q.msg || q).mimetype || '';

            if (!mime.includes('webp') && !mime.includes('sticker')) {
                return reply(`❗ *Reply to a sticker* to steal it!\\n\\nUsage: *.steal [packname] [author]*\\n\\n${sig()}`);
            }

            const packname = args[0] || 'LIAM EYES';
            const author   = args[1] || 'Liam';

            await sock.sendMessage(m.chat, { react: { text: '🎨', key: m.key } }).catch(() => {});

            try {
                const buf = await sock.downloadMediaMessage(q.msg || q);
                await sock.sendImageAsSticker(m.chat, buf, m, { packname, author });
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                reply(`✅ *Sticker stolen!*\\n📦 Pack: *${packname}*\\n✍️ Author: *${author}*\\n\\n${sig()}`);
            } catch (e) {
                reply(`❌ Steal failed: ${e.message}\\n\\n${sig()}`);
            }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .tagall — Tag all members in a group
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'tagall',
        category: 'group',
        description: 'Tag all group members',
        execute: async (sock, m, { args, reply, isAdmins, isBotAdmins, groupMetadata, participants }) => {
            if (!m.isGroup) return reply(`❗ Group only command!\\n\\n${sig()}`);
            if (!isAdmins && !isBotAdmins) return reply(`❗ Admin only!\\n\\n${sig()}`);

            const msg  = args.join(' ') || '📢 Attention everyone!';
            const jids = (participants || []).map(p => p.id).filter(Boolean);
            const mentions = jids;

            const text = `📢 *${msg}*\\n\\n` +
                jids.map(j => `@${j.split('@')[0]}`).join(' ') +
                `\\n\\n${sig()}`;

            await sock.sendMessage(m.chat, { text, mentions }).catch(() => {});
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .warn @user — Warn a user. 3 warns = auto-kick
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'warn',
        category: 'group',
        description: 'Warn a user (3 warns = auto-kick)',
        execute: async (sock, m, { args, reply, isAdmins, isBotAdmins, participants }) => {
            if (!m.isGroup) return reply(`❗ Group only!\\n\\n${sig()}`);
            if (!isAdmins) return reply(config.message.admin);

            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                || m.quoted?.key?.participant
                || m.quoted?.key?.remoteJid;

            if (!mentioned) return reply(`❗ Tag or reply to a user to warn them.\\n\\n${sig()}`);

            const num     = mentioned.split('@')[0];
            const warnKey = `${m.chat}:${num}`;
            const prev    = warnStore.get(warnKey) || 0;
            const count   = prev + 1;
            warnStore.set(warnKey, count);

            const MAX = 3;
            await sock.sendMessage(m.chat, {
                text:
                    `⚠️ *USER WARNED*\\n\\n` +
                    `👤 @${num}\\n` +
                    `🔢 Warnings: *${count}/${MAX}*\\n\\n` +
                    (count >= MAX
                        ? `🚨 *MAX WARNINGS REACHED — Removing from group!*`
                        : `⚠️ ${MAX - count} warning(s) remaining before kick.`) +
                    `\\n\\n${sig()}`,
                mentions: [mentioned],
            }).catch(() => {});

            if (count >= MAX && isBotAdmins) {
                await sleep(1500);
                await sock.groupParticipantsUpdate(m.chat, [mentioned], 'remove').catch(() => {});
                warnStore.delete(warnKey);
                await sock.sendMessage(m.chat, {
                    text: `🚫 @${num} was *removed* after ${MAX} warnings.\\n\\n${sig()}`,
                    mentions: [mentioned],
                }).catch(() => {});
            }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .clearwarn @user — Clear all warnings for a user
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'clearwarn',
        category: 'group',
        description: 'Clear warnings for a user',
        execute: async (sock, m, { reply, isAdmins }) => {
            if (!m.isGroup) return reply(`❗ Group only!\\n\\n${sig()}`);
            if (!isAdmins) return reply(config.message.admin);

            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                || m.quoted?.key?.participant;

            if (!mentioned) return reply(`❗ Tag or reply to a user.\\n\\n${sig()}`);

            const num = mentioned.split('@')[0];
            warnStore.delete(`${m.chat}:${num}`);

            await sock.sendMessage(m.chat, {
                text: `✅ *Warnings cleared* for @${num}\\n\\n${sig()}`,
                mentions: [mentioned],
            }).catch(() => {});
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .rules — Show or set group rules
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'rules',
        category: 'group',
        description: 'Show or set group rules (.rules set <text>)',
        execute: async (sock, m, { args, reply, isAdmins, groupMetadata }) => {
            if (!m.isGroup) return reply(`❗ Group only!\\n\\n${sig()}`);

            const rulesFile = path.join(__dirname, '..', 'library', 'database', 'rules.json');
            let rules = {};
            try { rules = JSON.parse(fs.readFileSync(rulesFile, 'utf8')); } catch (_) {}

            if (args[0] === 'set' && isAdmins) {
                const text = args.slice(1).join(' ');
                if (!text) return reply(`❗ Usage: *.rules set <your rules here>*\\n\\n${sig()}`);
                rules[m.chat] = text;
                fs.writeFileSync(rulesFile, JSON.stringify(rules, null, 2));
                return reply(`✅ *Group rules updated!*\\n\\n${sig()}`);
            }

            const groupRules = rules[m.chat];
            if (!groupRules) {
                return reply(
                    `📋 *No rules set for this group.*\\n\\n` +
                    `Admins can set rules with:\\n*.rules set <rules text>*\\n\\n${sig()}`
                );
            }

            const groupName = groupMetadata?.subject || 'This Group';
            await sock.sendMessage(m.chat, {
                text:
                    `📋 *${groupName} — Rules*\\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\\n\\n` +
                    groupRules +
                    `\\n\\n━━━━━━━━━━━━━━━━━━━━━━\\n${sig()}`,
            }).catch(() => {});
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .profile @user — View someone's profile picture
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'profile',
        category: 'tools',
        description: 'View profile picture of a tagged user or number',
        execute: async (sock, m, { args, reply }) => {
            let targetJid = null;

            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (mentioned) {
                targetJid = mentioned;
            } else if (m.quoted) {
                targetJid = m.quoted.key?.participant || m.quoted.key?.remoteJid;
            } else if (args[0]) {
                const num = args[0].replace(/\\D/g, '');
                if (num.length >= 7) targetJid = num + '@s.whatsapp.net';
            }

            if (!targetJid) {
                return reply(`❗ *Tag a user, reply to their message, or provide a number.*\\nExample: *.profile 254712345678*\\n\\n${sig()}`);
            }

            await sock.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } }).catch(() => {});

            try {
                const ppUrl = await sock.profilePictureUrl(targetJid, 'image').catch(() => null);
                const num   = targetJid.split('@')[0];

                if (!ppUrl) {
                    return reply(`❌ No profile picture found for +${num} (may be hidden)\\n\\n${sig()}`);
                }

                const { data: buf } = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 10000 });

                await sock.sendMessage(m.chat, {
                    image: Buffer.from(buf),
                    caption: `🖼️ *Profile Picture*\\n👤 +${num}\\n\\n${sig()}`,
                }, { quoted: m }).catch(() => {});

                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
            } catch (e) {
                reply(`❌ Could not fetch profile picture: ${e.message}\\n\\n${sig()}`);
            }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .ghost on/off — Toggle invisible mode (stop sending presence updates)
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'ghost',
        category: 'settings',
        owner: true,
        description: 'Toggle ghost/invisible mode',
        execute: async (sock, m, { args, reply, isCreator }) => {
            if (!isCreator) return reply(config.message.owner);

            const arg = (args[0] || '').toLowerCase();
            if (!config.features) config.features = {};

            const on = arg === 'on' ? true : arg === 'off' ? false : !config.features.ghost;
            config.features.ghost = on;

            if (on) {
                // Go offline — stop presence updates
                await sock.sendPresenceUpdate('unavailable').catch(() => {});
                await sock.updateLastSeenPrivacy('nobody').catch(() => {});
                await sock.updateOnlinePrivacy?.('match_last_seen').catch(() => {});
            } else {
                await sock.sendPresenceUpdate('available').catch(() => {});
                await sock.updateLastSeenPrivacy('contacts').catch(() => {});
            }

            await sock.sendMessage(m.chat, { react: { text: on ? '👻' : '👁️', key: m.key } }).catch(() => {});
            reply(
                `${on ? '👻' : '👁️'} *Ghost Mode*\\n\\n` +
                (on
                    ? `╔═══════════════════╗\\n║  👻  E N A B L E D  ║\\n╚═══════════════════╝\\n\\n_Bot is now invisible — no online/last seen_`
                    : `╔══════════════════════╗\\n║  ❌  D I S A B L E D  ║\\n╚══════════════════════╝\\n\\n_Bot is back online_`
                ) +
                `\\n\\n${sig()}`
            );
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .pin — Pin a replied message in a group
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'pin',
        category: 'group',
        description: 'Pin a replied message in a group',
        execute: async (sock, m, { args, reply, isAdmins, isBotAdmins }) => {
            if (!m.isGroup) return reply(`❗ Group only!\\n\\n${sig()}`);
            if (!isAdmins) return reply(config.message.admin);
            if (!isBotAdmins) return reply(`❗ Bot needs to be admin to pin messages!\\n\\n${sig()}`);
            if (!m.quoted) return reply(`❗ *Reply to a message* to pin it!\\n\\n${sig()}`);

            const duration = parseInt(args[0]) || 86400; // default 24h in seconds

            try {
                await sock.sendMessage(m.chat, {
                    pin: { type: 1, time: duration },
                    key: m.quoted.key,
                }).catch(() => {});

                await sock.sendMessage(m.chat, { react: { text: '📌', key: m.key } }).catch(() => {});
                reply(`📌 *Message pinned!*\\n⏱️ Duration: ${duration >= 86400 ? Math.round(duration/86400) + ' day(s)' : duration + 's'}\\n\\n${sig()}`);
            } catch (e) {
                reply(`❌ Pin failed: ${e.message}\\n\\n${sig()}`);
            }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .resetlink — Reset group invite link
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'resetlink',
        category: 'group',
        description: 'Reset the group invite link',
        execute: async (sock, m, { reply, isAdmins, isBotAdmins }) => {
            if (!m.isGroup) return reply(`❗ Group only!\\n\\n${sig()}`);
            if (!isAdmins) return reply(config.message.admin);
            if (!isBotAdmins) return reply(`❗ Bot needs to be admin!\\n\\n${sig()}`);

            try {
                const newCode = await sock.groupRevokeInvite(m.chat);
                const link    = `https://chat.whatsapp.com/${newCode}`;
                await sock.sendMessage(m.chat, { react: { text: '🔄', key: m.key } }).catch(() => {});
                reply(`🔄 *Group invite link reset!*\\n\\n🔗 New link: ${link}\\n\\n${sig()}`);
            } catch (e) {
                reply(`❌ Failed: ${e.message}\\n\\n${sig()}`);
            }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .broadcast <message> — Send a message to all saved contacts (DMs)
    //  Owner only, sends to all chats in DB
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'broadcast',
        category: 'owner',
        owner: true,
        description: 'Broadcast a message to all recent chats',
        execute: async (sock, m, { args, reply, isCreator }) => {
            if (!isCreator) return reply(config.message.owner);
            const text = args.join(' ');
            if (!text) return reply(`❗ Usage: *.broadcast <message>*\\n\\n${sig()}`);

            await sock.sendMessage(m.chat, { react: { text: '📡', key: m.key } }).catch(() => {});

            try {
                // Get recent chats
                let chats = [];
                try {
                    const dbPath = path.join(__dirname, '..', 'library', 'database');
                    const files  = fs.readdirSync(dbPath).filter(f => f.endsWith('.json'));
                    for (const f of files) {
                        try {
                            const data = JSON.parse(fs.readFileSync(path.join(dbPath, f), 'utf8'));
                            if (Array.isArray(data)) chats.push(...data.filter(c => c && typeof c === 'string' && c.includes('@')));
                        } catch (_) {}
                    }
                } catch (_) {}

                if (!chats.length) {
                    return reply(`❌ No chats found to broadcast to.\\n\\n${sig()}`);
                }

                let sent = 0, failed = 0;
                const broadcastText =
                    `📡 *[LIAM EYES Broadcast]*\\n\\n${text}\\n\\n${sig()}`;

                for (const jid of [...new Set(chats)]) {
                    try {
                        await sock.sendMessage(jid, { text: broadcastText });
                        sent++;
                        await sleep(500);
                    } catch (_) { failed++; }
                }

                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
                reply(`✅ *Broadcast complete!*\\n\\n📤 Sent: *${sent}*\\n❌ Failed: *${failed}*\\n\\n${sig()}`);
            } catch (e) {
                reply(`❌ Broadcast error: ${e.message}\\n\\n${sig()}`);
            }
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  .disappear on/off — Toggle disappearing messages in a chat
    // ─────────────────────────────────────────────────────────────────────────
    {
        command: 'disappear',
        category: 'group',
        description: 'Toggle disappearing messages (7 days)',
        execute: async (sock, m, { args, reply, isAdmins, isBotAdmins }) => {
            if (m.isGroup && !isAdmins) return reply(config.message.admin);
            if (m.isGroup && !isBotAdmins) return reply(`❗ Bot needs to be admin!\\n\\n${sig()}`);

            const arg = (args[0] || 'on').toLowerCase();
            const on  = arg !== 'off';

            try {
                // 604800 = 7 days in seconds, 0 = off
                await sock.sendMessage(m.chat, {
                    disappearingMessagesInChat: on ? 604800 : 0,
                }).catch(() => {});

                await sock.sendMessage(m.chat, { react: { text: on ? '⏳' : '🔴', key: m.key } }).catch(() => {});
                reply(
                    `⏳ *Disappearing Messages*\\n\\n` +
                    (on ? `✅ Enabled — messages disappear after *7 days*` : `❌ Disabled`) +
                    `\\n\\n${sig()}`
                );
            } catch (e) {
                reply(`❌ Failed: ${e.message}\\n\\n${sig()}`);
            }
        }
    },

];
