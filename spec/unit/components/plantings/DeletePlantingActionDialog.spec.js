import { mountWithPlugins } from '../../../helpers/mount';
import { httpError } from '../../../helpers/http-errors';
import { aSaveInFlight, isOpen, openAction, press } from '../../../helpers/action-dialogs';
import DeletePlantingActionDialog from '@/components/plantings/DeletePlantingActionDialog.vue';

const planting = { plantingId: 'planting-1', name: 'Early beans' };

function mountDialog(props) {
    return mountWithPlugins(DeletePlantingActionDialog, {
        props: { planting, onSubmit: vi.fn(), ...props },
        attachTo: document.body,
    });
}

const open = wrapper => openAction(wrapper, 'Delete', 'Delete Planting');

describe('DeletePlantingActionDialog', () => {
    it('asks before deleting the planting, by name', async () => {
        const dialog = await open(mountDialog());

        expect(dialog.find('h3').text()).toBe('Do you really want to delete Early beans?');
    });

    it('submits a DELETE action on Confirm, and closes', async () => {
        const wrapper = mountDialog();

        await press(await open(wrapper), 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith('DELETE', {});
        expect(isOpen()).toBe(false);
    });

    it('closes on Cancel without submitting', async () => {
        const wrapper = mountDialog();

        await press(await open(wrapper), 'Cancel');

        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(isOpen()).toBe(false);
    });

    it('waits for the delete, open', async () => {
        const wrapper = mountDialog({ onSubmit: aSaveInFlight() });

        await press(await open(wrapper), 'Confirm');

        expect(isOpen()).toBe(true);
    });

    it('stays open, and says so, when the delete fails', async () => {
        const wrapper = mountDialog({ onSubmit: vi.fn().mockRejectedValue(httpError(500)) });

        await press(await open(wrapper), 'Confirm');

        expect(isOpen()).toBe(true);
        expect(document.body.textContent).toContain("Couldn't delete. Try again.");
    });
});
