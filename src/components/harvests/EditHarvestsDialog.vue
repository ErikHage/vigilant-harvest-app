<template>
  <v-dialog v-model="showDialog" id="edit-harvests-dialog" max-width="800px" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">Edit Harvests</span>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="errorMessage"
                 type="error"
                 density="compact"
                 class="mb-4">{{ errorMessage }}
        </v-alert>

        <v-form ref="editHarvestsForm">
          <v-row no-gutters v-for="harvest in harvestsCopy" :key="harvest.harvestId" class="harvest-row">
            <v-col cols="5">
              <div class="d-flex flex-column align-start justify-center mr-6">
                <span class="text-success">{{ harvest.plantingName }}</span>
                <span class="smaller-text">{{ harvest.plantName }}</span>
              </div>
            </v-col>
            <v-col cols="4">
              <v-select v-model="harvest.harvestTypeId"
                        :items="harvestTypes"
                        item-title="harvestTypeName"
                        item-value="harvestTypeId"
                        label="Type"
                        density="compact"
                        variant="solo"
              ></v-select>
            </v-col>
            <v-col cols="3">
              <v-text-field v-model.number="harvest.quantity"
                            type="number"
                            label="Quantity"
                            density="compact"
                            required
              ></v-text-field>
            </v-col>

            <v-col cols="12" v-if="mergeWarning(harvest)">
              <div class="merge-warning mb-2">
                <v-icon size="small" class="mr-1">mdi-alert-outline</v-icon>{{ mergeWarning(harvest) }}
              </div>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn color="error" @click="handleCancel">Cancel</v-btn>
        <v-btn color="primary" :disabled="!canUpdate" @click="handleSubmit">Update</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import harvestUtils from "@/utils/harvest-utils";
import { isPositiveNumber } from '@/utils/form-rules';

export default {
  name: 'EditHarvestsDialog',

  props: {
    show: Boolean,
    harvests: Array,
    harvestTypes: {
      type: Array,
      default: () => [],
    },
    errorMessage: {
      type: String,
      default: '',
    },
    onSubmit: Function,
    onCancel: Function,
  },

  data() {
    return {
      harvestsCopy: [],
    };
  },

  watch: {
    harvests: {
      immediate: true,
      handler(newHarvests) {
        // copy each harvest, the originals are the same objects the page renders from
        this.harvestsCopy = newHarvests.map(harvest => ({ ...harvest }));
      },
    },
  },

  computed: {
    // the service requires each quantity to be more than nothing
    canUpdate() {
      return this.harvestsCopy.every(harvest => isPositiveNumber(harvest.quantity));
    },

    showDialog() {
      return this.show;
    },

    // the service allows at most one harvest per planting per day per type, so rows that
    // collide on that pair get folded into one and their quantities summed
    mergeGroups() {
      return this.harvestsCopy.reduce((acc, harvest) => {
        const key = `${harvest.plantingId}::${harvest.harvestTypeId}`;

        if (!acc[key]) {
          acc[key] = {count: 0, quantity: 0};
        }

        acc[key].count += 1;
        acc[key].quantity += Number(harvest.quantity) || 0;
        return acc;
      }, {});
    },
  },

  methods: {
    harvestTypeName(harvestTypeId) {
      return harvestUtils.harvestTypeNameById(this.harvestTypes, harvestTypeId);
    },

    mergeWarning(harvest) {
      const group = this.mergeGroups[`${harvest.plantingId}::${harvest.harvestTypeId}`];

      if (!group || group.count < 2) {
        return '';
      }

      const harvestTypeName = this.harvestTypeName(harvest.harvestTypeId);
      return `Same planting and type as another row. Saving combines these into one `
          + `${group.quantity} ${harvestTypeName} harvest.`;
    },

    handleCancel() {
      this.onCancel();
    },

    handleSubmit() {
      this.onSubmit(this.harvestsCopy);
    },
  }
}
</script>

<style scoped>
.smaller-text {
  font-size: 0.8rem;
  color: gray;
}

.harvest-row {
  align-items: center;
}

.merge-warning {
  font-size: 0.8rem;
  color: #b26500;
}
</style>
