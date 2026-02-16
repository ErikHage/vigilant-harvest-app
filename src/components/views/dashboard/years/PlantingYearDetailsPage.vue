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
                  <div class="text-h5">{{ formatDateString(plantingYear.lastFrostDate) }}</div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card>
                <v-card-subtitle class="text-uppercase">Target Planting Date</v-card-subtitle>
                <v-card-text>
                  <div class="text-h5">{{ formatDateString(plantingYear.targetPlantingDate) }}</div>
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
import {usePlantingsStore, usePlantingYearsStore} from "@/store";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export default {
  name: "PlantingYearDetailsPage",

  computed: {
    ...mapState(usePlantingYearsStore, {
      plantingYear: 'plantingYear',
    }),

    ...mapState(usePlantingsStore, {
      plantings: 'plantings',
    }),

    year() {
      return this.$route.params.year;
    },

    plantingsCounts() {
      return this.plantings.reduce((acc, { currentStatus }) => {
        acc[currentStatus] = (acc[currentStatus] ?? 0) + 1
        return acc
      }, {})
    },

    statusItems() {
      return [
        {
          label: 'Created Plantings',
          value: this.plantingsCounts["CREATED"] ?? 0,
          color: '#2196f3'
        },
        {
          label: 'Started Plantings',
          value: this.plantingsCounts["STARTED"] ?? 0,
          color: '#ff9800'
        },
        {
          label: 'Planted Plantings',
          value: this.plantingsCounts["PLANTED"] ?? 0,
          color: '#4caf50'
        },
        {
          label: 'Retired Plantings',
          value: this.plantingsCounts["RETIRED"] ?? 0,
          color: '#9e9e9e'
        }
      ];
    }
  },

  methods: {
    ...mapActions(usePlantingYearsStore, [
      'fetchPlantingYear',
    ]),

    ...mapActions(usePlantingsStore, [
      'fetchPlantingsByYear',
    ]),

    formatDateString(dateString) {
      return dayjs.utc(dateString).format('MMM D');
    },
  },

  mounted() {
    this.fetchPlantingYear(this.year);
    this.fetchPlantingsByYear(this.year);
  }
}
</script>
