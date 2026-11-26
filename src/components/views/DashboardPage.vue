<template>
  <!-- Only a parent for the dashboard pages: their links are in the shell's
       drawer, and each page has its own container inside the shell's -->
  <!-- the common store's: the planting years, loaded here for every dashboard page -->
  <fade-out-alert :is-visible="alert.isVisible" :alert-type="alert.type" :message="alert.message"/>
  <router-view/>
</template>

<script>

import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import {mapActions} from "pinia";
import {useCommonStore} from "@/store";
import { alertOf } from "@/store/alerts";

export default {
  name: 'DashboardPage',

  components: {FadeOutAlert},

  computed: {
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
