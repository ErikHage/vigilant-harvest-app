<template>
  <v-dialog max-width="500px" persistent>
    <template #activator="{ props }">
      <v-btn v-bind="props" size="small">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </template>

    <template #default="{ isActive }">
      <v-card>
        <v-card-title>
          <span class="headline">Add Subcategory</span>
        </v-card-title>
        <v-card-subtitle class="mt-1">
          Category: <strong>{{ category.categoryName }}</strong>
        </v-card-subtitle>
        <v-card-text>
          <v-alert v-if="saveError" type="error" density="compact" class="mb-4">{{ saveError }}</v-alert>
          <v-form ref="subcategoryForm">
            <v-text-field
                v-model="form.subcategoryName"
                label="Subcategory Name"
                density="compact"
                variant="solo"
                required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="handleOnCancel(isActive)">Cancel</v-btn>
          <v-btn color="primary" text :disabled="!canAdd" @click="handleSaveSubcategory(isActive)">Add</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
import { saveFailureMessage } from '@/utils/save-failures';
import { hasText } from '@/utils/form-rules';

export default {
  name: 'PlantSubcategoryAddDialog',

  props: {
    category: {
      type: Object,
      required: true,
    },
    onSubmit: {
      type: Function,
    },
  },

  data() {
    return {
      saveError: '',
      form: {
        subcategoryName: '',
      },
    };
  },

  computed: {
    canAdd() {
      return hasText(this.form.subcategoryName);
    },
  },

  methods: {
    resetForm() {
      this.form = { subcategoryName: '' };
    },

    async handleSaveSubcategory(isActive) {
      this.saveError = '';
      try {
        await this.onSubmit({
          categoryId: this.category.categoryId,
          subcategoryName: this.form.subcategoryName.trim(),
        });
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
