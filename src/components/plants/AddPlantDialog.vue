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
          <v-select
              v-model="form.lifespanType"
              :items="lifespanTypes"
              :item-title="(lifespanType) => lifespanType"
              :item-value="(lifespanType) => lifespanType"
              label="Select Lifespan Type"
              density="compact"
              variant="solo"
          ></v-select>
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
        lifespanType: null,
        description: '',
      },
      lifespanTypes: [
        'Annual',
        'Perennial',
        'Biennial',
        'Unknown',
      ],
    };
  },

  computed: {
    showDialog() {
      return this.show;
    },
  },

  methods: {
    resetForm() {
      this.form = {
        category: '',
        friendlyName: '',
        lifespanType: null,
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
