<template>
  <v-card>
    <v-card-text>
      <div>
        <v-text-field
            v-if="selectedYear != null"
            density="compact"
            disabled
        >
          <span :class="flashClass">Currently Selected: {{ selectedYear }}</span>
        </v-text-field>
      </div>
      <div class="d-flex">
        <v-btn
            class="mr-4"
            color="primary"
            :disabled="!isNewValueSelected"
            @click="handleSelectYear"
        >Set
        </v-btn>
        <v-select
            v-model="newSelectedYear"
            :items="availableYears"
            :item-title="(year) => year"
            :item-value="(year) => year"
            label="Select Planting Year"
            density="compact"
            variant="solo"
        ></v-select>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: "PlantingYearSelectCard",

  props: [
    'availableYears',
    'onSelectYearChange',
    'onSelectYearClear',
    'selectedYear',
  ],

  data() {
    return {
      newSelectedYear: this.selectedYear,
      flashClass: '',
    };
  },

  computed: {
    isNewValueSelected() {
      return this.selectedYear !== this.newSelectedYear;
    },
  },

  methods: {
    handleSelectYear() {
      this.onSelectYearChange(this.newSelectedYear);
    },

    flashGreen() {
      this.flashClass = 'flash-green';
      setTimeout(() => {
        this.flashClass = '';
      }, 500);
    },
  },

  watch: {
    selectedYear() {
      this.flashGreen();
    },
  },
}
</script>

<style scoped>
.flash-green {
  background-color: #388E3C !important;
  transition: background-color 0.2s ease-in-out;
}
</style>