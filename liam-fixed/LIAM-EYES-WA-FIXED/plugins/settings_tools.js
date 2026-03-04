// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — SETTINGS TOOLS  (~70 commands)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const fs     = require('fs');
const path   = require('path');
const config = require('../settings/config');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});
const OW    = ctx => ctx.isCreator;
const owErr = '👑 Owner only!\n\n' + sig();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Toggle engine ───────────────────────────────────────────────────────────
const toggle = async (feat, label, emoji, on_icon, off_icon, sock, m, ctx) => {
    if (!OW(ctx)) return ctx.reply(owErr);
    if (!config.features) config.features = {};
    const arg = (ctx.args[0] || '').toLowerCase();
    const on = arg === 'on' ? true : arg === 'off' ? false : !config.features[feat];
    config.features[feat] = on;
    await react(sock, m, on ? (on_icon || emoji) : '❌');
    return ctx.reply(
        `${on ? (on_icon || emoji) : '❌'} *${label}*\n\n` +
        (on
            ? `╔═══════════════════╗\n║  ✅  E N A B L E D  ║\n╚═══════════════════╝`
            : `╔════════════════════╗\n║  ❌  D I S A B L E D  ║\n╚════════════════════╝`) +
        `\n\n${sig()}`
    );
};

// ── Custom messages store ───────────────────────────────────────────────────
if (!config.customMsgs) config.customMsgs = {};
if (!config.countryList) config.countryList = [];
if (!config.ignoreList) config.ignoreList = [];

