<template>
  <v-dialog v-model="showDialog" max-width="500px" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">{{ isEditMode ? 'Edit Plant' : 'Add Plant' }}</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="applicationForm">
          <v-text-field
              v-model="plantCopy.friendlyName"
              label="Name"
              required></v-text-field>
          <v-text-field
              v-model="plantCopy.family"
              label="Family"
              required></v-text-field>
          <v-text-field
              v-model="plantCopy.genus"
              label="Genus"
              required></v-text-field>
          <v-text-field
              v-model="plantCopy.species"
              label="Species"
              required></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="handleOnCancel">Cancel</v-btn>
        <v-btn v-if="isEditMode" color="blue darken-1" text @click="handleSavePlant">Update</v-btn>
        <v-btn v-else color="blue darken-1" text @click="handleSavePlant">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'UpsertPlantDialog',

  props: {
    show: Boolean,
    plant: Object,
    onSubmit: Function,
    onCancel: Function,
  },

  data() {
    return {
      plantCopy: {
        plantId: '',
        friendlyName: '',
        family: '',
        genus: '',
        species: '',
      },
    };
  },

  watch: {
    plant: {
      immediate: true,
      handler(newPlant) {
        if (newPlant !== null) {
          this.plantCopy = { ...newPlant };
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
      return this.plant !== null;
    }
  },

  methods: {
    resetForm() {
      this.plantCopy = {
        plantId: '',
            friendlyName: '',
            family: '',
            genus: '',
            species: '',
      };
    },

    async handleSavePlant() {
      await this.onSubmit(this.plantCopy);
      this.resetForm()
    },

    handleOnCancel() {
      this.resetForm();
      this.onCancel();
    },
  },
}
</script>