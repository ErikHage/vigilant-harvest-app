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

        <v-textarea
            v-model="form.comment"
            class="mt-4"
            label="Comment (optional)"
            rows="4"></v-textarea>
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
      show: false,
      form: {
        comment: null,
        splits: [],
      },
    };
  },

  computed: {

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

    handleSubmit() {
      // check total counts vs existing numberSown
      this.onSubmit(plantingActions.split, this.getDataToSubmit());
      this.show = false;
      this.resetForm();
    },

    handleCancel() {
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
