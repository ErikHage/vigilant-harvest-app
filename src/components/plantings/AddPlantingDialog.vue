<template>
  <v-dialog v-model="showDialog" max-width="500px" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">Add Planting</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="applicationForm">
          <v-text-field
              v-model="planting.name"
              label="Name"
              required></v-text-field>
          <v-select
              v-model="planting.plantId"
              :items="plants"
              :item-title="(plant) => plant.friendlyName"
              :item-value="(plant) => plant.plantId"
              label="Select Plant"
              variant="solo"
          ></v-select>
          <v-text-field
              v-model="planting.seedSource"
              label="Seed Source"
              required></v-text-field>
          <v-text-field
              v-model="planting.lotNumber"
              label="Lot#"
              required></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" @click="handleOnCancel">Cancel</v-btn>
        <v-btn color="primary" @click="handleSavePlanting">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "AddPlantingDialog",

  props: {
    show: Boolean,
    plants: Array,
    onSubmit: Function,
    onCancel: Function,
  },

  data() {
    return {
      planting: {
        name: '',
        plantId: '',
        seedSource: null,
        lotNumber: null,
      },
    };
  },

  computed: {
    showDialog() {
      return this.show;
    },
  },

  methods: {
    resetForm() {
      this.planting = {
        name: '',
        plantId: '',
        seedSource: null,
        lotNumber: null,
      };
    },

    async handleSavePlanting() {
      await this.onSubmit({
        ...this.planting,
        currentStatus: 'INITIALIZED',
      });
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