import { mountWithPlugins } from '../../../../helpers/mount';
import { apiError, serviceErrorBody } from '../../../../helpers/http-errors';
import { buttonLabelled, inputLabelled } from '../../../../helpers/fields';
import { isOpen, openAction, press } from '../../../../helpers/action-dialogs';
import CreateScheduleDialog from '@/components/admin/schedules/CreateScheduleDialog.vue';

// An error thrown by a handler goes to `errorHandler`, as an app's would
function mountDialog({ errorHandler, ...props } = {}) {
    return mountWithPlugins(CreateScheduleDialog, {
        props: { onSubmit: vi.fn(), ...props },
        attachTo: document.body,
        global: errorHandler ? { config: { errorHandler } } : {},
    });
}

const open = wrapper => openAction(wrapper, 'Create Activity Schedule', 'Create Activity Schedule');

async function fillIn(dialog, name, description) {
    await inputLabelled(dialog, 'Activity Schedule Name').setValue(name);
    await inputLabelled(dialog, 'Description').setValue(description);
}

describe('CreateScheduleDialog', () => {
    it('opens empty, with Create disabled', async () => {
        const dialog = await open(mountDialog());

        expect(inputLabelled(dialog, 'Activity Schedule Name').element.value).toBe('');
        expect(inputLabelled(dialog, 'Description').element.value).toBe('');
        expect(buttonLabelled(dialog, 'Create').attributes('disabled')).toBeDefined();
    });

    // The service takes a schedule with no description
    it.each([
        ['a name', 'Tomatoes', ''],
        ['a description', '', 'Feed every two weeks'],
    ])('keeps Create disabled without %s', async (_, name, description) => {
        const dialog = await open(mountDialog());

        await fillIn(dialog, name, description);

        expect(buttonLabelled(dialog, 'Create').attributes('disabled')).toBeDefined();
    });

    it('submits the name, trimmed, and the description, then empties and closes', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await fillIn(dialog, ' Tomatoes ', ' Feed every two weeks ');

        await press(dialog, 'Create');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith({ name: 'Tomatoes', description: ' Feed every two weeks ' });
        expect(isOpen()).toBe(false);
        dialog = await open(wrapper);
        expect(inputLabelled(dialog, 'Activity Schedule Name').element.value).toBe('');
    });

    it('empties and closes on Cancel, without submitting', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await fillIn(dialog, 'Tomatoes', 'Feed every two weeks');

        await press(dialog, 'Cancel');

        expect(isOpen()).toBe(false);
        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        dialog = await open(wrapper);
        expect(inputLabelled(dialog, 'Description').element.value).toBe('');
    });

    // A failed save keeps it open, with what was entered, and it says why: the
    // service's reason for a 400
    it('stays open, and says why, when the save fails', async () => {
        const errorHandler = vi.fn();
        const wrapper = mountDialog({ errorHandler, onSubmit: vi.fn().mockRejectedValue(apiError(400, serviceErrorBody(400, 'name is required'))) });
        const dialog = await open(wrapper);
        await fillIn(dialog, 'Tomatoes', 'Feed every two weeks');

        await press(dialog, 'Create');

        expect(errorHandler).not.toHaveBeenCalled();
        expect(document.body.textContent).toContain("name is required");
        expect(isOpen()).toBe(true);
    });

    // DocumentsCurrentBehavior: Create is enabled by any text, but the name
    // is trimmed when sent, so a name of spaces goes out as ''. The service
    // rejects it (name is required), and the dialog stays open, saying so
    // (backlog A16). Should keep Create disabled until the trimmed name has
    // something in it
    it('submits a name of spaces as an empty name', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);
        await fillIn(dialog, '   ', 'Feed every two weeks');

        await press(dialog, 'Create');

        expect(wrapper.props('onSubmit').mock.calls[0][0].name).toBe('');
    });
});
