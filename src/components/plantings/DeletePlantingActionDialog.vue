<template>
  <v-dialog v-model="show"  max-width="500px" persistent>
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn v-bind="activatorProps" class="mx-1" text="Delete" color="error" @click="show = true"/>
    </template>

    <v-card>
      <v-card-title>
        <span class="headline">Delete Planting</span>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="saveError" type="error" density="compact" class="mb-4">{{ saveError }}</v-alert>
        <h3>Do you really want to delete {{ planting.name }}?</h3>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" @click="handleCancel">Cancel</v-btn>
        <v-btn color="primary" @click="handleSubmit">Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { saveFailureMessage } from '@/utils/save-failures';

import plantingUtils from '../../utils/plantings';

const { plantingActions } = plantingUtils;

export default {
  name: "DeletePlantingActionDialog",

  props: {
    planting: {
      type: Object,
    },
    onSubmit: {
      type: Function,
      required: true,
    },
  },

  data() {
    return {
      saveError: '',
      show: false,
    };
  },

  methods: {
    async handleSubmit() {
      this.saveError = '';
      try {
        await this.onSubmit(plantingActions.delete, {});
      } catch (err) {
        this.saveError = saveFailureMessage(err, "Couldn't delete. Try again.");
        return;
      }
      this.show = false;
    },

    handleCancel() {
      this.saveError = '';
      this.show = false;
    },
  },
}
</script>