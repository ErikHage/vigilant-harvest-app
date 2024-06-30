<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <span class="headline">Manage Plants</span>
            <v-spacer></v-spacer>
            <v-btn class="mr-2 mt-3" color="primary" @click="openDialog()">Add</v-btn>
            <v-btn class="mt-3" color="primary" @click="refreshData">Refresh</v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
                :headers="headers"
                :items="tempPlantData"
                item-key="plantId"
                class="elevation-1"
            >
              <template #item.actions="{ item }">
                <v-icon small @click="openDialog(item)">mdi-pencil</v-icon>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title>
          <span class="headline">{{ isEditMode ? 'Edit Plant' : 'Add Plant' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="applicationForm">
            <v-text-field v-model="form.friendlyName" label="Name" required></v-text-field>
            <v-text-field v-model="form.family" label="Family" required></v-text-field>
            <v-text-field v-model="form.genus" label="Genus" required></v-text-field>
            <v-text-field v-model="form.species" label="Species" required></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>
          <v-btn v-if="isEditMode" color="blue darken-1" text @click="savePlant">Update</v-btn>
          <v-btn v-else color="blue darken-1" text @click="savePlant">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>

function getPlant(id, name) {
  return {
    plantId: id,
    family: 'something',
    genus: 'something',
    species: 'something',
    friendlyName: name,
  };
}

export default {
  name: 'PlantsPage',

  components: {},

  data: () => ({
    dialog: false,
    isEditMode: false,
    tempPlantData: [
      getPlant('1', 'a'),
      getPlant('2', 'b'),
      getPlant('3', 'c'),
      getPlant('4', 'd'),
      getPlant('5', 'e'),
      getPlant('6', 'f'),
    ],
    headers: [
      // { title: 'Id', key: 'plantId' }, // don't need to show this on table, maybe not the taxonomy either
      {title: 'Name', key: 'friendlyName'},
      {title: 'Family', key: 'family'},
      {title: 'Genus', key: 'genus'},
      {title: 'Species', key: 'species'},
      {title: 'Actions', key: 'actions', sortable: false},
    ],
    form: {
      plantId: '',
      friendlyName: '',
      family: '',
      genus: '',
      species: '',
    },
  }),

  computed: {},

  methods: {
    async refreshData() {
      // load plants
    },

    resetForm() {
      this.form = {
        plantId: '',
        friendlyName: '',
        family: '',
        genus: '',
        species: '',
      };
    },

    openDialog(plant) {
      console.log("plant", plant);
      if (plant !== undefined) {
        console.log('in edit mode if block');
        this.form = {
          plantId: plant.plantId,
          friendlyName: plant.friendlyName,
          family: plant.family,
          genus: plant.genus,
          species: plant.species,
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

    async savePlant() {
      // todo - use upsert api
      this.closeDialog();
    }
  },

  mounted() {
    this.refreshData();
  }
}
</script>
