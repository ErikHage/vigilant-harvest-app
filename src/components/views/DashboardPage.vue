<template>
  <v-container>
    <dashboard-app-bar :is-planting-year-selected="plantingYear != null"/>
    <v-row>
      <router-view/>
    </v-row>
  </v-container>
</template>

<script>

import DashboardAppBar from "@/components/layout/DashboardAppBar.vue";
import { mapState } from "pinia";
import { useCommonStore } from "@/store";

export default {
  name: 'DashboardPage',

  components: { DashboardAppBar },

  computed: {
    ...mapState(useCommonStore, [
        'plantingYear',
    ]),
  },
}
</script>
