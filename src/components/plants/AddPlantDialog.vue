<template>
  <v-dialog v-model="showDialog" max-width="800px" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">Add Plant</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="applicationForm">
          <v-text-field v-model="form.category" label="Category" density="compact" required></v-text-field>
          <v-text-field v-model="form.friendlyName" label="Name" density="compact" required></v-text-field>
          <v-textarea v-model="form.description" label="Description" density="compact" rows="8" required></v-textarea>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" text @click="handleOnCancel">Cancel</v-btn>
        <v-btn color="primary" text @click="handleSavePlant">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'AddPlantDialog',

  props: {
    show: Boolean,
    onSubmit: Function,
    onCancel: Function,
  },

  data() {
    return {
      form: {
        category: '',
        friendlyName: '',
        description: '',
      },
    };
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
      this.form = {
        category: '',
        friendlyName: '',
        description: '',
      };
    },

    async handleSavePlant() {
      await this.onSubmit(this.form);
      this.resetForm();
    },

    handleOnCancel() {
      this.resetForm();
      this.onCancel();
    },
  },
}
</script>