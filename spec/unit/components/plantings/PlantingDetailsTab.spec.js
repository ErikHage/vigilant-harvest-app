import { reactive } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { VAutocomplete, VSelect } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { inputLabelled } from '../../../helpers/fields';
import { aPlanting } from '../../../helpers/plantings';
import DatePickerDialogActivator from '@/components/utils/DatePickerDialogActivator.vue';
import PlantingDetailsTab from '@/components/plantings/PlantingDetailsTab.vue';

const plants = () => [
    { plantId: 'plant-2', friendlyName: 'cherokee Purple' },
    { plantId: 'plant-1', friendlyName: 'Provider bush bean' },
];
const plots = () => [
    { plotId: 'plot-2', friendlyName: 'south bed' },
    { plotId: 'plot-1', friendlyName: 'North bed' },
];

// The page passes its copy of the planting, which the tab edits in place
function mountTab({ planting = aPlanting(), enableEdit = false, ...props } = {}) {
    const $router = { push: vi.fn() };
    const wrapper = mountWithPlugins(PlantingDetailsTab, {
        props: { planting, plants: plants(), plots: plots(), enableEdit, ...props },
        global: { mocks: { $router } },
    });
    return { wrapper, planting, $router };
}

const disabled = (wrapper, label) => inputLabelled(wrapper, label).attributes('disabled') !== undefined;
const pickers = wrapper => Object.fromEntries(wrapper.findAllComponents(DatePickerDialogActivator)
    .map(picker => [picker.props('title'), picker]));
const shownDates = wrapper => wrapper.findAll('h3.ml-2').map(heading => heading.text());

