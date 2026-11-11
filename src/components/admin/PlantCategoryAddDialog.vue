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
          <v-alert v-if="saveError" type="error" density="compact" class="mb-4">{{ saveError }}</v-alert>
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
          <v-btn color="primary" text :disabled="!canCreate" @click="handleSaveCategory(isActive)">Create</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
import { saveFailureMessage } from '@/utils/save-failures';
import { hasText } from '@/utils/form-rules';

export default {
  name: 'AddCategoryDialog',

  props: {
    onSubmit: {
      type: Function,
    },
  },

  data() {
    return {
      saveError: '',
      form: {
        categoryName: '',
      },
    };
  },

  computed: {
    canCreate() {
      return hasText(this.form.categoryName);
    },
  },

  methods: {
    resetForm() {
      this.form = { categoryName: '' };
    },

    async handleSaveCategory(isActive) {
      this.saveError = '';
      try {
        await this.onSubmit({ categoryName: this.form.categoryName.trim() });
      } catch (err) {
        this.saveError = saveFailureMessage(err);
        return;
      }
      this.resetForm();
      isActive.value = false;
    },

    handleOnCancel(isActive) {
      this.saveError = '';
      this.resetForm();
      isActive.value = false;
    },
  },
};
</script>
