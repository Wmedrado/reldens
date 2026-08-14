/**
 *
 * VibeCraft - test-kill-xp
 *
 * Verifies the T2.3 combat XP chain: when an enemy dies the RewardsPlugin is
 * already wired to reldens.battleEnded and gives the player's class path the
 * enemy's rewards.experience (Rat 5, Goblin 10, Orc 20, Golem 50 - seeded by
 * beta.48-vibecraft-creatures.sql). This test drives the REAL RewardsSubscriber
 * with mocked player/target/events and asserts the XP reaches
 * skillsServer.classPath.addExperience(). No live server or database.
 *
 */

const assert = require('assert');
const { Reward } = require('../lib/rewards/server/reward');
const { RewardsSubscriber } = require('../lib/rewards/server/subscribers/rewards-subscriber');

// ---------------------------------------------------------------------------
// mocks
// ---------------------------------------------------------------------------

function makeClassPath()
{
    return {
        currentLevel: 1,
        currentExp: 0,
        granted: [],
        async addExperience(exp)
        {
            this.granted.push(Number(exp));
            this.currentExp = this.currentExp + Number(exp);
        }
    };
}

function makePlayer(playerId, classPath)
{
    return {
        player_id: playerId,
        currentTeam: null,
        vip: {},
        skillsServer: { classPath },
        inventory: {
            manager: {
                async createItemInstance(){ return null; }
            }
        }
    };
}

function makeTargetObject(id, rewards)
{
    return {
        id,
        rewards,
        dropTables: [],
        dataServer: {
            getEntity: () => ({ async updateById(){ return {}; } })
        }
    };
}

function makeReward(experience, itemId = null)
{
    // droppable item + experience, drop_rate 100 => always wins, valid reward:
    return new Reward({
        id: 1,
        objectId: 1,
        itemId,
        modifierId: null,
        experience,
        dropRate: 100,
        dropQuantity: 1,
        isUnique: 0,
        wasGiven: 0,
        hasDropBody: 1,
        animationData: {assetKey: 'drop'},
        item: itemId ? {} : null,
        modifier: null
    });
}

const eventsMock = { async emit(){ return true; } };

function makeSubscriber(splitExperience = 0)
{
    return new RewardsSubscriber({
        featuresManager: {
            featuresList: { teams: { package: null } },
            config: {
                getWithoutLogs: () => ({splitExperience})
            }
        }
    });
}

// ---------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------

async function main()
{
    // --- single player kill: full rewards.experience reaches classPath ------
    let cp = makeClassPath();
    let subscriber = makeSubscriber(0); // SPLIT_EXPERIENCE.ALL
    let rat = makeTargetObject(400, [makeReward(5, 102)]);
    await subscriber.giveRewards(makePlayer(7, cp), rat, eventsMock);
    assert.deepStrictEqual(cp.granted, [5], 'Rat (5 XP) grants exactly 5 XP');
    assert.strictEqual(cp.currentExp, 5, 'classPath accumulates the 5 XP');

    cp = makeClassPath();
    let goblin = makeTargetObject(401, [makeReward(10, 102)]);
    await subscriber.giveRewards(makePlayer(7, cp), goblin, eventsMock);
    assert.deepStrictEqual(cp.granted, [10], 'Goblin (10 XP) grants 10 XP');

    cp = makeClassPath();
    let orc = makeTargetObject(402, [makeReward(20, 102)]);
    await subscriber.giveRewards(makePlayer(7, cp), orc, eventsMock);
    assert.deepStrictEqual(cp.granted, [20], 'Orc (20 XP) grants 20 XP');

    cp = makeClassPath();
    let golem = makeTargetObject(403, [makeReward(50, 102)]);
    await subscriber.giveRewards(makePlayer(7, cp), golem, eventsMock);
    assert.deepStrictEqual(cp.granted, [50], 'Golem (50 XP) grants 50 XP');

    // --- experience-only reward (no item/modifier) is still granted ---------
    cp = makeClassPath();
    let expOnly = makeTargetObject(404, [makeReward(10, null)]);
    await subscriber.giveRewards(makePlayer(7, cp), expOnly, eventsMock);
    assert.deepStrictEqual(cp.granted, [10], 'experience-only reward grants XP');

    // --- reward with zero experience grants nothing --------------------------
    cp = makeClassPath();
    let noExp = makeTargetObject(405, [makeReward(0, 102)]);
    await subscriber.giveRewards(makePlayer(7, cp), noExp, eventsMock);
    assert.deepStrictEqual(cp.granted, [], 'zero-experience reward grants no XP');

    // --- team kill with SPLIT_EXPERIENCE.ALL splits evenly ------------------
    // the team mock uses the real player schemas (which carry skillsServer),
    // the same way TeamsPlugin holds the live player objects:
    let cpA = makeClassPath();
    let cpB = makeClassPath();
    let playerA = makePlayer(7, cpA);
    let playerB = makePlayer(8, cpB);
    playerA.currentTeam = 'teamA';
    playerB.currentTeam = 'teamA';
    let teamSubscriber = new RewardsSubscriber({
        featuresManager: {
            featuresList: { teams: { package: { teams: { teamA: { players: {'7': playerA, '8': playerB} } } } } },
            config: { getWithoutLogs: () => ({splitExperience: 0}) }
        }
    });
    let teamGoblin = makeTargetObject(401, [makeReward(10, 102)]);
    // giveRewards walks the killer's own targets; in ALL-split every team
    // member gets the split on every team kill (whoever dealt the killing blow):
    await teamSubscriber.giveRewards(playerA, teamGoblin, eventsMock);
    assert.deepStrictEqual(cpA.granted, [5], 'team ALL split: A gets half of A kill');
    assert.deepStrictEqual(cpB.granted, [5], 'team ALL split: B gets half of A kill');
    await teamSubscriber.giveRewards(playerB, teamGoblin, eventsMock);
    assert.deepStrictEqual(cpA.granted, [5, 5], 'team ALL split: A gets half of B kill');
    assert.deepStrictEqual(cpB.granted, [5, 5], 'team ALL split: B gets half of B kill');

    // --- several kills accumulate on the same classPath ----------------------
    cp = makeClassPath();
    await subscriber.giveRewards(makePlayer(7, cp), rat, eventsMock);
    await subscriber.giveRewards(makePlayer(7, cp), goblin, eventsMock);
    assert.deepStrictEqual(cp.granted, [5, 10], 'XP accumulates across kills');
    assert.strictEqual(cp.currentExp, 15, 'currentExp is the sum of kills');

    console.log('test-kill-xp: all tests passed');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
