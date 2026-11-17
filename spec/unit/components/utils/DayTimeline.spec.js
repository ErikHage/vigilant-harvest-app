import { flushPromises } from '@vue/test-utils';
import { h } from 'vue';
import DayTimeline from '@/components/utils/DayTimeline.vue';
import { mountWithPlugins } from '../../../helpers/mount';
import { buttonLabelled } from '../../../helpers/fields';

// A record's date as the pages' records carry it: a local wall-clock time,
// with no timezone, or a bare day
const aRecord = (id, when) => ({ id, when });

const morning = aRecord('r-1', '2026-06-01T10:00:00');
// already June 2 in UTC
const evening = aRecord('r-2', '2026-06-01T21:30:00');
const nextDay = aRecord('r-3', '2026-06-02');
const weekLater = aRecord('r-4', '2026-06-10T08:00:00');

const records = [nextDay, evening, weekLater, morning];

// Mounted under a host holding the chosen day through v-model, as a page does.
// The host's records can be changed with setProps
function mountTimeline({ records: given = records, day = null } = {}) {
    const Host = {
        props: { records: Array },
        data: () => ({ day }),
        render() {
            return h(DayTimeline, {
                records: this.records,
                dateOf: record => record.when,
                modelValue: this.day,
                'onUpdate:modelValue': chosen => { this.day = chosen; },
            }, {
                day: ({ day: shown, records: ofDay }) => h('div', { class: 'shown' }, `${shown}: ${ofDay.map(r => r.id).join(', ')}`),
                actions: ({ day: shown }) => h('span', { class: 'actions' }, `actions for ${shown}`),
                empty: () => h('p', { class: 'empty' }, 'Nothing yet.'),
            });
        },
    };
    return mountWithPlugins(Host, { props: { records: given } });
}

const timeline = wrapper => wrapper.findAll('.timeline-entry').map(item => item.text());
const selected = wrapper => wrapper.find('.timeline-entry.selected').text();
const heading = wrapper => wrapper.find('h2').text();
const shown = wrapper => wrapper.find('.shown').text();
const emitted = wrapper => wrapper.findComponent(DayTimeline).emitted('update:modelValue');
const chosenDays = wrapper => emitted(wrapper).map(([day]) => day);

async function clickDay(wrapper, day) {
    await wrapper.findAll('.timeline-entry').find(item => item.text() === day).trigger('click');
    await flushPromises();
}

async function press(wrapper, label) {
    await buttonLabelled(wrapper, label).trigger('click');
    await flushPromises();
}

describe('DayTimeline', () => {
    it('lists the days with records, newest first, with a gap where days are skipped', async () => {
        const wrapper = mountTimeline();
        await flushPromises();

        expect(timeline(wrapper)).toEqual(['2026-06-10', '...', '2026-06-02', '2026-06-01']);
    });

    it('marks a single skipped day, and no gap between days next to each other', async () => {
        const wrapper = mountTimeline({ records: [aRecord('a', '2026-06-01'), aRecord('b', '2026-06-03'), aRecord('c', '2026-06-04')] });
        await flushPromises();

        expect(timeline(wrapper)).toEqual(['2026-06-04', '2026-06-03', '...', '2026-06-01']);
    });

    it('files a record under its local day', async () => {
        const wrapper = mountTimeline();

        await clickDay(wrapper, '2026-06-01');

        expect(shown(wrapper)).toBe('2026-06-01: r-2, r-1');
    });

    it('opens on the newest day, and says so', async () => {
        const wrapper = mountTimeline();
        await flushPromises();

        expect(chosenDays(wrapper)).toEqual(['2026-06-10']);
        expect(selected(wrapper)).toBe('2026-06-10');
        expect(heading(wrapper)).toBe('2026-06-10');
        expect(shown(wrapper)).toBe('2026-06-10: r-4');
    });

    it('opens on the day given', async () => {
        const wrapper = mountTimeline({ day: '2026-06-02' });
        await flushPromises();

        expect(emitted(wrapper)).toBeUndefined();
        expect(selected(wrapper)).toBe('2026-06-02');
    });

    it('shows the day clicked', async () => {
        const wrapper = mountTimeline();

        await clickDay(wrapper, '2026-06-02');

        expect(selected(wrapper)).toBe('2026-06-02');
        expect(heading(wrapper)).toBe('2026-06-02');
        expect(shown(wrapper)).toBe('2026-06-02: r-3');
    });

    it('does nothing on a click on a gap', async () => {
        const wrapper = mountTimeline();
        await flushPromises();

        await clickDay(wrapper, '...');

        expect(chosenDays(wrapper)).toEqual(['2026-06-10']);
        expect(selected(wrapper)).toBe('2026-06-10');
    });

    it('moves between days with Older and Newer, each disabled at its end', async () => {
        const wrapper = mountTimeline();
        await flushPromises();
        expect(buttonLabelled(wrapper, 'Newer').attributes('disabled')).toBeDefined();

        await press(wrapper, 'Older');
        expect(heading(wrapper)).toBe('2026-06-02');
        await press(wrapper, 'Older');
        expect(heading(wrapper)).toBe('2026-06-01');
        expect(buttonLabelled(wrapper, 'Older').attributes('disabled')).toBeDefined();

        await press(wrapper, 'Newer');
        expect(heading(wrapper)).toBe('2026-06-02');
    });

    it('goes to the newest day when the one shown has no records left, and says so', async () => {
        const wrapper = mountTimeline({ day: '2026-06-02' });
        await flushPromises();

        await wrapper.setProps({ records: [weekLater, morning] });
        await flushPromises();

        expect(chosenDays(wrapper)).toEqual(['2026-06-10']);
        expect(selected(wrapper)).toBe('2026-06-10');
    });

    it("hands the actions the day shown", async () => {
        const wrapper = mountTimeline();
        await flushPromises();

        expect(wrapper.find('.actions').text()).toBe('actions for 2026-06-10');
    });

    it('shows what the page gives it when there are no records', async () => {
        const wrapper = mountTimeline({ records: [] });
        await flushPromises();

        expect(timeline(wrapper)).toEqual([]);
        expect(wrapper.find('h2').exists()).toBe(false);
        expect(wrapper.find('.empty').text()).toBe('Nothing yet.');
        expect(emitted(wrapper)).toBeUndefined();
    });
});
