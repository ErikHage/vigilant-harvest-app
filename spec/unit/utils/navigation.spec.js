import { activeViewFor, sectionsFor } from '@/utils/navigation';

const titles = sections => sections.map(section => [section.label, section.items.map(item => item.title)]);

describe('navigation', () => {
    describe('sectionsFor', () => {
        it('links to each page, with a planting year, Dashboard first and the rest under headings', () => {
            expect(titles(sectionsFor(true))).toEqual([
                [undefined, ['Dashboard']],
                ['Planning', ['Plan']],
                ['Garden', ['Overview', 'Plots', 'Plants', 'Plantings', 'Harvests']],
                ['Recordkeeping', ['Journal', 'Activity Log', 'Stats']],
                ['Config', ['Years', 'Categories', 'Activity Schedules']],
            ]);
        });

        it('leaves out the year-specific pages without one, and the sections left empty', () => {
            expect(titles(sectionsFor(false))).toEqual([
                [undefined, ['Dashboard']],
                ['Garden', ['Plots', 'Plants']],
                ['Config', ['Years', 'Categories', 'Activity Schedules']],
            ]);
        });

        it("gives each link an icon, its path, and its route's name as its value, and nothing else", () => {
            const links = sectionsFor(true).flatMap(section => section.items);

            expect(links.find(link => link.title === 'Plants'))
                .toEqual({ value: 'PlantsPage', title: 'Plants', icon: 'mdi-leaf', to: '/dashboard/plants' });
            expect(links.find(link => link.title === 'Dashboard'))
                .toEqual({ value: 'DashboardDefaultPage', title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/dashboard' });
            for (const link of links) {
                expect(Object.keys(link)).toEqual(['value', 'title', 'icon', 'to']);
                expect(link.icon).toMatch(/^mdi-/);
            }
        });

        it('gives no two links the same value', () => {
            const values = sectionsFor(true).flatMap(section => section.items.map(item => item.value));

            expect(new Set(values).size).toBe(values.length);
        });
    });

    describe('activeViewFor', () => {
        it('marks the link a page is at', () => {
            expect(activeViewFor('/dashboard/plants')).toBe('PlantsPage');
            expect(activeViewFor('/dashboard/activity-log')).toBe('ActivityLog');
        });

        it('marks the link a page is under', () => {
            expect(activeViewFor('/dashboard/plants/p-1/details')).toBe('PlantsPage');
            expect(activeViewFor('/dashboard/plants/p-1/edit')).toBe('PlantsPage');
            expect(activeViewFor('/dashboard/plantings/pl-1/details')).toBe('PlantingsPage');
            expect(activeViewFor('/dashboard/planting-years/2026')).toBe('PlantingYearsPage');
            expect(activeViewFor('/dashboard/planting-years/add')).toBe('PlantingYearsPage');
            expect(activeViewFor('/dashboard/activity-schedules/s-1')).toBe('ActivitySchedulesPage');
        });

        it('marks Dashboard on the dashboard alone, though every page is under it', () => {
            expect(activeViewFor('/dashboard')).toBe('DashboardDefaultPage');
            expect(activeViewFor('/dashboard/no-such-page')).toBe('');
        });

        it('marks nothing off the links', () => {
            expect(activeViewFor('/')).toBe('');
            expect(activeViewFor('/dashboard/plantsx')).toBe('');
        });
    });
});
