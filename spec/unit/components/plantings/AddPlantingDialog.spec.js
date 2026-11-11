import { flushPromises } from '@vue/test-utils';
import { VAutocomplete } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled, inputLabelled } from '../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../helpers/dialogs';
import AddPlantingDialog from '@/components/plantings/AddPlantingDialog.vue';

const plants = () => [
    { plantId: 'plant-2', friendlyName: 'cherokee Purple' },
    { plantId: 'plant-1', friendlyName: 'Provider bush bean' },
    { plantId: 'plant-3', friendlyName: 'Asparagus' },
];

async function mountDialog(props) {
    const wrapper = mountWithPlugins(AddPlantingDialog, {
        props: { show: true, plants: plants(), onSubmit: vi.fn(), onCancel: vi.fn(), ...props },
        attachTo: document.body,
    });
    await flushPromises();
    return wrapper;
}

const plantSelect = wrapper => wrapper.findComponent(VAutocomplete);
const dialog = () => dialogTitled('Add Planting');

async function fillIn(wrapper) {
    await inputLabelled(dialog(), 'Name').setValue('Early beans');
    await plantSelect(wrapper).setValue('plant-1');
    await inputLabelled(dialog(), 'Indoor Sow Lead Time (weeks)').setValue('3');
    await inputLabelled(dialog(), 'Seed Source').setValue('Johnny’s');
    await inputLabelled(dialog(), 'Lot#').setValue('L-2026-14');
}

describe('AddPlantingDialog', () => {
    it('is open while show is true', async () => {
        const wrapper = await mountDialog({ show: false });
        expect(findDialog('Add Planting')).toBeUndefined();

        await wrapper.setProps({ show: true });
        await flushPromises();

        expect(findDialog('Add Planting')).toBeDefined();
    });

    it('offers the plants by name, ignoring case', async () => {
        const wrapper = await mountDialog();

        expect(plantSelect(wrapper).props('items').map(plant => plant.friendlyName))
            .toEqual(['Asparagus', 'cherokee Purple', 'Provider bush bean']);
    });

    // It sorts the plants it was given, in place: the plants store's list
    it('sorts the array of plants it was given', async () => {
        const given = plants();

        await mountDialog({ plants: given });

        expect(given.map(plant => plant.plantId)).toEqual(['plant-3', 'plant-2', 'plant-1']);
    });

    it('submits the planting, then empties the form', async () => {
        const wrapper = await mountDialog();
        await fillIn(wrapper);

        await buttonLabelled(dialog(), 'Create').trigger('click');
        await flushPromises();

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({
            name: 'Early beans',
            plantId: 'plant-1',
            leadTimeWeeks: 3,
            seedSource: 'Johnny’s',
            lotNumber: 'L-2026-14',
        });
        expect(inputLabelled(dialog(), 'Name').element.value).toBe('');
        expect(plantSelect(wrapper).props('modelValue')).toBe('');
    });

    it('empties the form, and calls onCancel, on Cancel', async () => {
        const wrapper = await mountDialog();
        await fillIn(wrapper);

        await buttonLabelled(dialog(), 'Cancel').trigger('click');
        await flushPromises();

        expect(wrapper.props('onCancel')).toHaveBeenCalledTimes(1);
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(inputLabelled(dialog(), 'Name').element.value).toBe('');
    });

    // DocumentsCurrentBehavior: Create is never disabled, so a planting with
    // no name and no plant is sent. The service rejects it (name is
    // required), and the dialog stays open, saying so (validation-fixes doc,
    // fix 2). Should keep Create disabled until a name and a plant are chosen
    it('submits a planting with no name and no plant', async () => {
        const wrapper = await mountDialog();

        await buttonLabelled(dialog(), 'Create').trigger('click');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({
            name: '',
            plantId: '',
            leadTimeWeeks: null,
            seedSource: null,
            lotNumber: null,
        });
    });
});
