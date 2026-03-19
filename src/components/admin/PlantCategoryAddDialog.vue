<template>
  <v-dialog max-width="500px" persistent>
    <template #activator="{ props }">
      <v-btn v-bind="props" color="primary" size="small">
        <v-icon left>mdi-plus</v-icon> Add Category
      </v-btn>
    </template>

    <template #default="{ isActive }">
      <v-card>
        <v-card-title>
          <span class="headline">Add Category</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="categoryForm">
            <v-text-field
                v-model="form.categoryName"
                label="Category Name"
                density="compact"
                variant="solo"
                required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="handleOnCancel(isActive)">Cancel</v-btn>
          <v-btn color="primary" text :disabled="!form.categoryName" @click="handleSaveCategory(isActive)">Create</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
export default {
  name: 'AddCategoryDialog',

  props: {
    onSubmit: {
      type: Function,
    },
  },

  data() {
    return {
      form: {
        categoryName: '',
      },
    };
  },

  methods: {
    resetForm() {
      this.form = { categoryName: '' };
    },

    async handleSaveCategory(isActive) {
      await this.onSubmit({ categoryName: this.form.categoryName.trim() });
      this.resetForm();
      isActive.value = false;
    },

    handleOnCancel(isActive) {
      this.resetForm();
      isActive.value = false;
    },
  },
};
</script>
