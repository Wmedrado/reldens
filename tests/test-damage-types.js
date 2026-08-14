/**
 *
 * Reldens - test-damage-types
 *
 * Standalone tests for the damage types system (pure logic, no live server).
 *
 */

const assert = require('assert');
const { DamageTypes } = require('../lib/actions/server/damage-types');

(async () => {

    // valid types:
    assert.strictEqual(DamageTypes.isValidType('slash'), true);
    assert.strictEqual(DamageTypes.isValidType('magic'), true);
    assert.strictEqual(DamageTypes.isValidType('fire'), false);
    assert.strictEqual(DamageTypes.isValidType(''), false);

    // getSkillDamageType:
    assert.strictEqual(
        DamageTypes.getSkillDamageType({key: 'slashAtk', customData: '{"damageType":"slash"}'}),
        'slash'
    );
    assert.strictEqual(
        DamageTypes.getSkillDamageType({key: 'plainAtk', customData: '{}'}),
        false
    );
    assert.strictEqual(
        DamageTypes.getSkillDamageType({key: 'plainAtk'}),
        false
    );
    assert.strictEqual(
        DamageTypes.getSkillDamageType({key: 'badType', customData: '{"damageType":"fire"}'}),
        false
    );

    // no damage data, multiplier is neutral:
    assert.strictEqual(DamageTypes.getDamageTypeMultiplier('slash', {}), 1);
    assert.strictEqual(DamageTypes.getDamageTypeMultiplier('slash', null), 1);
    assert.strictEqual(DamageTypes.getDamageTypeMultiplier('invalid', {def_slash: 1}), 1);

    // direct weakness multiplier (weak_<type>):
    assert.strictEqual(
        DamageTypes.getDamageTypeMultiplier('slash', {weak_slash: 1.5}),
        1.5
    );
    assert.strictEqual(
        DamageTypes.getDamageTypeMultiplier('slash', {weak_slash: 0.5}),
        0.5
    );

    // defense conversion (def_<type>), negative is a weakness:
    assert.strictEqual(DamageTypes.getDamageTypeMultiplier('slash', {def_slash: -3}), 1.3);
    assert.strictEqual(DamageTypes.getDamageTypeMultiplier('slash', {def_slash: 2}), 0.8);
    assert.strictEqual(DamageTypes.getDamageTypeMultiplier('crush', {def_crush: -7}), 1.5);
    assert.strictEqual(DamageTypes.getDamageTypeMultiplier('crush', {def_crush: 7}), 0.5);

    // weakness multiplier has precedence over defense conversion:
    assert.strictEqual(
        DamageTypes.getDamageTypeMultiplier('slash', {def_slash: -3, weak_slash: 0.6}),
        0.6
    );

    // Fase 2: game entity with a `damageTypes` map takes precedence over `stats`:
    let entity = {
        stats: {def_slash: -3},
        damageTypes: {weak_slash: 0.6, def_magic: 5}
    };
    assert.strictEqual(DamageTypes.getDamageTypeMultiplier('slash', entity), 0.6);
    assert.strictEqual(DamageTypes.getDamageTypeMultiplier('magic', entity), 0.5);

    // Fase 2: entity with only `stats` falls back to the stats map:
    let statsOnlyEntity = {stats: {def_slash: -3}};
    assert.strictEqual(DamageTypes.getDamageTypeMultiplier('slash', statsOnlyEntity), 1.3);

    // applyDamageTypeToSkill:
    let skill = {
        key: 'slashAtk',
        hitDamage: 100,
        customData: '{"damageType":"slash"}',
        target: {stats: {def_slash: -3}}
    };
    assert.strictEqual(DamageTypes.applyDamageTypeToSkill(skill), true);
    assert.strictEqual(skill.hitDamage, 130);
    assert.strictEqual(skill.__damageTypeOriginalHitDamage, 100);

    // restore brings the base damage back:
    assert.strictEqual(DamageTypes.restoreDamageTypeFromSkill(skill), true);
    assert.strictEqual(skill.hitDamage, 100);
    assert.strictEqual(skill.__damageTypeOriginalHitDamage, undefined);

    // no restore when nothing was applied:
    assert.strictEqual(DamageTypes.restoreDamageTypeFromSkill(skill), false);

    // skill without damage type is not modified:
    let plainSkill = {
        key: 'plainAtk',
        hitDamage: 50,
        target: {stats: {def_slash: -3}}
    };
    assert.strictEqual(DamageTypes.applyDamageTypeToSkill(plainSkill), false);
    assert.strictEqual(plainSkill.hitDamage, 50);

    // skill without hitDamage is not an attack:
    let effectSkill = {key: 'heal', target: {stats: {}}};
    assert.strictEqual(DamageTypes.applyDamageTypeToSkill(effectSkill), false);

    // neutral multiplier leaves the skill untouched:
    let neutralSkill = {
        key: 'slashAtk',
        hitDamage: 100,
        customData: '{"damageType":"slash"}',
        target: {stats: {}}
    };
    assert.strictEqual(DamageTypes.applyDamageTypeToSkill(neutralSkill), false);
    assert.strictEqual(neutralSkill.hitDamage, 100);

    console.log('test-damage-types: all tests passed');
})();
