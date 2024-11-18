<template>
  <v-dialog v-model="showDialog" max-width="500px" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">{{ isEditMode ? 'Edit Plot' : 'Add Plot' }}</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="applicationForm">
          <v-text-field
              v-model="plotCopy.friendlyName"
              label="Name"
              required></v-text-field>
          <v-text-field
              v-model.number="plotCopy.lengthInInches"
              type="number"
              label="Length (inches)"
              required></v-text-field>
          <v-text-field
              v-model.number="plotCopy.widthInInches"
              type="number"
              label="Width (inches)"
              required></v-text-field>
          <v-select
              v-model="plotCopy.plotType"
              :items="plotTypes"
              item-title="item"
              item-value="item"
              label="Plot Type"
              variant="solo"
              return-object
          ></v-select>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="handleOnCancel">Cancel</v-btn>
        <v-btn v-if="isEditMode" color="blue darken-1" text @click="handleSavePlot">Update</v-btn>
        <v-btn v-else color="blue darken-1" text @click="handleSavePlot">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'UpsertPlotDialog',

  props: {
    show: Boolean,
    plot: Object,
    onSubmit: Function,
    onCancel: Function,
  },

  data() {
    return {
      plotCopy: {
        plotId: '',
        friendlyName: '',
        lengthInInches: 0,
        widthInInches: 0,
        plotType: '',
        isActive: false,
      },
      plotTypes: [
        'Bed',
        'Raised Bed',
        'Planter',
        'Tree',
      ],
    };
  },

  watch: {
    plot: {
      immediate: true,
      handler(newPlot) {
        if (newPlot !== null) {
          this.plotCopy = { ...newPlot };
        } else {
          this.resetForm();
        }
      },
    },
  },

  computed: {
    showDialog() {
      return this.show;
    },

    isEditMode() {
      return this.plot !== null;
    }
  },

  methods: {
    resetForm() {
      this.plotCopy = {
        plotId: '',
        friendlyName: '',
        lengthInInches: 0,
        widthInInches: 0,
        plotType: '',
        isActive: false,
      };
    },

    async handleSavePlot() {
      await this.onSubmit(this.plotCopy);
      this.resetForm()
    },

    handleOnCancel() {
      this.resetForm();
      this.onCancel();
    },
  },
}
</script>

<style scoped>

</style>