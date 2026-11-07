import { flushPromises } from '@vue/test-utils';
import { VSelect } from 'vuetify/components';
import { mountWithPlugins } from '../../../helpers/mount';
import { inputLabelled } from '../../../helpers/fields';
import { aSaveInFlight, isOpen, openAction, press } from '../../../helpers/action-dialogs';
import DatePickerDialogActivator from '@/components/utils/DatePickerDialogActivator.vue';
import PlantPlantingActionDialog from '@/components/plantings/PlantPlantingActionDialog.vue';

const planting = { plantingId: 'planting-1', name: 'Early beans' };
const plots = () => [
    { plotId: 'plot-2', friendlyName: 'south bed' },
    { plotId: 'plot-1', friendlyName: 'North bed' },
];

function mountDialog({ now = '2026-05-10T10:00:00', ...props } = {}) {
    vi.useFakeTimers({ now: new Date(now), toFake: ['Date'] });
    return mountWithPlugins(PlantPlantingActionDialog, {
        props: { planting, plots: plots(), onSubmit: vi.fn(), ...props },
        attachTo: document.body,
    });
}

const open = wrapper => openAction(wrapper, 'Plant', 'Plant Planting');
const plotSelect = wrapper => wrapper.findComponent(VSelect);

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
            transplantDate: new Date(2026, 4, 9).toISOString(),
            numberTransplanted: 20,
            plotId: 'plot-1',
            comment: 'Hardened off a week',
        });
        expect(isOpen()).toBe(false);
    });

    // DocumentsCurrentBehavior: as in the start dialog, the default date is
    // the moment the dialog was created, sent as its UTC instant, so a New
    // York evening is recorded as the next day. Should send today's date
    it('sends a New York evening as the next day', async () => {
        const wrapper = mountDialog({ now: '2026-05-10T22:15:00' });

        await press(await open(wrapper), 'Confirm');

        expect(wrapper.props('onSubmit').mock.calls[0][1].transplantDate).toBe('2026-05-11T02:15:00.000Z');
    });

    // DocumentsCurrentBehavior: the plot has no rule and Confirm is never
    // disabled, so a planting is planted in no plot (validation-fixes doc,
    // fix 5). Should require a plot, unless planting without one is wanted
    it('plants with no plot chosen', async () => {
        const wrapper = mountDialog();

        await press(await open(wrapper), 'Confirm');

        expect(wrapper.props('onSubmit').mock.calls[0][1].plotId).toBeNull();
    });

    it('closes on Cancel without submitting', async () => {
        const wrapper = mountDialog();

        await press(await open(wrapper), 'Cancel');

        expect(wrapper.props('onSubmit')).not.toHaveBeenCalled();
        expect(isOpen()).toBe(false);
    });

    // DocumentsCurrentBehavior: Cancel keeps what was entered, so the next
    // open shows it. Should go back to the defaults (backlog A13)
    it('keeps a cancelled entry for the next time it opens', async () => {
        const wrapper = mountDialog();
        let dialog = await open(wrapper);
        await inputLabelled(dialog, 'Number Transplanted').setValue('20');
        await press(dialog, 'Cancel');

        dialog = await open(wrapper);

        expect(inputLabelled(dialog, 'Number Transplanted').element.value).toBe('20');
    });

    // DocumentsCurrentBehavior: it doesn't wait for onSubmit, so it closes
    // before the plant is done, and can't stay open if it fails (backlog A6).
    // Should wait
    it('closes before the plant is done', async () => {
        const wrapper = mountDialog({ onSubmit: aSaveInFlight() });

        await press(await open(wrapper), 'Confirm');

        expect(isOpen()).toBe(false);
    });
});
