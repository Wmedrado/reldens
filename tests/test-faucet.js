/**
 *
 * Reldens - test-faucet
 *
 * Standalone tests for the token faucet. Uses an in-memory fake repository and
 * a pinned injectable clock, so no database or real time is needed.
 *
 */

const assert = require('assert');
const { Faucet } = require('../lib/blockchain/server/faucet');

function createFakeRepo()
{
    let rows = [];
    let nextId = 1;
    return {
        rows,
        async create(params)
        {
            let row = Object.assign({id: nextId++}, params);
            rows.push(row);
            return row;
        },
        async loadAll()
        {
            return rows;
        },
        async loadOneBy(field, value)
        {
            return rows.find((currentRow) => currentRow[field] === value) || null;
        },
        async updateById(id, params)
        {
            let row = rows.find((currentRow) => currentRow.id === id);
            if(row){
                Object.assign(row, params);
            }
            return row;
        },
        async deleteById(id)
        {
            rows = rows.filter((currentRow) => currentRow.id !== id);
            return true;
        }
    };
}

function makeRepo()
{
    let repo = createFakeRepo();
    return {repo, dataServer: {getEntity(){ return repo; }}};
}

function makeConfig(values)
{
    return {
        getWithoutLogs(key, defaultValue)
        {
            return undefined !== values[key] ? values[key] : defaultValue;
        }
    };
}

async function main()
{
    let BASE = 1000000000000;
    let current = BASE;
    let now = () => current;
    let COOLDOWN = 60;
    let grants = [];
    let values = {
        'server/blockchain/faucet/enabled': true,
        'server/blockchain/faucet/cooldownSeconds': COOLDOWN,
        'server/blockchain/faucet/amount': 5
    };

    // Disabled -> ok:false, reason disabled.
    let disabledFaucet = new Faucet({
        dataServer: makeRepo().dataServer,
        config: makeConfig({'server/blockchain/faucet/enabled': false}),
        now: now
    });
    let disabledResult = await disabledFaucet.claimForUser(1);
    assert.strictEqual(disabledResult.ok, false);
    assert.strictEqual(disabledResult.reason, 'disabled');

    // First claim -> ok, amount, grant callback invoked.
    let setup = makeRepo();
    let faucet = new Faucet({
        dataServer: setup.dataServer,
        config: makeConfig(values),
        now: now
    });
    faucet.setGrantCallback(async (userId, amount) => {
        grants.push({userId, amount});
    });
    let firstClaim = await faucet.claimForUser(7);
    assert.strictEqual(firstClaim.ok, true);
    assert.strictEqual(firstClaim.amount, 5);
    assert.strictEqual(setup.repo.rows.length, 1);
    assert.strictEqual(grants.length, 1);
    assert.deepStrictEqual(grants[0], {userId: 7, amount: 5});

    // Second claim within cooldown -> ok:false, cooldown + retryAfterSeconds.
    current = BASE + 30 * 1000;
    let secondClaim = await faucet.claimForUser(7);
    assert.strictEqual(secondClaim.ok, false);
    assert.strictEqual(secondClaim.reason, 'cooldown');
    assert.ok(secondClaim.retryAfterSeconds > 0);
    assert.strictEqual(secondClaim.retryAfterSeconds, 30);
    assert.strictEqual(setup.repo.rows.length, 1, 'no new row on cooldown');

    // After cooldown -> ok again, grant called again.
    current = BASE + (COOLDOWN + 1) * 1000;
    let thirdClaim = await faucet.claimForUser(7);
    assert.strictEqual(thirdClaim.ok, true);
    assert.strictEqual(grants.length, 2);

    // statusForUser reflects the cooldown without mutating.
    current = BASE + 2 * 1000;
    let status = await faucet.statusForUser(7);
    assert.strictEqual(status.ok, false);
    assert.strictEqual(status.reason, 'cooldown');
    assert.ok(status.retryAfterSeconds > 0);
    current = BASE + (2 * COOLDOWN + 1) * 1000;
    status = await faucet.statusForUser(7);
    assert.strictEqual(status.ok, true);
    assert.strictEqual(setup.repo.rows.length, 1, 'statusForUser never writes');

    console.log('test-faucet: OK');
}

main().catch((error) => {
    console.error('test-faucet: FAIL', error);
    process.exit(1);
});
