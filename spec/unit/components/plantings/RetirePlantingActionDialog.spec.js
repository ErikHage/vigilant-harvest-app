import { mountWithPlugins } from '../../../helpers/mount';
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

    // DocumentsCurrentBehavior: Cancel keeps the comment, so the next open
    // shows it, and Confirm sends it. Should clear it (backlog A13)
    it('keeps a cancelled comment for the next time it opens', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await dialog.find('textarea').setValue('never mind');
        await press(dialog, 'Cancel');

        dialog = await open(wrapper);

        expect(dialog.find('textarea').element.value).toBe('never mind');
    });

    // DocumentsCurrentBehavior: it doesn't wait for onSubmit, so it closes
    // before the retire is done, and can't stay open if it fails (backlog
    // A6). Should wait
    it('closes before the retire is done', async () => {
        const wrapper = mountDialog({ onSubmit: aSaveInFlight() });

        await press(await open(wrapper), 'Confirm');

        expect(isOpen()).toBe(false);
    });
});
