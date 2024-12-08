<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Manage Plots"/>
        <v-spacer></v-spacer>
        <v-btn class="mr-2 mt-3" color="primary" @click="openDialog()">Add</v-btn>
        <v-btn class="mt-3" color="primary" @click="refreshData">Refresh</v-btn>
      </v-col>
      <v-col cols="2"></v-col>
      <v-col cols="8">
        <plots-table
          :plots="plots"
          :on-edit-clicked="openDialog"
        />
      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

    <upsert-plot-dialog
      :show="dialog"
      :plot="selectedPlot"
      :on-submit="savePlot"
      :on-cancel="closeDialog"
    />

  </v-container>
</template>

<script>

import {mapActions, mapState} from "pinia";
import {usePlotsStore} from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import PlotsTable from "@/components/plots/PlotsTable.vue";
import UpsertPlotDialog from "@/components/plots/UpsertPlotDialog.vue";

export default {
  name: 'PlotsPage',

  components: {
    UpsertPlotDialog,
    PlotsTable,
    PageTitle,
  },

  data: () => ({
    dialog: false,
    selectedPlot: null,
  }),

  computed: {
    ...mapState(usePlotsStore, [
      'plots', 'alertType', 'alertMessage', 'alertVisible',
    ]),
  },

  methods: {
    ...mapActions(usePlotsStore, [
      'upsertPlot',
      'fetchPlots',
      'deletePlotById',
    ]),

    async refreshData() {
      await this.fetchPlots();
    },

    openDialog(plot) {
      if (plot !== undefined) {
        this.selectedPlot = plot;
      } else {
        this.selectedPlot = null;
      }
      this.dialog = true;
    },

    closeDialog() {
      this.dialog = false;
      this.selectedPlot = null;
    },

    async savePlot(plot) {
      await this.upsertPlot(plot);
      this.closeDialog();
      await this.refreshData();
    }
  },

  mounted() {
    this.refreshData();
  }
}
</script>
