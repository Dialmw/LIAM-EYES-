// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — GROUP TOOLS  (54 commands)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const config = require('../settings/config');
const fs     = require('fs');
const path   = require('path');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (sock, m, e) => sock.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {});
const fixJid = j => (j || '').replace(/:\d+@/g, '@');

// Runtime stores
const groupCodes   = new Map(); // groupId → [ codes ]
const groupAllowed = new Map(); // groupId → [ jids ]
const groupKick    = new Map(); // groupId → { cancelled }

// ── Admin-check shortcut ──────────────────────────────────────────────────
const reqAdmin = (ctx, reply) => {
    if (!ctx.isBotAdmins) { reply(`❌ *Bot must be admin for this command!*\n\n${sig()}`); return false; }
    if (!ctx.isAdmins && !ctx.isCreator) { reply(`❌ *You must be an admin!*\n\n${sig()}`); return false; }
    return true;
};

// ── Mention all participants ──────────────────────────────────────────────
const mentionAll = (participants) => participants.map(p => p.id).join('\n');

module.exports = [

    // ── .kick ────────────────────────────────────────────────────────────────
    {
        command: 'kick', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            const target = m.quoted?.sender || ctx.args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!target || target === '@s.whatsapp.net') return ctx.reply(`❓ Reply to a message or mention a user.\n\n${sig()}`);
            await react(sock, m, '🚫');
            await sock.groupParticipantsUpdate(m.chat, [fixJid(target)], 'remove');
            ctx.reply(`✅ *Kicked!* @${target.split('@')[0]} has been removed.\n\n${sig()}`);
        }
    },

    // ── .promote ─────────────────────────────────────────────────────────────
    {
        command: 'promote', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            const target = m.quoted?.sender || ctx.args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!target || target === '@s.whatsapp.net') return ctx.reply(`❓ Reply to a message or mention user.\n\n${sig()}`);
            await react(sock, m, '👑');
            await sock.groupParticipantsUpdate(m.chat, [fixJid(target)], 'promote');
            ctx.reply(`✅ @${target.split('@')[0]} has been *promoted to admin!* 👑\n\n${sig()}`);
        }
    },

    // ── .demote ──────────────────────────────────────────────────────────────
    {
        command: 'demote', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            const target = m.quoted?.sender || ctx.args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (!target || target === '@s.whatsapp.net') return ctx.reply(`❓ Reply to a message or mention user.\n\n${sig()}`);
            await react(sock, m, '⬇️');
            await sock.groupParticipantsUpdate(m.chat, [fixJid(target)], 'demote');
            ctx.reply(`✅ @${target.split('@')[0]} has been *demoted from admin.*\n\n${sig()}`);
        }
    },

    // ── .add ─────────────────────────────────────────────────────────────────
    {
        command: 'add', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            const num = ctx.args[0]?.replace(/[^0-9]/g, '');
            if (!num) return ctx.reply(`❓ Usage: *.add <number>*\nExample: _.add 254712345678_\n\n${sig()}`);
            await react(sock, m, '➕');
            const res = await sock.groupParticipantsUpdate(m.chat, [num + '@s.whatsapp.net'], 'add');
            const status = res?.[0]?.status;
            if (status === 200) ctx.reply(`✅ *@${num} added successfully!*\n\n${sig()}`);
            else if (status === 403) ctx.reply(`❌ *${num} has their privacy set to not allow adds.*\nSend invite link instead.\n\n${sig()}`);
            else if (status === 408) ctx.reply(`❌ *${num} is not on WhatsApp.*\n\n${sig()}`);
            else ctx.reply(`⚠️ Status: ${status}\n\n${sig()}`);
        }
    },

    // ── .link ─────────────────────────────────────────────────────────────────
    {
        command: 'link', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!ctx.isBotAdmins) return ctx.reply(`❌ Bot must be admin!\n\n${sig()}`);
            await react(sock, m, '🔗');
            const code = await sock.groupInviteCode(m.chat);
            ctx.reply(`🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}\n\n⚠️ Share carefully!\n\n${sig()}`);
        }
    },

    // ── .invite ───────────────────────────────────────────────────────────────
    {
        command: 'invite', category: 'group', group: true,
        execute: async (sock, m, ctx) => {
            if (!ctx.isBotAdmins) return ctx.reply(`❌ Bot must be admin!\n\n${sig()}`);
            const code = await sock.groupInviteCode(m.chat);
            const link = `https://chat.whatsapp.com/${code}`;
            await sock.sendMessage(m.chat, {
                text: `🔗 *${ctx.groupName}*\n\n${link}\n\n${sig()}`,
                contextInfo: { externalAdReply: { title: '🔗 Group Invite', body: ctx.groupName, thumbnailUrl: config.thumbUrl, sourceUrl: link, mediaType: 1 } }
            }, { quoted: m });
        }
    },

    // ── .resetlink ────────────────────────────────────────────────────────────
    {
        command: 'resetlink', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            await react(sock, m, '🔄');
            await sock.groupRevokeInvite(m.chat);
            const code = await sock.groupInviteCode(m.chat);
            ctx.reply(`✅ *Invite link reset!*\n\nNew link: https://chat.whatsapp.com/${code}\n\n${sig()}`);
        }
    },

    // ── .open / .close ────────────────────────────────────────────────────────
    {
        command: 'open', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            await react(sock, m, '🔓');
            await sock.groupSettingUpdate(m.chat, 'not_announcement');
            ctx.reply(`🔓 *Group opened!* Everyone can now send messages.\n\n${sig()}`);
        }
    },
    {
        command: 'close', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            await react(sock, m, '🔒');
            await sock.groupSettingUpdate(m.chat, 'announcement');
            ctx.reply(`🔒 *Group locked!* Only admins can now send messages.\n\n${sig()}`);
        }
    },

    // ── .tag / .tagall / .tagadmin ────────────────────────────────────────────
    {
        command: 'tag', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const text = ctx.text || '👋';
            const mentions = ctx.participants.map(p => p.id);
            await sock.sendMessage(m.chat, {
                text: `📢 *${text}*\n\n${mentions.map(j => `@${j.split('@')[0]}`).join(' ')}`,
                mentions,
                contextInfo: { externalAdReply: { title: 'LIAM EYES — Tag', body: ctx.groupName, thumbnailUrl: config.thumbUrl, sourceUrl: config.pairingSite } }
            }, { quoted: m });
        }
    },
    {
        command: 'tagall', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const mentions = ctx.participants.map(p => p.id);
            const text = ctx.text || '📢 *Attention everyone!*';
            await sock.sendMessage(m.chat, {
                text: `${text}\n\n${mentions.map(j => `@${j.split('@')[0]}`).join(' ')} `,
                mentions,
            }, { quoted: m });
        }
    },
    {
        command: 'tagadmin', category: 'group', group: true,
        execute: async (sock, m, ctx) => {
            const admins = ctx.groupAdmins;
            if (!admins.length) return ctx.reply(`❌ No admins found.\n\n${sig()}`);
            const text = ctx.text || '📢 Admins, your attention please!';
            await sock.sendMessage(m.chat, {
                text: `${text}\n\n${admins.map(j => `@${j.split('@')[0]}`).join(' ')}`,
                mentions: admins,
            }, { quoted: m });
        }
    },
    {
        command: 'hidetag', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const mentions = ctx.participants.map(p => p.id);
            const text = ctx.text || ctx.config?.watermark || '👁️ LIAM EYES';
            await sock.sendMessage(m.chat, { text, mentions }, { quoted: m });
        }
    },
    {
        command: 'mediatag', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const q = m.quoted;
            if (!q) return ctx.reply(`❗ Reply to a media message.\n\n${sig()}`);
            const mentions = ctx.participants.map(p => p.id);
            const mime = (q.msg || q).mimetype || '';
            const buf  = await sock.downloadMediaMessage(q);
            if (mime.includes('image'))
                await sock.sendMessage(m.chat, { image: buf, caption: ctx.text || '📢', mentions }, { quoted: m });
            else if (mime.includes('video'))
                await sock.sendMessage(m.chat, { video: buf, caption: ctx.text || '📢', mentions }, { quoted: m });
        }
    },
    {
        command: 'antitag', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features = config.features || {};
            config.features.antitag = !config.features.antitag;
            const on = config.features.antitag;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Tag* is now *${on ? '✅ ON' : '❌ OFF'}*\n\n${sig()}`);
        }
    },
    {
        command: 'antitagadmin', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features = config.features || {};
            config.features.antitagadmin = !config.features.antitagadmin;
            const on = config.features.antitagadmin;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Tag Admin* is now *${on ? '✅ ON' : '❌ OFF'}*\n\n${sig()}`);
        }
    },

    // ── .setgroupname / .setdesc / .setppgroup / .delppgroup / .getgrouppp ───
    {
        command: 'setgroupname', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!ctx.text) return ctx.reply(`❓ Usage: *.setgroupname <name>*\n\n${sig()}`);
            if (!reqAdmin(ctx, ctx.reply)) return;
            await react(sock, m, '✏️');
            await sock.groupUpdateSubject(m.chat, ctx.text);
            ctx.reply(`✅ *Group name changed to:* ${ctx.text}\n\n${sig()}`);
        }
    },
    {
        command: 'setdesc', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!ctx.text) return ctx.reply(`❓ Usage: *.setdesc <description>*\n\n${sig()}`);
            if (!reqAdmin(ctx, ctx.reply)) return;
            await react(sock, m, '📝');
            await sock.groupUpdateDescription(m.chat, ctx.text);
            ctx.reply(`✅ *Group description updated!*\n\n${sig()}`);
        }
    },
    {
        command: 'setppgroup', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            const q = m.quoted;
            if (!q) return ctx.reply(`❗ Reply to an image to set as group icon.\n\n${sig()}`);
            await react(sock, m, '🖼️');
            const buf = await sock.downloadMediaMessage(q);
            await sock.updateProfilePicture(m.chat, buf);
            ctx.reply(`✅ *Group photo updated!*\n\n${sig()}`);
        }
    },
    {
        command: 'delppgroup', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            await react(sock, m, '🗑️');
            await sock.removeProfilePicture(m.chat);
            ctx.reply(`✅ *Group photo removed!*\n\n${sig()}`);
        }
    },
    {
        command: 'getgrouppp', category: 'group', group: true,
        execute: async (sock, m, ctx) => {
            await react(sock, m, '🖼️');
            try {
                const url = await sock.profilePictureUrl(m.chat, 'image');
                await sock.sendMessage(m.chat, { image: { url }, caption: `🖼️ *${ctx.groupName} — Group Photo*\n\n${sig()}` }, { quoted: m });
            } catch { ctx.reply(`❌ Could not fetch group photo.\n\n${sig()}`); }
        }
    },

    // ── .totalmembers ─────────────────────────────────────────────────────────
    {
        command: 'totalmembers', category: 'group', group: true,
        execute: async (sock, m, ctx) => {
            const total  = ctx.participants.length;
            const admins = ctx.groupAdmins.length;
            ctx.reply(`👥 *${ctx.groupName}*\n\n👤 Total Members: *${total}*\n👑 Admins: *${admins}*\n👶 Regular: *${total - admins}*\n\n${sig()}`);
        }
    },

    // ── .poll ────────────────────────────────────────────────────────────────
    {
        command: 'poll', category: 'group', group: true,
        execute: async (sock, m, ctx) => {
            if (ctx.args.length < 3) return ctx.reply(`❓ Usage: *.poll Question | Option1 | Option2 | ...*\nExample: _.poll Favorite color | Red | Blue | Green_\n\n${sig()}`);
            const parts = ctx.text.split('|').map(s => s.trim());
            const question = parts[0];
            const options  = parts.slice(1);
            if (options.length < 2) return ctx.reply(`❗ Need at least 2 options\n\n${sig()}`);
            await react(sock, m, '📊');
            await sock.sendMessage(m.chat, {
                poll: { name: question, values: options, selectableCount: 1 }
            }, { quoted: m });
        }
    },

    // ── .welcome ──────────────────────────────────────────────────────────────
    {
        command: 'welcome', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.welcome = !config.features.welcome;
            const on = config.features.welcome;
            await react(sock, m, on ? '👋' : '❌');
            ctx.reply(`👋 *Welcome Messages* are now *${on ? '✅ ON' : '❌ OFF'}*\n\n${sig()}`);
        }
    },

    // ── .kickall ─────────────────────────────────────────────────────────────
    {
        command: 'kickall', category: 'group', group: true, admin: true, owner: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            const botId  = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net';
            const targets = ctx.participants.filter(p => !p.admin && p.id !== botId).map(p => p.id);
            if (!targets.length) return ctx.reply(`❌ No regular members to kick.\n\n${sig()}`);
            await react(sock, m, '🚫');
            ctx.reply(`⚠️ *Kicking ${targets.length} members...*\n\n${sig()}`);
            for (const jid of targets) {
                await sock.groupParticipantsUpdate(m.chat, [jid], 'remove').catch(() => {});
                await new Promise(r => setTimeout(r, 500));
            }
            ctx.reply(`✅ *Kicked ${targets.length} members!*\n\n${sig()}`);
        }
    },

    // ── .kickinactive ────────────────────────────────────────────────────────
    {
        command: 'kickinactive', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            ctx.reply(`ℹ️ *Kick Inactive*\n\nThis feature tracks message activity.\n_Currently, manual tracking is not enabled._\n_Use .kickall to remove all non-admins._\n\n${sig()}`);
        }
    },

    // ── .listactive / .listinactive ───────────────────────────────────────────
    {
        command: 'listactive', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const admins = ctx.groupAdmins.map(j => `👑 @${j.split('@')[0]}`).join('\n');
            const others = ctx.participants.filter(p => !p.admin).map(p => `👤 @${p.id.split('@')[0]}`).join('\n');
            ctx.reply(`📋 *${ctx.groupName} — Members*\n\n*Admins (${ctx.groupAdmins.length}):*\n${admins}\n\n*Members (${ctx.participants.length - ctx.groupAdmins.length}):*\n${others}\n\n${sig()}`);
        }
    },
    {
        command: 'listinactive', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            ctx.reply(`ℹ️ *List Inactive*\n\nActivity tracking is not currently enabled.\nUse *.listactive* to see all members.\n\n${sig()}`);
        }
    },

    // ── .approve / .approveall / .disapproveall / .reject ─────────────────────
    {
        command: 'listrequests', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            try {
                const req = await sock.groupRequestParticipantsList(m.chat);
                if (!req?.length) return ctx.reply(`ℹ️ No pending join requests.\n\n${sig()}`);
                const list = req.map((r, i) => `${i+1}. @${r.jid.split('@')[0]}`).join('\n');
                ctx.reply(`📋 *Pending Requests (${req.length}):*\n\n${list}\n\n${sig()}`);
            } catch { ctx.reply(`❌ Could not fetch requests.\n\n${sig()}`); }
        }
    },
    {
        command: 'approve', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const target = m.quoted?.sender || ctx.args[0]?.replace(/[^0-9]/g,'') + '@s.whatsapp.net';
            if (!target || target === '@s.whatsapp.net') return ctx.reply(`❓ Reply to a request message or provide number.\n\n${sig()}`);
            await react(sock, m, '✅');
            await sock.groupRequestParticipantsUpdate(m.chat, [fixJid(target)], 'approve');
            ctx.reply(`✅ @${target.split('@')[0]} approved!\n\n${sig()}`);
        }
    },
    {
        command: 'approveall', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            await react(sock, m, '✅');
            try {
                const req = await sock.groupRequestParticipantsList(m.chat);
                if (!req?.length) return ctx.reply(`ℹ️ No pending requests.\n\n${sig()}`);
                for (const r of req)
                    await sock.groupRequestParticipantsUpdate(m.chat, [r.jid], 'approve').catch(() => {});
                ctx.reply(`✅ Approved *${req.length} requests!*\n\n${sig()}`);
            } catch (e) { ctx.reply(`❌ Error: ${e.message}\n\n${sig()}`); }
        }
    },
    {
        command: 'disapproveall', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            await react(sock, m, '❌');
            try {
                const req = await sock.groupRequestParticipantsList(m.chat);
                if (!req?.length) return ctx.reply(`ℹ️ No pending requests.\n\n${sig()}`);
                for (const r of req)
                    await sock.groupRequestParticipantsUpdate(m.chat, [r.jid], 'reject').catch(() => {});
                ctx.reply(`❌ Rejected *${req.length} requests!*\n\n${sig()}`);
            } catch (e) { ctx.reply(`❌ Error: ${e.message}\n\n${sig()}`); }
        }
    },
    {
        command: 'reject', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const target = m.quoted?.sender || ctx.args[0]?.replace(/[^0-9]/g,'') + '@s.whatsapp.net';
            if (!target || target === '@s.whatsapp.net') return ctx.reply(`❓ Reply to request or provide number.\n\n${sig()}`);
            await react(sock, m, '❌');
            await sock.groupRequestParticipantsUpdate(m.chat, [fixJid(target)], 'reject').catch(() => {});
            ctx.reply(`❌ Request from @${target.split('@')[0]} rejected.\n\n${sig()}`);
        }
    },

    // ── .addcode / .delcode / .listcode ───────────────────────────────────────
    {
        command: 'addcode', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const code = ctx.text?.toUpperCase();
            if (!code) return ctx.reply(`❓ Usage: *.addcode <code>*\n\n${sig()}`);
            if (!groupCodes.has(m.chat)) groupCodes.set(m.chat, []);
            groupCodes.get(m.chat).push(code);
            ctx.reply(`✅ Code *${code}* added!\nUsers can join with: *.join ${code}*\n\n${sig()}`);
        }
    },
    {
        command: 'delcode', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const code = ctx.text?.toUpperCase();
            if (!code) return ctx.reply(`❓ Usage: *.delcode <code>*\n\n${sig()}`);
            const list = groupCodes.get(m.chat) || [];
            const idx  = list.indexOf(code);
            if (idx === -1) return ctx.reply(`❌ Code *${code}* not found.\n\n${sig()}`);
            list.splice(idx, 1);
            ctx.reply(`✅ Code *${code}* removed!\n\n${sig()}`);
        }
    },
    {
        command: 'listcode', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const codes = groupCodes.get(m.chat) || [];
            if (!codes.length) return ctx.reply(`ℹ️ No codes set for this group.\n\n${sig()}`);
            ctx.reply(`📋 *Group Codes:*\n\n${codes.map((c,i) => `${i+1}. \`${c}\``).join('\n')}\n\n${sig()}`);
        }
    },

    // ── .allow / .delallowed / .listallowed ───────────────────────────────────
    {
        command: 'allow', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const target = m.quoted?.sender || ctx.args[0]?.replace(/[^0-9]/g,'') + '@s.whatsapp.net';
            if (!target || target === '@s.whatsapp.net') return ctx.reply(`❓ Mention or reply to a user.\n\n${sig()}`);
            if (!groupAllowed.has(m.chat)) groupAllowed.set(m.chat, []);
            groupAllowed.get(m.chat).push(fixJid(target));
            ctx.reply(`✅ @${target.split('@')[0]} is now *allowed* even when group is locked.\n\n${sig()}`);
        }
    },
    {
        command: 'delallowed', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const target = m.quoted?.sender || ctx.args[0]?.replace(/[^0-9]/g,'') + '@s.whatsapp.net';
            const list   = groupAllowed.get(m.chat) || [];
            const idx    = list.indexOf(fixJid(target));
            if (idx !== -1) list.splice(idx, 1);
            ctx.reply(`✅ @${target.split('@')[0]} removed from allowed list.\n\n${sig()}`);
        }
    },
    {
        command: 'listallowed', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const list = groupAllowed.get(m.chat) || [];
            if (!list.length) return ctx.reply(`ℹ️ Allowed list is empty.\n\n${sig()}`);
            ctx.reply(`📋 *Allowed Users:*\n\n${list.map((j,i) => `${i+1}. @${j.split('@')[0]}`).join('\n')}\n\n${sig()}`);
        }
    },

    // ── .userid ───────────────────────────────────────────────────────────────
    {
        command: 'userid', category: 'group', group: true,
        execute: async (sock, m, ctx) => {
            const target = m.quoted?.sender || ctx.sender;
            ctx.reply(`🆔 *User ID*\n\nJID: \`${target}\`\nNumber: *+${target.split('@')[0]}*\n\n${sig()}`);
        }
    },

    // ── .vcf ─────────────────────────────────────────────────────────────────
    {
        command: 'vcf', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            await react(sock, m, '📇');
            const vcfData = ctx.participants.map(p => {
                const num = p.id.split('@')[0];
                return `BEGIN:VCARD\nVERSION:3.0\nFN:+${num}\nTEL:+${num}\nEND:VCARD`;
            }).join('\n');
            const buf = Buffer.from(vcfData, 'utf8');
            await sock.sendMessage(m.chat, {
                document: buf, filename: `${ctx.groupName.slice(0,30)}_members.vcf`,
                mimetype: 'text/vcard', caption: `📇 *${ctx.participants.length} contacts exported*\n\n${sig()}`,
            }, { quoted: m });
            await react(sock, m, '✅');
        }
    },

    // ── .tosgroup ─────────────────────────────────────────────────────────────
    {
        command: 'tosgroup', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const q = m.quoted;
            if (!q) return ctx.reply(`❗ Reply to a message to forward to all groups.\n\n${sig()}`);
            ctx.reply(`ℹ️ *Group broadcast requires accessing all groups.*\n_Use .tostatus to post to your status instead._\n\n${sig()}`);
        }
    },

    // ── .announcements ───────────────────────────────────────────────────────
    {
        command: 'announcements', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!ctx.text) return ctx.reply(`❓ Usage: *.announcements <message>*\n\n${sig()}`);
            const mentions = ctx.participants.map(p => p.id);
            await sock.sendMessage(m.chat, {
                text: `📢 *ANNOUNCEMENT*\n━━━━━━━━━━━━━━━━━━\n${ctx.text}\n━━━━━━━━━━━━━━━━━━\n_${ctx.groupName}_\n\n${sig()}`,
                mentions,
            }, { quoted: m });
        }
    },

    // ── .editsettings ────────────────────────────────────────────────────────
    {
        command: 'editsettings', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            if (!reqAdmin(ctx, ctx.reply)) return;
            const arg = ctx.args[0];
            if (arg === 'adminsonly') {
                await sock.groupSettingUpdate(m.chat, 'locked');
                ctx.reply(`🔒 *Only admins can edit group info now.*\n\n${sig()}`);
            } else {
                await sock.groupSettingUpdate(m.chat, 'unlocked');
                ctx.reply(`🔓 *All members can edit group info.*\n\n${sig()}`);
            }
        }
    },

    // ── .closetime / .opentime ────────────────────────────────────────────────
    {
        command: 'closetime', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const time = ctx.text;
            if (!time) return ctx.reply(`❓ Usage: *.closetime <HH:MM>*\nExample: _.closetime 22:00_\n\n${sig()}`);
            config.closeTime = time;
            ctx.reply(`🔒 *Group will auto-close at ${time}*\n\n${sig()}`);
        }
    },
    {
        command: 'opentime', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            const time = ctx.text;
            if (!time) return ctx.reply(`❓ Usage: *.opentime <HH:MM>*\nExample: _.opentime 06:00_\n\n${sig()}`);
            config.openTime = time;
            ctx.reply(`🔓 *Group will auto-open at ${time}*\n\n${sig()}`);
        }
    },

    // ── Anti-group features ────────────────────────────────────────────────────
    {
        command: 'antilink', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antilink = !config.features.antilink;
            const on = config.features.antilink;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Link* is now *${on ? '✅ ON' : '❌ OFF'}*\n\n${sig()}`);
        }
    },
    {
        command: 'antilinkgc', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antilinkgc = !config.features.antilinkgc;
            const on = config.features.antilinkgc;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti Group-Link* is now *${on ? '✅ ON' : '❌ OFF'}*\n_Blocks WhatsApp group links specifically_\n\n${sig()}`);
        }
    },
    {
        command: 'antibadword', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antibadword = !config.features.antibadword;
            const on = config.features.antibadword;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Bad Word* is now *${on ? '✅ ON' : '❌ OFF'}*\n\n${sig()}`);
        }
    },
    {
        command: 'antibot', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antibot = !config.features.antibot;
            const on = config.features.antibot;
            await react(sock, m, on ? '🤖' : '❌');
            ctx.reply(`🤖 *Anti-Bot* is now *${on ? '✅ ON' : '❌ OFF'}*\n_Removes bots that join the group_\n\n${sig()}`);
        }
    },
    {
        command: 'antidemote', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antidemote = !config.features.antidemote;
            const on = config.features.antidemote;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Demote* is now *${on ? '✅ ON' : '❌ OFF'}*\n_Kicks anyone who demotes the bot_\n\n${sig()}`);
        }
    },
    {
        command: 'antiforeign', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antiforeign = !config.features.antiforeign;
            const on = config.features.antiforeign;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Foreign* is now *${on ? '✅ ON' : '❌ OFF'}*\n_Removes members with foreign country codes_\n\n${sig()}`);
        }
    },
    {
        command: 'antigroupmention', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antigroupmention = !config.features.antigroupmention;
            const on = config.features.antigroupmention;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Group-Mention* is now *${on ? '✅ ON' : '❌ OFF'}*\n_Deletes messages that @mention all_\n\n${sig()}`);
        }
    },
    {
        command: 'antisticker', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            config.features.antisticker = !config.features.antisticker;
            const on = config.features.antisticker;
            await react(sock, m, on ? '🛡️' : '❌');
            ctx.reply(`🛡️ *Anti-Sticker* is now *${on ? '✅ ON' : '❌ OFF'}*\n\n${sig()}`);
        }
    },

    // ── .cancelkick ───────────────────────────────────────────────────────────
    {
        command: 'cancelkick', category: 'group', group: true, admin: true,
        execute: async (sock, m, ctx) => {
            groupKick.set(m.chat, { cancelled: true });
            ctx.reply(`✅ *Kick operation cancelled!*\n\n${sig()}`);
        }
    },

];
