import { mountWithPlugins } from '../../../helpers/mount';
import { httpError } from '../../../helpers/http-errors';
import { aSaveInFlight, isOpen, openAction, press } from '../../../helpers/action-dialogs';
import RetirePlantingActionDialog from '@/components/plantings/RetirePlantingActionDialog.vue';

const planting = { plantingId: 'planting-1', name: 'Early beans' };

function mountDialog(props) {
    return mountWithPlugins(RetirePlantingActionDialog, {
        props: { planting, onSubmit: vi.fn(), ...props },
        attachTo: document.body,
    });
}

const open = wrapper => openAction(wrapper, 'Retire', 'Retire Planting');

describe('RetirePlantingActionDialog', () => {
    it('asks before retiring the planting, by name', async () => {
        const dialog = await open(mountDialog());

        expect(dialog.find('h3').text()).toBe('Do you really want to retire Early beans?');
    });

    it('submits a RETIRE action with the comment, and closes', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);

        await dialog.find('textarea').setValue('Powdery mildew');
        await press(dialog, 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith('RETIRE', { comment: 'Powdery mildew' });
        expect(isOpen()).toBe(false);
    });

    it('submits a null comment when none is written', async () => {
        const wrapper = mountDialog();

        await press(await open(wrapper), 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith('RETIRE', { comment: null });
    });

    it('closes on Cancel without submitting', async () => {
        const wrapper = mountDialog();

        await press(await open(wrapper), 'Cancel');

        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(isOpen()).toBe(false);
    });

    // (backlog A13)
    it('forgets a cancelled comment the next time it opens', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await dialog.find('textarea').setValue('never mind');
        await press(dialog, 'Cancel');

        dialog = await open(wrapper);

        expect(dialog.find('textarea').element.value).toBe('');
    });

    it('waits for the retire, open', async () => {
        const wrapper = mountDialog({ onSubmit: aSaveInFlight() });

        await press(await open(wrapper), 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalled();
        expect(isOpen()).toBe(true);
    });

    it('stays open, and says so, when the retire fails', async () => {
        const wrapper = mountDialog({ onSubmit: vi.fn().mockRejectedValue(httpError(500)) });

        await press(await open(wrapper), 'Confirm');

        expect(isOpen()).toBe(true);
        expect(document.body.textContent).toContain("Couldn't save. Try again.");
    });
});
