import { flushPromises } from '@vue/test-utils';
import { mountWithPlugins } from '../../../../helpers/mount';
import { buttonLabelled } from '../../../../helpers/fields';
import { dialogTitled } from '../../../../helpers/dialogs';
import { isOpen, press } from '../../../../helpers/action-dialogs';
import { aScheduleItem } from '../../../../helpers/schedules';
import DeleteScheduleItemDialog from '@/components/admin/schedules/DeleteScheduleItemDialog.vue';

// An error thrown by a handler goes to `errorHandler`, as an app's would
function mountDialog({ errorHandler, ...props } = {}) {
    return mountWithPlugins(DeleteScheduleItemDialog, {
        props: { scheduleItem: aScheduleItem(), onSubmit: vi.fn(), ...props },
        attachTo: document.body,
        global: errorHandler ? { config: { errorHandler } } : {},
    });
}

// Its button is a bare bin icon, with no text
async function open(wrapper) {
    await wrapper.find('.v-btn .mdi-delete').trigger('click');
    await flushPromises();
    return dialogTitled('Delete Schedule Item');
}

const details = dialog => dialog.findAll('.v-list-item').map(item => [
    item.find('.v-list-item-title').text(),
    item.find('.v-list-item-subtitle').text(),
]);

async function confirm(dialog) {
    await dialog.find('.v-switch input').setValue(true);
    await flushPromises();
}

describe('DeleteScheduleItemDialog', () => {
    // The page shows the rule as text; here it's shown as stored
    it('shows the item: its activity, subcategory, rule, dates and notes', async () => {
        const dialog = await open(mountDialog());

        expect(details(dialog)).toEqual([
            ['Activity type', 'Fertilize'],
            ['Subcategory', 'Blood Meal'],
            ['Recurrence', 'RRULE:FREQ=WEEKLY;INTERVAL=2'],
            ['Date(s)', 'May 1 - Sep 30'],
            ['Notes', 'Side-dress the tomatoes'],
        ]);
    });

    it('leaves out a subcategory and notes the item has none of', async () => {
        const dialog = await open(mountDialog({ scheduleItem: aScheduleItem({ subType: null, notes: null, endDate: '05-01' }) }));

        expect(details(dialog).map(([title]) => title)).toEqual(['Activity type', 'Recurrence', 'Date(s)']);
        expect(details(dialog)[2][1]).toBe('May 1');
    });

    it('enables Delete only once confirmed', async () => {
        const dialog = await open(mountDialog());
        expect(buttonLabelled(dialog, 'Delete').attributes('disabled')).toBeDefined();

        await confirm(dialog);

        expect(buttonLabelled(dialog, 'Delete').attributes('disabled')).toBeUndefined();
    });

    it("submits the item's id, then closes, unconfirmed for next time", async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await confirm(dialog);

        await press(dialog, 'Delete');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith('item-1');
        expect(isOpen()).toBe(false);
        dialog = await open(wrapper);
        expect(buttonLabelled(dialog, 'Delete').attributes('disabled')).toBeDefined();
    });

    it('closes on Delete with no onSubmit given', async () => {
        const dialog = await open(mountDialog({ onSubmit: undefined }));
        await confirm(dialog);

        await press(dialog, 'Delete');

        expect(isOpen()).toBe(false);
    });

    it('closes on Cancel, unconfirmed, without submitting', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await confirm(dialog);

        await press(dialog, 'Cancel');

        expect(isOpen()).toBe(false);
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        dialog = await open(wrapper);
        expect(buttonLabelled(dialog, 'Delete').attributes('disabled')).toBeDefined();
    });

    // It waits for onSubmit; the page's never rejects, since the store
    // swallows (A6)
    it('stays open when the delete rejects', async () => {
        const errorHandler = vi.fn();
        const wrapper = mountDialog({ errorHandler, onSubmit: vi.fn().mockRejectedValue(new Error('error deleting activity schedule item')) });
        const dialog = await open(wrapper);
        await confirm(dialog);

        await press(dialog, 'Delete');

        expect(errorHandler).toHaveBeenCalledTimes(1);
        expect(isOpen()).toBe(true);
    });
});
