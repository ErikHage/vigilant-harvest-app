import { mountWithPlugins } from '../../../helpers/mount';
import { apiError, serviceErrorBody } from '../../../helpers/http-errors';
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

    it('waits for the save, open', async () => {
        const wrapper = mountDialog({ onSubmit: aSaveInFlight() });
        const dialog = await open(wrapper);
        await dialog.find('textarea').setValue('First true leaves');

        await press(dialog, 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalled();
        expect(isOpen()).toBe(true);
    });

    it('stays open, with the comment, and says why, when the save fails', async () => {
        const wrapper = mountDialog({ onSubmit: vi.fn().mockRejectedValue(apiError(400, serviceErrorBody(400, 'comment must be at most 1000 characters'))) });
        const dialog = await open(wrapper);
        await dialog.find('textarea').setValue('First true leaves');

        await press(dialog, 'Confirm');

        expect(isOpen()).toBe(true);
        expect(document.body.textContent).toContain('comment must be at most 1000 characters');
        expect(document.querySelector('.v-overlay--active textarea').value).toBe('First true leaves');
    });
});
