<template>
  <v-dialog v-model="showDialog" max-width="500px" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">{{ isEditMode ? 'Edit Planting' : 'Add Planting' }}</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="applicationForm">
          <v-text-field
              v-model.number="plantingCopy.plantingId"
              type="text"
              label="Planting Id"
              readonly
          ></v-text-field>
          <v-text-field
              v-model="plantingCopy.name"
              label="Name"
              required></v-text-field>
          <v-select
              v-model="plantingCopy.plantId"
              :items="plants"
              :item-title="(plant) => plant.friendlyName"
              :item-value="(plant) => plant.plantId"
              label="Select Plant"
              variant="solo"
          ></v-select>
          <v-select
              v-model="plantingCopy.plotId"
              :items="plots"
              :item-title="(plot) => plot.friendlyName"
              :item-value="(plot) => plot.plotId"
              label="Select Plot"
              variant="solo"
          ></v-select>
          <v-text-field
              v-model.number="plantingCopy.numPlants"
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
          <v-card v-if="plantingCopy.notes?.length > 0">
            <v-card-text>
              <ul>
                <li v-for="note in plantingCopy.notes"
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
        <v-btn color="blue darken-1" text @click="handleOnCancel">Cancel</v-btn>
        <v-btn v-if="isEditMode" color="blue darken-1" text @click="handleSavePlanting">Update</v-btn>
        <v-btn v-else color="blue darken-1" text @click="handleSavePlanting">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "UpsertPlantingDialog",

  props: {
    show: Boolean,
    planting: Object,
    plants: Array,
    plots: Array,
    onSubmit: Function,
    onCancel: Function,
  },

  data() {
    return {
      newNote: '',
      plantingCopy: {
        plantingId: null,
        name: '',
        plotId: '',
        plantId: '',
        numPlants: 0,
        notes: [],
      },
    };
  },

  watch: {
    planting: {
      immediate: true,
      handler(newPlanting) {
        if (newPlanting !== null) {
          this.plantingCopy = { ...newPlanting };
        } else {
          this.resetForm();
        }
      },
    },
  },

  computed: {
    showDialog() {
      return this.show;
    },

    isEditMode() {
      return this.planting !== null;
    }
  },

  methods: {
    addNote() {
      if (this.newNote.trim()) {
        this.plantingCopy.notes.push(this.newNote.trim());
        this.newNote = '';
      }
    },

    resetForm() {
      this.plantingCopy = {
        plantingId: null,
        name: '',
        plotId: '',
        plantId: '',
        numPlants: 0,
        notes: [],
      };
    },

    async handleSavePlanting() {
      await this.onSubmit(this.plantingCopy);
      this.resetForm();
    },

    handleOnCancel() {
      this.resetForm();
      this.onCancel();
    },
  },
}
</script>

<style scoped>

</style>