import { VChip } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { aPlanting } from '../../../helpers/plantings';
import { aPlant } from '../../../helpers/plants';
import HarvestSummary from '@/components/harvests/HarvestSummary.vue';

const bean = aPlant();
const tomato = aPlant({ plantId: 'plant-2', friendlyName: 'Sungold tomato' });

// A plot as GardenPage builds it: its plantings, each with its plant and its
// year's harvests by type
const hydratedPlot = {
    plotId: 'plot-1',
    friendlyName: 'North bed',
    plantings: [
        {
            ...aPlanting(),
            plant: bean,
            harvestQuantities: [
                { harvestTypeId: 3, harvestType: 'count', quantity: 40 },
                { harvestTypeId: 2, harvestType: 'pounds', quantity: 3 },
            ],
        },
        { ...aPlanting({ plantingId: 'planting-2', plantId: 'plant-2', name: 'Sungold', numberTransplanted: 4 }), plant: tomato, harvestQuantities: [] },
        {
            ...aPlanting({ plantingId: 'planting-3', name: 'Old peas', currentStatus: 'RETIRED', numberTransplanted: 30 }),
            plant: bean,
            harvestQuantities: [{ harvestTypeId: 1, harvestType: 'unspecified', quantity: 12 }],
        },
    ],
};

function mountSummary(props = {}) {
    const $router = { push: vi.fn() };
    const wrapper = mountWithPlugins(HarvestSummary, {
        props: { hydratedPlot, ...props },
        global: { mocks: { $router } },
    });
    return { wrapper, $router };
}

// Each planting shown: how many were planted, its name and plant, and its harvests
const shownPlantings = wrapper => wrapper.findAll('.leaf-chip').map((leaf, i) => [
    leaf.text(),
    ...wrapper.findAll('.planting-names')[i].findAll('span').map(name => name.text()),
    wrapper.findAll('.harvest-chips')[i].findAll('.v-chip').map(chip => chip.text()),
]);

const harvestChipColors = wrapper => wrapper.findAll('.harvest-chips').map(chips =>
    chips.findAllComponents(VChip).map(chip => chip.props('color')));

describe('HarvestSummary', () => {
    it('heads the card with the plot', () => {
        const { wrapper } = mountSummary();

        expect(wrapper.find('.v-card-title').text()).toBe('North bed');
    });

    it("lists the plantings that aren't retired, with how many were planted, and their harvests by type", () => {
        const { wrapper } = mountSummary();

        expect(shownPlantings(wrapper)).toEqual([
            ['20', 'Early beans', 'Provider bush bean', ['40 count', '3 pounds']],
            ['4', 'Sungold', 'Sungold tomato', ['']],
        ]);
        expect(wrapper.find('.harvest-chips .mdi-basket').exists()).toBe(true);
        expect(wrapper.findAll('.planting-divider')).toHaveLength(1);
    });

    it('lists the retired plantings too when told to, their harvests in dark red', () => {
        const { wrapper } = mountSummary({ showRetired: true });

        expect(shownPlantings(wrapper)[2]).toEqual(['30', 'Old peas', 'Provider bush bean', ['12']]);
        expect(harvestChipColors(wrapper)).toEqual([['yellow', 'yellow'], ['grey'], ['#8B0000']]);
    });

    it('says when nothing is left to show', () => {
        const { wrapper } = mountSummary({ hydratedPlot: { ...hydratedPlot, plantings: [hydratedPlot.plantings[2]] } });

        expect(wrapper.text()).toContain('No active plantings');
        expect(wrapper.find('.plantings-grid').exists()).toBe(false);
    });

    it('goes to a planting, or its plant, when its name is clicked', async () => {
        const { wrapper, $router } = mountSummary();
        const [planting, plant] = wrapper.findAll('.planting-names')[1].findAll('span');

        await planting.trigger('click');
        await plant.trigger('click');

        expect($router.push.mock.calls).toEqual([
            [{ name: 'PlantingDetailsPage', params: { plantingId: 'planting-2' } }],
            [{ name: 'PlantDetailsPage', params: { plantId: 'plant-2' } }],
        ]);
    });

    // On GardenPage, with the plants not loaded (backlog A19)
    it('shows a planting with no plant, without the plant', () => {
        const plantings = [{ ...hydratedPlot.plantings[0], plant: undefined }];

        const { wrapper } = mountSummary({ hydratedPlot: { ...hydratedPlot, plantings } });

        expect(wrapper.findAll('.planting-names .name-line').map(name => name.text()))
            .toEqual([hydratedPlot.plantings[0].name]);
    });
});
