/**
 *
 * Capital Builder - AI agent client
 *
 * Pushes map ops to the collab server so the AI can build maps live while the
 * human watches/edits in the browser.
 *
 * Usage:
 *   node ai.js --map <name> --op '<json op>'
 *   node ai.js --map <name> --file ops.json      (array of ops, applied in order)
 *   node ai.js --map <name> --file ops.json --say 'mensagem'   (prints msg, no op)
 *
 * The ops file format:
 *   [
 *     {"type":"tile","layer":"ground","x":3,"y":4,"gid":116},
 *     {"type":"fill","layer":"ground","x":0,"y":0,"w":5,"h":5,"gid":121},
 *     {"type":"object-add","layer":"objects","object":{"name":"npc","type":"sprite","x":96,"y":96,"width":32,"height":32}}
 *   ]
 *
 */

const http = require('http');

const BASE = process.env.CAPITAL_URL || 'http://localhost:4310';

function parseArgs(argv)
{
    let args = {op: null, file: null, map: null, say: null};
    for(let i = 0; i < argv.length; i++){
        if(argv[i] === '--map'){ args.map = argv[++i]; }
        if(argv[i] === '--op'){ args.op = argv[++i]; }
        if(argv[i] === '--file'){ args.file = argv[++i]; }
        if(argv[i] === '--say'){ args.say = argv[++i]; }
    }
    return args;
}

function post(path, body)
{
    return new Promise((resolve, reject) => {
        let data = JSON.stringify(body);
        let url = new URL(BASE + path);
        let req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data)}
        }, (res) => {
            let chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

(async function main()
{
    let args = parseArgs(process.argv.slice(2));
    if(!args.map){
        console.error('use --map <name>');
        process.exit(1);
    }
    if(args.say){
        console.log('[ai] ' + args.say);
        return;
    }
    let ops;
    if(args.op){
        ops = [JSON.parse(args.op)];
    } else if(args.file){
        let fs = require('fs');
        ops = JSON.parse(fs.readFileSync(args.file, 'utf8'));
    } else {
        console.error('provide --op or --file');
        process.exit(1);
    }
    let results = [];
    for(let op of ops){
        let res = await post('/api/op', {map: args.map, op});
        results.push({ok: !!res.ok, rev: res.rev, type: op.type});
        if(!res.ok){
            console.error('OP REJECTED:', JSON.stringify(op), res.error);
        }
    }
    let ok = results.filter(r => r.ok).length;
    console.log(`[ai] ${args.map}: ${ok}/${ops.length} ops aplicados` + (results.length ? ' (rev ' + results[results.length - 1].rev + ')' : ''));
})().catch(err => {
    console.error('[ai] ERROR:', err.message);
    process.exit(1);
});
