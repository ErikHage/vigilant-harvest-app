import { flushPromises } from '@vue/test-utils';
import { apiError, serviceErrorBody } from '../../../../helpers/http-errors';
import { mountWithPlugins } from '../../../../helpers/mount';
import { buttonLabelled, inputLabelled } from '../../../../helpers/fields';
import { dialogTitled } from '../../../../helpers/dialogs';
import { isOpen, press } from '../../../../helpers/action-dialogs';
import { aSchedule } from '../../../../helpers/schedules';
import EditScheduleDialog from '@/components/admin/schedules/EditScheduleDialog.vue';

// An error thrown by a handler goes to `errorHandler`, as an app's would
function mountDialog({ errorHandler, ...props } = {}) {
    return mountWithPlugins(EditScheduleDialog, {
        props: { activitySchedule: aSchedule(), onSubmit: vi.fn(), ...props },
        attachTo: document.body,
        global: errorHandler ? { config: { errorHandler } } : {},
    });
}

// Its button is a bare pencil icon, with no text
async function open(wrapper) {
    await wrapper.find('.v-btn .mdi-pencil').trigger('click');
    await flushPromises();
    return dialogTitled('Edit Activity Schedule');
}

const fields = dialog => [
    inputLabelled(dialog, 'Activity Schedule Name').element.value,
    inputLabelled(dialog, 'Description').element.value,
];

describe('EditScheduleDialog', () => {
    it("opens on the schedule's name and description", async () => {
        const dialog = await open(mountDialog());

        expect(fields(dialog)).toEqual(['Tomatoes', 'Feed every two weeks']);
        expect(buttonLabelled(dialog, 'Save').attributes('disabled')).toBeUndefined();
    });

    it('disables Save with the name cleared', async () => {
        const dialog = await open(mountDialog());

        await inputLabelled(dialog, 'Activity Schedule Name').setValue('');

        expect(buttonLabelled(dialog, 'Save').attributes('disabled')).toBeDefined();
    });

    // The service takes a schedule with no description (backlog B33)
    it('offers Save with the description cleared', async () => {
        const dialog = await open(mountDialog());

        await inputLabelled(dialog, 'Description').setValue('');

        expect(buttonLabelled(dialog, 'Save').attributes('disabled')).toBeUndefined();
    });

    it('submits the schedule with its id, the name trimmed, then closes', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);
        await inputLabelled(dialog, 'Activity Schedule Name').setValue(' Peppers ');
        await inputLabelled(dialog, 'Description').setValue('Feed weekly');

        await press(dialog, 'Save');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({ activityScheduleId: 'schedule-1', name: 'Peppers', description: 'Feed weekly' });
        expect(isOpen()).toBe(false);
    });

    it('takes up a new schedule given to it', async () => {
        const wrapper = mountDialog();

        await wrapper.setProps({ activitySchedule: aSchedule({ name: 'Peppers', description: 'Feed weekly' }) });

        expect(fields(await open(wrapper))).toEqual(['Peppers', 'Feed weekly']);
    });

    it('closes on Cancel without submitting', async () => {
        const wrapper = mountDialog();

        await press(await open(wrapper), 'Cancel');

        expect(isOpen()).toBe(false);
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
    });

    // DocumentsCurrentBehavior: Cancel keeps the edits, so the next open
    // shows them, not the schedule, and Save sends them (backlog A13). Should
    // go back to the schedule on Cancel
    it('keeps a cancelled edit for the next time it opens', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await inputLabelled(dialog, 'Activity Schedule Name').setValue('Peppers');
        await press(dialog, 'Cancel');

        dialog = await open(wrapper);

        expect(fields(dialog)).toEqual(['Peppers', 'Feed every two weeks']);
    });

    // A failed save keeps it open, with what was entered, and it says why: the
    // service's reason for a 400
    it('stays open, and says why, when the save fails', async () => {
        const errorHandler = vi.fn();
        const wrapper = mountDialog({ errorHandler, onSubmit: vi.fn().mockRejectedValue(apiError(400, serviceErrorBody(400, 'name is required'))) });

        await press(await open(wrapper), 'Save');

        expect(errorHandler).not.toHaveBeenCalled();
        expect(document.body.textContent).toContain("name is required");
        expect(isOpen()).toBe(true);
    });

    // The service reads a name of spaces as missing (backlog A16)
    it("doesn't offer Save for a name of spaces", async () => {
        const dialog = await open(mountDialog());

        await inputLabelled(dialog, 'Activity Schedule Name').setValue('   ');

        expect(buttonLabelled(dialog, 'Save').attributes('disabled')).toBeDefined();
    });
});
