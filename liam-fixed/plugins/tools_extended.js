// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — EXTENDED TOOLS  (~35 commands)
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');
const config = require('../settings/config');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});
const getTmp= ext => path.join(os.tmpdir(), `liam_${Date.now()}${ext}`);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fixJid= j => (j||'').replace(/:\d+@/g,'@');

// ── Unicode font sets ──────────────────────────────────────────────────────
const FONTS = {
    bold:     { A:'𝐀',B:'𝐁',C:'𝐂',D:'𝐃',E:'𝐄',F:'𝐅',G:'𝐆',H:'𝐇',I:'𝐈',J:'𝐉',K:'𝐊',L:'𝐋',M:'𝐌',N:'𝐍',O:'𝐎',P:'𝐏',Q:'𝐐',R:'𝐑',S:'𝐒',T:'𝐓',U:'𝐔',V:'𝐕',W:'𝐖',X:'𝐗',Y:'𝐘',Z:'𝐙',a:'𝐚',b:'𝐛',c:'𝐜',d:'𝐝',e:'𝐞',f:'𝐟',g:'𝐠',h:'𝐡',i:'𝐢',j:'𝐣',k:'𝐤',l:'𝐥',m:'𝐦',n:'𝐧',o:'𝐨',p:'𝐩',q:'𝐪',r:'𝐫',s:'𝐬',t:'𝐭',u:'𝐮',v:'𝐯',w:'𝐰',x:'𝐱',y:'𝐲',z:'𝐳' },
    italic:   { A:'𝘈',B:'𝘉',C:'𝘊',D:'𝘋',E:'𝘌',F:'𝘍',G:'𝘎',H:'𝘏',I:'𝘐',J:'𝘑',K:'𝘒',L:'𝘓',M:'𝘔',N:'𝘕',O:'𝘖',P:'𝘗',Q:'𝘘',R:'𝘙',S:'𝘚',T:'𝘛',U:'𝘜',V:'𝘝',W:'𝘞',X:'𝘟',Y:'𝘠',Z:'𝘡',a:'𝘢',b:'𝘣',c:'𝘤',d:'𝘥',e:'𝘦',f:'𝘧',g:'𝘨',h:'𝘩',i:'𝘪',j:'𝘫',k:'𝘬',l:'𝘭',m:'𝘮',n:'𝘯',o:'𝘰',p:'𝘱',q:'𝘲',r:'𝘳',s:'𝘴',t:'𝘵',u:'𝘶',v:'𝘷',w:'𝘸',x:'𝘹',y:'𝘺',z:'𝘻' },
    script:   { A:'𝓐',B:'𝓑',C:'𝓒',D:'𝓓',E:'𝓔',F:'𝓕',G:'𝓖',H:'𝓗',I:'𝓘',J:'𝓙',K:'𝓚',L:'𝓛',M:'𝓜',N:'𝓝',O:'𝓞',P:'𝓟',Q:'𝓠',R:'𝓡',S:'𝓢',T:'𝓣',U:'𝓤',V:'𝓥',W:'𝓦',X:'𝓧',Y:'𝓨',Z:'𝓩',a:'𝓪',b:'𝓫',c:'𝓬',d:'𝓭',e:'𝓮',f:'𝓯',g:'𝓰',h:'𝓱',i:'𝓲',j:'𝓳',k:'𝓴',l:'𝓵',m:'𝓶',n:'𝓷',o:'𝓸',p:'𝓹',q:'𝓺',r:'𝓻',s:'𝓼',t:'𝓽',u:'𝓾',v:'𝓿',w:'𝔀',x:'𝔁',y:'𝔂',z:'𝔃' },
    double:   { A:'𝔸',B:'𝔹',C:'ℂ',D:'𝔻',E:'𝔼',F:'𝔽',G:'𝔾',H:'ℍ',I:'𝕀',J:'𝕁',K:'𝕂',L:'𝕃',M:'𝕄',N:'ℕ',O:'𝕆',P:'ℙ',Q:'ℚ',R:'ℝ',S:'𝕊',T:'𝕋',U:'𝕌',V:'𝕍',W:'𝕎',X:'𝕏',Y:'𝕐',Z:'ℤ',a:'𝕒',b:'𝕓',c:'𝕔',d:'𝕕',e:'𝕖',f:'𝕗',g:'𝕘',h:'𝕙',i:'𝕚',j:'𝕛',k:'𝕜',l:'𝕝',m:'𝕞',n:'𝕟',o:'𝕠',p:'𝕡',q:'𝕢',r:'𝕣',s:'𝕤',t:'𝕥',u:'𝕦',v:'𝕧',w:'𝕨',x:'𝕩',y:'𝕪',z:'𝕫' },
    gothic:   { A:'𝔄',B:'𝔅',C:'ℭ',D:'𝔇',E:'𝔈',F:'𝔉',G:'𝔊',H:'ℌ',I:'ℑ',J:'𝔍',K:'𝔎',L:'𝔏',M:'𝔐',N:'𝔑',O:'𝔒',P:'𝔓',Q:'𝔔',R:'ℜ',S:'𝔖',T:'𝔗',U:'𝔘',V:'𝔙',W:'𝔚',X:'𝔛',Y:'𝔜',Z:'ℨ',a:'𝔞',b:'𝔟',c:'𝔠',d:'𝔡',e:'𝔢',f:'𝔣',g:'𝔤',h:'𝔥',i:'𝔦',j:'𝔧',k:'𝔨',l:'𝔩',m:'𝔪',n:'𝔫',o:'𝔬',p:'𝔭',q:'𝔮',r:'𝔯',s:'𝔰',t:'𝔱',u:'𝔲',v:'𝔳',w:'𝔴',x:'𝔵',y:'𝔶',z:'𝔷' },
    flip:     { a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z',A:'∀',B:'q',C:'Ɔ',D:'p',E:'Ǝ',F:'Ⅎ',G:'פ',H:'H',I:'I',J:'ɾ',K:'ʞ',L:'˥',M:'W',N:'N',O:'O',P:'Ԁ',Q:'Q',R:'ɹ',S:'S',T:'┴',U:'∩',V:'Λ',W:'M',X:'X',Y:'⅄',Z:'Z','1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'ㄥ','8':'8','9':'6','0':'0','!':'¡','?':'¿','.':'˙',',': "'", "'": ',', '(': ')', ')': '(' },
};

