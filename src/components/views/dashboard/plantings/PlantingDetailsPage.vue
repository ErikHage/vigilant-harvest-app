<template>
  <v-container>
    <v-row>
      <v-col cols="2"></v-col>
      <v-col cols="8">
        <v-row>
          <v-col cols="12" class="text-center">
            <page-title :title="title"/>
            <v-spacer></v-spacer>
<!--            TODO do some fancy v-chip stuff -->
            <h3>{{ planting.currentStatus }}</h3>
            <v-spacer></v-spacer>
            <fade-out-alert
                v-for="(alert, i) in alerts"
                :key="'alert' + i"
                :is-visible="alert.isVisible"
                :alert-type="alert.type"
                :message="alert.message"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">

            <v-card>
              <v-card-text class="text-center">
                <v-btn class="mx-1" color="primary">Comment</v-btn>

                <sow-planting-action-dialog
                    v-if="planting && showAction('Sow')"
                    class="mx-1"
                    :planting="planting"
                    :plots="plots"
                    :on-submit="savePlanting"/>

                <v-btn v-if="showAction('Delete')" class="mx-1" color="error">Delete</v-btn>
                <v-btn v-if="showAction('Transplant')" class="mx-1" color="green">Transplant</v-btn>
                <v-btn v-if="showAction('Retire')" class="mx-1" color="warning">Retire</v-btn>
              </v-card-text>
            </v-card>

            <v-card class="mt-4">
              <v-card-text>
                <v-text-field v-model="plantingId" label="Id" variant="solo" density="compact" disabled/>

                <div class="d-flex">
                  <v-text-field v-model="createdAt" label="Created At" variant="solo" density="compact" disabled/>
                  <v-text-field v-model="lastModifiedAt" label="Last Updated" variant="solo" density="compact" disabled/>
                </div>

                <div class="d-flex">
                  <v-text-field v-model="planting.seedSource" label="source" variant="solo" density="compact"/>
                  <v-text-field v-model="planting.lotNumber" label="Lot#" variant="solo" density="compact"/>
                </div>

                <div class="d-flex">
                  <v-text-field v-model="plant.friendlyName" label="Plant" variant="solo" density="compact" disabled/>
                  <v-btn class="px-1" color="black" size="small" icon="mdi-magnify" @click="navigateToPlantDetails(planting.plantId)"/>
                </div>
<!--                TODO combine plant and plot into one row-->
<!--                TODO link to plots page (once one exists)-->
                <div class="d-flex">
                  <v-text-field v-model="plotName" label="Plot" variant="solo" density="compact" disabled/>
<!--                  <v-btn v-if="plot" class="px-1" color="black" size="small" icon="mdi-magnify" @click="navigateToPlotDetails(planting.plotId)"/>-->
                </div>

                <div class="d-flex">
                  <v-text-field v-model="sowDate" label="Sow Date" variant="solo" density="compact" disabled/>
                  <v-text-field v-model="sowType" label="Sow Type" variant="solo" density="compact" disabled/>
                </div>

                <div class="d-flex">
                  <v-text-field v-model="leadTime" label="Transplant Lead Time" variant="solo" density="compact" disabled/>
                  <v-text-field v-model="transplantDate" label="Transplant Date" variant="solo" density="compact" disabled/>
                </div>

                <v-text-field v-model="numberOfPlants" label="Number of Plants" variant="solo" density="compact" disabled/>
              </v-card-text>
            </v-card>

            <v-card class="mt-4">
              <v-card-title>Notes</v-card-title>
              <v-card-text>
                <v-card
                    v-for="note in notes"
                    class="mt-2">
                  <v-card-text>
                    {{ note }}
                  </v-card-text>
                </v-card>
              </v-card-text>
            </v-card>

          </v-col>
        </v-row>
      </v-col>
      <v-col cols="2"></v-col>
    </v-row>
  </v-container>
</template>

<script>
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import PageTitle from "@/components/layout/PageTitle.vue";
import { mapActions, mapState } from "pinia";
import { usePlantingsStore, usePlantsStore, usePlotsStore } from "@/store";
import SowPlantingActionDialog from "@/components/plantings/SowPlantingActionDialog.vue";

