import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VSelect } from 'vuetify/components';
import PlantEditPage from '@/components/views/dashboard/plants/PlantEditPage.vue';
import TextBoxDialog from '@/components/utils/TextBoxDialog.vue';
import PlantTagsDialog from '@/components/plants/PlantTagsDialog.vue';
import ManagePlantSchedulesDialog from '@/components/plants/ManagePlantSchedulesDialog.vue';
import { usePlantsStore } from '@/store';
import { mountWithPlugins } from '../../../../../helpers/mount';
import { buttonLabelled, inputLabelled } from '../../../../../helpers/fields';
import { aPlant } from '../../../../../helpers/plants';

const categories = [
    {
        categoryId: 'category-1',
        categoryName: 'Legumes',
        subcategories: [
            { subcategoryId: 'subcategory-1', subcategoryName: 'Beans' },
            { subcategoryId: 'subcategory-2', subcategoryName: 'Peas' },
        ],
    },
    {
        categoryId: 'category-2',
        categoryName: 'Nightshades',
        subcategories: [{ subcategoryId: 'subcategory-3', subcategoryName: 'Tomatoes' }],
    },
];
const harvestTypes = [
    { harvestTypeId: 1, harvestTypeName: 'unspecified' },
    { harvestTypeId: 2, harvestTypeName: 'pounds' },
];

// Mounts the page on /plants/plant-1/edit. The store's fetches are stubs, so
// the plant is whatever plantsById holds
async function mountPage({ plantsById = { 'plant-1': aPlant() }, state = {}, beforeMount = () => {} } = {}) {
    const pinia = createTestingPinia({
        initialState: { plants: { plantsById, categories, harvestTypes, ...state } },
    });
    beforeMount(usePlantsStore(pinia));
    const $router = { push: vi.fn() };
    const wrapper = mountWithPlugins(PlantEditPage, {
        global: {
            plugins: [pinia],
            mocks: { $route: { params: { plantId: 'plant-1' } }, $router },
            // Its own spec covers the schedules dialog, which needs the
            // activity-schedules store
            stubs: { ManagePlantSchedulesDialog: true },
        },
        attachTo: document.body,
    });
    await flushPromises();
    return { wrapper, store: usePlantsStore(pinia), $router };
}

const select = (wrapper, label) => wrapper.findAllComponents(VSelect).find(s => s.props('label') === label);
const button = (wrapper, label) => buttonLabelled(wrapper, label);
const enabled = (wrapper, label) => button(wrapper, label).attributes('disabled') === undefined;
const textBox = (wrapper, title) => wrapper.findAllComponents(TextBoxDialog).find(box => box.props('title') === title);

async function type(wrapper, label, value) {
    await inputLabelled(wrapper, label).setValue(value);
    await flushPromises();
}

async function update(wrapper) {
    await button(wrapper, 'Update').trigger('click');
    await flushPromises();
}

