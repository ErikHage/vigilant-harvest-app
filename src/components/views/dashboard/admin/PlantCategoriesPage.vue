<template>
  <v-container v-if="categories != null">
    <v-row>
      <v-col cols="12">

        <v-row v-if="alertVisible">
          <fade-out-alert :is-visible="alertVisible" :alert-type="alertType" :message="alertMessage"/>
        </v-row>

        <v-row class="mb-4 align-center">
          <v-col>
            <page-title title="Plant Categories"/>
            <v-spacer></v-spacer>
            <span class="text-medium-emphasis text-body-2">
               {{ filteredCategories.length }} of {{ categories.length }} categories
            </span>
          </v-col>
        </v-row>

        <v-card>
          <v-card-text>
            <div class="d-flex justify-space-between align-center mb-4">
              <v-text-field
                  v-model="filter"
                  prepend-inner-icon="mdi-magnify"
                  label="Filter categories"
                  density="compact"
                  variant="solo"
                  clearable
                  hide-details
              />
              <v-spacer></v-spacer>
              <PlantCategoryAddDialog :on-submit="addCategory"/>
            </div>

            <v-table density="compact">
              <thead>
              <tr>
                <th style="width: 220px">
                  Category&nbsp;
                  <v-icon :color="getSortIconColor('categoryName')" @click="sortByProperty('categoryName')">
                    {{ sortIcon('categoryName') }}
                  </v-icon>
                </th>
                <th>Subcategories</th>
                <th style="width: 80px"></th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="category in filteredCategories" :key="category.categoryId">
                <td class="font-weight-medium">{{ category.categoryName }}</td>
                <td>
                  <div>
                    <v-chip
                        v-for="sub in category.subcategories"
                        :key="sub.subcategoryId"
                        size="small"
                        variant="tonal"
                        color="blue"
                    >
                      {{ sub.subcategoryName }}
                    </v-chip>
                  </div>
                </td>
                <td>
                  <PlantSubcategoryAddDialog :category="category" :on-submit="addSubcategory"/>
                </td>
              </tr>
              <tr v-if="filteredCategories.length === 0">
                <td colspan="3" class="text-center text-medium-emphasis py-6">No categories found</td>
              </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapState } from 'pinia';
import { usePlantsStore } from '@/store';
import FadeOutAlert from '@/components/utils/FadeOutAlert.vue';
import PageTitle from "@/components/layout/PageTitle.vue";
import PlantCategoryAddDialog from "@/components/admin/PlantCategoryAddDialog.vue";
import PlantSubcategoryAddDialog from "@/components/admin/PlantSubcategoryAddDialog.vue";

export default {
  name: 'PlantCategoriesPage',

  components: {
    PlantSubcategoryAddDialog,
    PageTitle,
    FadeOutAlert,
    PlantCategoryAddDialog,
  },

  data() {
    return {
      filter: '',
      sortingField: 'categoryName',
    };
  },

  computed: {
    ...mapState(usePlantsStore, {
      categories: 'categories',
      alertType: 'alertType',
      alertMessage: 'alertMessage',
      alertVisible: 'alertVisible',
    }),

    alert() {
      return {
        isVisible: this.alertVisible,
        type: this.alertType,
        message: this.alertMessage,
      };
    },

    filteredCategories() {
      let result = this.categories;
      if (this.filter) {
        const upper = this.filter.toUpperCase();
        result = result.filter(c => {
          const matchString = c.categoryName.toUpperCase()
              + c.subcategories.map(s => s.subcategoryName).join(' ').toUpperCase();
          return matchString.includes(upper);
        });
      }
      return [...result].sort(this.generateSortingFunction(this.sortingField));
    },
  },

  methods: {
    ...mapActions(usePlantsStore, [
      'fetchPlantCategories',
      'createCategory',
      'createSubcategory',
    ]),

    async refreshData() {
      await this.fetchPlantCategories();
    },

    async addCategory(category) {
      await this.createCategory(category);
      await this.refreshData();
    },

    async addSubcategory(subcategory) {
      await this.createSubcategory(subcategory);
      await this.refreshData();
    },

    sortByProperty(property) {
      if (this.sortingField === property) {
        this.sortingField = '-' + property;
      } else {
        this.sortingField = property;
      }
    },

    sortIcon(property) {
      if (this.sortingField === `-${property}`) return 'mdi-sort-descending';
      if (this.sortingField === property) return 'mdi-sort-ascending';
      return 'mdi-sort';
    },

    getSortIconColor(property) {
      const activeField = this.sortingField.replace(/^-/, '');
      return activeField === property ? 'primary' : 'default';
    },

    generateSortingFunction(property) {
      let sortOrder = 1;
      if (property[0] === '-') {
        sortOrder = -1;
        property = property.substring(1);
      }
      return (a, b) => {
        const result = a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
        return result * sortOrder;
      };
    },
  },

  mounted() {
    this.refreshData();
  },
};
</script>

<style scoped>
</style>
