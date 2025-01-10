<template>
  <v-container>
    <v-row v-if="alertVisible">
      <fade-out-alert :is-visible="alertVisible" :alert-type="alertType" :message="alertMessage"/>
    </v-row>

    <v-row v-if="loading" class="mt-10 d-flex justify-center">
      <v-progress-circular size="100" width="10" color="green" indeterminate/>
    </v-row>

    <v-row v-if="plant !== null">
      <v-col>
        <plant-details :plant="plant"/>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "pinia";
import { usePlantsStore } from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import PlantDetails from "@/components/views/dashboard/plants/PlantDetails.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";

export default {
  name: "PlantDetailsPage",

  components: {
    FadeOutAlert,
    PlantDetails,
    PageTitle,
  },

  computed: {
    ...mapState(usePlantsStore, [
      'plantsById',
      'loading',
      'alertVisible',
      'alertType',
      'alertMessage',
    ]),

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