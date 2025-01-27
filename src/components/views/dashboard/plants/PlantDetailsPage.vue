<template>
  <v-container>
    <v-row>
      <v-col cols="2"></v-col>
      <v-col cols="8">

        <v-row v-if="alertVisible">
          <fade-out-alert :is-visible="alertVisible" :alert-type="alertType" :message="alertMessage"/>
        </v-row>

        <v-row v-if="loading" class="mt-10 d-flex justify-center">
          <v-progress-circular size="100" width="10" color="green" indeterminate/>
        </v-row>

        <v-row>
          <v-col cols="12" class="text-center">
            <page-title :title="plant.friendlyName"/>
            <v-spacer/>
            <span>{{ plant.category }}</span>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-card>
              <v-tabs
                  v-model="tab"
                  align-tabs="center"
                  fixed-tabs
              >
                <v-tab value="details">Details</v-tab>
                <v-tab value="taxonomy">Taxonomy</v-tab>
                <v-tab value="sowing">Sowing</v-tab>
                <v-tab value="planting">Planting</v-tab>
                <v-tab value="growing">Growing</v-tab>
                <v-tab value="harvesting">Harvesting</v-tab>
              </v-tabs>

              <v-card-text class="mt-5">
                <v-tabs-window v-model="tab">
                  <v-tabs-window-item value="details">
                    <plant-details-tab :plant="plant"/>
                  </v-tabs-window-item>

                  <v-tabs-window-item value="taxonomy">
                    <plant-taxonomy-tab :plant="plant"/>
                  </v-tabs-window-item>

                  <v-tabs-window-item value="sowing">
                    <v-table>
                      <tbody>
                      <tr>
                        <th class="details-header shrink-column">Indoors</th>
                        <td>{{ plant.sowing.indoor }}</td>
                      </tr>
                      <tr>
                        <th class="details-header shrink-column">Direct</th>
                        <td>{{ plant.sowing.direct}}</td>
                      </tr>
                      <tr>
                        <th class="details-header shrink-column">Germination Time</th>
                        <td>{{ plant.sowing.germinationDaysRange }}</td>
                      </tr>
                      <tr>
                        <th class="details-header shrink-column">Germination Temperature</th>
                        <td>{{ plant.sowing.germinationTempRange }}</td>
                      </tr>
                      </tbody>
                    </v-table>
                  </v-tabs-window-item>

                  <v-tabs-window-item value="planting">
                    <v-table>
                      <tbody>
                      <tr>
                        <th class="details-header shrink-column">Planting Depth</th>
                        <td>{{ plant.planting.depthInInches }}</td>
                      </tr>
                      <tr>
                        <th class="details-header shrink-column">Plant Spacing (in)</th>
                        <td>{{ plant.planting.plantSpacingInches}}</td>
                      </tr>
                      <tr>
                        <th class="details-header shrink-column">Row Spacing (in)</th>
                        <td>{{ plant.planting.rowSpacingInches }}</td>
                      </tr>
                      <tr>
                        <th class="details-header shrink-column">Instructions</th>
                        <td>{{ plant.planting.instructions }}</td>
                      </tr>
                      </tbody>
                    </v-table>
                  </v-tabs-window-item>

                  <v-tabs-window-item value="growing">
                    <v-table>
                      <tbody>
                      <tr>
                        <th class="details-header shrink-column">Sun</th>
                        <td>{{ plant.growing.requiredSun }}</td>
                      </tr>
                      <tr>
                        <th class="details-header shrink-column">Days to Maturity</th>
                        <td>{{ plant.growing.daysToMaturity}}</td>
                      </tr>
                      <tr>
                        <th class="details-header shrink-column">Climbing</th>
                        <td>{{ plant.growing.isClimbing }}</td>
                      </tr>
                      <tr v-if="plant.growing.isClimbing">
                        <th class="details-header shrink-column">Climbing Height</th>
                        <td>{{ plant.growing.climbingHeightFeet }}</td>
                      </tr>
                      <tr>
                        <th class="details-header shrink-column">Mature Size</th>
                        <td>{{ plant.growing.plantSize }}</td>
                      </tr>
                      </tbody>
                    </v-table>
                  </v-tabs-window-item>

                  <v-tabs-window-item value="harvesting">
                    <v-table>
                      <tbody>
                      <tr>
                        <th class="details-header shrink-column">Fruit Size</th>
                        <td>{{ plant.harvesting.fruitSize }}</td>
                      </tr>
                      <tr>
                        <th class="details-header shrink-column">Shelf Stability</th>
                        <td>{{ plant.harvesting.shelfStability}}</td>
                      </tr>
                      <tr>
                        <th class="details-header shrink-column">Instructions</th>
                        <td>{{ plant.harvesting.harvestInstructions }}</td>
                      </tr>
                      </tbody>
                    </v-table>
                  </v-tabs-window-item>
                </v-tabs-window>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import PageTitle from "@/components/layout/PageTitle.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import { mapActions, mapState } from "pinia";
import { usePlantsStore } from "@/store";
import PlantDetailsTab from "@/components/plants/PlantDetailsTab.vue";
import PlantTaxonomyTab from "@/components/plants/PlantTaxonomyTab.vue";

export default {
  name: "PlantDetailsPage",

  components: {
    PlantTaxonomyTab,
    PlantDetailsTab,
    FadeOutAlert,
    PageTitle,
  },

  data() {
    return {
      tab: null,
    };
  },

  computed: {
    ...mapState(usePlantsStore, [
      'plantsById',
      'loading',
      'alertVisible',
      'alertType',
      'alertMessage',
    ]),

    plantId() {
      return this.$route.params.plantId;
    },

    plant() {
      return this.plantsById ? this.plantsById[this.plantId] : null;
    },

    createdAt() {
      return this.plantCopy ? new Date(this.plantCopy.dateCreated).toLocaleString() : '--';
    },

    lastModifiedAt() {
      return this.plantCopy ? new Date(this.plantCopy.dateModified).toLocaleString() : '--';
    },
  },

  methods: {
    ...mapActions(usePlantsStore, [
      'fetchPlantById',
    ]),

    async refreshData() {
      await this.fetchPlantById(this.plantId);
    },
  },

  mounted() {
    this.refreshData();
  },
}
</script>

<style scoped>
.details-header {
  font-weight: bold;
}
.shrink-column {
  white-space: nowrap;
  width: 1%;
}
.multiline-cell {
  white-space: pre;
}
</style>