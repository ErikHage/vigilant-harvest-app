<template>
  <v-dialog v-model="showDialog" max-width="800px" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">Add Plant</span>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="saveError" type="error" density="compact" class="mb-4">{{ saveError }}</v-alert>
        <v-form ref="applicationForm">
          <v-text-field v-model="form.friendlyName" label="Name" density="compact" required></v-text-field>
          <v-select
              v-model="form.category"
              :items="categories"
              item-title="categoryName"
              item-value="categoryId"
              label="Category"
              density="compact"
              variant="solo"
              return-object
              @update:model-value="clearSubcategory"
          ></v-select>
          <v-select
              v-model="form.subcategoryId"
              :items="subcategories"
              item-title="subcategoryName"
              item-value="subcategoryId"
              label="Subcategory"
              density="compact"
              variant="solo"
              :disabled="form.category == null"
          ></v-select>
          <v-select
              v-model="form.lifespanType"
              :items="lifespanTypes"
              :item-title="(lifespanType) => lifespanType"
              :item-value="(lifespanType) => lifespanType"
              label="Lifespan Type"
              density="compact"
              variant="solo"
          ></v-select>
          <v-select
              v-model="form.defaultHarvestTypeId"
              :items="harvestTypes"
              item-title="harvestTypeName"
              item-value="harvestTypeId"
              label="Default Harvest Type"
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
import { saveFailureMessage } from '@/utils/save-failures';
import harvestUtils from "@/utils/harvest-utils";

export default {
  name: 'AddPlantDialog',

  props: {
    show: {
      type: Boolean,
      required: true,
    },
    categories: {
      type: Array,
      default: () => [],
    },
    harvestTypes: {
      type: Array,
      default: () => [],
    },
    onSubmit: {
      type: Function,
    },
    onCancel: {
      type: Function,
    },
  },

  data() {
    return {
      saveError: '',
      form: {
        category: null,
        subcategoryId: null,
        friendlyName: '',
        lifespanType: null,
        description: '',
        defaultHarvestTypeId: harvestUtils.unspecifiedHarvestTypeId,
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

    subcategories() {
      if (this.form.category != null) {
        return this.form.category.subcategories;
      }
      return [];
    }
  },

  methods: {
    clearSubcategory() {
      this.form.subcategoryId = null;
    },

    resetForm() {
      this.form = {
        category: null,
        subcategoryId: null,
        friendlyName: '',
        lifespanType: null,
        description: '',
        defaultHarvestTypeId: harvestUtils.unspecifiedHarvestTypeId,
      };
    },

    async handleSavePlant() {
      this.saveError = '';
      try {
        await this.onSubmit({
          subcategoryId: this.form.subcategoryId,
          friendlyName: this.form.friendlyName,
          lifespanType: this.form.lifespanType,
          description: this.form.description,
          harvesting: {
            defaultHarvestTypeId: this.form.defaultHarvestTypeId ?? harvestUtils.unspecifiedHarvestTypeId,
          },
        });
      } catch (err) {
        this.saveError = saveFailureMessage(err);
        return;
      }
      this.resetForm();
    },

    handleOnCancel() {
      this.saveError = '';
      this.resetForm();
      this.onCancel();
    },
  },
}
</script>
