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
