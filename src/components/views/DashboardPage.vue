<template>
  <v-container>
    <dashboard-app-bar
        :is-planting-year-selected="plantingYear != null"
    />
    <!-- the common store's: the planting years, loaded here for every dashboard page -->
    <fade-out-alert :is-visible="alert.isVisible" :alert-type="alert.type" :message="alert.message"/>
    <v-row>
      <router-view/>
    </v-row>
  </v-container>
</template>

<script>

import DashboardAppBar from "@/components/layout/DashboardAppBar.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import {mapActions, mapState} from "pinia";
import {useCommonStore} from "@/store";
import { alertOf } from "@/store/alerts";

export default {
  name: 'DashboardPage',

  components: {DashboardAppBar, FadeOutAlert},

  computed: {
    ...mapState(useCommonStore, {
      plantingYear: 'plantingYear',
    }),

    alert() {
      return alertOf(useCommonStore());
    },
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
