import { flushPromises } from '@vue/test-utils';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled } from '../../../helpers/fields';
import { dialogTitled, findDialog } from '../../../helpers/dialogs';
import ConfirmHarvestsDialog from '@/components/garden/ConfirmHarvestsDialog.vue';

const harvestTypes = [
    { harvestTypeId: 1, harvestTypeName: 'unspecified' },
    { harvestTypeId: 2, harvestTypeName: 'pounds' },
    { harvestTypeId: 3, harvestTypeName: 'count' },
];

// The garden page's harvest form records, as it hands over those with a quantity
const harvests = [
    { plotId: 'plot-1', plotName: 'North bed', plantingId: 'planting-1', plantingName: 'Early beans', plantName: 'Provider bush bean', harvestTypeId: 2, quantity: 1.5, currentStatus: 'PLANTED' },
    { plotId: 'plot-2', plotName: 'South bed', plantingId: 'planting-2', plantingName: 'Sungold', plantName: 'Sungold tomato', harvestTypeId: 1, quantity: 12, currentStatus: 'PLANTED' },
];

const title = 'Confirm Harvests [Sat Jul 04 2026]';

async function mountDialog(props) {
    const wrapper = mountWithPlugins(ConfirmHarvestsDialog, {
        props: {
            show: true,
            harvestDate: new Date(2026, 6, 4),
            harvests,
            harvestTypes,
            onConfirm: vi.fn(),
            onBack: vi.fn(),
            onCancel: vi.fn(),
            ...props,
        },
        attachTo: document.body,
    });
    await flushPromises();
    return wrapper;
}

const shownHarvests = dialog => dialog.findAll('.v-card-text > div').map(row => [
    row.find('.text-success').text(),
    row.find('.smaller-text').text(),
    row.find('.v-chip').text(),
]);

describe('ConfirmHarvestsDialog', () => {
    it('heads the dialog with the harvest date', async () => {
        await mountDialog();

        expect(dialogTitled(title)).toBeDefined();
    });

    it('lists each harvest: its planting, its plot and plant, and what is added', async () => {
        await mountDialog();

        expect(shownHarvests(dialogTitled(title))).toEqual([
            ['Early beans', 'North bed:Provider bush bean', '+1.5 pounds'],
            ['Sungold', 'South bed:Sungold tomato', '+12'],
        ]);
    });

    it('names the type the form chose, not the plant default', async () => {
        await mountDialog({ harvests: [{ ...harvests[0], harvestTypeId: 3, quantity: 4 }] });

        expect(shownHarvests(dialogTitled(title))[0][2]).toBe('+4 count');
    });

    it('shows a bare quantity for a type it has no name for', async () => {
        await mountDialog({ harvestTypes: undefined });

        expect(shownHarvests(dialogTitled(title)).map(([, , added]) => added)).toEqual(['+1.5', '+12']);
    });

    it.each([
        ['Cancel', 'onCancel'],
        ['Back', 'onBack'],
        ['Confirm', 'onConfirm'],
    ])('calls %s through %s, and leaves closing to its parent', async (label, handler) => {
        const wrapper = await mountDialog();

        await buttonLabelled(dialogTitled(title), label).trigger('click');
        await flushPromises();

        expect(wrapper.props(handler)).toHaveBeenCalledTimes(1);
        expect(findDialog(title)).toBeDefined();
    });

    it('opens and closes with show', async () => {
        const wrapper = await mountDialog({ show: false });
        expect(findDialog(title)).toBeUndefined();

        await wrapper.setProps({ show: true });
        await flushPromises();
        expect(findDialog(title)).toBeDefined();

        await wrapper.setProps({ show: false });
        await flushPromises();
        expect(findDialog(title)).toBeUndefined();
    });
});
