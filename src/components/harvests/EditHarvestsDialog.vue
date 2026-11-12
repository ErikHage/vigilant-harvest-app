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
          <v-row no-gutters v-for="harvest in harvestsCopy" :key="harvest.harvestId" class="harvest-row"
                 :class="{ removed: isRemoved(harvest) }">
            <v-col cols="1">
              <v-btn
                  :icon="isRemoved(harvest) ? 'mdi-undo' : 'mdi-delete-outline'"
                  :aria-label="isRemoved(harvest) ? 'Keep' : 'Remove'"
                  variant="text"
                  size="small"
                  @click="toggleRemoved(harvest)"
              ></v-btn>
            </v-col>
            <v-col cols="4">
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
                        :disabled="isRemoved(harvest)"
              ></v-select>
            </v-col>
            <v-col cols="3">
              <v-text-field v-model.number="harvest.quantity"
                            type="number"
                            step="1"
                            label="Quantity"
                            density="compact"
                            required
                            :disabled="isRemoved(harvest)"
                            :error-messages="quantityError(harvest)"
              ></v-text-field>
            </v-col>

            <v-col cols="12" v-if="isRemoved(harvest)">
              <div class="removed-note mb-2">Removed on Update</div>
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
import { isWholeNumber } from '@/utils/form-rules';

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
      // the ids of the harvests to delete on Update
      removedIds: [],
    };
  },

  watch: {
    harvests: {
      immediate: true,
      handler(newHarvests) {
        // copy each harvest, the originals are the same objects the page renders from
        this.harvestsCopy = newHarvests.map(harvest => ({ ...harvest }));
        this.removedIds = [];
      },
    },
  },

  computed: {
    keptHarvests() {
      return this.harvestsCopy.filter(harvest => !this.isRemoved(harvest));
    },

    // each kept quantity a whole number of at least 1: the service requires
    // more than nothing, and stores whole numbers, rounding a fraction
    canUpdate() {
      return this.keptHarvests.every(harvest => isWholeNumber(harvest.quantity, 1));
    },

    showDialog() {
      return this.show;
    },

    // the service allows at most one harvest per planting per day per type, so rows that
    // collide on that pair get folded into one and their quantities summed
    mergeGroups() {
      return this.keptHarvests.reduce((acc, harvest) => {
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

    isRemoved(harvest) {
      return this.removedIds.includes(harvest.harvestId);
    },

    toggleRemoved(harvest) {
      this.removedIds = this.isRemoved(harvest)
          ? this.removedIds.filter(id => id !== harvest.harvestId)
          : [...this.removedIds, harvest.harvestId];
    },

    // a fraction is the one case worth saying why: the box takes it, and
    // Update waits
    quantityError(harvest) {
      const quantity = harvest.quantity;
      return !this.isRemoved(harvest) && typeof quantity === 'number' && quantity > 0 && !Number.isInteger(quantity)
          ? 'A whole number'
          : [];
    },

    // in the type's label, as the rest of the app shows it: none for
    // unspecified
    mergeWarning(harvest) {
      if (this.isRemoved(harvest)) {
        return '';
      }
      const group = this.mergeGroups[`${harvest.plantingId}::${harvest.harvestTypeId}`];

      if (!group || group.count < 2) {
        return '';
      }

      const total = harvestUtils.formatQuantity(group.quantity, this.harvestTypeName(harvest.harvestTypeId));
      return `Same planting and type as another row. Saving combines these into one ${total} harvest.`;
    },

    handleCancel() {
      this.onCancel();
    },

    // the harvests kept, as edited, and the ids of those removed
    handleSubmit() {
      this.onSubmit(this.keptHarvests, this.removedIds);
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

.removed .text-success,
.removed .smaller-text {
  text-decoration: line-through;
}

.removed-note {
  font-size: 0.8rem;
  color: gray;
}
</style>
