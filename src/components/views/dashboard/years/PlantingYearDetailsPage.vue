<template>
  <v-container>
    <v-row v-if="plantingYear">
      <v-col cols="12">
        <v-sheet class="pa-4">
          <v-row>
            <v-col cols="12">
              <v-card>
                <v-card-title class="text-h4 text-primary">
                  Planting Year {{ plantingYear.plantingYear }}
                </v-card-title>
              </v-card>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="6">
              <v-card>
                <v-card-subtitle class="text-uppercase">Last Frost Date</v-card-subtitle>
                <v-card-text>
                  <div class="text-h5">{{ formatDate(plantingYear.lastFrostDate) }}</div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card>
                <v-card-subtitle class="text-uppercase">Target Planting Date</v-card-subtitle>
                <v-card-text>
                  <div class="text-h5">{{ formatDate(plantingYear.targetPlantingDate) }}</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-card>
                <v-card-title class="text-h6">Planting Status</v-card-title>
                <v-card-text>
                  <v-list>
                    <v-list-item
                        v-for="(item, key) in statusItems"
                        :key="key"
                    >
                      <template v-slot:prepend>
                        <v-avatar :color="item.color" size="8"></v-avatar>
                      </template>
                      <v-list-item-title>{{ item.label }}</v-list-item-title>
                      <template v-slot:append>
                  <span class="text-h5" :style="{ color: item.color }">
                    {{ item.value }}
                  </span>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>
    </v-row>

  </v-container>
</template>

<script>
import {mapActions, mapState} from "pinia";
import {usePlantingYearsStore} from "@/store";

export default {
  name: "PlantingYearDetailsPage",

  computed: {
    ...mapState(usePlantingYearsStore, {
      plantingYear: 'plantingYear',
    }),

    year() {
      return this.$route.params.year;
    },

    statusItems() {
      return [
        {
          label: 'Created Plantings',
          value: this.plantingYear.details.createdPlantings,
          color: '#2196f3'
        },
        {
          label: 'Started Plantings',
          value: this.plantingYear.details.startedPlantings,
          color: '#ff9800'
        },
        {
          label: 'Planted Plantings',
          value: this.plantingYear.details.plantedPlantings,
          color: '#4caf50'
        },
        {
          label: 'Retired Plantings',
          value: this.plantingYear.details.retiredPlantings,
          color: '#9e9e9e'
        }
      ];
    }
  },

  methods: {
    ...mapActions(usePlantingYearsStore, [
      'fetchPlantingYear',
    ]),

    formatDate(dateString) {
      // dates in UTC, hack to get the right date
      const date = new Date(dateString);
      date.setHours(date.getHours() + 12);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  },

  mounted() {
    this.fetchPlantingYear(this.year);
  }
}
</script>
