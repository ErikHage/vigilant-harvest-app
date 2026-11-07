import { VChip } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { tableHeaders, tableRows } from '../../../helpers/tables';
import PlantingsTable from '@/components/plantings/PlantingsTable.vue';

const plantsMap = {
    'plant-1': { plantId: 'plant-1', friendlyName: 'Provider bush bean' },
    'plant-2': { plantId: 'plant-2', friendlyName: 'Cherokee Purple' },
};
const plotsMap = {
    'plot-1': { plotId: 'plot-1', friendlyName: 'North bed' },
};
const plantings = [
    { plantingId: 'planting-1', name: 'late beans', plantId: 'plant-1', currentStatus: 'CREATED' },
    { plantingId: 'planting-2', name: 'Early beans', plantId: 'plant-1', plotId: 'plot-1', currentStatus: 'PLANTED', numberSown: 12, numberTransplanted: 10 },
    { plantingId: 'planting-3', name: 'Tomatoes', plantId: 'plant-2', currentStatus: 'STARTED', numberSown: 6 },
    { plantingId: 'planting-4', name: 'Old beans', plantId: 'plant-1', plotId: 'plot-1', currentStatus: 'RETIRED', numberSown: 8, numberTransplanted: 8 },
];

function mountTable(props) {
    return mountWithPlugins(PlantingsTable, {
        props: { plantsMap, plotsMap, plantings, onViewClicked: vi.fn(), ...props },
    });
}

const names = wrapper => tableRows(wrapper).map(([name]) => name);

describe('PlantingsTable', () => {
    it("lists each planting with its plant and plot, sorted by name ignoring case", () => {
        const wrapper = mountTable();

        expect(tableHeaders(wrapper)).toEqual(['Name', 'Plant', 'Qty', 'Plot', 'Status', '']);
        expect(tableRows(wrapper)).toEqual([
            ['Early beans', 'Provider bush bean', '10', 'North bed', 'PLANTED', ''],
            ['late beans', 'Provider bush bean', '', '', 'CREATED', ''],
            ['Old beans', 'Provider bush bean', '', 'North bed', 'RETIRED', ''],
            ['Tomatoes', 'Cherokee Purple', '6', '', 'STARTED', ''],
        ]);
    });

    // The quantity is the number sown while started, and the number
    // transplanted once planted. Created and retired plantings show none
    it('shows a quantity only for started and planted plantings', () => {
        const qty = Object.fromEntries(tableRows(mountTable()).map(([name, , count]) => [name, count]));

        expect(qty).toEqual({ 'Early beans': '10', 'late beans': '', 'Old beans': '', 'Tomatoes': '6' });
    });

    it("colours each status's chip", () => {
        const wrapper = mountTable();

        expect(wrapper.findAllComponents(VChip).map(chip => [chip.text(), chip.props('color')])).toEqual([
            ['PLANTED', 'success'],
            ['CREATED', 'info'],
            ['RETIRED', 'error'],
            ['STARTED', 'secondary'],
        ]);
    });

    it.each([
        ['a name', 'EARLY', ['Early beans']],
        ['a plant', 'cherokee', ['Tomatoes']],
        ['a plot', 'north', ['Early beans', 'Old beans']],
    ])('filters by %s, ignoring case', (_, filter, expected) => {
        expect(names(mountTable({ filter }))).toEqual(expected);
    });

    it('filters by status', () => {
        expect(names(mountTable({ statusFilter: 'PLANTED' }))).toEqual(['Early beans']);
    });

    it('counts the plantings shown, of all of them', () => {
        expect(mountTable().text()).toContain('4 of 4 plantings');
        expect(mountTable({ filter: 'beans', statusFilter: 'CREATED' }).text()).toContain('1 of 4 plantings');
    });

    it("calls onViewClicked with the row's planting, with its plant and plot names", async () => {
        const wrapper = mountTable();

        await wrapper.findAll('tbody tr')[0].find('.mdi-magnify').trigger('click');

        expect(wrapper.props('onViewClicked')).toHaveBeenCalledWith(expect.objectContaining({
            plantingId: 'planting-2',
            plantName: 'Provider bush bean',
            plotName: 'North bed',
        }));
    });

    // DocumentsCurrentBehavior: the table lists nothing until at least one
    // plot exists, though a created planting has no plot. A new garden's
    // plantings all show as "0 of N". Should list them with no plots
    it('lists no plantings when there are no plots', () => {
        const wrapper = mountTable({ plotsMap: {} });

        expect(tableRows(wrapper)).toEqual([]);
        expect(wrapper.text()).toContain('0 of 4 plantings');
    });

    // DocumentsCurrentBehavior: it reads the plant's name without checking the
    // plant is loaded, so it throws if the plants failed to load while the
    // plots didn't. Should show the planting without a plant name
    it("throws for a planting whose plant isn't loaded", () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        expect(() => mountTable({ plantsMap: {} })).toThrow(TypeError);

        vi.restoreAllMocks();
    });

    it('lists nothing with no plantings', () => {
        expect(mountTable({ plantings: [] }).text()).toContain('0 of 0 plantings');
    });
});
