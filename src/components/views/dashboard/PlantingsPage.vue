<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Manage Plantings"/>
        <v-spacer></v-spacer>
        <v-btn class="mr-2 mt-3" color="primary" @click="openDialog()">Add</v-btn>
        <v-btn class="mt-3" color="primary" @click="refreshData">Refresh</v-btn>
      </v-col>
      <v-col cols="2"></v-col>
      <v-col cols="8">
        <plantings-table
          :plots-map="plotsById"
          :plants-map="plantsById"
          :plantings="plantings"
          :on-edit-clicked="openDialog"
        />
      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title>
          <span class="headline">{{ isEditMode ? 'Edit Planting' : 'Add Planting' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="applicationForm">
            <v-text-field
                v-model.number="form.plantingId"
                type="text"
                label="Planting Id"
                readonly
            ></v-text-field>
            <v-select
                v-model="form.plantId"
                :items="plants"
                :item-title="(plant) => plant.friendlyName"
                :item-value="(plant) => plant.plantId"
                label="Select Plant"
                variant="solo"
            ></v-select>
            <v-select
                v-model="form.plotId"
                :items="plots"
                :item-title="(plot) => plot.friendlyName"
                :item-value="(plot) => plot.plotId"
                label="Select Plot"
                variant="solo"
            ></v-select>
            <v-text-field
                v-model.number="form.numPlants"
                type="number"
                label="Number of Plants"
                required
            ></v-text-field>
            <v-text-field
                v-model="newNote"
                label="Add note"
            >
              <template #append-inner>
                <v-btn
                    color="default"
                    @click="addNote"
                    :disabled="!newNote.trim()"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </template>
            </v-text-field>
            <v-card v-if="form.notes.length > 0">
              <v-card-text>
                <ul>
                  <li v-for="note in form.notes"
                      class="note-list-item">
                    {{ note }}
                  </li>
                </ul>
              </v-card-text>
            </v-card>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>
          <v-btn v-if="isEditMode" color="blue darken-1" text @click="savePlanting">Update</v-btn>
          <v-btn v-else color="blue darken-1" text @click="savePlanting">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { useCommonStore, usePlantingsStore, usePlantsStore, usePlotsStore } from "@/store";
import PlantingYearSelectCard from "@/components/PlantingYearSelectCard.vue";
import PageTitle from "@/components/layout/PageTitle.vue";
import PlantingsTable from "@/components/plantings/PlantingsTable.vue";

export default {
  name: 'PlantingsPage',

  components: {
    PlantingsTable,
    PageTitle,
    PlantingYearSelectCard,
  },

  data: () => ({
    dialog: false,
    isEditMode: false,
    newNote: '',
    form: {
      plantingId: null,
      plotId: '',
      plantId: '',
      numPlants: 0,
      notes: [],
    },
  }),

  computed: {
    ...mapState(useCommonStore, [
      'plantingYear',
    ]),

    ...mapState(usePlotsStore, [
       'plots', 'plotsById',
    ]),

    ...mapState(usePlantsStore, [
      'plants', 'plantsById',
    ]),

    ...mapState(usePlantingsStore, [
      'plantings', 'alertType', 'alertMessage', 'alertVisible',
    ]),
  },

  methods: {
    ...mapActions(usePlotsStore, [
      'fetchPlots',
    ]),

    ...mapActions(usePlantsStore, [
      'fetchPlants',
    ]),

    ...mapActions(usePlantingsStore, [
      'upsertPlanting',
      'fetchPlantingsByYear',
    ]),

    resetForm() {
      this.form = {
        plantingId: null,
        plotId: '',
        plantId: '',
        numPlants: 0,
      };
    },

    openDialog(planting) {
      if (planting !== undefined) {
        console.log('in edit mode if block');
        this.form = {
          plantingId: planting.plantingId,
          plotId: planting.plotId,
          plantId: planting.plantId,
          numPlants: planting.numPlants,
          notes: planting.notes,
        };
        this.isEditMode = true;
        this.newNote = '';
      } else {
        console.log('in non-edit mode if block');
        this.resetForm();
        this.isEditMode = false;
      }
      this.dialog = true;
    },

    addNote() {
      if (this.newNote.trim()) {
        this.form.notes.push(this.newNote.trim());
        this.newNote = '';
      }
    },

    closeDialog() {
      this.dialog = false;
    },

    async savePlanting() {
      await this.upsertPlanting({
        plantingId: this.form.plantingId,
        plantingYear: this.plantingYear,
        plotId: this.form.plotId,
        plantId: this.form.plantId,
        numPlants: this.form.numPlants,
        notes: this.form.notes,
      });
      this.closeDialog();
      await this.refreshData();
    },

    async refreshData() {
      await this.fetchPlants();
      await this.fetchPlots();
      await this.fetchPlantingsByYear(this.plantingYear);
    },
  },

  mounted() {
    this.refreshData();
  }
}
</script>
<style scoped>
</style>