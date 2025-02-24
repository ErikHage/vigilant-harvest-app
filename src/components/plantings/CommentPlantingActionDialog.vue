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
      show: false,
      comment: null,
    };
  },

  methods: {
    handleSubmit() {
      this.onSubmit(plantingActions.comment, {
        comment: this.comment,
      });
      this.show = false;
    },

    handleCancel() {
      this.show = false;
    },
  },
}
</script>