const convert = (text, map) => text.split('').map(c => map[c] || c).join('');

module.exports = [

// ─────────────────────────────────────────────────────────────────────────────
//  .sticker — image/video to sticker
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'sticker', category: 'tools',
    execute: async (sock, m, { reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime) return reply(`❗ Reply to an image or video to make a sticker.\n\n${sig()}`);
        await react(sock, m, '🎨');
        try {
            const buf = await sock.downloadMediaMessage(q.msg || q);
            if (mime.includes('video')) {
                await sock.sendVideoAsSticker(m.chat, buf, m, { packname: config.sticker?.packname || 'LIAM EYES', author: config.sticker?.author || 'Liam' });
            } else {
                await sock.sendImageAsSticker(m.chat, buf, m, { packname: config.sticker?.packname || 'LIAM EYES', author: config.sticker?.author || 'Liam' });
            }
            await react(sock, m, '✅');
        } catch(e) { await react(sock, m,'❌'); reply(`❌ Sticker failed: ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .toimage — sticker to image
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'toimage', category: 'tools',
    execute: async (sock, m, { reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('webp')) return reply(`❗ Reply to a sticker.\n\n${sig()}`);
        try {
            await react(sock, m, '🖼️');
            const buf = await sock.downloadMediaMessage(q.msg || q);
            await sock.sendMessage(m.chat, { image: buf, caption: `🖼️ *Sticker converted!*\n\n${sig()}` }, { quoted: m });
            await react(sock, m, '✅');
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .fancy — convert text to multiple font styles
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'fancy', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.fancy <text>*\n\n${sig()}`);
        reply(
            `✨ *Fancy Text Converter*\n\n` +
            `🔤 Normal: ${text}\n` +
            `𝐁 Bold: ${convert(text, FONTS.bold)}\n` +
            `𝘐 Italic: ${convert(text, FONTS.italic)}\n` +
            `𝓒 Script: ${convert(text, FONTS.script)}\n` +
            `𝔻 Double: ${convert(text, FONTS.double)}\n` +
            `𝔊 Gothic: ${convert(text, FONTS.gothic)}\n\n${sig()}`
        );
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .fliptext — flip text upside down
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'fliptext', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.fliptext <text>*\n\n${sig()}`);
        const flipped = convert(text, FONTS.flip).split('').reverse().join('');
        reply(`🔄 *Flipped Text*\n\n${flipped}\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .calculate — evaluate math expression
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'calculate', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.calculate <expression>*\nExample: _.calculate 2 + 2 * 10_\n\n${sig()}`);
        try {
            // Safe math eval — only allow safe chars
            if (/[^0-9+\-*/%^.()\s,]/.test(text.replace(/sqrt|abs|pow|log|sin|cos|tan|pi|e/gi,'')))
                return reply(`❌ Invalid characters in expression.\n\n${sig()}`);
            const cleaned = text.replace(/pi/gi,'Math.PI').replace(/e(?!\d)/gi,'Math.E')
                .replace(/sqrt\(/g,'Math.sqrt(').replace(/abs\(/g,'Math.abs(')
                .replace(/pow\(/g,'Math.pow(').replace(/log\(/g,'Math.log(')
                .replace(/sin\(/g,'Math.sin(').replace(/cos\(/g,'Math.cos(')
                .replace(/tan\(/g,'Math.tan(').replace(/\^/g,'**');
            const result = Function('"use strict";return (' + cleaned + ')')();
            reply(`🧮 *Calculator*\n\n📥 Input: \`${text}\`\n📤 Result: *${result}*\n\n${sig()}`);
        } catch(e) { reply(`❌ Invalid expression: ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .qrcode — generate QR code for text/URL
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'qrcode', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.qrcode <text or url>*\n\n${sig()}`);
        await react(sock, m, '🔲');
        try {
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(text)}`;
            await sock.sendMessage(m.chat, {
                image: { url }, caption: `🔲 *QR Code Generated*\n📝 Content: _${text.slice(0,50)}${text.length>50?'…':''}_\n\n${sig()}`,
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch(e) { reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .genpass — generate secure password
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'genpass', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const len = Math.min(Math.max(parseInt(args[0]) || 16, 6), 64);
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
        const pass = Array.from(crypto.randomBytes(len)).map(b => charset[b % charset.length]).join('');
        reply(`🔐 *Generated Password (${len} chars)*\n\n\`${pass}\`\n\n⚠️ _Never share passwords!_\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .say — text to speech (TTS via voicerss)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'say', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const lang = args.length > 1 ? args[0] : 'en-us';
        const text = args.length > 1 ? args.slice(1).join(' ') : args.join(' ');
        if (!text) return reply(`❗ Usage: *.say [lang] <text>*\nExample: _.say sw Habari yako_\n\n${sig()}`);
        await react(sock, m, '🗣️');
        try {
            const url = `https://api.streamelements.com/kappa/v2/speech?voice=${lang === 'sw' ? 'Brian' : 'Brian'}&text=${encodeURIComponent(text)}`;
            const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
            await sock.sendMessage(m.chat, {
                audio: Buffer.from(data), mimetype: 'audio/mpeg', ptt: true
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch(e) {
            // Fallback: Google TTS
            try {
                const gtts = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text.slice(0,200))}`;
                const { data } = await axios.get(gtts, { responseType:'arraybuffer', timeout:12000, headers:{'User-Agent':'Mozilla/5.0'} });
                await sock.sendMessage(m.chat, { audio: Buffer.from(data), mimetype:'audio/mpeg', ptt:true }, { quoted: m });
                await react(sock, m, '✅');
            } catch(e2) { await react(sock,m,'❌'); reply(`❌ TTS failed: ${e2.message}\n\n${sig()}`); }
        }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .tinyurl — shorten a URL
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'tinyurl', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const url = args[0];
        if (!url || !url.startsWith('http')) return reply(`❗ Usage: *.tinyurl <url>*\n\n${sig()}`);
        await react(sock, m, '🔗');
        try {
            const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 8000 });
            reply(`🔗 *URL Shortened*\n\n📎 Original: ${url.slice(0,50)}…\n✂️ Short: *${data}*\n\n${sig()}`);
            await react(sock, m, '✅');
        } catch(e) { reply(`❌ ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .ssweb / .sswebpc / .sswebtab — screenshot a website
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'ssweb', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const url = args[0];
        if (!url || !url.startsWith('http')) return reply(`❗ Usage: *.ssweb <url>*\n\n${sig()}`);
        await react(sock, m, '📸');
        try {
            const ssUrl = `https://api.screenshotmachine.com?key=3b3df4&url=${encodeURIComponent(url)}&dimension=1920x1080&format=png&cacheLimit=0`;
            await sock.sendMessage(m.chat, {
                image: { url: ssUrl }, caption: `📸 *Screenshot*\n🌐 ${url}\n\n${sig()}`,
            }, { quoted: m });
            await react(sock, m, '✅');
        } catch(e) {
            // Fallback API
            try {
                const fb = `https://screenshot.abstractapi.com/v1/?api_key=&url=${encodeURIComponent(url)}`;
                await sock.sendMessage(m.chat,{image:{url:`https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot&meta=false&embed=screenshot.url`},caption:`📸 ${url}\n\n${sig()}`},{quoted:m});
                await react(sock, m, '✅');
            } catch(e2){ await react(sock,m,'❌'); reply(`❌ Screenshot failed: ${e2.message}\n\n${sig()}`); }
        }
    }
},
{
    command: 'sswebpc', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const url = args[0];
        if (!url || !url.startsWith('http')) return reply(`❗ Usage: *.sswebpc <url>*\n\n${sig()}`);
        await react(sock, m, '🖥️');
        try {
            const ssUrl = `https://image.thum.io/get/width/1280/png/${encodeURIComponent(url)}`;
            await sock.sendMessage(m.chat,{image:{url:ssUrl},caption:`🖥️ *Desktop Screenshot*\n🌐 ${url}\n\n${sig()}`},{quoted:m});
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},
{
    command: 'sswebtab', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const url = args[0];
        if (!url || !url.startsWith('http')) return reply(`❗ Usage: *.sswebtab <url>*\n\n${sig()}`);
        await react(sock, m, '📱');
        try {
            const ssUrl = `https://image.thum.io/get/width/390/png/${encodeURIComponent(url)}`;
            await sock.sendMessage(m.chat,{image:{url:ssUrl},caption:`📱 *Mobile Screenshot*\n🌐 ${url}\n\n${sig()}`},{quoted:m});
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .gsmarena — phone specs lookup
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'gsmarena', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.gsmarena <phone name>*\nExample: _.gsmarena Samsung Galaxy S24_\n\n${sig()}`);
        await react(sock, m, '📱');
        try {
            const { data } = await axios.get(
                `https://api.api-ninjas.com/v1/phones?name=${encodeURIComponent(text)}`,
                { timeout: 10000, headers: { 'X-Api-Key': 'anonymous' } }
            );
            if (!data?.length) {
                // Fallback: GPT description
                const { data: gpt } = await axios.get(
                    `https://text.pollinations.ai/${encodeURIComponent(`Give detailed specs for phone: ${text}. Format nicely with bullet points.`)}`,
                    { timeout: 15000 }
                );
                return reply(`📱 *${text}*\n\n${gpt?.toString()?.trim()}\n\n${sig()}`);
            }
            const p = data[0];
            reply(
                `📱 *${p.name || text}*\n\n` +
                `🔹 Brand: ${p.brand || 'N/A'}\n` +
                `🔹 OS: ${p.os || 'N/A'}\n` +
                `🔹 Display: ${p.display_size || 'N/A'}\n` +
                `🔹 RAM: ${p.memory_internal || 'N/A'}\n` +
                `🔹 Camera: ${p.camera || 'N/A'}\n` +
                `🔹 Battery: ${p.battery || 'N/A'}\n\n${sig()}`
            );
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .device — detect device from user-agent / WhatsApp client info
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'device', category: 'tools',
    execute: async (sock, m, { reply, quoted }) => {
        const target = m.quoted || m;
        const id     = target?.key?.id || '';
        // WhatsApp device detection from message ID prefix
        const device = id.startsWith('3A') ? '📱 iPhone (iOS)' :
                       id.startsWith('3E') ? '🤖 Android' :
                       id.startsWith('BA') ? '💻 Web/Desktop' :
                       id.startsWith('BE') ? '🖥️ WhatsApp Web' :
                       '❓ Unknown Device';
        reply(`🔍 *Device Detection*\n\n${device}\n📩 Msg ID: \`${id.slice(0,10)}…\`\n\n_Note: This is an estimate based on message ID prefix_\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .obfuscate — obfuscate JavaScript code
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'obfuscate', category: 'tools',
    execute: async (sock, m, { text, reply, quoted }) => {
        const input = text || (m.quoted?.message?.conversation) || (m.quoted?.message?.extendedTextMessage?.text) || '';
        if (!input) return reply(`❗ Usage: *.obfuscate <code>* or reply to code\n\n${sig()}`);
        // Simple obfuscation: base64 wrap
        const encoded = Buffer.from(input).toString('base64');
        const obf = `eval(Buffer.from("${encoded}","base64").toString())`;
        reply(`🔒 *Obfuscated Code*\n\n\`\`\`\n${obf}\n\`\`\`\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .tourl — upload media and get URL
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'tourl', category: 'tools',
    execute: async (sock, m, { reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime) return reply(`❗ Reply to any media to get its URL.\n\n${sig()}`);
        await react(sock, m, '🔗');
        try {
            const buf = await sock.downloadMediaMessage(q.msg || q);
            // Upload to catbox.moe (free, no auth)
            const form = new (require('form-data'))();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', buf, { filename: 'media.' + (mime.split('/')[1]||'bin'), contentType: mime });
            const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: form.getHeaders(), timeout: 30000
            });
            if (!data || !data.startsWith('http')) throw new Error('Upload failed');
            reply(`🔗 *Media URL*\n\n${data}\n\n_Link expires after 72h_\n\n${sig()}`);
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ Upload failed: ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .take — take sticker (forward with new pack info)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'take', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime.includes('webp')) return reply(`❗ Reply to a sticker to take it.\n\n${sig()}`);
        const pack = args[0] || (config.sticker?.packname || 'LIAM EYES');
        const auth = args[1] || (config.sticker?.author || 'Liam');
        await react(sock, m, '🎨');
        try {
            const buf = await sock.downloadMediaMessage(q.msg || q);
            await sock.sendImageAsSticker(m.chat, buf, m, { packname: pack, author: auth });
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .emojimix — mix two emojis
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'emojimix', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        if (args.length < 2) return reply(`❗ Usage: *.emojimix <emoji1> <emoji2>*\nExample: _.emojimix 😀 🔥_\n\n${sig()}`);
        const e1 = args[0], e2 = args[1];
        await react(sock, m, '✨');
        try {
            // Use Google's emoji kitchen API
            const cp1 = [...e1].map(c=>c.codePointAt(0).toString(16).padStart(4,'0')).join('-');
            const cp2 = [...e2].map(c=>c.codePointAt(0).toString(16).padStart(4,'0')).join('-');
            const kitchenUrl = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${cp1}/u${cp1}_u${cp2}.png`;
            const { status } = await axios.head(kitchenUrl, { timeout: 6000 });
            if (status === 200) {
                await sock.sendMessage(m.chat,{image:{url:kitchenUrl},caption:`✨ *${e1} + ${e2}*\n\n${sig()}`},{quoted:m});
                await react(sock, m, '✅');
            } else throw new Error('Combo not found');
        } catch(e){
            reply(`❌ This emoji combination isn't available in Google Kitchen.\nTry different emojis!\n\n${sig()}`);
        }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .texttopdf — convert text to PDF
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'texttopdf', category: 'tools',
    execute: async (sock, m, { text, reply, quoted }) => {
        const input = text || (m.quoted?.message?.conversation) || (m.quoted?.message?.extendedTextMessage?.text) || '';
        if (!input) return reply(`❗ Usage: *.texttopdf <text>* or reply to text\n\n${sig()}`);
        await react(sock, m, '📄');
        try {
            // Use a free PDF API
            const { data } = await axios.post('https://api.html2pdf.app/v1/generate', {
                html: `<html><body style="font-family:Arial;font-size:14px;padding:30px;line-height:1.6">${input.replace(/\n/g,'<br>')}</body></html>`,
                zoom: '1', display_header_footer: false, format: 'A4',
            }, { responseType: 'arraybuffer', timeout: 20000 });
            const out = getTmp('.pdf');
            fs.writeFileSync(out, data);
            await sock.sendMessage(m.chat, {
                document: Buffer.from(data), mimetype: 'application/pdf', fileName: 'liam-eyes.pdf',
                caption: `📄 *PDF Generated*\n\n${sig()}`
            }, { quoted: m });
            await react(sock, m, '✅');
            try { fs.unlinkSync(out); } catch(_) {}
        } catch(e){ await react(sock,m,'❌'); reply(`❌ PDF generation failed: ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .filtervcf — filter VCF contacts by country code
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'filtervcf', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || '';
        const code = args[0]?.replace(/\D/g,'');
        if (!code) return reply(`❗ Usage: *.filtervcf <country_code>* (reply to .vcf)\nExample: _.filtervcf 254_\n\n${sig()}`);
        if (!mime.includes('vcard') && !mime.includes('contacts'))
            return reply(`❗ Reply to a VCF contacts file.\n\n${sig()}`);
        await react(sock, m, '📋');
        try {
            const buf  = await sock.downloadMediaMessage(q.msg || q);
            const text = buf.toString();
            const entries = text.split(/BEGIN:VCARD/g).filter(Boolean).map(e => 'BEGIN:VCARD' + e);
            const filtered = entries.filter(e => e.includes(`+${code}`) || e.includes(`:${code}`));
            if (!filtered.length) return reply(`❌ No contacts found for +${code}\n\n${sig()}`);
            const out = getTmp('.vcf');
            fs.writeFileSync(out, filtered.join(''));
            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(out), mimetype: 'text/vcard', fileName: `filtered_${code}.vcf`,
                caption: `📋 *${filtered.length} contacts with +${code}*\n\n${sig()}`
            }, { quoted: m });
            await react(sock, m, '✅');
            try { fs.unlinkSync(out); } catch(_) {}
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .vcc — generate virtual credit card (test data)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'vcc', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const type = (args[0] || 'visa').toLowerCase();
        const prefixes = { visa: ['4'], mastercard: ['51','52','53','54','55'], amex: ['34','37'] };
        const prefix = prefixes[type]?.[Math.floor(Math.random()*3)] || '4';
        const len = type === 'amex' ? 15 : 16;
        let num = prefix;
        while (num.length < len - 1) num += Math.floor(Math.random()*10);
        // Luhn checksum
        let sum = 0;
        for (let i = num.length - 1; i >= 0; i-=2) sum += parseInt(num[i]);
        for (let i = num.length - 2; i >= 0; i-=2) { let d=parseInt(num[i])*2; sum += d>9?d-9:d; }
        num += ((10 - (sum%10)) % 10);
        const exp = `${(new Date().getMonth()+2).toString().padStart(2,'0')}/${(new Date().getFullYear()+2).toString().slice(-2)}`;
        const cvv = Array.from(crypto.randomBytes(3)).map(b=>b%10).join('');
        reply(
            `💳 *Virtual Test Card (${type.toUpperCase()})*\n\n` +
            `🔢 Number: \`${num.match(/.{4}/g)?.join(' ') || num}\`\n` +
            `📅 Expiry: ${exp}\n` +
            `🔐 CVV: ${cvv}\n\n` +
            `⚠️ _Test data only — not real card_\n\n${sig()}`
        );
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .runeval — safely evaluate expression (owner only)
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'runeval', category: 'tools', owner: true,
    execute: async (sock, m, { text, reply, isCreator }) => {
        if (!isCreator) return reply('👑 Owner only!\n\n' + sig());
        if (!text) return reply(`❗ Usage: *.runeval <expression>*\n\n${sig()}`);
        try {
            const result = await Promise.resolve(Function('"use strict";return (' + text + ')')()).catch(e=>e);
            reply(`⚡ *Eval Result*\n\n\`\`\`\n${JSON.stringify(result,null,2)}\n\`\`\`\n\n${sig()}`);
        } catch(e){ reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .browse — AI-powered web search answer
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'browse', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.browse <query>*\n\n${sig()}`);
        await react(sock, m, '🌐');
        try {
            const prompt = `Search and answer this query concisely with facts: ${text}. Include key facts and sources if possible.`;
            const { data } = await axios.get(
                `https://text.pollinations.ai/${encodeURIComponent(prompt)}`,
                { timeout: 18000, headers: { 'User-Agent': 'LIAM-EYES/2.0' } }
            );
            reply(`🌐 *Browse: ${text}*\n\n${(data||'').toString().trim()}\n\n${sig()}`);
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .base64 — encode/decode base64
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'base64', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const mode = (args[0] || 'encode').toLowerCase();
        const text = args.slice(1).join(' ');
        if (!text) return reply(`❗ Usage: *.base64 encode/decode <text>*\n\n${sig()}`);
        try {
            const result = mode === 'decode'
                ? Buffer.from(text, 'base64').toString('utf8')
                : Buffer.from(text).toString('base64');
            reply(`🔐 *Base64 ${mode === 'decode' ? 'Decoded' : 'Encoded'}*\n\n\`${result}\`\n\n${sig()}`);
        } catch(e){ reply(`❌ ${e.message}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .binary — convert text to binary / binary to text
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'binary', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const mode = (args[0] || 'encode').toLowerCase();
        const text = args.slice(1).join(' ');
        if (!text) return reply(`❗ Usage: *.binary encode/decode <text>*\n\n${sig()}`);
        const result = mode === 'decode'
            ? text.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('')
            : text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
        reply(`💻 *Binary ${mode === 'decode' ? 'Decoded' : 'Encoded'}*\n\n\`${result.slice(0,1000)}\`\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .morse — encode/decode morse code
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'morse', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const code = { A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.' };
        const rev  = Object.fromEntries(Object.entries(code).map(([k,v])=>[v,k]));
        const mode = (args[0]||'encode').toLowerCase();
        const text = args.slice(1).join(' ');
        if (!text) return reply(`❗ Usage: *.morse encode/decode <text>*\n\n${sig()}`);
        const result = mode === 'decode'
            ? text.split('  ').map(w => w.split(' ').map(c => rev[c]||'?').join('')).join(' ')
            : text.toUpperCase().split('').map(c => c === ' ' ? '  ' : (code[c]||'?')).join(' ');
        reply(`📡 *Morse ${mode === 'decode' ? 'Decoded' : 'Encoded'}*\n\n${result}\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .md5 — hash text with MD5
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'md5', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.md5 <text>*\n\n${sig()}`);
        const hash = crypto.createHash('md5').update(text).digest('hex');
        reply(`🔐 *MD5 Hash*\n\n📥 Input: \`${text}\`\n🔑 Hash: \`${hash}\`\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .sha256 — hash text with SHA-256
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'sha256', category: 'tools',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❗ Usage: *.sha256 <text>*\n\n${sig()}`);
        const hash = crypto.createHash('sha256').update(text).digest('hex');
        reply(`🔐 *SHA-256 Hash*\n\n📥 Input: \`${text}\`\n🔑 Hash: \`${hash}\`\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .uuid — generate UUID
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'uuid', category: 'tools',
    execute: async (sock, m, { reply }) => {
        const uuid = crypto.randomUUID ? crypto.randomUUID() : [8,4,4,4,12].map(n=>crypto.randomBytes(Math.ceil(n/2)).toString('hex').slice(0,n)).join('-');
        reply(`🔑 *UUID Generated*\n\n\`${uuid}\`\n\n${sig()}`);
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .ip — get IP info for a host
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'ip', category: 'tools',
    execute: async (sock, m, { args, reply }) => {
        const host = args[0] || '';
        if (!host) return reply(`❗ Usage: *.ip <domain or IP>*\nExample: _.ip google.com_\n\n${sig()}`);
        await react(sock, m, '🌐');
        try {
            const { data } = await axios.get(`https://ipapi.co/${host}/json/`, { timeout: 8000 });
            if (data.error) throw new Error(data.reason || 'Lookup failed');
            reply(
                `🌐 *IP Lookup: ${host}*\n\n` +
                `🔹 IP: ${data.ip}\n` +
                `🔹 Country: ${data.country_name} ${data.country_flag_emoji||''}\n` +
                `🔹 Region: ${data.region||'N/A'}\n` +
                `🔹 City: ${data.city||'N/A'}\n` +
                `🔹 ISP: ${data.org||'N/A'}\n` +
                `🔹 Timezone: ${data.timezone||'N/A'}\n\n${sig()}`
            );
            await react(sock, m, '✅');
        } catch(e){ await react(sock,m,'❌'); reply(`❌ ${e.message}\n\n${sig()}`); }
    }
},

// ─────────────────────────────────────────────────────────────────────────────
//  .character — count characters in a message
// ─────────────────────────────────────────────────────────────────────────────
{
    command: 'character', category: 'tools',
    execute: async (sock, m, { text, reply, quoted }) => {
        const input = text || (m.quoted?.message?.conversation) || (m.quoted?.message?.extendedTextMessage?.text) || '';
        if (!input) return reply(`❗ Usage: *.character <text>* or reply to a message\n\n${sig()}`);
        const words = input.trim().split(/\s+/).filter(Boolean).length;
        const sentences = (input.match(/[.!?]+/g) || []).length;
        reply(
            `📊 *Text Analysis*\n\n` +
            `📝 Characters: *${input.length}*\n` +
            `🔤 Characters (no spaces): *${input.replace(/\s/g,'').length}*\n` +
            `📖 Words: *${words}*\n` +
            `📄 Sentences: *${sentences}*\n` +
            `📑 Lines: *${input.split('\n').length}*\n\n${sig()}`
        );
    }
},

];
