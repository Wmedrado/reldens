/**
 *
 * Reldens - Farming Constants
 *
 */

const TYPE_FARM = 'farm';
const OPTION_PLANT = 'plant';
const OPTION_HARVEST = 'harvest';
const PLOT_STATE_EMPTY = 'empty';
const PLOT_STATE_PLANTED = 'planted';
const PLOT_STATE_READY = 'ready';
const DEFAULT_GROWTH_SECONDS = 60;

const SNIPPETS = {
    OBJECT: {
        CONTENT: 'A farm plot. Plant a seed and come back to harvest.',
        OPTIONS: {
            PLANT: 'Plant',
            HARVEST: 'Harvest'
        },
        NO_CROPS: 'No crops available to plant.',
        PLOT_OCCUPIED: 'This plot is already planted.',
        PLOT_NOT_READY: 'The crop is still growing.',
        PLANTED: 'Planted!',
        HARVESTED: 'Harvested!',
        NO_SEED: 'You do not have the required seed.',
        NOT_ENOUGH_ENERGY: 'Not enough energy to plant.'
    }
};

module.exports = {
    TYPE_FARM,
    OPTION_PLANT,
    OPTION_HARVEST,
    PLOT_STATE_EMPTY,
    PLOT_STATE_PLANTED,
    PLOT_STATE_READY,
    DEFAULT_GROWTH_SECONDS,
    SNIPPETS
};
