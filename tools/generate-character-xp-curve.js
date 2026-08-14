/**
 *
 * VibeCraft - generate-character-xp-curve
 *
 * Generates migrations/development/beta.48-character-xp-curve.sql, the character
 * level curve (T2.3). The engine (@reldens/skills LevelsSet) treats
 * required_experience as CUMULATIVE: leveling happens when the player's total XP
 * reaches the next level's required_experience.
 *
 * Curve: required_experience(level) = round(15 * level^2.4), level 1 = 0.
 * Tuning knob: change K (15) and P (2.4) below and re-run to regenerate.
 * Per-level stat growth: +2 atk, +2 def, +8 max hp, +8 max mp on every level,
 * applied to all four class paths (level sets 1-4) so every class levels equally.
 *
 * Idempotent: the level INSERT uses ON DUPLICATE KEY UPDATE (unique key is
 * `key`,`level_set_id`); the modifier INSERT is guarded with NOT EXISTS.
 *
 */

const fs = require('fs');
const path = require('path');

const LEVELS = 100;
const K = 15;
const P = 2.4;
const LEVEL_SETS = [1, 2, 3, 4];

function curve(level)
{
    return 1 === level ? 0 : Math.round(K * Math.pow(level, P));
}

function buildLevelCurve()
{
    const rows = [];
    for(let l = 1; l <= LEVELS; l++){
        rows.push(`    SELECT ${l} AS lvl, '${l}' AS lbl, ${curve(l)} AS xp`);
    }
    return `INSERT INTO \`skills_levels\` (\`key\`, \`label\`, \`required_experience\`, \`level_set_id\`)\n` +
        `SELECT c.lvl, c.lbl, c.xp, s.id\n` +
        `FROM (\n${rows.join('\n    UNION ALL\n')}\n) c\n` +
        `JOIN \`skills_levels_set\` s ON s.id IN (${LEVEL_SETS.join(',')})\n` +
        `ON DUPLICATE KEY UPDATE \`required_experience\` = VALUES(\`required_experience\`);`;
}

function buildModifiers()
{
    // one template row per (level, stat) pair; the JOIN fans it out to every level set:
    const stats = [
        {key: 'inc_atk', property: 'stats/atk', value: '2'},
        {key: 'inc_def', property: 'stats/def', value: '2'},
        {key: 'inc_hp', property: 'statsBase/hp', value: '8'},
        {key: 'inc_mp', property: 'statsBase/mp', value: '8'}
    ];
    const rows = [];
    for(let l = 1; l <= LEVELS; l++){
        for(const st of stats){
            rows.push(`    SELECT ${l} AS lvl, '${st.key}' AS mod_key, '${st.property}' AS prop, 1 AS op, '${st.value}' AS val`);
        }
    }
    return `INSERT INTO \`skills_levels_modifiers\` (\`level_id\`, \`key\`, \`property_key\`, \`operation\`, \`value\`, \`minValue\`, \`maxValue\`, \`minProperty\`, \`maxProperty\`)\n` +
        `SELECT l.id, m.mod_key, m.prop, m.op, m.val, NULL, NULL, NULL, NULL\n` +
        `FROM (\n${rows.join('\n    UNION ALL\n')}\n) m\n` +
        `JOIN \`skills_levels\` l ON l.\`key\` = m.lvl AND l.level_set_id IN (${LEVEL_SETS.join(',')})\n` +
        `WHERE NOT EXISTS (SELECT 1 FROM \`skills_levels_modifiers\` sm WHERE sm.level_id = l.id AND sm.\`key\` = m.mod_key);`;
}

const clearOldModifiers =
    '-- replace the tiny beta.16 modifiers (scrambled level_key ids, +10 atk) so the\n' +
    '-- new uniform +2/+8 per-level growth applies to every level of every set:\n' +
    'DELETE m FROM `skills_levels_modifiers` m\n' +
    'JOIN `skills_levels` l ON l.id = m.level_id\n' +
    'WHERE l.level_set_id IN (' + LEVEL_SETS.join(',') + ');';

const output = [
    '-- ===================================================================',
    '-- VibeCraft: character XP curve (T2.3 - personagem / XP de personagem)',
    '-- -------------------------------------------------------------------',
    '-- Adds a real cumulative XP curve (1-100) to all four class paths and',
    '-- per-level stat growth. The engine already feeds this curve from',
    '-- quests, gathering, crafting, farming, achievements and daily tasks;',
    '-- with a real curve players now actually progress.',
    '-- Curve: round(15 * level^2.4), level 1 = 0 XP, level 100 = 946.436 XP.',
    '-- Stat growth per level: +2 atk, +2 def, +8 max hp, +8 max mp.',
    '-- Tune K/P in tools/generate-character-xp-curve.js and re-run to retune.',
    '-- ===================================================================',
    '',
    buildLevelCurve(),
    '',
    clearOldModifiers,
    '',
    buildModifiers(),
    ''
].join('\n');

const target = path.join(__dirname, '..', 'migrations', 'development', 'beta.48-character-xp-curve.sql');
fs.writeFileSync(target, output, 'utf8');
console.log('wrote', target, '(', output.length, 'bytes,', output.split('\n').length, 'lines )');
