import { flushPromises } from '@vue/test-utils';
import { apiError, serviceErrorBody } from '../../../helpers/http-errors';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled } from '../../../helpers/fields';
import { aSaveInFlight, isOpen, openAction, press } from '../../../helpers/action-dialogs';
import SplitPlantingActionDialog from '@/components/plantings/SplitPlantingActionDialog.vue';

const planting = { plantingId: 'planting-1', name: 'Early beans', numberSown: 24 };

function mountDialog(props) {
    return mountWithPlugins(SplitPlantingActionDialog, {
        props: { planting, onSubmit: vi.fn(), ...props },
        attachTo: document.body,
    });
}

const open = wrapper => openAction(wrapper, 'Split', 'Split Planting');

async function addSplit(dialog, name, count) {
    await dialog.find('.mdi-plus').trigger('click');
    await flushPromises();
    const rows = dialog.findAll('.v-row');
    const [nameInput, countInput] = rows[rows.length - 1].findAll('input');
    if (name !== undefined) await nameInput.setValue(name);
    if (count !== undefined) await countInput.setValue(String(count));
}

describe('SplitPlantingActionDialog', () => {
    it('opens with no splits', async () => {
        const dialog = await open(mountDialog());

        expect(dialog.findAll('.v-row')).toHaveLength(0);
    });

    it('adds a split row per click, each with its own placeholder', async () => {
        const dialog = await open(mountDialog());

        await addSplit(dialog);
        await addSplit(dialog);

        expect(dialog.findAll('.v-row')).toHaveLength(2);
        expect(dialog.findAll('.v-row')[1].find('input').attributes('placeholder')).toBe('Split 2 name');
    });

    it('submits a SPLIT action from this planting, with the splits and comment, then closes and empties', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await addSplit(dialog, 'North beans', 12);
        await addSplit(dialog, 'South beans', 12);
        await dialog.find('textarea').setValue('Even halves');

        await press(dialog, 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith('SPLIT', {
            sourcePlantingId: 'planting-1',
            comment: 'Even halves',
            splits: [
                { name: 'North beans', count: 12 },
                { name: 'South beans', count: 12 },
            ],
        });
        expect(isOpen()).toBe(false);
        dialog = await open(wrapper);
        expect(dialog.findAll('.v-row')).toHaveLength(0);
    });

    it('empties the form on Cancel, without submitting', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await addSplit(dialog, 'North beans', 12);

        await press(dialog, 'Cancel');
        dialog = await open(wrapper);

        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(dialog.findAll('.v-row')).toHaveLength(0);
    });

    // Each split needs a name and at least one plant, and together they can
    // take no more than were sown (backlog A24)
    it.each([
        ['no splits', async () => {}],
        ['a split with no name and a count of 0', async dialog => addSplit(dialog)],
        ['a split with a name of spaces', async dialog => addSplit(dialog, '   ', 3)],
        ['a split of 0', async dialog => addSplit(dialog, 'North beans', 0)],
        ['a split of 1.5', async dialog => addSplit(dialog, 'North beans', 1.5)],
        ['splits that add up to more than were sown', async dialog => {
            await addSplit(dialog, 'North beans', 20);
            await addSplit(dialog, 'South beans', 20);
        }],
    ])("doesn't offer Confirm for %s", async (_, fill) => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);
        await fill(dialog);

        expect(buttonLabelled(dialog, 'Confirm').attributes('disabled')).toBeDefined();
    });

    it('says when the splits total more than were sown', async () => {
        const dialog = await open(mountDialog());
        await addSplit(dialog, 'North beans', 20);
        expect(dialog.text()).not.toContain('more than the');

        await addSplit(dialog, 'South beans', 20);

        expect(dialog.text()).toContain('The splits total 40, more than the 24 sown.');
    });

    // With nothing sown on record, the service checks the total
    it('offers Confirm for any total when nothing sown is recorded', async () => {
        const dialog = await open(mountDialog({ planting: { ...planting, numberSown: null } }));
        await addSplit(dialog, 'North beans', 40);

        expect(buttonLabelled(dialog, 'Confirm').attributes('disabled')).toBeUndefined();
    });

    it('waits for the split, open', async () => {
        const wrapper = mountDialog({ onSubmit: aSaveInFlight() });
        const dialog = await open(wrapper);
        await addSplit(dialog, 'North beans', 12);

        await press(dialog, 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalled();
        expect(isOpen()).toBe(true);
    });

    it('stays open, with the splits, and says why, when the split fails', async () => {
        const wrapper = mountDialog({ onSubmit: vi.fn().mockRejectedValue(apiError(400, serviceErrorBody(400, 'splits[0].count must be at least 1'))) });
        const dialog = await open(wrapper);
        await addSplit(dialog, 'North beans', 12);

        await press(dialog, 'Confirm');

        expect(isOpen()).toBe(true);
        expect(document.body.textContent).toContain('splits[0].count must be at least 1');
        expect(wrapper.vm.form.splits).toEqual([{ name: 'North beans', count: 12 }]);
    });
});
