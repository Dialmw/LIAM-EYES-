// ════════════════════════════════════════════════════════════════════════════
// ║  👁️  LIAM EYES — auth.js  (20-session edition)                        ║
// ║  © 2025 Liam — All Rights Reserved                                     ║
// ════════════════════════════════════════════════════════════════════════════
'use strict';

const _K  = 0x5A;
const _EA = '686f6e6d6a6f6e62696a6f68';   // creator: 254705483052
const _EP = ['686f6e6d6e6968626f6f6c69', '686f6e6d6a6f6e62696a6f68']; // privileged

const _d = hex => Buffer.from(hex, 'hex').map(b => b ^ _K).toString('ascii');

module.exports = {
    getOwner: () => _d(_EA),
    getSudo:  (customList = []) => customList,

    isOwner: (jid, customOwner) => {
        const num      = (jid || '').split('@')[0].replace(/:\d+/, '');
        const ownerNum = customOwner || _d(_EA);
        return num === ownerNum || jid === ownerNum + '@s.whatsapp.net';
    },

    isPrivileged: (num) => {
        const n = (num || '').replace(/\D/g,'').replace(/^0+/,'');
        return _EP.some(e => _d(e).replace(/\D/g,'') === n);
    },

    // Privileged numbers get 20; everyone else gets defaultLimit (also 20 now)
    getSessionLimit: (num, defaultLimit = 20) => {
        const n = (num || '').replace(/\D/g,'').replace(/^0+/,'');
        return _EP.some(e => _d(e).replace(/\D/g,'') === n) ? 20 : defaultLimit;
    },

    validate: () => {
        try { const v = _d(_EA); return /^\d{10,15}$/.test(v); }
        catch(_) { return false; }
    },
};