export default {
  name: "PlantingDetailsPage",

  components: {
    SowPlantingActionDialog,
    FadeOutAlert,
    PageTitle,
  },

  data() {
    return {
      unassignedPlot: '---',
      actionMapping: {
        'INITIALIZED': ['Sow', 'Delete'],
        'INDOOR SOWN': ['Transplant'],
        'OUTDOOR SOWN': ['Retire'],
        'RETIRED': [],
      },
    };
  },

  computed: {
    ...mapState(usePlotsStore, {
      plots: 'plots',
      plotsById: 'plotsById',
      plotsAlertType: 'alertType',
      plotsAlertMessage: 'alertMessage',
      plotsAlertVisible: 'alertVisible',
    }),

    ...mapState(usePlantsStore, {
      plantsById: 'plantsById',
      plantsAlertType: 'alertType',
      plantsAlertMessage: 'alertMessage',
      plantsAlertVisible: 'alertVisible',
    }),

    ...mapState(usePlantingsStore, {
      plantingsById: 'plantingsById',
      plantingsAlertType: 'alertType',
      plantingsAlertMessage: 'alertMessage',
      plantingsAlertVisible: 'alertVisible',
    }),

    plantingId() {
      return this.$route.params.plantingId;
    },

    planting() {
      return this.plantingsById ? this.plantingsById[this.plantingId] : null;
    },

    title() {
      return this.planting?.name ?? 'Planting Details';
    },

    createdAt() {
      return this.planting ? new Date(this.planting.dateCreated).toLocaleString() : '--';
    },

    lastModifiedAt() {
      return this.planting ? new Date(this.planting.dateModified).toLocaleString() : '--';
    },

    notes() {
      return this.planting ? this.planting.notes : [];
    },

    plotName() {
      const plot = this.plotsById[this.planting.plotId];
      return plot ? plot.friendlyName : '---';
    },

    plant() {
      return this.plantsById[this.planting.plantId];
    },

    sowDate() {
      return this.planting.sowDate
          ? new Date(this.planting.sowDate).toLocaleDateString()
          : '---';
    },

    sowType() {
      return this.planting.sowType || '---';
    },

    transplantDate() {
      return this.planting.transplantDate
          ? new Date(this.planting.transplantDate).toLocaleDateString()
          : '---';
    },

    numberOfPlants() {
      return this.planting.numberTransplanted || this.planting.numberSown || '---';
    },

    leadTime() {
      return this.planting.leadTimeWeeks
          ? this.planting.leadTimeWeeks + ' weeks'
          : '---';
    },

    alerts() {
      return [
        {
          isVisible: this.plantingsAlertVisible,
          type: this.plantingsAlertType,
          message: this.plantingsAlertMessage,
        },
        {
          isVisible: this.plantsAlertVisible,
          type: this.plantsAlertType,
          message: this.plantsAlertMessage,
        },
        {
          isVisible: this.plotsAlertVisible,
          type: this.plotsAlertType,
          message: this.plotsAlertMessage,
        }
      ];
    },
  },

  methods: {
    ...mapActions(usePlotsStore, [
      'fetchPlots',
    ]),

    ...mapActions(usePlantingsStore, [
      'fetchPlantingById',
      'upsertPlanting',
    ]),

    async refreshData() {
      await this.fetchPlots();
      await this.fetchPlantingById(this.plantingId);
    },

    navigateToPlotDetails(plotId) {
      console.log('plot clicked, do something');
    },

    navigateToPlantDetails(plantId) {
      this.$router.push({
        name: 'PlantDetailsPage',
        params: {
          plantId,
        },
      });
    },

    showAction(actionName) {
      return this.actionMapping[this.planting.currentStatus].includes(actionName);
    },

    async savePlanting(planting) {
      await this.upsertPlanting(planting);
      await this.refreshData();
    },
  },

  mounted() {
    this.refreshData();
  },
}
</script>

<style scoped>

</style>