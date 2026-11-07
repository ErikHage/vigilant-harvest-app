import { flushPromises } from '@vue/test-utils';
import { mountWithPlugins } from '../../../helpers/mount';
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

    // DocumentsCurrentBehavior: Confirm is never disabled and nothing is
    // checked, so it sends no splits, splits with blank names, and counts of
    // 0. The service rejects a blank name (splits[0].name is required, the
    // validation-fixes doc's fix 3) and checks the total, which the dialog's
    // own comment says it should. Should require a name and a count of at
    // least 1 for each split, and check the total against numberSown
    it.each([
        ['no splits', async () => {}, []],
        ['a split with no name and a count of 0', async dialog => addSplit(dialog), [{ name: '', count: 0 }]],
        ['splits that add up to more than were sown', async dialog => {
            await addSplit(dialog, 'North beans', 20);
            await addSplit(dialog, 'South beans', 20);
        }, [{ name: 'North beans', count: 20 }, { name: 'South beans', count: 20 }]],
    ])('sends %s', async (_, fill, splits) => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);
        await fill(dialog);

        await press(dialog, 'Confirm');

        expect(wrapper.props('onSubmit').mock.calls[0][1].splits).toEqual(splits);
    });

    // DocumentsCurrentBehavior: it doesn't wait for onSubmit, so it closes,
    // and empties the splits, before the split is done. If it fails, the
    // splits are lost (backlog A6). Should wait
    it('closes before the split is done', async () => {
        const wrapper = mountDialog({ onSubmit: aSaveInFlight() });
        const dialog = await open(wrapper);
        await addSplit(dialog, 'North beans', 12);

        await press(dialog, 'Confirm');

        expect(isOpen()).toBe(false);
    });
});