describe('PlantingDetailsTab', () => {
    let warn;

    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows nothing without a planting', () => {
        const { wrapper } = mountTab({ planting: null });

        expect(wrapper.text()).toBe('');
    });

    it("shows the planting's fields", () => {
        const { wrapper } = mountTab();

        expect(inputLabelled(wrapper, 'Name').element.value).toBe('Early beans');
        expect(inputLabelled(wrapper, 'source').element.value).toBe("Johnny's");
        expect(inputLabelled(wrapper, 'Lot#').element.value).toBe('L-14');
        expect(inputLabelled(wrapper, 'Current Planting Year').element.value).toBe('2026');
        expect(inputLabelled(wrapper, 'Transplant Lead Time (weeks)').element.value).toBe('3');
        expect(inputLabelled(wrapper, 'Number Sown').element.value).toBe('24');
        expect(inputLabelled(wrapper, 'Number Planted').element.value).toBe('20');
        expect(inputLabelled(wrapper, 'Created At').element.value).toBe(new Date('2026-03-01T18:00:00Z').toLocaleString());
        expect(wrapper.findComponent(VAutocomplete).props('modelValue')).toBe('plant-1');
        expect(wrapper.findComponent(VSelect).props('modelValue')).toBe('plot-1');
    });

    // The dates are YYYY-MM-DD strings, which dayjs reads as local days
    it('shows the target, sow and planting dates as given', () => {
        const { wrapper } = mountTab();

        expect(shownDates(wrapper)).toEqual(['2026-05-17', '2026-04-20', '2026-05-18']);
    });

    it('shows -- for a date not set', () => {
        const { wrapper } = mountTab({ planting: aPlanting({ sowDate: null, transplantDate: null, targetPlantingDate: null }) });

        expect(shownDates(wrapper)).toEqual(['--', '--', '--']);
    });

    it.each([
        [[2026], '2026'],
        [[2024, 2025, 2026], '2024 - 2026'],
        [[], ''],
        [undefined, ''],
    ])('shows planting years %j as %j', (plantingYears, shown) => {
        const { wrapper } = mountTab({ planting: aPlanting({ plantingYears }) });

        expect(inputLabelled(wrapper, 'Planting Years').element.value).toBe(shown);
    });

    // It sorts the arrays it was given, in place: the stores' lists (B21)
    it('offers the plants and plots by name, ignoring case, sorting the arrays it was given', () => {
        const givenPlants = plants();
        const givenPlots = plots();

        const { wrapper } = mountTab({ plants: givenPlants, plots: givenPlots });

        expect(wrapper.findComponent(VAutocomplete).props('items').map(p => p.plantId)).toEqual(['plant-2', 'plant-1']);
        expect(givenPlants.map(p => p.plantId)).toEqual(['plant-2', 'plant-1']);
        expect(givenPlots.map(p => p.plotId)).toEqual(['plot-1', 'plot-2']);
    });

    it('locks every field until editing is enabled', () => {
        const { wrapper } = mountTab();

        for (const label of ['Name', 'source', 'Lot#', 'Transplant Lead Time (weeks)', 'Number Sown', 'Number Planted']) {
            expect(disabled(wrapper, label)).toBe(true);
        }
        expect(Object.values(pickers(wrapper)).every(picker => picker.props('disabled'))).toBe(true);
    });

    // Name, source and lot are editable in every status; the rest only in the
    // status they belong to
    it.each([
        ['CREATED', ['Name', 'source', 'Lot#', 'Transplant Lead Time (weeks)'], ['Set Target Planting Date']],
        ['STARTED', ['Name', 'source', 'Lot#', 'Number Sown'], ['Set Target Planting Date', 'Set Sow Date']],
        ['PLANTED', ['Name', 'source', 'Lot#', 'Number Planted'], ['Set Planting Date']],
        ['RETIRED', ['Name', 'source', 'Lot#'], []],
    ])('when %s and unlocked, opens only its own fields', (status, openFields, openPickers) => {
        const { wrapper } = mountTab({ planting: aPlanting({ currentStatus: status }), enableEdit: true });

        const fields = ['Name', 'source', 'Lot#', 'Transplant Lead Time (weeks)', 'Number Sown', 'Number Planted'];
        expect(fields.filter(label => !disabled(wrapper, label))).toEqual(openFields);
        expect(Object.entries(pickers(wrapper)).filter(([, picker]) => !picker.props('disabled')).map(([title]) => title))
            .toEqual(openPickers);
        expect(wrapper.findComponent(VAutocomplete).props('disabled')).toBe(status !== 'CREATED');
        expect(wrapper.findComponent(VSelect).props('disabled')).toBe(status !== 'PLANTED');
    });

    it('greys out the dates it locks', () => {
        const { wrapper } = mountTab({ planting: aPlanting({ currentStatus: 'STARTED' }), enableEdit: true });

        expect(wrapper.findAll('.disabled-text').map(div => div.find('p').text())).toEqual(['Date planted']);
    });

    it('follows the page unlocking editing', async () => {
        const { wrapper } = mountTab();

        await wrapper.setProps({ enableEdit: true });

        expect(disabled(wrapper, 'Name')).toBe(false);
    });

    it("edits the page's copy of the planting directly", async () => {
        const { wrapper, planting } = mountTab({ enableEdit: true });

        await inputLabelled(wrapper, 'Name').setValue('Earliest beans');
        await inputLabelled(wrapper, 'Number Planted').setValue('18');
        await wrapper.findComponent(VSelect).setValue('plot-2');

        expect(planting).toMatchObject({ name: 'Earliest beans', numberTransplanted: 18, plotId: 'plot-2' });
    });

    it.each([
        ['source', 'seedSource', 'Baker Creek', 'RETIRED'],
        ['Lot#', 'lotNumber', 'L-99', 'RETIRED'],
        ['Transplant Lead Time (weeks)', 'leadTimeWeeks', 4, 'CREATED'],
        ['Number Sown', 'numberSown', 30, 'STARTED'],
    ])('edits %s in the copy', async (label, field, value, currentStatus) => {
        const { wrapper, planting } = mountTab({ planting: aPlanting({ currentStatus }), enableEdit: true });

        await inputLabelled(wrapper, label).setValue(String(value));

        expect(planting[field]).toBe(value);
    });

    it('changes the plant in the copy, for a created planting', async () => {
        const { wrapper, planting } = mountTab({ planting: aPlanting({ currentStatus: 'CREATED' }), enableEdit: true });

        await wrapper.findComponent(VAutocomplete).setValue('plant-2');

        expect(planting.plantId).toBe('plant-2');
    });

    it.each([
        ['Set Target Planting Date', 'targetPlantingDate', 'CREATED'],
        ['Set Sow Date', 'sowDate', 'STARTED'],
        ['Set Planting Date', 'transplantDate', 'PLANTED'],
    ])('sets the date picked in %s', async (title, field, status) => {
        const { wrapper, planting } = mountTab({ planting: aPlanting({ currentStatus: status }), enableEdit: true });

        pickers(wrapper)[title].props('onSubmit')(new Date(2026, 5, 2));
        await flushPromises();

        expect(planting[field]).toEqual(new Date(2026, 5, 2));
    });

    it("goes to the planting's plant from the sprout button", async () => {
        const { wrapper, $router } = mountTab();

        await wrapper.find('.mdi-sprout-outline').trigger('click');

        expect($router.push).toHaveBeenCalledWith({ name: 'PlantDetailsPage', params: { plantId: 'plant-1' } });
    });

    // The plot button's handler is a placeholder that only logs
    it('does nothing from the plot button but log', async () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        const { wrapper, $router } = mountTab();

        await wrapper.find('.mdi-vector-square').trigger('click');

        expect($router.push).not.toHaveBeenCalled();
        expect(log).toHaveBeenCalledWith('plot clicked, do something in the future');
    });

    // The service sends dates as YYYY-MM-DD strings, and the pickers take
    // Dates: each gets its day's local midnight, so Vue has nothing to warn
    // about (backlog B25)
    it('gives the date pickers Dates', () => {
        const { wrapper } = mountTab();

        const given = Object.entries(pickers(wrapper)).map(([title, picker]) => [title, picker.props('date')]);
        expect(given).toEqual([
            ['Set Target Planting Date', new Date(2026, 4, 17)],
            ['Set Sow Date', new Date(2026, 3, 20)],
            ['Set Planting Date', new Date(2026, 4, 18)],
        ]);
        expect(warn).not.toHaveBeenCalled();
    });

    // DocumentsCurrentBehavior: each date picker reads its date only when
    // it's created (backlog B15). The page renders this tab before its copy
    // of the planting is filled, so every picker keeps the empty date it
    // started with, and opens with nothing chosen. Confirming without picking
    // then clears the date on screen. Should follow the planting's date
    it('keeps the dates its pickers started with', async () => {
        // reactive, as the page's copy is, so the tab sees the date arrive
        const planting = reactive(aPlanting({ currentStatus: 'STARTED', sowDate: null }));
        const { wrapper } = mountTab({ planting, enableEdit: true });
        planting.sowDate = '2026-04-20';
        await flushPromises();
        expect(shownDates(wrapper)[1]).toBe('2026-04-20');

        pickers(wrapper)['Set Sow Date'].vm.handleOnSubmit();
        await flushPromises();

        expect(shownDates(wrapper)[1]).toBe('--');
    });
});