describe('PlantEditPage', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('loading', () => {
        it('loads the plant, the categories and the harvest types', async () => {
            const { store } = await mountPage();

            expect(store.fetchPlantById).toHaveBeenCalledWith('plant-1');
            expect(store.fetchPlantCategories).toHaveBeenCalledTimes(1);
            expect(store.fetchHarvestTypes).toHaveBeenCalledTimes(1);
        });

        it('fills the form from the plant', async () => {
            const { wrapper } = await mountPage();

            expect(wrapper.find('.page-title').text()).toBe('Provider bush bean');
            expect(inputLabelled(wrapper, 'Id').element.value).toBe('plant-1');
            expect(inputLabelled(wrapper, 'Created At').element.value)
                .toBe(new Date('2026-03-01T13:00:00.000Z').toLocaleString());
            expect(inputLabelled(wrapper, 'Name').element.value).toBe('Provider bush bean');
            expect(inputLabelled(wrapper, 'Indoor Sow').element.value).toBe('0');
            expect(inputLabelled(wrapper, 'Planting Depth (in.)').element.value).toBe('1');
            expect(inputLabelled(wrapper, 'Family').element.value).toBe('Fabaceae');
            expect(wrapper.text()).toContain('A reliable bush bean.');
        });

        it("selects the plant's category, subcategory, lifespan type and harvest type", async () => {
            const { wrapper } = await mountPage();

            expect(select(wrapper, 'Category').props('modelValue')).toEqual(categories[0]);
            expect(select(wrapper, 'Subcategory').props('modelValue')).toBe('subcategory-1');
            expect(select(wrapper, 'Subcategory').props('items')).toEqual(categories[0].subcategories);
            expect(select(wrapper, 'Lifespan Type').props('modelValue')).toBe('Annual');
            expect(select(wrapper, 'Default Harvest Type').props('modelValue')).toBe(2);
        });

        it('selects the unspecified harvest type for a plant without one', async () => {
            const plant = aPlant({ harvesting: { ...aPlant().harvesting, defaultHarvestTypeId: null } });
            const { wrapper } = await mountPage({ plantsById: { 'plant-1': plant } });

            expect(select(wrapper, 'Default Harvest Type').props('modelValue')).toBe(1);
        });

        it("lists the plant's schedules, and goes to one from its name", async () => {
            const { wrapper, $router } = await mountPage();

            await wrapper.find('h4.clickable').trigger('click');

            expect(wrapper.find('h4.clickable').text()).toBe('Beans');
            expect($router.push).toHaveBeenCalledWith({
                name: 'ActivityScheduleDetailsPage',
                params: { activityScheduleId: 'schedule-1' },
            });
        });

        it('shows the climbing height only for a plant that climbs', async () => {
            const { wrapper } = await mountPage();
            expect(wrapper.text()).not.toContain('Climbing Height (ft.)');

            await wrapper.find('.v-checkbox input').setValue(true);

            expect(wrapper.text()).toContain('Climbing Height (ft.)');
        });

        it("shows the plants store's alert, and a spinner while loading", async () => {
            const { wrapper } = await mountPage({
                state: { loading: true, alertVisible: true, alertType: 'error', alertMessage: 'error upserting plant' },
            });

            expect(wrapper.find('.v-alert').text()).toBe('error upserting plant');
            expect(wrapper.find('.v-progress-circular').exists()).toBe(true);
        });

        // DocumentsCurrentBehavior: with no plant loaded, refreshData copies
        // plantsById[plantId], which is undefined, through JSON.parse, which
        // throws. mounted() doesn't await refreshData, so in the app that's an
        // unhandled rejection in the console (backlog A10). Should not throw.
        // The page shows only its alert.
        //
        // The mount's own refresh is held, so its rejection can't escape the
        // test, and the second refresh is the one checked
        it('throws, and shows only the alert, when the plant is not loaded', async () => {
            const { wrapper } = await mountPage({
                plantsById: {},
                state: { alertVisible: true, alertType: 'error', alertMessage: 'error fetching plant' },
                beforeMount: store => store.fetchPlantById.mockReturnValueOnce(new Promise(() => {})),
            });

            await expect(wrapper.vm.refreshData()).rejects.toThrow(SyntaxError);
            expect(wrapper.text()).toBe('error fetching plant');
        });
    });

    describe('Update and Reset', () => {
        it('are disabled until something changes', async () => {
            const { wrapper } = await mountPage();

            expect(enabled(wrapper, 'Update')).toBe(false);
            expect(enabled(wrapper, 'Reset')).toBe(false);

            await type(wrapper, 'Name', 'Provider');

            expect(enabled(wrapper, 'Update')).toBe(true);
            expect(enabled(wrapper, 'Reset')).toBe(true);
        });

        it('count a change only in spaces at either end as no change', async () => {
            const { wrapper } = await mountPage();

            await type(wrapper, 'Name', '  Provider bush bean  ');

            expect(enabled(wrapper, 'Update')).toBe(false);
        });

        it.each([
            ['the depth', wrapper => type(wrapper, 'Planting Depth (in.)', '2')],
            ['the harvest type', wrapper => select(wrapper, 'Default Harvest Type').setValue(1)],
            ['the subcategory', wrapper => select(wrapper, 'Subcategory').setValue('subcategory-2')],
            ['a note', wrapper => textBox(wrapper, 'Growing Notes').props('onSubmit')('Water deeply.')],
            ['the tags', wrapper => wrapper.findComponent(PlantTagsDialog).props('onSubmit')(['Determinate'])],
        ])('are enabled by a change to %s', async (_, change) => {
            const { wrapper } = await mountPage();

            await change(wrapper);
            await flushPromises();

            expect(enabled(wrapper, 'Update')).toBe(true);
        });

        it('clears the subcategory when the category changes', async () => {
            const { wrapper } = await mountPage();

            await select(wrapper, 'Category').setValue(categories[1]);

            expect(select(wrapper, 'Subcategory').props('modelValue')).toBeNull();
            expect(select(wrapper, 'Subcategory').props('items')).toEqual(categories[1].subcategories);
        });

        it('sends the whole plant, trimmed, then reloads and says so', async () => {
            const { wrapper, store } = await mountPage();
            store.upsertPlant.mockResolvedValue(true);
            await type(wrapper, 'Name', '  Provider  ');
            await type(wrapper, 'Plant Spacing (in.)', '4');
            await select(wrapper, 'Subcategory').setValue('subcategory-2');
            await textBox(wrapper, 'Description').props('onSubmit')('Bush bean. ');

            await update(wrapper);

            expect(store.upsertPlant).toHaveBeenCalledWith({
                plantId: 'plant-1',
                subcategoryId: 'subcategory-2',
                friendlyName: 'Provider',
                lifespanType: 'Annual',
                seedSource: undefined,
                tags: ['Cold Tolerant', 'Container Friendly'],
                description: 'Bush bean.',
                taxonomy: { family: 'Fabaceae', genus: 'Phaseolus', species: 'vulgaris' },
                sowing: {
                    indoor: '0',
                    direct: '1',
                    germinationDaysRange: '7-10',
                    germinationTempRange: '70-85F',
                    sowingNotes: 'Sow after the last frost.',
                },
                planting: { depthInInches: 1, plantSpacingInches: 4, rowSpacingInches: 18, instructions: 'Rows north to south.' },
                growing: {
                    requiredSun: 'Full',
                    daysToMaturity: 50,
                    isClimbing: false,
                    climbingHeightFeet: null,
                    plantSize: '18 in',
                    growingNotes: 'Keep evenly moist.',
                },
                harvesting: {
                    defaultHarvestTypeId: 2,
                    fruitSize: '5 in',
                    shelfStability: 'A week, refrigerated',
                    harvestInstructions: 'Pick young.',
                },
            });
            expect(store.fetchPlantById).toHaveBeenCalledTimes(2);
            expect(document.body.textContent).toContain('Updated successfully!');
        });

        it.each([
            ['Indoor Sow', 'sowing.indoor', '6 weeks before last frost'],
            ['Direct Sow', 'sowing.direct', 'yes'],
            ['Germination Days', 'sowing.germinationDaysRange', '5-8'],
            ['Germination Temp', 'sowing.germinationTempRange', '65-80F'],
            ['Row Spacing (in.)', 'planting.rowSpacingInches', 24],
            ['Plant Size', 'growing.plantSize', '2 ft'],
            ['Fruit Size', 'harvesting.fruitSize', '6 in'],
            ['Shelf Stability', 'harvesting.shelfStability', 'Two weeks'],
            ['Family', 'taxonomy.family', 'Fabaceae (legumes)'],
            ['Genus', 'taxonomy.genus', 'Vigna'],
            ['Species', 'taxonomy.species', 'unguiculata'],
        ])('sends an edited %s', async (label, path, value) => {
            const { wrapper, store } = await mountPage();
            store.upsertPlant.mockResolvedValue(true);

            await type(wrapper, label, String(value));
            await update(wrapper);

            const [section, field] = path.split('.');
            expect(store.upsertPlant.mock.calls[0][0][section][field]).toBe(value);
        });

        it.each([
            ['Lifespan Type', 'Perennial', sent => sent.lifespanType],
            ['Required Sun', 'Part Sun (4-6 hours)', sent => sent.growing.requiredSun],
        ])('sends a chosen %s', async (label, value, read) => {
            const { wrapper, store } = await mountPage();
            store.upsertPlant.mockResolvedValue(true);

            await select(wrapper, label).setValue(value);
            await update(wrapper);

            expect(read(store.upsertPlant.mock.calls[0][0])).toBe(value);
        });

        it.each([
            ['Sowing Notes', sent => sent.sowing.sowingNotes],
            ['Planting Instructions', sent => sent.planting.instructions],
            ['Harvesting Instructions', sent => sent.harvesting.harvestInstructions],
        ])('sends what was written in its %s box', async (title, read) => {
            const { wrapper, store } = await mountPage();
            store.upsertPlant.mockResolvedValue(true);

            textBox(wrapper, title).props('onSubmit')('Written in the box.');
            await flushPromises();
            await update(wrapper);

            expect(read(store.upsertPlant.mock.calls[0][0])).toBe('Written in the box.');
        });

        it('sends the climbing height for a plant that climbs', async () => {
            const { wrapper, store } = await mountPage();
            store.upsertPlant.mockResolvedValue(true);

            await wrapper.find('.v-checkbox input').setValue(true);
            await type(wrapper, 'Climbing Height (ft.)', '7');
            await update(wrapper);

            expect(store.upsertPlant.mock.calls[0][0].growing).toMatchObject({ isClimbing: true, climbingHeightFeet: 7 });
        });

        it('sends a field the service left null as null', async () => {
            const plant = aPlant({ taxonomy: { family: null, genus: 'Phaseolus', species: 'vulgaris' } });
            const { wrapper, store } = await mountPage({ plantsById: { 'plant-1': plant } });
            store.upsertPlant.mockResolvedValue(true);

            await type(wrapper, 'Name', 'Provider');
            await update(wrapper);

            expect(store.upsertPlant.mock.calls[0][0].taxonomy.family).toBeNull();
        });

        // PUT /plants is a full upsert, and the service would default a
        // missing harvest type to "unspecified" anyway (the page's comment)
        it('sends the unspecified harvest type when the choice is cleared', async () => {
            const { wrapper, store } = await mountPage();
            store.upsertPlant.mockResolvedValue(true);

            await select(wrapper, 'Default Harvest Type').setValue(null);
            await update(wrapper);

            expect(store.upsertPlant.mock.calls[0][0].harvesting.defaultHarvestTypeId).toBe(1);
        });

        // The service treats '' as "not given" for an optional number
        // (validation-fixes doc, "Already fixed")
        it('sends a cleared number box as an empty string', async () => {
            const { wrapper, store } = await mountPage();
            store.upsertPlant.mockResolvedValue(true);

            await type(wrapper, 'Days to Maturity', '');
            await update(wrapper);

            expect(store.upsertPlant.mock.calls[0][0].growing.daysToMaturity).toBe('');
        });

        it('stays as it is, without reloading, when the save fails', async () => {
            const { wrapper, store } = await mountPage();
            store.upsertPlant.mockResolvedValue(false);
            await type(wrapper, 'Name', 'Provider');

            await update(wrapper);

            expect(store.fetchPlantById).toHaveBeenCalledTimes(1);
            expect(inputLabelled(wrapper, 'Name').element.value).toBe('Provider');
            expect(document.body.textContent).not.toContain('Updated successfully!');
        });

        it('puts the plant back on Reset', async () => {
            const { wrapper, store } = await mountPage();
            await type(wrapper, 'Name', 'Provider');

            await button(wrapper, 'Reset').trigger('click');
            await flushPromises();

            expect(store.fetchPlantById).toHaveBeenCalledTimes(2);
            expect(inputLabelled(wrapper, 'Name').element.value).toBe('Provider bush bean');
            expect(enabled(wrapper, 'Update')).toBe(false);
        });
    });

    describe('schedules', () => {
        it('gives the schedules dialog the plant and its schedules', async () => {
            const { wrapper } = await mountPage();

            const dialog = wrapper.findComponent(ManagePlantSchedulesDialog);
            expect(dialog.props('plantName')).toBe('Provider bush bean');
            expect(dialog.props('assignedSchedules')).toEqual(aPlant().activitySchedules);
        });

        it('assigns and unassigns the schedules, then reloads', async () => {
            const { wrapper, store } = await mountPage();

            await wrapper.findComponent(ManagePlantSchedulesDialog).props('onSubmit')(['schedule-3'], ['schedule-1']);
            await flushPromises();

            expect(store.updatePlantScheduleAssignment)
                .toHaveBeenCalledWith('plant-1', { assign: ['schedule-3'], unassign: ['schedule-1'] });
            expect(store.fetchPlantById).toHaveBeenCalledTimes(2);
        });

        // DocumentsCurrentBehavior: saving the schedules reloads the plant into
        // the form, so any unsaved edit elsewhere on the page is lost. Should
        // reload only the schedules, or keep the edits
        it('throws away unsaved edits when the schedules are saved', async () => {
            const { wrapper } = await mountPage();
            await type(wrapper, 'Name', 'Provider');

            await wrapper.findComponent(ManagePlantSchedulesDialog).props('onSubmit')(['schedule-3'], []);
            await flushPromises();

            expect(inputLabelled(wrapper, 'Name').element.value).toBe('Provider bush bean');
        });
    });
});
