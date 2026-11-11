import { flushPromises } from '@vue/test-utils';
import { mountWithPlugins } from '../../../helpers/mount';
import { inputLabelled } from '../../../helpers/fields';
import { aSaveInFlight, isOpen, openAction, press } from '../../../helpers/action-dialogs';
import DatePickerDialogActivator from '@/components/utils/DatePickerDialogActivator.vue';
import StartPlantingActionDialog from '@/components/plantings/StartPlantingActionDialog.vue';

const planting = { plantingId: 'planting-1', name: 'Early beans' };

// The dialog reads the clock when it's created, for its default sow date
function mountDialog({ now = '2026-03-15T10:00:00', ...props } = {}) {
    vi.useFakeTimers({ now: new Date(now), toFake: ['Date'] });
    return mountWithPlugins(StartPlantingActionDialog, {
        props: { planting, onSubmit: vi.fn(), ...props },
        attachTo: document.body,
    });
}

const open = wrapper => openAction(wrapper, 'Start', 'Start Planting');

async function overrideDate(wrapper, date) {
    wrapper.findComponent(DatePickerDialogActivator).props('onSubmit')(date);
    await flushPromises();
}

describe('StartPlantingActionDialog', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts on today, none sown, and no comment', async () => {
        const dialog = await open(mountDialog());

        expect(dialog.find('h3').text()).toBe('Sun Mar 15 2026');
        expect(inputLabelled(dialog, 'Number Sown').element.value).toBe('0');
    });

    it('submits a START action with the number sown, the date and the comment, and closes', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);
        await inputLabelled(dialog, 'Number Sown').setValue('24');
        await overrideDate(wrapper, new Date(2026, 2, 12));
        await dialog.find('textarea').setValue('Heat mat');

        await press(dialog, 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith('START', {
            sowDate: '2026-03-12',
            numberSown: 24,
            comment: 'Heat mat',
        });
        expect(isOpen()).toBe(false);
    });

    it('shows an overridden date', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);

        await overrideDate(wrapper, new Date(2026, 2, 12));

        expect(dialog.find('h3').text()).toBe('Thu Mar 12 2026');
    });

    // The sow date is the user's own day, as YYYY-MM-DD, so a New York
    // evening, already the next day in UTC, is sown that day (backlog A22)
    it('sends a New York evening as that day', async () => {
        const wrapper = mountDialog({ now: '2026-11-07T21:30:00' });

        await press(await open(wrapper), 'Confirm');

        expect(wrapper.props('onSubmit').mock.calls[0][1].sowDate).toBe('2026-11-07');
    });

    it('closes on Cancel without submitting', async () => {
        const wrapper = mountDialog();

        await press(await open(wrapper), 'Cancel');

        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(isOpen()).toBe(false);
    });

    // DocumentsCurrentBehavior: Cancel keeps what was entered, so the next
    // open shows it. Should go back to the defaults (backlog A13)
    it('keeps a cancelled entry for the next time it opens', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await inputLabelled(dialog, 'Number Sown').setValue('24');
        await press(dialog, 'Cancel');

        dialog = await open(wrapper);

        expect(inputLabelled(dialog, 'Number Sown').element.value).toBe('24');
    });

    // DocumentsCurrentBehavior: it doesn't wait for onSubmit, so it closes
    // before the start is done, and can't stay open if it fails (backlog A6).
    // Should wait
    it('closes before the start is done', async () => {
        const wrapper = mountDialog({ onSubmit: aSaveInFlight() });

        await press(await open(wrapper), 'Confirm');

        expect(isOpen()).toBe(false);
    });
});