module.exports = [

// ──────────────────────────────────────────────────────────────────────────
//  FEATURE TOGGLES
// ──────────────────────────────────────────────────────────────────────────
{ command:'alwaysonline',    category:'settings', execute: async(s,m,c)=>toggle('alwaysonline','Always Online','🟢','🟢','⚫',s,m,c) },
{ command:'autoread',        category:'settings', execute: async(s,m,c)=>toggle('autoread','Auto Read','👁️','👁️','🙈',s,m,c) },
{ command:'autoreact',       category:'settings', execute: async(s,m,c)=>toggle('autoreact','Auto React','🤩','🤩','😑',s,m,c) },
{ command:'autotype',        category:'settings', execute: async(s,m,c)=>toggle('autotyping','Auto Typing','⌨️','⌨️','🤫',s,m,c) },
{ command:'autorecord',      category:'settings', execute: async(s,m,c)=>toggle('autorecording','Auto Record Presence','🎙️','🎙️','🔇',s,m,c) },
{ command:'autorecordtyping',category:'settings', execute: async(s,m,c)=>toggle('autorecordtyping','Auto Record+Type','🎙️','🎙️','🔇',s,m,c) },
{ command:'autoviewstatus',  category:'settings', execute: async(s,m,c)=>toggle('autoviewstatus','Auto View Status','👁️','👁️','🙈',s,m,c) },
{ command:'autoreactstatus', category:'settings', execute: async(s,m,c)=>toggle('autoreactstatus','Auto React Status','😍','😍','😑',s,m,c) },
{ command:'antidelete',      category:'settings', execute: async(s,m,c)=>toggle('antidelete','Anti Delete','🗑️','🗑️','🗑️',s,m,c) },
{ command:'antideletestatus',category:'settings', execute: async(s,m,c)=>toggle('antideletestatus','Anti Delete Status','🗑️','🗑️','🗑️',s,m,c) },
{ command:'antiedit',        category:'settings', execute: async(s,m,c)=>toggle('antiedit','Anti Edit','✏️','✏️','📝',s,m,c) },
{ command:'antiviewonce',    category:'settings', execute: async(s,m,c)=>toggle('antiviewonce','Anti View-Once','👁️','👁️','🙈',s,m,c) },
{ command:'autoblock',       category:'settings', execute: async(s,m,c)=>toggle('autoblock','Auto Block Unknown','🚫','🚫','✅',s,m,c) },
{ command:'antibug',         category:'settings', execute: async(s,m,c)=>toggle('antibug','Anti Bug','🛡️','🛡️','⚠️',s,m,c) },
{ command:'anticall',        category:'settings', execute: async(s,m,c)=>toggle('anticall','Anti Call (Auto-reject)','📵','📵','📞',s,m,c) },
{ command:'chatbot',         category:'settings', execute: async(s,m,c)=>toggle('chatbot','AI Chatbot','🤖','🤖','🤫',s,m,c) },
{ command:'autobio',         category:'settings', execute: async(s,m,c)=>toggle('autobio','Auto Bio Update','✍️','✍️','🤐',s,m,c) },

// ──────────────────────────────────────────────────────────────────────────
//  BOT CUSTOMIZATION
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'setbotname', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setbotname <name>*\n\n${sig()}`);
        config.settings.title = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Bot name → ${ctx.text}*\n\n${sig()}`);
    }
},
{
    command: 'setownername', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setownername <name>*\n\n${sig()}`);
        config.settings.author = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Owner name → ${ctx.text}*\n\n${sig()}`);
    }
},
{
    command: 'setownernumber', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const num = ctx.args[0]?.replace(/\D/g,'');
        if (!num) return ctx.reply(`❗ Usage: *.setownernumber <number>*\n\n${sig()}`);
        config.owner = num;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Owner number updated*\n\n${sig()}`);
    }
},
{
    command: 'setprefix', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const p = ctx.args[0];
        if (!p || !'.!#$%^&*'.includes(p)) return ctx.reply(`❗ Valid prefixes: . ! # $ % ^ & *\n\n${sig()}`);
        config.prefix = p;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Prefix → ${p}*\n\n_Use ${p}menu to test_\n\n${sig()}`);
    }
},
{
    command: 'setcontextlink', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setcontextlink <url>*\n\n${sig()}`);
        config.pairingSite = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Context link updated*\n${ctx.text}\n\n${sig()}`);
    }
},
{
    command: 'setwatermark', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setwatermark <text>*\n\n${sig()}`);
        config.settings.footer = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Watermark → ${ctx.text}*\n\n${sig()}`);
    }
},
{
    command: 'setstickerpackname', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setstickerpackname <name>*\n\n${sig()}`);
        config.sticker.packname = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Sticker pack name → ${ctx.text}*\n\n${sig()}`);
    }
},
{
    command: 'setstickerauthor', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setstickerauthor <name>*\n\n${sig()}`);
        config.sticker.author = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Sticker author → ${ctx.text}*\n\n${sig()}`);
    }
},
{
    command: 'setmenu', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const n = parseInt(ctx.args[0]);
        if (![1,2,3,4].includes(n))
            return ctx.reply(`❗ Usage: *.setmenu 1/2/3/4*\n1=Numbered, 2=Classic, 3=Cursive, 4=Grid\n\n${sig()}`);
        config.menuStyle = n;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Menu style → ${n}*\n\n${sig()}`);
    }
},
{
    command: 'setmenuimage', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('image')) return ctx.reply('❗ Reply to an image to set as menu image.\n\n' + sig());
        try {
            const buf = await sock.downloadMediaMessage(q.msg || q);
            const logoPath = path.join(__dirname, '..', 'thumbnail', 'logo.jpg');
            fs.writeFileSync(logoPath, buf);
            await react(sock, m, '✅');
            ctx.reply(`✅ *Menu image updated!*\n\n${sig()}`);
        } catch(e) { ctx.reply(`❌ ${e.message}`); }
    }
},
{
    command: 'setfont', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const fonts = {
            '1': 'Normal',
            '2': '𝐁𝐨𝐥𝐝',
            '3': '𝘐𝘵𝘢𝘭𝘪𝘤',
            '4': '𝓒𝓾𝓻𝓼𝓲𝓿𝓮',
            '5': '𝔽𝕒𝕟𝕔𝕪',
        };
        const n = ctx.args[0];
        if (!n || !fonts[n])
            return ctx.reply(`🔤 *Font Styles*\n\n${Object.entries(fonts).map(([k,v])=>`${k}. ${v}`).join('\n')}\n\nUsage: *.setfont 2*\n\n${sig()}`);
        config.fontStyle = parseInt(n);
        await react(sock, m, '✅');
        ctx.reply(`✅ *Font → ${fonts[n]}*\n\n${sig()}`);
    }
},
{
    command: 'settimezone', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.settimezone Africa/Nairobi*\n\n${sig()}`);
        config.timezone = ctx.text;
        process.env.TZ = ctx.text;
        await react(sock, m, '✅');
        const now = new Date().toLocaleString('en-US', { timeZone: ctx.text });
        ctx.reply(`✅ *Timezone → ${ctx.text}*\nCurrent time: ${now}\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  SUDO MANAGEMENT
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'addsudo', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const num = ctx.args[0]?.replace(/\D/g,'') || (m.quoted?.sender || '').split('@')[0];
        if (!num) return ctx.reply('❗ Usage: *.addsudo <number>* or reply to user\n\n' + sig());
        if (!config.sudo) config.sudo = [];
        if (config.sudo.includes(num)) return ctx.reply(`⚠️ ${num} is already sudo.\n\n${sig()}`);
        config.sudo.push(num);
        await react(sock, m, '✅');
        ctx.reply(`✅ *Added +${num} to sudo*\n\n${sig()}`);
    }
},
{
    command: 'delsudo', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const num = ctx.args[0]?.replace(/\D/g,'') || (m.quoted?.sender || '').split('@')[0];
        if (!num) return ctx.reply('❗ Usage: *.delsudo <number>*\n\n' + sig());
        config.sudo = (config.sudo || []).filter(n => n !== num);
        await react(sock, m, '✅');
        ctx.reply(`✅ *Removed +${num} from sudo*\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  BAD WORDS
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'addbadword', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.addbadword <word>*\n\n${sig()}`);
        if (!config.badwords) config.badwords = [];
        const words = ctx.text.split(',').map(w=>w.trim().toLowerCase()).filter(Boolean);
        words.forEach(w => { if (!config.badwords.includes(w)) config.badwords.push(w); });
        await react(sock, m, '✅');
        ctx.reply(`✅ *Added ${words.length} bad word(s)*\n\n${sig()}`);
    }
},
{
    command: 'deletebadword', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.deletebadword <word>*\n\n${sig()}`);
        config.badwords = (config.badwords||[]).filter(w => w !== ctx.text.toLowerCase());
        await react(sock, m, '✅');
        ctx.reply(`✅ *Removed from bad words*\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  IGNORE LIST
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'addignorelist', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const num = ctx.args[0]?.replace(/\D/g,'') || (m.quoted?.sender||'').split('@')[0];
        if (!num) return ctx.reply('❗ Reply to user or *.addignorelist <number>*\n\n' + sig());
        const jid = num + '@s.whatsapp.net';
        if (!config.ignoreList) config.ignoreList = [];
        if (!config.ignoreList.includes(jid)) config.ignoreList.push(jid);
        await react(sock, m, '✅');
        ctx.reply(`✅ *@${num} will be ignored*\n\n${sig()}`);
    }
},
{
    command: 'delignorelist', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const num = ctx.args[0]?.replace(/\D/g,'') || (m.quoted?.sender||'').split('@')[0];
        const jid = num + '@s.whatsapp.net';
        config.ignoreList = (config.ignoreList||[]).filter(j => j !== jid);
        await react(sock, m, '✅');
        ctx.reply(`✅ *@${num} removed from ignore list*\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  COUNTRY CODE WHITELIST
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'addcountrycode', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const code = ctx.args[0]?.replace(/\D/g,'');
        if (!code) return ctx.reply(`❗ Usage: *.addcountrycode 254* (Kenya)\n\n${sig()}`);
        if (!config.countryList) config.countryList = [];
        if (!config.countryList.includes(code)) config.countryList.push(code);
        await react(sock, m, '✅');
        ctx.reply(`✅ *Country code +${code} allowed*\n\n${sig()}`);
    }
},
{
    command: 'delcountrycode', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const code = ctx.args[0]?.replace(/\D/g,'');
        config.countryList = (config.countryList||[]).filter(c => c !== code);
        await react(sock, m, '✅');
        ctx.reply(`✅ *Country code +${code} removed*\n\n${sig()}`);
    }
},
{
    command: 'listcountrycode', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const list = config.countryList || [];
        ctx.reply(list.length
            ? `🌍 *Allowed Country Codes*\n\n${list.map(c=>`+${c}`).join(', ')}\n\n${sig()}`
            : `📋 *All countries allowed* (no filter set)\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  ANTI-CALL
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'setanticallmsg', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setanticallmsg <message>*\n\n${sig()}`);
        config.customMsgs.anticallmsg = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Anti-call message set*\n\n_"${ctx.text}"_\n\n${sig()}`);
    }
},
{
    command: 'delanticallmsg', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        delete config.customMsgs.anticallmsg;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Anti-call message reset to default*\n\n${sig()}`);
    }
},
{
    command: 'showanticallmsg', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const msg = config.customMsgs?.anticallmsg || '📵 Calls are disabled. Please send a message instead.';
        ctx.reply(`📵 *Anti-Call Message*\n\n_"${msg}"_\n\n${sig()}`);
    }
},
{
    command: 'testanticallmsg', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const msg = config.customMsgs?.anticallmsg || '📵 Calls are disabled. Please send a message instead.';
        ctx.reply(`📵 *[TEST Anti-Call Message]*\n\n${msg}\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  WELCOME / GOODBYE
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'setwelcome', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setwelcome <message>*\nVariables: {user} {group} {count}\n\n${sig()}`);
        config.customMsgs.welcome = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Welcome message set*\n\n${sig()}`);
    }
},
{
    command: 'setgoodbye', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.text) return ctx.reply(`❗ Usage: *.setgoodbye <message>*\n\n${sig()}`);
        config.customMsgs.goodbye = ctx.text;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Goodbye message set*\n\n${sig()}`);
    }
},
{
    command: 'delwelcome', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        delete config.customMsgs.welcome;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Welcome message reset to default*\n\n${sig()}`);
    }
},
{
    command: 'delgoodbye', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        delete config.customMsgs.goodbye;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Goodbye message reset to default*\n\n${sig()}`);
    }
},
{
    command: 'showwelcome', category: 'settings',
    execute: async (sock, m, ctx) => {
        const msg = config.customMsgs?.welcome || '👋 Welcome {user} to *{group}*!\n\n👥 Members: {count}';
        ctx.reply(`👋 *Welcome Message*\n\n${msg}\n\n${sig()}`);
    }
},
{
    command: 'showgoodbye', category: 'settings',
    execute: async (sock, m, ctx) => {
        const msg = config.customMsgs?.goodbye || '👋 Goodbye {user}! See you again.';
        ctx.reply(`👋 *Goodbye Message*\n\n${msg}\n\n${sig()}`);
    }
},
{
    command: 'testwelcome', category: 'settings',
    execute: async (sock, m, ctx) => {
        const template = config.customMsgs?.welcome || '👋 Welcome {user} to *{group}*!\n\n👥 Members: {count}';
        const msg = template
            .replace('{user}', ctx.pushname)
            .replace('{group}', m.isGroup ? (ctx.groupName || 'this group') : 'Private Chat')
            .replace('{count}', ctx.participants?.length || 1);
        ctx.reply(`🧪 *[TEST Welcome]*\n\n${msg}\n\n${sig()}`);
    }
},
{
    command: 'testgoodbye', category: 'settings',
    execute: async (sock, m, ctx) => {
        const template = config.customMsgs?.goodbye || '👋 Goodbye {user}!';
        const msg = template.replace('{user}', ctx.pushname);
        ctx.reply(`🧪 *[TEST Goodbye]*\n\n${msg}\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  MODE
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'mode', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const val = (ctx.args[0] || '').toLowerCase();
        if (!['public','private'].includes(val))
            return ctx.reply(`❗ Usage: *.mode public/private*\nCurrent: *${sock.public ? 'Public' : 'Private'}*\n\n${sig()}`);
        sock.public = val === 'public';
        await react(sock, m, val === 'public' ? '🌍' : '🔒');
        ctx.reply(`${val === 'public' ? '🌍' : '🔒'} *Mode → ${val.toUpperCase()}*\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  WARN SETTINGS
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'setwarn', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const n = parseInt(ctx.args[0]);
        if (!n || n < 1 || n > 20) return ctx.reply(`❗ Usage: *.setwarn <number>* (1-20)\n\n${sig()}`);
        config.warnLimit = n;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Warn limit → ${n}*\n\n${sig()}`);
    }
},
{
    command: 'resetwarn', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        config.warnLimit = 3;
        await react(sock, m, '✅');
        ctx.reply(`✅ *Warn limit reset to 3*\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  GETSETTINGS / RESETSETTING
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'getsettings', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        const f = config.features || {};
        const on = Object.entries(f).filter(([,v])=>v).map(([k])=>`✅ ${k}`);
        const off = Object.entries(f).filter(([,v])=>!v).map(([k])=>`❌ ${k}`);
        ctx.reply(
            `⚙️ *Bot Settings*\n\n` +
            `🤖 Name: ${config.settings?.title || 'LIAM EYES'}\n` +
            `🌍 Mode: ${sock.public ? 'Public' : 'Private'}\n` +
            `🔰 Prefix: ${ctx.prefix}\n` +
            `🎨 Menu: Style ${config.menuStyle || 1}\n` +
            `⚠️ Warn limit: ${config.warnLimit || 3}\n\n` +
            `*Active Features:*\n${on.join('\n') || '_(none)_'}\n\n` +
            `*Inactive Features:*\n${off.join('\n') || '_(none)_'}\n\n${sig()}`
        );
    }
},
{
    command: 'resetsetting', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!config.features) return ctx.reply('❗ No settings to reset.\n\n' + sig());
        Object.keys(config.features).forEach(k => config.features[k] = false);
        config.menuStyle = 1;
        delete config.customMsgs;
        config.customMsgs = {};
        await react(sock, m, '✅');
        ctx.reply(`✅ *All settings reset to default*\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  STATUS EMOJI
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'setstatusemoji', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!ctx.args.length) {
            const current = (config.statusReactEmojis||[]).join('  ');
            return ctx.reply(`😍 *Status React Emojis*\n\nCurrent: ${current}\n\nSet new: *.setstatusemoji ❤️ 🔥 😍*\n\n${sig()}`);
        }
        config.statusReactEmojis = ctx.args;
        await react(sock, m, ctx.args[0]);
        ctx.reply(`✅ *Status emojis updated*\n\n${ctx.args.join('  ')}\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  CLEARCHAT
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'clearchat', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (global._chatHistory) global._chatHistory.delete(m.chat);
        await react(sock, m, '🗑️');
        ctx.reply(`🗑️ *Chat history cleared!*\n\nAI starts fresh here.\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  LISTWARN
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'listwarn', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        if (!global._warnStore?.size)
            return ctx.reply(`📋 *No active warnings*\n\n${sig()}`);
        const lines = [...global._warnStore.entries()].map(([j,c])=>`👤 @${j.split('@')[0]} — ⚠️ ${c} warn(s)`);
        ctx.reply(`⚠️ *Warn List*\n\n${lines.join('\n')}\n\n${sig()}`);
    }
},

