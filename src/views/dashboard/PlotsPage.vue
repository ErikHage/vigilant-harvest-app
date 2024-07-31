<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <span class="headline">Manage Plots</span>
            <v-spacer></v-spacer>
            <v-btn class="mr-2 mt-3" color="primary" @click="openDialog()">Add</v-btn>
            <v-btn class="mt-3" color="primary" @click="refreshData">Refresh</v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
                :headers="headers"
                :items="plots"
                item-key="plotId"
                class="elevation-1"
            >
              <template #item.actions="{ item }">
                <v-icon small @click="openDialog(item)">mdi-pencil</v-icon>
                <!-- TODO add delete button, with confirm dialog. only admin can see/use it -->
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title>
          <span class="headline">{{ isEditMode ? 'Edit Plot' : 'Add Plot' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="applicationForm">
            <v-text-field v-model="form.friendlyName" label="Name" required></v-text-field>
            <v-text-field v-model.number="form.lengthInInches" type="number" label="Length (inches)" required></v-text-field>
            <v-text-field v-model.number="form.widthInInches" type="number" label="Width (inches)" required></v-text-field>
            <v-select
                v-model="form.plotType"
                :items="plotTypes"
                item-title="item"
                item-value="item"
                label="Plot Type"
                variant="solo"
                return-object
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>
          <v-btn v-if="isEditMode" color="blue darken-1" text @click="savePlot">Update</v-btn>
          <v-btn v-else color="blue darken-1" text @click="savePlot">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { usePlotsStore } from "@/store";

export default {
  name: 'PlotsPage',

  components: {},

  data: () => ({
    dialog: false,
    isEditMode: false,
    headers: [
      // { title: 'Id', key: 'plotId' }, // don't need to show this on table
      { title: 'Name', key: 'friendlyName' },
      { title: 'Length (in.)', key: 'lengthInInches' },
      { title: 'Width (in.)', key: 'widthInInches' },
      { title: 'Type', key: 'plotType' },
      // TODO make this a checkbox or something, not the number it is now - also why is this not a boolean?
      { title: 'Active', key: 'isActive' },
      { title: 'Actions', key: 'actions', sortable: false },
    ],
    form: {
      plotId: '',
      friendlyName: '',
      lengthInInches: 0,
      widthInInches: 0,
      plotType: '',
      isActive: false,
    },
    plotTypes: [
        'Bed',
        'Raised Bed',
        'Planter',
        'Tree',
    ],
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

    resetForm() {
      this.form = {
        plotId: '',
        friendlyName: '',
        lengthInInches: 0,
        widthInInches: 0,
        plotType: '',
        isActive: false,
      };
    },

    openDialog(plot) {
      console.log("plot", plot);
      if (plot !== undefined) {
        console.log('in edit mode if block');
        this.form = {
          plotId: plot.plotId,
          friendlyName: plot.friendlyName,
          widthInInches: plot.widthInInches,
          lengthInInches: plot.lengthInInches,
          plotType: plot.plotType,
          isActive: plot.isActive,
        };
        this.isEditMode = true;
      } else {
        console.log('in non-edit mode if block');
        this.resetForm();
        this.isEditMode = false;
      }
      this.dialog = true;
    },

    closeDialog() {
      this.dialog = false;
    },

    async savePlot() {
      console.log('saving plot', this.form);
      await this.upsertPlot(this.form);
      this.closeDialog();
      await this.refreshData();
    }
  },

  mounted() {
    this.refreshData();
  }
}
</script>
