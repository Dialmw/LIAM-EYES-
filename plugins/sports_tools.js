// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES WhatsApp Bot                                            ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ║  Unauthorized redistribution, modification, or resale is prohibited.   ║
// ║  GitHub: https://github.com/Dialmw/LIAM-EYES                          ║
// ════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
//  LIAM EYES — SPORTS TOOLS  (39 commands)
//  Football leagues: EPL, La Liga, Bundesliga, Serie A, Ligue 1, EFL, EL, CL, WC
//  Wrestling: WWE events, news, schedule
// ══════════════════════════════════════════════════════════════════════════════
'use strict';
const axios  = require('axios');
const config = require('../settings/config');

const sig   = () => '> 👁️ 𝐋𝐈𝐀𝐌 𝐄𝐘𝐄𝐒';
const react = (s,m,e) => s.sendMessage(m.chat,{react:{text:e,key:m.key}}).catch(()=>{});

// ── League configs ─────────────────────────────────────────────────────────
const LEAGUES = {
    epl:        { id: 39,  name: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 English Premier League', season: 2024 },
    laliga:     { id: 140, name: '🇪🇸 La Liga',                    season: 2024 },
    bundesliga: { id: 78,  name: '🇩🇪 Bundesliga',                  season: 2024 },
    seriea:     { id: 135, name: '🇮🇹 Serie A',                     season: 2024 },
    ligue1:     { id: 61,  name: '🇫🇷 Ligue 1',                    season: 2024 },
    efl:        { id: 40,  name: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 EFL Championship',           season: 2024 },
    el:         { id: 3,   name: '🇪🇺 UEFA Europa League',           season: 2024 },
    cl:         { id: 2,   name: '🇪🇺 UEFA Champions League',        season: 2024 },
    wc:         { id: 1,   name: '🌍 FIFA World Cup',               season: 2026 },
};

// ── API-Football free tier via RapidAPI (anonymous fallback = pollinations) ──
const fetchFootball = async (endpoint, params) => {
    try {
        const { data } = await axios.get(`https://v3.football.api-sports.io/${endpoint}`, {
            params, timeout: 10000,
            headers: {
                'x-rapidapi-key': process.env.FOOTBALL_API_KEY || 'anonymous',
                'x-rapidapi-host': 'v3.football.api-sports.io',
            }
        });
        if (data?.errors && Object.keys(data.errors).length) throw new Error(JSON.stringify(data.errors));
        return data?.response || [];
    } catch (e) {
        // Fallback: ask AI for info
        return null;
    }
};

// ── AI fallback for football data ─────────────────────────────────────────
const aiFallback = async (query) => {
    try {
        const { data } = await axios.get(
            `https://text.pollinations.ai/${encodeURIComponent(query + '. Give concise, current data with emojis.')}`,
            { timeout: 15000, headers: { 'User-Agent': 'LIAM-EYES/2.0' } }
        );
        return (data || '').toString().trim();
    } catch(e) { return `❌ Could not fetch data. Try again later.\n\n${sig()}`; }
};

// ── Format match row ───────────────────────────────────────────────────────
const fmtMatch = m => {
    const h = m.teams?.home?.name || '?';
    const a = m.teams?.away?.name || '?';
    const gs = m.goals?.home, ga = m.goals?.away;
    const status = m.fixture?.status?.short;
    const score  = (gs !== null && ga !== null) ? `${gs}-${ga}` : 'vs';
    const dt = m.fixture?.date ? new Date(m.fixture.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : '';
    const live = ['1H','HT','2H','ET','BT','P','SUSP','INT','LIVE'].includes(status) ? ' 🔴' : '';
    return `${dt} ${h} *${score}* ${a}${live}`;
};

// ── Format standing row ───────────────────────────────────────────────────
const fmtStanding = (s, i) =>
    `${(i+1).toString().padStart(2)}. ${s.team?.name||'?'} │ GP:${s.all?.played||0} W:${s.all?.win||0} D:${s.all?.draw||0} L:${s.all?.lose||0} │ ${s.points||0}pts`;

// ── Build league command set ───────────────────────────────────────────────
const buildLeagueCommands = (key, league) => {
    const { id, name, season } = league;

    return [
        // MATCHES — recent + upcoming
        {
            command: `${key}matches`, category: 'sports',
            execute: async (sock, m, { reply }) => {
                await react(sock, m, '⚽');
                const data = await fetchFootball('fixtures', { league: id, season, last: 5 });
                if (!data || !data.length) {
                    const text = await aiFallback(`Latest ${name} match results ${season}`);
                    return reply(`⚽ *${name} — Recent Results*\n\n${text}\n\n${sig()}`);
                }
                const lines = data.map(fmtMatch).join('\n');
                reply(`⚽ *${name}*\n*Recent Matches*\n\n${lines}\n\n${sig()}`);
                await react(sock, m, '✅');
            }
        },
        // STANDINGS
        {
            command: `${key}standings`, category: 'sports',
            execute: async (sock, m, { reply }) => {
                await react(sock, m, '📊');
                const data = await fetchFootball('standings', { league: id, season });
                if (!data || !data.length) {
                    const text = await aiFallback(`Current ${name} standings table ${season}`);
                    return reply(`📊 *${name} — Standings*\n\n${text}\n\n${sig()}`);
                }
                const rows = (data[0]?.league?.standings?.[0] || []).slice(0,10);
                const lines = rows.map(fmtStanding).join('\n');
                reply(`📊 *${name}*\n*Top 10 Standings*\n\n\`\`\`\n${lines}\n\`\`\`\n\n${sig()}`);
                await react(sock, m, '✅');
            }
        },
        // TOP SCORERS
        {
            command: `${key}scorers`, category: 'sports',
            execute: async (sock, m, { reply }) => {
                await react(sock, m, '🥅');
                const data = await fetchFootball('players/topscorers', { league: id, season });
                if (!data || !data.length) {
                    const text = await aiFallback(`Top scorers ${name} ${season}`);
                    return reply(`🥅 *${name} — Top Scorers*\n\n${text}\n\n${sig()}`);
                }
                const lines = data.slice(0,10).map((p,i) => {
                    const pl = p.player, st = p.statistics?.[0];
                    return `${i+1}. ${pl?.name||'?'} (${st?.team?.name||'?'}) — ⚽ ${st?.goals?.total||0}`;
                }).join('\n');
                reply(`🥅 *${name} — Top Scorers*\n\n${lines}\n\n${sig()}`);
                await react(sock, m, '✅');
            }
        },
        // UPCOMING FIXTURES
        {
            command: `${key}upcoming`, category: 'sports',
            execute: async (sock, m, { reply }) => {
                await react(sock, m, '📅');
                const data = await fetchFootball('fixtures', { league: id, season, next: 5 });
                if (!data || !data.length) {
                    const text = await aiFallback(`Upcoming ${name} fixtures next week ${season}`);
                    return reply(`📅 *${name} — Upcoming*\n\n${text}\n\n${sig()}`);
                }
                const lines = data.map(fmtMatch).join('\n');
                reply(`📅 *${name}*\n*Upcoming Fixtures*\n\n${lines}\n\n${sig()}`);
                await react(sock, m, '✅');
            }
        },
    ];
};

// ── Generate all league commands ───────────────────────────────────────────
const leagueCommands = Object.entries(LEAGUES).flatMap(([key, league]) => buildLeagueCommands(key, league));

// ── Wrestling / WWE commands ───────────────────────────────────────────────
const wrestlingCommands = [
    {
        command: 'wrestlingevents', category: 'sports',
        execute: async (sock, m, { reply }) => {
            await react(sock, m, '🤼');
            const text = await aiFallback('Upcoming WWE and AEW wrestling events 2025 with dates and venues');
            reply(`🤼 *Upcoming Wrestling Events*\n\n${text}\n\n${sig()}`);
        }
    },
    {
        command: 'wwenews', category: 'sports',
        execute: async (sock, m, { reply }) => {
            await react(sock, m, '📰');
            const text = await aiFallback('Latest WWE wrestling news headlines today');
            reply(`📰 *WWE Latest News*\n\n${text}\n\n${sig()}`);
        }
    },
    {
        command: 'wweschedule', category: 'sports',
        execute: async (sock, m, { reply }) => {
            await react(sock, m, '📅');
            const text = await aiFallback('WWE RAW SmackDown NXT schedule this week with match card details');
            reply(`📅 *WWE Weekly Schedule*\n\n${text}\n\n${sig()}`);
        }
    },
    // Bonus sports commands to hit 325+
    {
        command: 'livescores', category: 'sports',
        execute: async (sock, m, { reply }) => {
            await react(sock, m, '🔴');
            const text = await aiFallback('Football live scores happening right now across all major leagues');
            reply(`🔴 *Live Football Scores*\n\n${text}\n\n${sig()}`);
        }
    },
    {
        command: 'transfernews', category: 'sports',
        execute: async (sock, m, { reply }) => {
            await react(sock, m, '📋');
            const text = await aiFallback('Latest football transfer news and rumours today');
            reply(`📋 *Transfer News*\n\n${text}\n\n${sig()}`);
        }
    },
    {
        command: 'nba', category: 'sports',
        execute: async (sock, m, { args, reply }) => {
            await react(sock, m, '🏀');
            const q = args.join(' ') || 'NBA latest results standings today';
            const text = await aiFallback(q);
            reply(`🏀 *NBA*\n\n${text}\n\n${sig()}`);
        }
    },
    {
        command: 'ufc', category: 'sports',
        execute: async (sock, m, { reply }) => {
            await react(sock, m, '🥊');
            const text = await aiFallback('Latest UFC fight results and upcoming UFC events schedule');
            reply(`🥊 *UFC News & Schedule*\n\n${text}\n\n${sig()}`);
        }
    },
    {
        command: 'formula1', category: 'sports',
        execute: async (sock, m, { reply }) => {
            await react(sock, m, '🏎️');
            const text = await aiFallback('Formula 1 2024 season latest results standings and upcoming races');
            reply(`🏎️ *Formula 1 2024*\n\n${text}\n\n${sig()}`);
        }
    },
    {
        command: 'cricket', category: 'sports',
        execute: async (sock, m, { args, reply }) => {
            await react(sock, m, '🏏');
            const q = args.join(' ') || 'latest international cricket match scores and results today';
            const text = await aiFallback(q);
            reply(`🏏 *Cricket*\n\n${text}\n\n${sig()}`);
        }
    },
];

module.exports = [...leagueCommands, ...wrestlingCommands];
