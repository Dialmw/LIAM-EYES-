// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — apk_tools.js  (APK Download & URL Search)           ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('../settings/config');
const sig = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

// Fast URL search with AbortController and parallel fetching
const fastGet = async (url, opts = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeout || 15000);
    try {
        const { data } = await axios.get(url, { ...opts, signal: controller.signal });
        return data;
    } finally { clearTimeout(timeout); }
};

module.exports = [

// .apk — search and download APK
{
    command: 'apk', category: 'download',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❓ *Usage:* *.apk <app name>*\nExample: _.apk WhatsApp_\n\n${sig()}`);
        await react(sock, m, '⬇️');
        try {
            // APKPure API search
            const searchUrl = `https://apkpure.com/search?q=${encodeURIComponent(text)}`;
            // Use APKCombo which has a direct API
            const apiUrl = `https://api.apkcombo.com/apkcombo/download?apk=${encodeURIComponent(text)}&lang=en&device=phone`;

            // Strategy: search multiple APK sources in parallel
            const results = await Promise.any([
                // Source 1: APKCombo
                axios.get(`https://apkcombo.com/apk/${encodeURIComponent(text.toLowerCase().replace(/\s+/g,'-'))}/`, {
                    timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0' }
                }).then(r => {
                    const html = r.data;
                    const nameMatch = html.match(/<title>([^<]+)<\/title>/);
                    const versionMatch = html.match(/Version[^:]*:\s*([^\s<"]+)/i);
                    const sizeMatch = html.match(/Size[^:]*:\s*([^\s<"]+)/i);
                    const downloadMatch = html.match(/href="(https:\/\/download\.apkcombo\.com[^"]+\.apk[^"]*)"/i);
                    if (!downloadMatch) throw new Error('not found');
                    return {
                        name: nameMatch?.[1]?.split('APKCombo')[0]?.trim() || text,
                        version: versionMatch?.[1] || 'Latest',
                        size: sizeMatch?.[1] || 'Unknown',
                        downloadUrl: downloadMatch[1],
                        source: 'APKCombo'
                    };
                }),

                // Source 2: APKPure  
                axios.get(`https://apkpure.com/${text.toLowerCase().replace(/\s+/g,'-')}/`, {
                    timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0' }
                }).then(r => {
                    const html = r.data;
                    const downloadMatch = html.match(/href="(https:\/\/[^"]+\.apk[^"]*)"/i);
                    if (!downloadMatch) throw new Error('not found');
                    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
                    return {
                        name: nameMatch?.[1] || text,
                        version: 'Latest',
                        size: 'Unknown',
                        downloadUrl: downloadMatch[1],
                        source: 'APKPure'
                    };
                })
            ]).catch(() => null);

            if (results?.downloadUrl) {
                // Try to download and send the actual APK file
                await reply(
                    `📦 *APK Found!*\n\n` +
                    `📱 *App:* ${results.name}\n` +
                    `🔢 *Version:* ${results.version}\n` +
                    `💾 *Size:* ${results.size}\n` +
                    `🌐 *Source:* ${results.source}\n\n` +
                    `⬇️ *Download Link:*\n${results.downloadUrl}\n\n` +
                    `_Note: Tap the link to download the APK file_\n\n${sig()}`
                );
                // Try to send as document if small enough
                try {
                    await react(sock, m, '📥');
                    const apkRes = await axios.get(results.downloadUrl, {
                        responseType: 'arraybuffer', timeout: 60000,
                        headers: { 'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-10485760' },
                        maxContentLength: 10 * 1024 * 1024, // 10MB limit
                    });
                    const buf = Buffer.from(apkRes.data);
                    if (buf.length > 100000) { // at least 100KB — real APK
                        await sock.sendMessage(m.chat, {
                            document: buf,
                            mimetype: 'application/vnd.android.package-archive',
                            fileName: `${results.name.replace(/[^a-zA-Z0-9]/g,'_')}.apk`,
                            caption: `📦 *${results.name}*\n🔢 v${results.version}\n\n${sig()}`
                        }, { quoted: m });
                        await react(sock, m, '✅');
                    }
                } catch(_) { /* Link was sent above, download silently failed */ }
            } else {
                // Fallback: Google Play link
                const playUrl = `https://play.google.com/store/search?q=${encodeURIComponent(text)}&c=apps`;
                reply(
                    `🔍 *APK Search: ${text}*\n\n` +
                    `Could not find direct APK download. Try:\n\n` +
                    `🟢 *Google Play:*\n${playUrl}\n\n` +
                    `📦 *APKPure:*\nhttps://apkpure.com/search?q=${encodeURIComponent(text)}\n\n` +
                    `📦 *APKCombo:*\nhttps://apkcombo.com/search?q=${encodeURIComponent(text)}\n\n` +
                    `${sig()}`
                );
                await react(sock, m, '🔗');
            }
        } catch(e) {
            await react(sock, m, '❌');
            reply(`❌ APK search failed: ${e.message}\n\nTry: https://apkpure.com/search?q=${encodeURIComponent(text)}\n\n${sig()}`);
        }
    }
},

// .urlinfo — fast URL meta info
{
    command: 'urlinfo', category: 'search',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❓ Usage: *.urlinfo <url>*\n\n${sig()}`);
        const url = text.startsWith('http') ? text : 'https://' + text;
        await react(sock, m, '🌐');
        try {
            const start = Date.now();
            const res = await axios.get(url, {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LIAM-EYES/2.0)' },
                maxRedirects: 5,
                validateStatus: () => true,
            });
            const ms = Date.now() - start;
            const html = res.data?.toString() || '';
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const descMatch  = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);
            const title = titleMatch?.[1]?.trim().slice(0,80) || 'No title';
            const desc  = descMatch?.[1]?.trim().slice(0,120) || 'No description';
            const contentType = res.headers?.['content-type']?.split(';')[0] || 'unknown';
            const size = res.headers?.['content-length'] ? Math.round(res.headers['content-length']/1024) + 'KB' : 'unknown';
            reply(
                `🌐 *URL Info*\n\n` +
                `🔗 *URL:* ${url.slice(0,60)}...\n` +
                `📄 *Title:* ${title}\n` +
                `📝 *Desc:* ${desc}\n` +
                `📊 *Status:* ${res.status}\n` +
                `📦 *Type:* ${contentType}\n` +
                `💾 *Size:* ${size}\n` +
                `⚡ *Speed:* ${ms}ms\n\n` +
                `${sig()}`
            );
            await react(sock, m, '✅');
        } catch(e) { await react(sock, m, '❌'); reply(`❌ Could not fetch URL: ${e.message}\n\n${sig()}`); }
    }
},

// .urlsearch — fast parallel web search
{
    command: 'urlsearch', category: 'search',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`❓ Usage: *.urlsearch <query>*\n\n${sig()}`);
        await react(sock, m, '🔍');
        try {
            // Use DuckDuckGo instant answers (no key, fast)
            const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(text)}&format=json&no_html=1&skip_disambig=1`;
            const { data } = await axios.get(ddgUrl, { timeout: 8000 });

            let result = '';
            if (data.AbstractText) {
                result = data.AbstractText.slice(0, 500);
            } else if (data.Answer) {
                result = data.Answer;
            } else if (data.RelatedTopics?.length) {
                result = data.RelatedTopics.slice(0,3)
                    .map(t => t.Text || '').filter(Boolean).join('\n\n');
            }

            if (result) {
                reply(
                    `🔍 *Search: ${text}*\n\n` +
                    `${result}\n\n` +
                    `🌐 *More:* https://duckduckgo.com/?q=${encodeURIComponent(text)}\n\n` +
                    `${sig()}`
                );
            } else {
                reply(
                    `🔍 *Search: ${text}*\n\n` +
                    `No instant answer found.\n\n` +
                    `🌐 *Search online:*\nhttps://duckduckgo.com/?q=${encodeURIComponent(text)}\n\n` +
                    `${sig()}`
                );
            }
            await react(sock, m, '✅');
        } catch(e) { await react(sock, m, '❌'); reply(`❌ Search failed: ${e.message}\n\n${sig()}`); }
    }
},

];
