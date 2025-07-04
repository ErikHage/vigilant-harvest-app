<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Manage Plants"/>
        <v-spacer></v-spacer>
        <fade-out-alert
            :is-visible="alert.isVisible"
            :alert-type="alert.type"
            :message="alert.message"/>
      </v-col>
      <v-col cols="12">
        <v-sheet class="pa-4">
          <div class="d-flex justify-space-between">
            <v-text-field
                v-model="searchFilter"
                label="Search..."
                class="search-bar"
                variant="solo"
                density="compact"
                clearable
            />

            <v-btn class="mx-4" color="primary" @click="openDialog()">Add</v-btn>
            <!--                <v-btn color="warning" @click="refreshData">Refresh</v-btn>-->
          </div>

          <plants-table
              :plants="plants"
              :filter="searchFilter"
              :on-view-clicked="navigateToPlantDetails"
              :on-edit-clicked="navigateToPlantEdit"
          />
        </v-sheet>
      </v-col>
    </v-row>

    <add-plant-dialog
        :show="dialog"
        :on-submit="savePlant"
        :on-cancel="closeDialog"
    />
  </v-container>
</template>

<script>

import {mapActions, mapState} from "pinia";
import {usePlantsStore} from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import PlantsTable from "@/components/plants/PlantsTable.vue";
import AddPlantDialog from "@/components/plants/AddPlantDialog.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";

export default {
  name: 'PlantsPage',

  components: {
    FadeOutAlert,
    AddPlantDialog,
    PageTitle,
    PlantsTable,
  },

  data: () => ({
    dialog: false,
    searchFilter: null,
  }),

  computed: {
    ...mapState(usePlantsStore, {
      plants: 'plants',
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
  },

  methods: {
    ...mapActions(usePlantsStore, [
      'upsertPlant',
      'fetchPlants',
    ]),

    async refreshData() {
      await this.fetchPlants();
    },

    navigateToPlantDetails(plant) {
      this.$router.push({
        name: 'PlantDetailsPage',
        params: {
          plantId: plant.plantId,
        },
      });
    },

    navigateToPlantEdit(plant) {
      this.$router.push({
        name: 'PlantEditPage',
        params: {
          plantId: plant.plantId,
        },
      });
    },

    openDialog() {
      this.dialog = true;
    },

    closeDialog() {
      this.dialog = false;
    },

    async savePlant(plant) {
      await this.upsertPlant(plant);
      this.closeDialog();
      await this.refreshData();
    }
  },

  mounted() {
    this.refreshData();
  }
}
</script>

<style scoped>
.search-bar {
  flex: 1;
  margin-right: 16px;
}
</style>
