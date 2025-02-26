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
          <v-autocomplete
              v-model="planting.plantId"
              :items="sortedPlants"
              :item-title="(plant) => plant.friendlyName"
              :item-value="(plant) => plant.plantId"
              label="Select Plant"
              variant="solo"
              clearable
          ></v-autocomplete>
          <v-text-field
              v-model.number="planting.leadTimeWeeks"
              type="number"
              label="Indoor Sow Lead Time (weeks)"
          ></v-text-field>
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
import sorting from "@/utils/sorting";

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
        leadTimeWeeks: null,
        seedSource: null,
        lotNumber: null,
      },
    };
  },

  computed: {
    showDialog() {
      return this.show;
    },

    sortedPlants() {
      return this.plants.sort(sorting.sortByPlantFriendlyName);
    }
  },

  methods: {
    resetForm() {
      this.planting = {
        name: '',
        plantId: '',
        leadTimeWeeks: null,
        seedSource: null,
        lotNumber: null,
      };
    },

    async handleSavePlanting() {
      await this.onSubmit(this.planting);
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