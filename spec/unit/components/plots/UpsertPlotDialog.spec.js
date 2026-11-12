import { flushPromises } from '@vue/test-utils';
import { VSelect } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled, inputLabelled } from '../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../helpers/dialogs';
import UpsertPlotDialog from '@/components/plots/UpsertPlotDialog.vue';

const northBed = { plotId: 'plot-2', friendlyName: 'North bed', lengthInInches: 120, widthInInches: 36, plotType: 'Bed', isActive: true };

async function mountDialog(props) {
    const wrapper = mountWithPlugins(UpsertPlotDialog, {
        props: { show: true, plot: null, onSubmit: vi.fn(), onCancel: vi.fn(), ...props },
        attachTo: document.body,
    });
    await flushPromises();
    return wrapper;
}

const typeSelect = wrapper => wrapper.findComponent(VSelect);

describe('UpsertPlotDialog', () => {
    it('is open while show is true', async () => {
        const wrapper = await mountDialog({ show: false });
        expect(findDialog('Add Plot')).toBeUndefined();

        await wrapper.setProps({ show: true });
        await flushPromises();

        expect(findDialog('Add Plot')).toBeDefined();
    });

    it('offers the four plot types', async () => {
        const wrapper = await mountDialog();

        expect(typeSelect(wrapper).props('items')).toEqual(['Bed', 'Raised Bed', 'Planter', 'Tree']);
    });

    describe('with no plot', () => {
        it('adds one, from an empty form', async () => {
            await mountDialog();

            const dialog = dialogTitled('Add Plot');
            expect(inputLabelled(dialog, 'Name').element.value).toBe('');
            expect(inputLabelled(dialog, 'Length (inches)').element.value).toBe('0');
            expect(buttonLabelled(dialog, 'Create').exists()).toBe(true);
        });

        // Plots don't retire, and the service makes each new one active. The
        // dialog sent isActive false, which the service ignored (backlog B24)
        it('submits the new plot, with an empty id and no isActive, then empties the form', async () => {
            const wrapper = await mountDialog();
            const dialog = dialogTitled('Add Plot');
            await inputLabelled(dialog, 'Name').setValue('East bed');
            await inputLabelled(dialog, 'Length (inches)').setValue('96');
            await inputLabelled(dialog, 'Width (inches)').setValue('48');
            await typeSelect(wrapper).setValue('Raised Bed');

            await buttonLabelled(dialog, 'Create').trigger('click');
            await flushPromises();

            expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({
                plotId: '',
                friendlyName: 'East bed',
                lengthInInches: 96,
                widthInInches: 48,
                plotType: 'Raised Bed',
            });
            expect(wrapper.props('onSubmit').mock.calls[0][0]).not.toHaveProperty('isActive');
            expect(inputLabelled(dialogTitled('Add Plot'), 'Name').element.value).toBe('');
        });

        // What the service requires: a name, a type, and sizes in whole
        // inches (backlog A16)
        it('offers Create only once a name and type are given', async () => {
            const wrapper = await mountDialog();
            const create = () => buttonLabelled(dialogTitled('Add Plot'), 'Create');
            expect(create().attributes('disabled')).toBeDefined();

            await inputLabelled(dialogTitled('Add Plot'), 'Name').setValue('North bed');
            expect(create().attributes('disabled')).toBeDefined();

            await typeSelect(wrapper).setValue('Bed');
            expect(create().attributes('disabled')).toBeUndefined();
        });

        it.each([['', 'a cleared length'], ['12.5', 'a length with a fraction']])("doesn't offer Create for %j, %s", async length => {
            const wrapper = await mountDialog();
            await inputLabelled(dialogTitled('Add Plot'), 'Name').setValue('North bed');
            await typeSelect(wrapper).setValue('Bed');

            await inputLabelled(dialogTitled('Add Plot'), 'Length (inches)').setValue(length);

            expect(buttonLabelled(dialogTitled('Add Plot'), 'Create').attributes('disabled')).toBeDefined();
        });
    });

    describe('with a plot', () => {
        it('edits a copy of it', async () => {
            const wrapper = await mountDialog({ plot: northBed });
            const dialog = dialogTitled('Edit Plot');
            expect(inputLabelled(dialog, 'Name').element.value).toBe('North bed');
            expect(typeSelect(wrapper).props('modelValue')).toBe('Bed');

            await inputLabelled(dialog, 'Name').setValue('North bed, extended');
            await inputLabelled(dialog, 'Length (inches)').setValue('144');
            await buttonLabelled(dialog, 'Update').trigger('click');

            expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({ ...northBed, friendlyName: 'North bed, extended', lengthInInches: 144 });
            expect(northBed.friendlyName).toBe('North bed');
        });

        it('goes back to adding when the plot is taken away', async () => {
            const wrapper = await mountDialog({ plot: northBed });

            await wrapper.setProps({ plot: null });
            await flushPromises();

            expect(inputLabelled(dialogTitled('Add Plot'), 'Name').element.value).toBe('');
        });
    });

    it('empties the form, and calls onCancel, on Cancel', async () => {
        const wrapper = await mountDialog();
        await inputLabelled(dialogTitled('Add Plot'), 'Name').setValue('East bed');

        await buttonLabelled(dialogTitled('Add Plot'), 'Cancel').trigger('click');
        await flushPromises();

        expect(wrapper.props('onCancel')).toHaveBeenCalledTimes(1);
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(inputLabelled(dialogTitled('Add Plot'), 'Name').element.value).toBe('');
    });
});
