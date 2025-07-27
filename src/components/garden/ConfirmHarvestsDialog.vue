<template>
  <v-dialog v-model="showDialog" max-width="800px" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">Confirm Harvests [{{ harvestDateString }}]</span>
      </v-card-title>
      <v-card-text>
        <div v-for="harvestFormRecord in newHarvests"
             :key="harvestFormRecord.plantingId">
          <div class="d-flex flex-row align-center justify-start">
            <div class="d-flex flex-column align-start justify-center mr-6">
              <span class="text-success">{{ harvestFormRecord.plantingName }}</span>
              <span class="smaller-text">{{ harvestFormRecord.plotName }}:{{ harvestFormRecord.plantName }}</span>
            </div>
            <v-chip color="yellow">+{{ harvestFormRecord.quantity }}</v-chip>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" @click="onCancel">Cancel</v-btn>
        <v-btn color="warning" @click="onBack">Back</v-btn>
        <v-btn color="primary" @click="onConfirm">Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "ConfirmHarvestsDialog",

  props: {
    show: {
      type: Boolean,
      required: true,
    },
    harvestDate: {
      type: Date,
      required: true,
    },
    harvests: {
      type: Array,
      required: true,
    },
    onConfirm: {
      type: Function,
      required: true,
    },
    onBack: {
      type: Function,
      required: true,
    },
    onCancel: {
      type: Function,
      required: true,
    },
  },

  data() {
    return {
      showDialog: false,
    };
  },

  computed: {
    newHarvests() {
      return this.harvests;
    },

    harvestDateString() {
      return this.harvestDate.toDateString();
    },
  },

  watch: {
    show: {
      immediate: true,
      handler(newVal) {
        this.showDialog = newVal;
      },
    },
  },
}
</script>

<style scoped>
.smaller-text {
  font-size: 0.8rem;
  color: gray;
}
</style>