// ──────────────────────────────────────────────────────────────────────────
//  SESSION ID
// ──────────────────────────────────────────────────────────────────────────
{
    command: 'session', category: 'settings', owner: true,
    execute: async (sock, m, ctx) => {
        if (!OW(ctx)) return ctx.reply(owErr);
        // .session or .session <number> → delegate to sessionid
        const num = ctx.args[0]?.replace(/\D/g,'');
        const sessionDir = path.join(__dirname, '..', 'sessions');
        const backupDir  = path.join(sessionDir, 'backup');
        const creds      = path.join(sessionDir, 'creds.json');

        if (!num) {
            if (!fs.existsSync(creds)) return ctx.reply(`❌ No active session found.\n\n${sig()}`);
            const raw = fs.readFileSync(creds);
            const sid = 'LIAM~' + Buffer.from(raw).toString('base64url');
            const sidMsg = await sock.sendMessage(m.chat, { text: sid }, { quoted: m });
            await sleep(500);
            return sock.sendMessage(m.chat, {
                text: `👆 *Your Bot Session ID*\n\nLong-press → Copy the LIAM~ message above\n⚠️ _Never share this!_\n\n${sig()}`
            }, { quoted: sidMsg });
        }

        if (!fs.existsSync(backupDir))
            return ctx.reply(`❌ No backup directory found.\n\n${sig()}`);

        const files = fs.readdirSync(backupDir).filter(f => f.includes(num) && f.endsWith('.json'));
        if (!files.length)
            return ctx.reply(`❌ No session backup for +${num}\n\n_Tip: pair first with .pair to auto-backup_\n\n${sig()}`);

        const latest = files.sort().pop();
        const data   = JSON.parse(fs.readFileSync(path.join(backupDir, latest)));
        const age    = Math.round((Date.now() - data.ts) / 60000);

        const sidMsg = await sock.sendMessage(m.chat, { text: data.sid }, { quoted: m });
        await sleep(500);
        sock.sendMessage(m.chat, {
            text: `📋 *Session for +${num}*\n\n⏱️ Saved ${age} min ago\n👆 Long-press to copy LIAM~ message above\n\n${sig()}`
        }, { quoted: sidMsg });
    }
},

];
