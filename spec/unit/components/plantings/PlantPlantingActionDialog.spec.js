import { flushPromises } from '@vue/test-utils';
import { httpError } from '../../../helpers/http-errors';
import { VSelect } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled, inputLabelled } from '../../../helpers/fields';
import { aSaveInFlight, isOpen, openAction, press } from '../../../helpers/action-dialogs';
import DatePickerDialogActivator from '@/components/utils/DatePickerDialogActivator.vue';
import PlantPlantingActionDialog from '@/components/plantings/PlantPlantingActionDialog.vue';

const planting = { plantingId: 'planting-1', name: 'Early beans' };
const plots = () => [
    { plotId: 'plot-2', friendlyName: 'south bed' },
    { plotId: 'plot-1', friendlyName: 'North bed' },
];

// The dialog reads the clock when it opens, for its default planting date
function mountDialog({ now = '2026-05-10T10:00:00', ...props } = {}) {
    vi.useFakeTimers({ now: new Date(now), toFake: ['Date'] });
    return mountWithPlugins(PlantPlantingActionDialog, {
        props: { planting, plots: plots(), onSubmit: vi.fn(), ...props },
        attachTo: document.body,
    });
}

const open = wrapper => openAction(wrapper, 'Plant', 'Plant Planting');
const plotSelect = wrapper => wrapper.findComponent(VSelect);

// Opened, with a plot chosen, which Confirm needs
async function openWithAPlot(wrapper) {
    const dialog = await open(wrapper);
    await plotSelect(wrapper).setValue('plot-1');
    return dialog;
}

describe('PlantPlantingActionDialog', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('offers the plots by name, ignoring case, and starts on today with none chosen', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);

        expect(plotSelect(wrapper).props('items').map(plot => plot.friendlyName)).toEqual(['North bed', 'south bed']);
        expect(plotSelect(wrapper).props('modelValue')).toBeNull();
        expect(inputLabelled(dialog, 'Number Transplanted').element.value).toBe('0');
        expect(dialog.find('h3').text()).toBe('Sun May 10 2026');
    });

    // It sorts the plots it was given, in place: the plots store's list (B21).
    // The dialog's contents render only once it opens, and the sort with them
    it('sorts the array of plots it was given, once opened', async () => {
        const given = plots();
        const wrapper = mountDialog({ plots: given });
        expect(given.map(plot => plot.plotId)).toEqual(['plot-2', 'plot-1']);

        await open(wrapper);

        expect(given.map(plot => plot.plotId)).toEqual(['plot-1', 'plot-2']);
    });

    it('submits a PLANT action with the plot, number, date and comment, and closes', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);
        await plotSelect(wrapper).setValue('plot-1');
        await inputLabelled(dialog, 'Number Transplanted').setValue('20');
        wrapper.findComponent(DatePickerDialogActivator).props('onSubmit')(new Date(2026, 4, 9));
        await flushPromises();
        await dialog.find('textarea').setValue('Hardened off a week');

        await press(dialog, 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalledWith('PLANT', {
            transplantDate: '2026-05-09',
            numberTransplanted: 20,
            plotId: 'plot-1',
            comment: 'Hardened off a week',
        });
        expect(isOpen()).toBe(false);
    });

    // As in the start dialog, the date is the user's own day, as YYYY-MM-DD,
    // so a New York evening is planted that day (backlog A22)
    // Not the day the page was opened (backlog A22)
    it('starts on the day it is opened', async () => {
        const wrapper = mountDialog();
        vi.setSystemTime(new Date('2026-05-11T08:00:00'));

        const dialog = await open(wrapper);

        expect(dialog.find('h3').text()).toBe('Mon May 11 2026');
    });

    it('sends a New York evening as that day', async () => {
        const wrapper = mountDialog({ now: '2026-05-10T22:15:00' });

        await press(await openWithAPlot(wrapper), 'Confirm');

        expect(wrapper.props('onSubmit').mock.calls[0][1].transplantDate).toBe('2026-05-10');
    });

    // Planting out puts a planting in a plot: the garden lists only plantings
    // that have one (validation-fixes doc, fix 5)
    it('offers Confirm only once a plot is chosen', async () => {
        const wrapper = mountDialog();
        const dialog = await open(wrapper);
        expect(buttonLabelled(dialog, 'Confirm').attributes('disabled')).toBeDefined();

        await plotSelect(wrapper).setValue('plot-1');

        expect(buttonLabelled(dialog, 'Confirm').attributes('disabled')).toBeUndefined();
    });

    it('closes on Cancel without submitting', async () => {
        const wrapper = mountDialog();

        await press(await open(wrapper), 'Cancel');

        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(isOpen()).toBe(false);
    });

    // (backlog A13)
    it('forgets a cancelled entry the next time it opens', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await inputLabelled(dialog, 'Number Transplanted').setValue('20');
        await press(dialog, 'Cancel');

        dialog = await open(wrapper);

        expect(inputLabelled(dialog, 'Number Transplanted').element.value).toBe('0');
    });

    it('waits for the plant, open', async () => {
        const wrapper = mountDialog({ onSubmit: aSaveInFlight() });

        await press(await openWithAPlot(wrapper), 'Confirm');

        expect(wrapper.props('onSubmit')).toHaveBeenCalled();
        expect(isOpen()).toBe(true);
    });

    it('stays open, and says so, when the plant fails', async () => {
        const wrapper = mountDialog({ onSubmit: vi.fn().mockRejectedValue(httpError(500)) });

        await press(await openWithAPlot(wrapper), 'Confirm');

        expect(isOpen()).toBe(true);
        expect(document.body.textContent).toContain("Couldn't save. Try again.");
    });
});
