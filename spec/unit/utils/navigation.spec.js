import { activeViewFor, crumbsFor, sectionsFor } from '@/utils/navigation';

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

    describe('crumbsFor', () => {
        const withYear = { isPlantingYearSelected: true };
        const records = {
            plantsById: { 'p-1': { plantId: 'p-1', friendlyName: 'Big Thai Hot Pepper' } },
            plantingsById: { 'pl-1': { plantingId: 'pl-1', name: 'Roma Tomatoes!' } },
            plantingYear: { plantingYear: 2025 },
            activitySchedule: { activityScheduleId: 's-1', name: 'Weekly Weeding' },
        };

        it('reads the dashboard alone: its section has no heading', () => {
            expect(crumbsFor('/dashboard', withYear)).toEqual([{ title: 'Dashboard' }]);
        });

        it("reads a list page's section, a link to the section's first page, then the page", () => {
            expect(crumbsFor('/dashboard/plants', withYear)).toEqual([
                { title: 'Garden', to: '/dashboard/garden' },
                { title: 'Plants' },
            ]);
            expect(crumbsFor('/dashboard/activity-log', withYear)).toEqual([
                { title: 'Recordkeeping', to: '/dashboard/journal' },
                { title: 'Activity Log' },
            ]);
        });

        it("links the section to its first page shown: with no year, Garden's is Plots", () => {
            expect(crumbsFor('/dashboard/plants', { isPlantingYearSelected: false })[0])
                .toEqual({ title: 'Garden', to: '/dashboard/plots' });
        });

        it("reads a plant's details as Garden, Plants back to the list, then the plant", () => {
            expect(crumbsFor('/dashboard/plants/p-1/details', { ...withYear, records })).toEqual([
                { title: 'Garden', to: '/dashboard/garden' },
                { title: 'Plants', to: '/dashboard/plants' },
                { title: 'Big Thai Hot Pepper' },
            ]);
        });

        it("reads a plant's edit page with the plant linking to its details, then Edit", () => {
            expect(crumbsFor('/dashboard/plants/p-1/edit', { ...withYear, records }).slice(1)).toEqual([
                { title: 'Plants', to: '/dashboard/plants' },
                { title: 'Big Thai Hot Pepper', to: '/dashboard/plants/p-1/details' },
                { title: 'Edit' },
            ]);
        });

        it("reads a planting's details with its saved name", () => {
            expect(crumbsFor('/dashboard/plantings/pl-1/details', { ...withYear, records }).slice(1)).toEqual([
                { title: 'Plantings', to: '/dashboard/plantings' },
                { title: 'Roma Tomatoes!' },
            ]);
        });

        it("reads a year's details, and adding a year, under Config and Years", () => {
            expect(crumbsFor('/dashboard/planting-years/2025', { ...withYear, records })).toEqual([
                { title: 'Config', to: '/dashboard/planting-years' },
                { title: 'Years', to: '/dashboard/planting-years' },
                { title: '2025' },
            ]);
            expect(crumbsFor('/dashboard/planting-years/add', withYear).slice(1)).toEqual([
                { title: 'Years', to: '/dashboard/planting-years' },
                { title: 'Add' },
            ]);
        });

        it("reads an activity schedule's details with its name", () => {
            expect(crumbsFor('/dashboard/activity-schedules/s-1', { ...withYear, records }).slice(1)).toEqual([
                { title: 'Activity Schedules', to: '/dashboard/activity-schedules' },
                { title: 'Weekly Weeding' },
            ]);
        });

        it("stops at the list until the store holds this page's record", () => {
            const others = {
                plantsById: {},
                plantingsById: {},
                plantingYear: { plantingYear: 2024 },
                activitySchedule: { activityScheduleId: 's-2', name: 'Another' },
            };
            const lastOf = path => crumbsFor(path, { ...withYear, records: others }).at(-1);

            expect(lastOf('/dashboard/plants/p-1/details')).toEqual({ title: 'Plants', to: '/dashboard/plants' });
            expect(lastOf('/dashboard/plants/p-1/edit')).toEqual({ title: 'Plants', to: '/dashboard/plants' });
            expect(lastOf('/dashboard/plantings/pl-1/details')).toEqual({ title: 'Plantings', to: '/dashboard/plantings' });
            expect(lastOf('/dashboard/planting-years/2025')).toEqual({ title: 'Years', to: '/dashboard/planting-years' });
            expect(lastOf('/dashboard/activity-schedules/s-1'))
                .toEqual({ title: 'Activity Schedules', to: '/dashboard/activity-schedules' });
            expect(crumbsFor('/dashboard/plants/p-1/details', withYear).at(-1))
                .toEqual({ title: 'Plants', to: '/dashboard/plants' });
        });

        it('has no crumbs off the links', () => {
            expect(crumbsFor('/', withYear)).toEqual([]);
            expect(crumbsFor('/dashboard/no-such-page', withYear)).toEqual([]);
        });
    });
});
