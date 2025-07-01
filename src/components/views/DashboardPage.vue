<template>
  <v-container>
    <dashboard-app-bar
        :is-planting-year-selected="plantingYear != null"
        :planting-year="selectedPlantingYear"
    />
    <v-row>
      <router-view/>
    </v-row>
  </v-container>
</template>

<script>

import DashboardAppBar from "@/components/layout/DashboardAppBar.vue";
import {mapActions, mapState} from "pinia";
import {useCommonStore} from "@/store";

export default {
  name: 'DashboardPage',

  components: {DashboardAppBar},

  computed: {
    ...mapState(useCommonStore, {
      plantingYear: 'plantingYear',
      selectedPlantingYear: 'selectedPlantingYear',
    }),
  },

  methods: {
    ...mapActions(useCommonStore, [
      'fetchPlantingYears',
    ]),
  },

  async mounted() {
    await this.fetchPlantingYears();
  }
}
</script>
