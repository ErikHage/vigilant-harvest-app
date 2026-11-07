import { mountWithPlugins } from '../../../helpers/mount';
import { tableRows } from '../../../helpers/tables';
import PlantsTable from '@/components/plants/PlantsTable.vue';

const plants = () => [
    { plantId: 'plant-1', friendlyName: 'Provider bush bean', category: 'Legumes', subcategory: 'Beans' },
    { plantId: 'plant-2', friendlyName: 'Cherokee Purple', category: 'Nightshades', subcategory: 'Tomatoes' },
    { plantId: 'plant-3', friendlyName: 'Asparagus', category: 'Perennials', subcategory: 'Stalks' },
];

function mountTable(props) {
    return mountWithPlugins(PlantsTable, {
        props: { plants: plants(), onViewClicked: vi.fn(), onEditClicked: vi.fn(), ...props },
    });
}

const names = wrapper => tableRows(wrapper).map(([name]) => name);

// Each header's sort icon and its colour
function sortIcons(wrapper) {
    return wrapper.findAll('thead th .v-icon').map(icon => [
        ['mdi-sort-ascending', 'mdi-sort-descending', 'mdi-sort'].find(name => icon.classes(name)),
        icon.classes('text-primary') ? 'primary' : 'default',
    ]);
}

async function clickSort(wrapper, column) {
    const index = { name: 0, category: 1, subcategory: 2 }[column];
    await wrapper.findAll('thead th .v-icon')[index].trigger('click');
}

describe('PlantsTable', () => {
    it('lists each plant with its category and subcategory, sorted by name', () => {
        const wrapper = mountTable();

        expect(wrapper.findAll('thead th').map(th => th.text().trim())).toEqual(['Name', 'Category', 'Subcategory', '']);
        expect(tableRows(wrapper)).toEqual([
            ['Asparagus', 'Perennials', 'Stalks', ''],
            ['Cherokee Purple', 'Nightshades', 'Tomatoes', ''],
            ['Provider bush bean', 'Legumes', 'Beans', ''],
        ]);
    });

    it('marks the name column as sorted ascending', () => {
        const wrapper = mountTable();

        expect(sortIcons(wrapper)).toEqual([
            ['mdi-sort-ascending', 'primary'],
            ['mdi-sort', 'default'],
            ['mdi-sort', 'default'],
        ]);
    });

    it('reverses the sort when its column is clicked again', async () => {
        const wrapper = mountTable();

        await clickSort(wrapper, 'name');

        expect(names(wrapper)).toEqual(['Provider bush bean', 'Cherokee Purple', 'Asparagus']);
        expect(sortIcons(wrapper)[0]).toEqual(['mdi-sort-descending', 'primary']);

        await clickSort(wrapper, 'name');

        expect(names(wrapper)).toEqual(['Asparagus', 'Cherokee Purple', 'Provider bush bean']);
    });

    it.each([
        ['category', ['Provider bush bean', 'Cherokee Purple', 'Asparagus']],
        ['subcategory', ['Provider bush bean', 'Asparagus', 'Cherokee Purple']],
    ])('sorts by %s when its column is clicked', async (column, expected) => {
        const wrapper = mountTable();

        await clickSort(wrapper, column);

        expect(names(wrapper)).toEqual(expected);
        expect(sortIcons(wrapper)[{ category: 1, subcategory: 2 }[column]]).toEqual(['mdi-sort-ascending', 'primary']);
        expect(sortIcons(wrapper)[0]).toEqual(['mdi-sort', 'default']);
    });

    it.each([
        ['category', 1],
        ['subcategory', 2],
    ])('sorts by %s descending on a second click, keeping equal ones in order', async (column, index) => {
        const wrapper = mountTable({
            plants: [
                { plantId: 'a', friendlyName: 'Provider bush bean', category: 'Legumes', subcategory: 'Beans' },
                { plantId: 'b', friendlyName: 'Asparagus', category: 'Perennials', subcategory: 'Stalks' },
                { plantId: 'c', friendlyName: 'Rhubarb', category: 'Perennials', subcategory: 'Stalks' },
            ],
        });

        await clickSort(wrapper, column);
        await clickSort(wrapper, column);

        expect(names(wrapper)).toEqual(['Asparagus', 'Rhubarb', 'Provider bush bean']);
        expect(sortIcons(wrapper)[index]).toEqual(['mdi-sort-descending', 'primary']);
    });

    // Unlike utils/sorting, which ignores case, this compares the strings as
    // they are, so a lower-case name sorts after every capitalised one
    it('sorts case-sensitively', () => {
        const wrapper = mountTable({
            plants: [
                { plantId: 'a', friendlyName: 'zucchini' },
                { plantId: 'b', friendlyName: 'Zinnia' },
                { plantId: 'c', friendlyName: 'arugula' },
            ],
        });

        expect(names(wrapper)).toEqual(['Zinnia', 'arugula', 'zucchini']);
    });

    // With no filter, the list it sorts is the one it was given, so the
    // parent's array (the plants store's list) is reordered too
    it('sorts the array it was given in place', () => {
        const given = plants();

        mountTable({ plants: given });

        expect(given.map(plant => plant.plantId)).toEqual(['plant-3', 'plant-2', 'plant-1']);
    });

    it.each([
        ['a name', 'cherokee', ['Cherokee Purple']],
        ['a category', 'LEGUMES', ['Provider bush bean']],
        ['a subcategory', 'stalk', ['Asparagus']],
    ])('filters by %s, ignoring case', (_, filter, expected) => {
        const wrapper = mountTable({ filter });

        expect(names(wrapper)).toEqual(expected);
    });

    // The filter matches the name, category and subcategory run together, so
    // it also matches across where one ends and the next begins
    it('matches a filter that spans the name and the category', () => {
        const wrapper = mountTable({ filter: 'beanleg' });

        expect(names(wrapper)).toEqual(['Provider bush bean']);
    });

    it('matches a plant with no category or subcategory by its name', () => {
        const wrapper = mountTable({ plants: [{ plantId: 'x', friendlyName: 'Mystery seed' }], filter: 'mystery' });

        expect(names(wrapper)).toEqual(['Mystery seed']);
    });

    it('counts the plants shown, of all of them', () => {
        expect(mountTable().text()).toContain('3 of 3 plants');
        expect(mountTable({ filter: 'bean' }).text()).toContain('1 of 3 plants');
    });

    it("calls onViewClicked and onEditClicked with the row's plant", async () => {
        const wrapper = mountTable();
        const firstRow = wrapper.findAll('tbody tr')[0];

        await firstRow.find('.mdi-magnify').trigger('click');
        await firstRow.find('.mdi-pencil').trigger('click');

        expect(wrapper.props('onViewClicked')).toHaveBeenCalledWith(expect.objectContaining({ plantId: 'plant-3' }));
        expect(wrapper.props('onEditClicked')).toHaveBeenCalledWith(expect.objectContaining({ plantId: 'plant-3' }));
    });
});
