// ════════════════════════════════════════════════════════════════════════════
//  build-encrypt.js — produces an obfuscated COPY of the bot for distribution.
//
//  - Your real source stays in index.js / media.js / imageedit.js, untouched.
//  - This writes obfuscated copies into ./dist/ — THAT is what you deploy or
//    share, so a casual repo browser / forker can't read your logic, owner
//    number, or API chain, even though settings.js stays a normal require.
//  - Run:  node build-encrypt.js      (after: npm i -D js-confuser)
//  - Deploy dist/ instead of the project root (copy package.json + settings.js
//    + node_modules alongside it, or point "main" at dist/start.js).
//
//  NOTE on real security: this raises the bar for casual reading/reselling of
//  your code. It is NOT encryption of secrets — anyone who controls the host
//  running the bot can still read your .env / session files at runtime. Keep
//  session files and API keys out of the obfuscated bundle; load them from
//  environment variables instead (settings.js already does this).
// ════════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const path = require('path');
const JsConfuser = require('js-confuser');

const SRC_DIR = __dirname;
const OUT_DIR = path.join(__dirname, 'dist');
const FILES = ['index.js', 'media.js', 'imageedit.js', 'start.js']; // settings.js intentionally left readable (it's user config)

const OPTIONS = {
    target: 'node',
    compact: true,
    minify: true,
    renameVariables: true,
    renameGlobals: false,       // keep `module`, `require`, `process` etc. intact
    identifierGenerator: 'randomized',
    stringEncoding: true,
    stringSplitting: true,
    stringConcealing: true,
    controlFlowFlattening: 0.6, // 0-1, higher = slower bot, more obfuscated
    deadCode: 0.2,
    dispatcher: true,
    duplicateLiteralsRemoval: true,
    objectExtraction: true,
    globalConcealing: true,
    lock: {
        // Stops the obfuscated file from running once your repo is cloned
        // somewhere else UNLESS you intentionally loosen this. Comment out
        // if you deploy on changing/ephemeral hosts (Render free tier, etc).
        // integrity: true,
    },
};

async function main() {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const file of FILES) {
        const srcPath = path.join(SRC_DIR, file);
        if (!fs.existsSync(srcPath)) { console.log(`skip (not found): ${file}`); continue; }
        const code = fs.readFileSync(srcPath, 'utf8');
        process.stdout.write(`obfuscating ${file} ... `);
        const { code: out } = await JsConfuser.obfuscate(code, OPTIONS);
        fs.writeFileSync(path.join(OUT_DIR, file), out);
        console.log(`done (${code.length} -> ${out.length} bytes)`);
    }
    console.log('\nDone. Deploy the dist/ folder (plus settings.js, package.json, node_modules).');
}

main().catch((e) => { console.error('Obfuscation failed:', e); process.exit(1); });
