<template>
  <v-card>
    <v-card-text>
      <v-table density="compact" height="50vh">
        <thead>
        <tr>
          <th>
            Name&nbsp;
            <v-icon
                :color="getSortIconColor('friendlyName')"
                @click="sortByProperty('friendlyName')">{{ nameSortIcon }}
            </v-icon>
          </th>
          <th>
            Category&nbsp;
            <v-icon
                :color="getSortIconColor('category')"
                @click="sortByProperty('category')">{{ categorySortIcon }}
            </v-icon>
          </th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="item in filteredPlants">
          <td>{{ item.friendlyName }}</td>
          <td>{{ item.category }}</td>
          <td>
            <v-icon small @click="onViewClicked(item)">mdi-magnify</v-icon>
            <v-icon class="pl-2" small @click="onEditClicked(item)">mdi-pencil</v-icon>
          </td>
        </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
  <div class="mt-4">
    <span> {{ filteredPlants.length }} of {{ plants.length }} plants</span>
  </div>
</template>

<script>
export default {
  name: 'PlantsTable',

  props: {
    plants: {
      type: Array,
    },
    filter: {
      type: String,
    },
    onViewClicked: {
      type: Function,
    },
    onEditClicked: {
      type: Function,
    },
  },

  data() {
    return {
      sortingField: 'friendlyName',
    };
  },

  computed: {
    filteredPlants() {
      let filtered = this.plants;
      if (this.filter !== null) {
        filtered = this.plants.filter(plant => {
          const matchString = plant.friendlyName.toUpperCase() + (plant.category?.toUpperCase() ?? "");
          return matchString.includes(this.filter.toUpperCase());
        });
      }
      return filtered.sort(this.generateSortingFunction(this.sortingField));
    },

    nameSortIcon() {
      if (this.sortingField === '-friendlyName') {
        return 'mdi-sort-descending';
      }
      if (this.sortingField === 'friendlyName') {
        return 'mdi-sort-ascending';
      }
      return 'mdi-sort';
    },

    categorySortIcon() {
      if (this.sortingField === '-category') {
        return 'mdi-sort-descending';
      }
      if (this.sortingField === 'category') {
        return 'mdi-sort-ascending';
      }
      return 'mdi-sort';
    }
  },

  methods: {
    sortByProperty(property) {
      if (this.sortingField === property) {
        this.sortingField = '-' + this.sortingField;
      } else {
        this.sortingField = property;
      }
    },

    generateSortingFunction(property) {
      let sortOrder = 1;
      if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
      }
      return function (a, b) {
        const result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
      }
    },

    getSortIconColor(property) {
      if (this.sortingField.includes(property)) {
        return 'primary';
      }
      return 'default';
    }
  },
}
</script>

<style scoped>

</style>