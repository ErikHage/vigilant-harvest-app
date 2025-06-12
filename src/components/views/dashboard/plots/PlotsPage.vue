<template>
  <v-container>
    <v-row>

      <v-col cols="12" class="text-center">
        <page-title title="Manage Plots"/>
        <v-spacer></v-spacer>
        <fade-out-alert
            :is-visible="alert.isVisible"
            :alert-type="alert.type"
            :message="alert.message"/>
      </v-col>

      <v-col cols="2"></v-col>
      <v-col cols="8">
        <v-sheet class="pa-4">
          <div class="d-flex">
            <v-text-field
                v-model="searchFilter"
                label="Search..."
                class="search-bar"
                variant="solo"
                density="compact"
                clearable
            />

            <v-btn class="mx-4" color="primary" @click="openDialog()">Add</v-btn>
            <v-btn color="warning" @click="refreshData">Refresh</v-btn>
          </div>

          <plots-table
              :plots="plots"
              :search-filter="searchFilter"
              :on-edit-clicked="openDialog"
          />
        </v-sheet>
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
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";

export default {
  name: 'PlotsPage',

  components: {
    UpsertPlotDialog,
    PlotsTable,
    PageTitle,
    FadeOutAlert,
  },

  data: () => ({
    dialog: false,
    selectedPlot: null,
    searchFilter: null,
  }),

  computed: {
    ...mapState(usePlotsStore, {
      plots: 'plots',
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
    ...mapActions(usePlotsStore, [
      'upsertPlot',
      'fetchPlots',
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
