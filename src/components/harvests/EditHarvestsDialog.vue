<template>
  <v-dialog v-model="showDialog" id="edit-harvests-dialog" max-width="800px" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">Edit Harvests</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="editHarvestsForm">
          <v-row no-gutters v-for="harvest in harvestsCopy" :key="harvest.harvestId">
            <v-col cols="9">
              <div class="d-flex flex-row align-center justify-start">
                <div class="d-flex flex-column align-start justify-center mr-6">
                  <span class="text-success">{{ harvest.plantingName }}</span>
                  <span class="smaller-text">{{ harvest.plantName }}</span>
                </div>
              </div>
            </v-col>
            <v-col cols="3">
              <v-text-field v-model.number="harvest.quantity"
                            type="number"
                            label="Quantity"
                            required
              ></v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn color="error" @click="handleCancel">Cancel</v-btn>
        <v-btn color="primary" @click="handleSubmit">Update</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'EditHarvestsDialog',

  props: {
    show: Boolean,
    harvests: Array,
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
        this.harvestsCopy = [...newHarvests];
      },
    },
  },

  computed: {
    showDialog() {
      return this.show;
    },
  },

  methods: {
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
</style>
