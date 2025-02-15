<template>
  <v-container>
    <v-row>
      <v-col cols="2"></v-col>
      <v-col cols="8">

        <v-row v-if="alertVisible">
          <fade-out-alert :is-visible="alertVisible" :alert-type="alertType" :message="alertMessage"/>
        </v-row>

        <v-row v-if="loading" class="mt-10 d-flex justify-center">
          <v-progress-circular size="100" width="10" color="green" indeterminate/>
        </v-row>

        <v-row>
          <v-col cols="12" class="text-center">
            <page-title :title="plant.friendlyName"/>
            <v-spacer/>
            <span>{{ plant.category }}</span>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-card>
              <v-tabs
                  v-model="tab"
                  align-tabs="center"
                  fixed-tabs
              >
                <v-tab value="details">Details</v-tab>
                <v-tab value="taxonomy">Taxonomy</v-tab>
                <v-tab value="sowing">Sowing</v-tab>
                <v-tab value="planting">Planting</v-tab>
                <v-tab value="growing">Growing</v-tab>
                <v-tab value="harvesting">Harvesting</v-tab>
              </v-tabs>

              <v-card-text class="mt-5">
                <v-tabs-window v-model="tab">
                  <v-tabs-window-item value="details">
                    <plant-details-tab :plant="plant"/>
                  </v-tabs-window-item>

                  <v-tabs-window-item value="taxonomy">
                    <plant-taxonomy-tab :plant="plant"/>
                  </v-tabs-window-item>

                  <v-tabs-window-item value="sowing">
                    <plant-sowing-tab :plant="plant"/>
                  </v-tabs-window-item>

                  <v-tabs-window-item value="planting">
                    <plant-planting-tab :plant="plant"/>
                  </v-tabs-window-item>

                  <v-tabs-window-item value="growing">
                    <plant-growing-tab :plant="plant"/>
                  </v-tabs-window-item>

                  <v-tabs-window-item value="harvesting">
                    <plant-harvesting-tab :plant="plant"/>
                  </v-tabs-window-item>
                </v-tabs-window>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "pinia";
import { usePlantsStore } from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import PlantDetailsTab from "@/components/plants/PlantDetailsTab.vue";
import PlantTaxonomyTab from "@/components/plants/PlantTaxonomyTab.vue";
import PlantSowingTab from "@/components/plants/PlantSowingTab.vue";
import PlantPlantingTab from "@/components/plants/PlantPlantingTab.vue";
import PlantGrowingTab from "@/components/plants/PlantGrowingTab.vue";
import PlantHarvestingTab from "@/components/plants/PlantHarvestingTab.vue";

export default {
  name: "PlantDetailsPage",

  components: {
    PlantHarvestingTab,
    PlantGrowingTab,
    PlantPlantingTab,
    PlantSowingTab,
    PlantTaxonomyTab,
    PlantDetailsTab,
    FadeOutAlert,
    PageTitle,
  },

  data() {
    return {
      tab: null,
    };
  },

  computed: {
    ...mapState(usePlantsStore, {
      plantsById: 'plantsById',
      loading: 'loading',
      alertType: 'alertType',
      alertMessage: 'alertMessage',
      alertVisible: 'alertVisible',
    }),

    plantId() {
      return this.$route.params.plantId;
    },

    plant() {
      return this.plantsById ? this.plantsById[this.plantId] : null;
    },
  },

  methods: {
    ...mapActions(usePlantsStore, [
      'fetchPlantById',
    ]),

    async refreshData() {
      await this.fetchPlantById(this.plantId);
    },
  },

  mounted() {
    this.refreshData();
  },
}
</script>

<style scoped>

</style>