<template>
  <v-dialog v-model="show"  max-width="500px" persistent>
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn v-bind="activatorProps" class="mx-1" text="Comment" color="default" @click="show = true"/>
    </template>

    <v-card>
      <v-card-title>
        <span class="headline">Comment</span>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="saveError" type="error" density="compact" class="mb-4">{{ saveError }}</v-alert>
        <v-textarea v-model="comment" rows="4"></v-textarea>
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
  name: "CommentPlantingActionDialog",

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
      comment: null,
    };
  },

  methods: {
    async handleSubmit() {
      this.saveError = '';
      try {
        await this.onSubmit(plantingActions.comment, {
          comment: this.comment,
        });
      } catch (err) {
        this.saveError = saveFailureMessage(err);
        return;
      }
      this.closeDialog();
    },

    handleCancel() {
      this.saveError = '';
      this.closeDialog();
    },

    closeDialog() {
      this.show = false;
      this.comment = null;
    },
  },
}
</script>