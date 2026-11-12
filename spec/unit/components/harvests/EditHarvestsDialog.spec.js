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

// Remove, or Keep once removed: an icon, named by its aria-label
async function toggleRemoved(row) {
    await dialog().findAll('.harvest-row')[row].find('.v-btn').trigger('click');
    await flushPromises();
}

// Under a row's quantity: the last of its messages, after the type's
const quantityMessage = row => dialog().findAll('.harvest-row')[row].findAll('.v-messages').at(-1).text();

const removeLabels = () => dialog().findAll('.harvest-row').map(row => row.find('.v-btn').attributes('aria-label'));

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

        const [submitted, removed] = wrapper.props('onSubmit').mock.calls[0];
        expect(submitted.map(h => [h.harvestId, h.harvestTypeId, h.quantity])).toEqual([
            ['harvest-1', 2, 3],
            ['harvest-2', 3, 12],
            ['harvest-3', 3, 25],
        ]);
        expect(removed).toEqual([]);
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

    // As the rest of the app shows it, with no name for unspecified. The
    // warning named it as stored, "14 unspecified harvest" (backlog B30)
    it('names no type for unspecified harvests in the warning', async () => {
        const wrapper = await mountDialog();
        await setType(wrapper, 0, 1);
        await setType(wrapper, 1, 1);

        expect(warnings()[0]).toBe('Same planting and type as another row. Saving combines these into one 14 harvest.');
    });

    // The service requires each quantity to be more than nothing (validation-
    // fixes doc, "worth doing"), so Update waits for that
    it.each([[''], ['0'], ['-1']])("doesn't offer Update for a quantity of \"%s\"", async entered => {
        await mountDialog();

        await setQuantity(0, entered);

        expect(updateButton().attributes('disabled')).toBeDefined();
    });

    // The service stores a quantity as a whole number, so 1.5 was saved as 2
    // (backlog B27)
    it("doesn't offer Update for a quantity with a fraction, and says why", async () => {
        await mountDialog();

        await setQuantity(0, '1.5');

        expect(updateButton().attributes('disabled')).toBeDefined();
        expect(quantityMessage(0)).toBe('A whole number');
    });

    it("says nothing under a quantity that's whole", async () => {
        await mountDialog();

        await setQuantity(0, '4');

        expect(quantityMessage(0)).toBe('');
    });

    describe('removing', () => {
        // The service has a delete, which the app never called, so a harvest
        // couldn't be removed (backlog B30)
        it('offers Remove on each row', async () => {
            await mountDialog();

            expect(removeLabels()).toEqual(['Remove', 'Remove', 'Remove']);
        });

        it('marks a removed row, and submits it apart from the rest', async () => {
            const wrapper = await mountDialog();

            await toggleRemoved(1);

            expect(removeLabels()).toEqual(['Remove', 'Keep', 'Remove']);
            expect(dialog().findAll('.harvest-row')[1].text()).toContain('Removed on Update');
            expect(dialog().findAll('.harvest-row')[1].find('input[type=number]').attributes('disabled')).toBeDefined();

            await press('Update');

            const [kept, removed] = wrapper.props('onSubmit').mock.calls[0];
            expect(kept.map(h => h.harvestId)).toEqual(['harvest-1', 'harvest-3']);
            expect(removed).toEqual(['harvest-2']);
        });

        it('keeps a row again on Keep', async () => {
            const wrapper = await mountDialog();
            await toggleRemoved(1);

            await toggleRemoved(1);
            await press('Update');

            const [kept, removed] = wrapper.props('onSubmit').mock.calls[0];
            expect(kept).toHaveLength(3);
            expect(removed).toEqual([]);
        });

        it("doesn't hold up Update for a removed row's quantity", async () => {
            await mountDialog();
            await setQuantity(0, '');

            await toggleRemoved(0);

            expect(updateButton().attributes('disabled')).toBeUndefined();
        });

        it('leaves a removed row out of the merge warning', async () => {
            const wrapper = await mountDialog();
            await setType(wrapper, 1, 2);

            await toggleRemoved(1);

            expect(warnings()).toEqual([]);
        });

        it('offers Update with every row removed', async () => {
            const wrapper = await mountDialog();
            await toggleRemoved(0);
            await toggleRemoved(1);
            await toggleRemoved(2);

            await press('Update');

            expect(wrapper.props('onSubmit')).toHaveBeenCalledWith([], ['harvest-1', 'harvest-2', 'harvest-3']);
        });

        it('forgets the removals when given new harvests', async () => {
            const wrapper = await mountDialog();
            await toggleRemoved(0);

            await wrapper.setProps({ harvests: [...harvests] });
            await flushPromises();

            expect(removeLabels()).toEqual(['Remove', 'Remove', 'Remove']);
        });
    });
});
