import { views } from './constants';

const { children } = views.dashboard;
const pathTo = child => `${views.dashboard.path}/${children[child].path}`;

// Every link in the drawer, by section, in order. A year-specific link needs a
// planting year. Each link's value is its route's name
const allSections = [
    {
        items: [
            { value: children.default.name, title: 'Dashboard', icon: 'mdi-view-dashboard', to: views.dashboard.path },
        ],
    },
    {
        label: 'Planning',
        items: [
            { value: children.planning.name, title: 'Plan', icon: 'mdi-calendar-edit', to: pathTo('planning'), isYearSpecific: true },
        ],
    },
    {
        label: 'Garden',
        items: [
            { value: children.garden.name, title: 'Overview', icon: 'mdi-sprout-outline', to: pathTo('garden'), isYearSpecific: true },
            { value: children.plots.name, title: 'Plots', icon: 'mdi-vector-square', to: pathTo('plots') },
            { value: children.plants.name, title: 'Plants', icon: 'mdi-leaf', to: pathTo('plants') },
            { value: children.plantings.name, title: 'Plantings', icon: 'mdi-shovel', to: pathTo('plantings'), isYearSpecific: true },
            { value: children.harvests.name, title: 'Harvests', icon: 'mdi-basket', to: pathTo('harvests'), isYearSpecific: true },
        ],
    },
    {
        label: 'Recordkeeping',
        items: [
            { value: children.journal.name, title: 'Journal', icon: 'mdi-book-open-page-variant', to: pathTo('journal'), isYearSpecific: true },
            { value: children.activityLog.name, title: 'Activity Log', icon: 'mdi-clipboard-list-outline', to: pathTo('activityLog'), isYearSpecific: true },
            { value: children.stats.name, title: 'Stats', icon: 'mdi-chart-bar', to: pathTo('stats'), isYearSpecific: true },
        ],
    },
    {
        label: 'Config',
        items: [
            { value: children.years.name, title: 'Years', icon: 'mdi-calendar-range', to: pathTo('years') },
            { value: children.categories.name, title: 'Categories', icon: 'mdi-shape-outline', to: pathTo('categories') },
            { value: children.activitySchedules.name, title: 'Activity Schedules', icon: 'mdi-calendar-clock', to: pathTo('activitySchedules') },
        ],
    },
];

/**
 * The side drawer's sections, as FrAppShell takes them. With no planting year
 * selected, the year-specific links go, and so does a section left with none
 */
export function sectionsFor(isPlantingYearSelected) {
    return allSections
        .map(({ items, ...section }) => ({
            ...section,
            items: items
                .filter(item => !item.isYearSpecific || isPlantingYearSelected)
                .map(({ value, title, icon, to }) => ({ value, title, icon, to })),
        }))
        .filter(section => section.items.length > 0);
}

const links = allSections.flatMap(section => section.items);

/**
 * The value of the link the path is at, or under: a plant's details are under
 * Plants. Every page is under the dashboard, so Dashboard is marked only on
 * the dashboard itself. Empty for a path under none of them
 */
export function activeViewFor(path) {
    const link = links
        .filter(item => path === item.to || (item.to !== views.dashboard.path && path.startsWith(`${item.to}/`)))
        .sort((a, b) => b.to.length - a.to.length)[0];
    return link?.value ?? '';
}

// The pages under a link, and the crumbs after the link's own for each: the
// record the page shows, named once the store holds this page's, and any
// page beyond it. `records` is what App passes; each returns no crumbs while
// its record isn't this page's, so the trail stops at the link
const pagesUnder = [
    {
        pattern: /^\/dashboard\/plants\/([^/]+)\/details$/,
        crumbs: ([plantId], records) => {
            const plant = records.plantsById?.[plantId];
            return plant ? [{ title: plant.friendlyName }] : [];
        },
    },
    {
        pattern: /^\/dashboard\/plants\/([^/]+)\/edit$/,
        crumbs: ([plantId], records) => {
            const plant = records.plantsById?.[plantId];
            return plant
                ? [{ title: plant.friendlyName, to: `${pathTo('plants')}/${plantId}/details` }, { title: 'Edit' }]
                : [];
        },
    },
    {
        pattern: /^\/dashboard\/plantings\/([^/]+)\/details$/,
        crumbs: ([plantingId], records) => {
            const planting = records.plantingsById?.[plantingId];
            return planting ? [{ title: planting.name }] : [];
        },
    },
    {
        pattern: /^\/dashboard\/planting-years\/add$/,
        crumbs: () => [{ title: 'Add' }],
    },
    {
        pattern: /^\/dashboard\/planting-years\/([^/]+)$/,
        crumbs: ([year], records) =>
            String(records.plantingYear?.plantingYear) === year ? [{ title: year }] : [],
    },
    {
        pattern: /^\/dashboard\/activity-schedules\/([^/]+)$/,
        crumbs: ([activityScheduleId], records) => {
            const schedule = records.activitySchedule;
            return schedule?.activityScheduleId === activityScheduleId ? [{ title: schedule.name }] : [];
        },
    },
];

/**
 * The breadcrumbs for the path, as FrBreadcrumbs takes them, as the
 * component playground draws them: the page's section, a link to its first
 * link shown in the drawer, then the page itself. On a page under a link (a
 * plant's details), the link goes back to the list, and the record follows
 * it once `records` holds this page's: until then, or for one that isn't
 * found, the trail stops at the list. Dashboard's section has no heading, so
 * the dashboard is its own crumb alone. Empty for a path under no link.
 *
 * `records`: the plants store's `plantsById`, the plantings store's
 * `plantingsById`, the planting years store's `plantingYear` (the year last
 * fetched) and the activity schedules store's `activitySchedule` (the one
 * last fetched)
 */
export function crumbsFor(path, { isPlantingYearSelected, records = {} }) {
    const value = activeViewFor(path);
    const section = sectionsFor(isPlantingYearSelected)
        .find(each => each.items.some(item => item.value === value));
    if (!section) {
        return [];
    }

    const link = section.items.find(item => item.value === value);
    const crumbs = section.label ? [{ title: section.label, to: section.items[0].to }] : [];
    if (path === link.to) {
        crumbs.push({ title: link.title });
    } else {
        crumbs.push({ title: link.title, to: link.to });
        for (const page of pagesUnder) {
            const match = path.match(page.pattern);
            if (match) {
                crumbs.push(...page.crumbs(match.slice(1), records));
                break;
            }
        }
    }

    return crumbs;
}
