<template>
  <v-dialog v-model="show" max-width="600px" persistent>
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn v-bind="activatorProps" class="mx-1" text="Split" color="warning" @click="show = true"/>
    </template>

    <v-card>
      <v-card-title>
        <span class="headline">Split Planting</span>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="saveError" type="error" density="compact" class="mb-4">{{ saveError }}</v-alert>
        <div class="d-flex justify-space-between mb-2">
          <h3>Splits: </h3>
          <v-btn
              color="blue"
              @click="addSplit">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>
        <template v-for="(split, index) in form.splits" :key="index">
          <v-row dense class="mt-1">
            <v-col cols="9">
              <v-text-field
                  v-model="split.name"
                  label="Name"
                  density="compact"
                  hide-details
                  :placeholder="`Split ${index + 1} name`"
              />
            </v-col>
            <v-col cols="3">
              <v-text-field
                  v-model.number="split.count"
                  label="Count"
                  type="number"
                  density="compact"
                  hide-details
                  :placeholder="`Count`"
              />
            </v-col>
          </v-row>
        </template>

        <p v-if="splitsTotalTooMany" class="text-error mt-2">
          The splits total {{ splitsTotal }}, more than the {{ planting.numberSown }} sown.
        </p>

        <v-textarea
            v-model="form.comment"
            class="mt-4"
            label="Comment (optional)"
            rows="4"></v-textarea>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" @click="handleCancel">Cancel</v-btn>
        <v-btn color="primary" :disabled="!canConfirm" @click="handleSubmit">Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { saveFailureMessage } from '@/utils/save-failures';
import plantingUtils from '../../utils/plantings';
import { hasText, isWholeNumber } from '@/utils/form-rules';

const { plantingActions } = plantingUtils;

export default {
  name: "SplitPlantingActionDialog",

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
      form: {
        comment: null,
        splits: [],
      },
    };
  },

  computed: {
    splitsTotal() {
      return this.form.splits.reduce((total, split) => total + (Number(split.count) || 0), 0);
    },

    // what was sown is the most the splits can take; with nothing recorded, the service checks
    splitsTotalTooMany() {
      const sown = this.planting?.numberSown;
      return Number.isInteger(sown) && this.splitsTotal > sown;
    },

    // at least one split, each named, of at least one plant, and no more than were sown
    canConfirm() {
      return this.form.splits.length > 0
          && this.form.splits.every(split => hasText(split.name) && isWholeNumber(split.count, 1))
          && !this.splitsTotalTooMany;
    },


  },

  methods: {
    addSplit() {
      this.form.splits.push({
        name: '',
        count: 0,
      })
    },

    getDataToSubmit() {
      return {
        sourcePlantingId: this.planting.plantingId,
        comment: this.form.comment,
        splits: this.form.splits,
      };
    },

    async handleSubmit() {
      this.saveError = '';
      try {
        await this.onSubmit(plantingActions.split, this.getDataToSubmit());
      } catch (err) {
        this.saveError = saveFailureMessage(err);
        return;
      }
      this.show = false;
      this.resetForm();
    },

    handleCancel() {
      this.saveError = '';
      this.show = false;
      this.resetForm();
    },

    resetForm() {
      this.form = {
        comment: null,
        splits: [],
      }
    },
  },
}
</script>
