<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <span class="headline">Manage Yearly Plantings</span>
            <v-spacer></v-spacer>
            <v-btn class="mr-2 mt-3" color="primary" @click="openDialog()">Add</v-btn>
            <v-btn class="mt-3" color="primary" @click="refreshData">Refresh</v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
                :headers="headers"
                :items="plotYears"
                item-key="plotYearId"
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
          <span class="headline">{{ isEditMode ? 'Edit' : 'Add' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="yearlyPlantingForm">
            <!-- Year - maybe select like the plantings page? -->
            <!-- Plot -->
            <!--    create a plot year [ year, plot id, num rows, num columns ] -->
            <!-- Planting -->
            <!--    link a plot year with one or more plantings  -->
            <!-- Some kind of grid selection to place the plantings in the plot -->
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
  name: 'YearlyPlantingsPage',

  components: {},

  data: () => ({
    dialog: false,
    isEditMode: false,
    headers: [
      // { title: 'Id', key: 'plotId' }, // don't need to show this on table
      // { title: 'Name', key: 'friendlyName' },
      // { title: 'Length (in.)', key: 'lengthInInches' },
      // { title: 'Width (in.)', key: 'widthInInches' },
      // { title: 'Type', key: 'plotType' },
      // { title: 'Active', key: 'isActive' },
      // { title: 'Actions', key: 'actions', sortable: false },
    ],
    form: {
      // plotId: '',
      // friendlyName: '',
      // lengthInInches: 0,
      // widthInInches: 0,
      // plotType: '',
      // isActive: false,
    },
    availableYears: [
      '2024',
      '2025',
    ],
  }),

  computed: {
    ...mapState(usePlotsStore, [
      'plots', 'alertType', 'alertMessage', 'alertVisible',
    ]),
  },

  methods: {
    ...mapActions(usePlotsStore, [
      'fetchPlots',
    ]),

    async refreshData() {
      await this.fetchPlots();
    },

    resetForm() {
      this.form = {

      };
    },

    openDialog(plot) {
      console.log("plot", plot);
      if (plot !== undefined) {
        console.log('in edit mode if block');
        this.form = {

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

    // async savePlot() {
    //   console.log('saving plot', this.form);
    //   await this.upsertPlot(this.form);
    //   this.closeDialog();
    //   await this.refreshData();
    // }
  },

  mounted() {
    this.refreshData();
  }
}
</script>
