import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VSelect } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled } from '../../../helpers/fields';
import { dialogTitled } from '../../../helpers/dialogs';
import ManagePlantSchedulesDialog from '@/components/plants/ManagePlantSchedulesDialog.vue';
import { useActivitySchedulesStore } from '@/store';

const beans = { activityScheduleId: 'schedule-1', name: 'Beans', description: 'Feed every two weeks' };
const pests = { activityScheduleId: 'schedule-2', name: 'Pest watch', description: 'Neem weekly' };
const compost = { activityScheduleId: 'schedule-3', name: 'Compost', description: 'Top-dress in spring' };

async function mountDialog(props) {
    const pinia = createTestingPinia({ initialState: { 'activity-schedules': { schedules: [beans, pests, compost] } } });
    const wrapper = mountWithPlugins(ManagePlantSchedulesDialog, {
        props: { plantName: 'Provider bush bean', assignedSchedules: [beans], onSubmit: vi.fn(), ...props },
        global: { plugins: [pinia] },
        attachTo: document.body,
    });
    await flushPromises();
    return { wrapper, store: useActivitySchedulesStore(pinia) };
}

// The dialog's title holds the headline and the plant's name, run together
const title = 'Manage SchedulesProvider bush bean';

async function open(wrapper) {
    await wrapper.find('.v-btn').trigger('click');
    await flushPromises();
    return dialogTitled(title);
}

// The names and descriptions listed under a section's heading
function listed(dialog, index) {
    const lists = dialog.findAll('.v-list');
    return lists[index] ? lists[index].findAll('.v-list-item').map(item => [
        item.find('.v-list-item-title').text(),
        item.find('.v-list-item-subtitle').text(),
    ]) : [];
}

const addSelect = wrapper => wrapper.findAllComponents(VSelect).find(select => select.props('label') === 'Select schedule');

async function add(wrapper, dialog, schedule) {
    await addSelect(wrapper).setValue(schedule);
    await buttonLabelled(dialog, 'Add').trigger('click');
    await flushPromises();
}

describe('ManagePlantSchedulesDialog', () => {
    it('loads the schedules', async () => {
        const { store } = await mountDialog();

        expect(store.fetchSchedules).toHaveBeenCalledTimes(1);
    });

    it("opens on the plant's assigned schedules", async () => {
        const { wrapper } = await mountDialog();

        const dialog = await open(wrapper);

        expect(dialog.find('.v-card-title .headline').text()).toBe('Manage Schedules');
        expect(dialog.find('.v-card-title .text-body-2').text()).toBe('Provider bush bean');
        expect(listed(dialog, 0)).toEqual([['Beans', 'Feed every two weeks']]);
    });

    it('says when none are assigned', async () => {
        const { wrapper } = await mountDialog({ assignedSchedules: [] });

        const dialog = await open(wrapper);

        expect(dialog.text()).toContain('No schedules currently assigned');
    });

    it('offers only the schedules not assigned or pending', async () => {
        const { wrapper } = await mountDialog();
        const dialog = await open(wrapper);
        expect(addSelect(wrapper).props('items')).toEqual([pests, compost]);

        await add(wrapper, dialog, pests);

        expect(addSelect(wrapper).props('items')).toEqual([compost]);
    });

    it('disables Add until a schedule is chosen, and Save until something changes', async () => {
        const { wrapper } = await mountDialog();
        const dialog = await open(wrapper);

        expect(buttonLabelled(dialog, 'Add').attributes('disabled')).toBeDefined();
        expect(buttonLabelled(dialog, 'Save').attributes('disabled')).toBeDefined();

        await addSelect(wrapper).setValue(pests);

        expect(buttonLabelled(dialog, 'Add').attributes('disabled')).toBeUndefined();
    });

    it('lists an added schedule as pending, and can take it back', async () => {
        const { wrapper } = await mountDialog();
        const dialog = await open(wrapper);

        await add(wrapper, dialog, pests);

        expect(dialog.text()).toContain('Pending addition');
        expect(listed(dialog, 1)).toEqual([['Pest watch', 'Neem weekly']]);
        expect(addSelect(wrapper).props('modelValue')).toBeNull();

        await dialog.findAll('.v-list')[1].find('.mdi-close').trigger('click');
        await flushPromises();

        expect(dialog.text()).not.toContain('Pending addition');
    });

    it('strikes out a schedule marked for removal, and can take it back', async () => {
        const { wrapper } = await mountDialog();
        const dialog = await open(wrapper);
        const struck = () => dialog.findAll('.v-list')[0].find('.text-decoration-line-through').exists();

        await dialog.find('.mdi-delete').trigger('click');
        expect(struck()).toBe(true);
        expect(buttonLabelled(dialog, 'Save').attributes('disabled')).toBeUndefined();

        await dialog.find('.mdi-close').trigger('click');
        expect(struck()).toBe(false);
    });

    it('saves the ids to assign and unassign, then closes', async () => {
        const { wrapper } = await mountDialog();
        const dialog = await open(wrapper);
        await add(wrapper, dialog, compost);
        await dialog.find('.mdi-delete').trigger('click');

        await buttonLabelled(dialog, 'Save').trigger('click');
        await flushPromises();

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith(['schedule-3'], ['schedule-1']);
        expect(document.querySelector('.v-overlay--active')).toBeNull();
    });

    // What a fix to A6 would let it do: if the save rejected, it would stay
    // open. Today PlantEditPage's onSubmit resolves even when the save fails
    it('stays open if the save rejects', async () => {
        const { wrapper } = await mountDialog({ onSubmit: vi.fn().mockRejectedValue(new Error('save failed')) });
        const dialog = await open(wrapper);
        await add(wrapper, dialog, compost);
        const caught = vi.fn();
        wrapper.vm.$.appContext.config.errorHandler = caught;

        await buttonLabelled(dialog, 'Save').trigger('click');
        await flushPromises();

        expect(caught).toHaveBeenCalledWith(expect.objectContaining({ message: 'save failed' }), expect.anything(), expect.anything());
        expect(document.querySelector('.v-overlay--active')).not.toBeNull();
    });

    it('drops the changes on Cancel, and closes', async () => {
        const { wrapper } = await mountDialog();
        let dialog = await open(wrapper);
        await add(wrapper, dialog, compost);
        await dialog.find('.mdi-delete').trigger('click');

        await buttonLabelled(dialog, 'Cancel').trigger('click');
        await flushPromises();
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(document.querySelector('.v-overlay--active')).toBeNull();

        dialog = await open(wrapper);
        expect(dialog.text()).not.toContain('Pending addition');
        expect(dialog.find('.text-decoration-line-through').exists()).toBe(false);
    });

    it('starts again when the assigned schedules change', async () => {
        const { wrapper } = await mountDialog();

        await wrapper.setProps({ assignedSchedules: [beans, pests] });
        const dialog = await open(wrapper);

        expect(listed(dialog, 0).map(([name]) => name)).toEqual(['Beans', 'Pest watch']);
    });
});
