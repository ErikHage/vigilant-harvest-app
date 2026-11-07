import { mountWithPlugins } from '../../../helpers/mount';
import { aSaveInFlight, isOpen, openAction, press } from '../../../helpers/action-dialogs';
import CommentPlantingActionDialog from '@/components/plantings/CommentPlantingActionDialog.vue';

const planting = { plantingId: 'planting-1', name: 'Early beans' };

function mountDialog(props) {
    return mountWithPlugins(CommentPlantingActionDialog, {
        props: { planting, onSubmit: vi.fn(), ...props },
        attachTo: document.body,
    });
}

const open = wrapper => openAction(wrapper, 'Comment', 'Comment');

describe('CommentPlantingActionDialog', () => {
    it('submits the comment as a COMMENT action, and closes', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);

        await dialog.find('textarea').setValue('First true leaves');
        await press(dialog, 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith('COMMENT', { comment: 'First true leaves' });
        expect(isOpen()).toBe(false);
    });

    it('submits a null comment when none is written', async () => {
        const wrapper = mountDialog();

        await press(await open(wrapper), 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith('COMMENT', { comment: null });
    });

    it('clears the comment on Cancel, without submitting', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await dialog.find('textarea').setValue('never mind');

        await press(dialog, 'Cancel');
        dialog = await open(wrapper);

        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(dialog.find('textarea').element.value).toBe('');
    });

    // The page shows it with no v-if, so before the planting loads it has none
    it('opens with no planting', async () => {
        const wrapper = mountDialog({ planting: null });

        await open(wrapper);

        expect(isOpen()).toBe(true);
    });

    // DocumentsCurrentBehavior: it doesn't wait for onSubmit, so it closes,
    // and forgets the comment, before the save is done. If the save fails, the
    // comment is lost, whatever the store does (backlog A6). Should wait, and
    // stay open if the save fails
    it('closes before the save is done', async () => {
        const wrapper = mountDialog({ onSubmit: aSaveInFlight() });
        const dialog = await open(wrapper);
        await dialog.find('textarea').setValue('First true leaves');

        await press(dialog, 'Confirm');

        expect(isOpen()).toBe(false);
    });
});
