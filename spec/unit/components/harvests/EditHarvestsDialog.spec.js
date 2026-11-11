import { flushPromises } from '@vue/test-utils';
import { VSelect } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled } from '../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../helpers/dialogs';
import { aHarvest, filedOn, harvestTypes } from '../../../helpers/harvests';
import EditHarvestsDialog from '@/components/harvests/EditHarvestsDialog.vue';

// One day's harvests, as HarvestsPage hands them over: as the service sent
// them, with their planting's and plant's names
const harvests = [
    { ...aHarvest(), plantingName: 'Early beans', plantName: 'Provider bush bean' },
    { ...aHarvest({ harvestId: 'harvest-2', harvestTypeId: 3, harvestType: 'count', quantity: 12 }), plantingName: 'Early beans', plantName: 'Provider bush bean' },
    { ...aHarvest({ harvestId: 'harvest-3', plantingId: 'planting-2', harvestTypeId: 1, harvestType: 'unspecified', quantity: 25 }), plantingName: 'Sungold', plantName: 'Sungold tomato' },
];

async function mountDialog(props = {}) {
    const wrapper = mountWithPlugins(EditHarvestsDialog, {
        props: { show: true, harvests, harvestTypes, onSubmit: vi.fn(), onCancel: vi.fn(), ...props },
        attachTo: document.body,
    });
    await flushPromises();
    return wrapper;
}

const dialog = () => dialogTitled('Edit Harvests');

// Each row: its planting and plant, its type, and its quantity
function rows(wrapper) {
    const types = wrapper.findAllComponents(VSelect);
    return dialog().findAll('.harvest-row').map((row, i) => [
        row.find('.text-success').text(),
        row.find('.smaller-text').text(),
        types[i].props('modelValue'),
        row.find('input[type=number]').element.value,
    ]);
}

async function setQuantity(row, quantity) {
    await dialog().findAll('.harvest-row')[row].find('input[type=number]').setValue(quantity);
    await flushPromises();
}

async function setType(wrapper, row, harvestTypeId) {
    await wrapper.findAllComponents(VSelect)[row].setValue(harvestTypeId);
    await flushPromises();
}

const updateButton = () => buttonLabelled(dialog(), 'Update');
const warnings = () => dialog().findAll('.merge-warning').map(warning => warning.text());

async function press(label) {
    await buttonLabelled(dialog(), label).trigger('click');
    await flushPromises();
}

describe('EditHarvestsDialog', () => {
    it('opens and closes with show', async () => {
        const wrapper = await mountDialog({ show: false });
        expect(findDialog('Edit Harvests')).toBeUndefined();

        await wrapper.setProps({ show: true });
        await flushPromises();
        expect(findDialog('Edit Harvests')).toBeDefined();

        await wrapper.setProps({ show: false });
        await flushPromises();
        expect(findDialog('Edit Harvests')).toBeUndefined();
    });

    it('lists each harvest, with its type and quantity', async () => {
        const wrapper = await mountDialog();

        expect(rows(wrapper)).toEqual([
            ['Early beans', 'Provider bush bean', 2, '2'],
            ['Early beans', 'Provider bush bean', 3, '12'],
            ['Sungold', 'Sungold tomato', 1, '25'],
        ]);
        expect(wrapper.findComponent(VSelect).props('items')).toEqual(harvestTypes);
    });

    it('offers no types when given none', async () => {
        const wrapper = await mountDialog({ harvestTypes: undefined });

        expect(wrapper.findComponent(VSelect).props('items')).toEqual([]);
    });

    it('shows the error it is given', async () => {
        await mountDialog({ errorMessage: 'harvests[0].quantity must be greater than 0' });

        expect(dialog().find('.v-alert').text()).toBe('harvests[0].quantity must be greater than 0');
    });

    it('shows no error by default', async () => {
        await mountDialog();

        expect(dialog().find('.v-alert').exists()).toBe(false);
    });

    it('submits the edited harvests on Update, leaving the originals alone, and stays open', async () => {
        const wrapper = await mountDialog();
        await setQuantity(0, '3');
        await setType(wrapper, 2, 3);

        await press('Update');

        const submitted = wrapper.props('onSubmit').mock.calls[0][0];
        expect(submitted.map(h => [h.harvestId, h.harvestTypeId, h.quantity])).toEqual([
            ['harvest-1', 2, 3],
            ['harvest-2', 3, 12],
            ['harvest-3', 3, 25],
        ]);
        expect(submitted[0]).toMatchObject({ plantingId: 'planting-1', harvestDate: filedOn('2026-07-10') });
        expect(harvests[0].quantity).toBe(2);
        expect(harvests[2].harvestTypeId).toBe(1);
        expect(findDialog('Edit Harvests')).toBeDefined();
    });

    it('calls onCancel on Cancel, without submitting, and stays open', async () => {
        const wrapper = await mountDialog();

        await press('Cancel');

        expect(wrapper.props('onCancel')).toHaveBeenCalledTimes(1);
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(findDialog('Edit Harvests')).toBeDefined();
    });

    it('starts afresh from new harvests, dropping the edits', async () => {
        const wrapper = await mountDialog();
        await setQuantity(0, '3');

        await wrapper.setProps({ harvests: [...harvests] });
        await flushPromises();

        expect(rows(wrapper)[0][3]).toBe('2');
    });

    it('warns on both rows when a planting has two of one type, with the total they will make', async () => {
        const wrapper = await mountDialog();
        expect(warnings()).toEqual([]);

        await setType(wrapper, 1, 2);

        expect(warnings()).toEqual([
            'Same planting and type as another row. Saving combines these into one 14 pounds harvest.',
            'Same planting and type as another row. Saving combines these into one 14 pounds harvest.',
        ]);
    });

    it('counts a cleared quantity as nothing in the warning', async () => {
        const wrapper = await mountDialog();
        await setType(wrapper, 1, 2);

        await setQuantity(1, '');

        expect(warnings()[0]).toBe('Same planting and type as another row. Saving combines these into one 2 pounds harvest.');
    });

    // The warning names the type as stored, where the rest of the app shows
    // no name for unspecified
    it("names unspecified harvests 'unspecified' in the warning", async () => {
        const wrapper = await mountDialog();
        await setType(wrapper, 0, 1);
        await setType(wrapper, 1, 1);

        expect(warnings()[0]).toBe('Same planting and type as another row. Saving combines these into one 14 unspecified harvest.');
    });

    // The service requires each quantity to be more than nothing (validation-
    // fixes doc, "worth doing"), so Update waits for that. A harvest can't be
    // removed: the app has no call to delete one (backlog B30, in F10)
    it.each([[''], ['0'], ['-1']])("doesn't offer Update for a quantity of \"%s\"", async entered => {
        await mountDialog();

        await setQuantity(0, entered);

        expect(updateButton().attributes('disabled')).toBeDefined();
    });

    it('offers Update for a quantity with a fraction', async () => {
        await mountDialog();

        await setQuantity(0, '1.5');

        expect(updateButton().attributes('disabled')).toBeUndefined();
    });
});
