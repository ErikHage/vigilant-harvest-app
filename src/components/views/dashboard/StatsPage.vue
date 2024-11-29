<template>
  <v-container>

    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Stats"/>
        <v-spacer></v-spacer>
      </v-col>
      <v-col cols="2"></v-col>
      <v-col cols="8">

        <!--        DATA HERE -->

      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { useCommonStore, useHarvestsStore } from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";

export default {
  name: 'StatsPage',

  components: {
    PageTitle,
  },

  data: () => ({}),

  computed: {
    ...mapState(useCommonStore, [
      'plantingYear',
    ]),

    ...mapState(useHarvestsStore, [
      'harvestStats',
    ]),
  },

  methods: {
    ...mapActions(useHarvestsStore, [
      'fetchHarvestStats',
    ]),

    async refreshData() {
      await this.fetchHarvestStats(this.plantingYear);
    },
  },

  mounted() {
    this.refreshData();
  }
}
</script>
