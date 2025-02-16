<template>
  <v-container>
    <v-row>
      <v-col cols="2"></v-col>
      <v-col cols="8">
        <v-row>
          <v-col cols="12" class="text-center">
            <page-title :title="title"/>
            <v-spacer/>
            <span>Planting</span>
            <v-spacer/>
            <fade-out-alert :is-visible="alertVisible" :alert-type="alertType" :message="alertMessage"/>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">

            <v-card>
              <v-card-text>
                <v-text-field v-model="plantingId" label="Id" variant="solo" density="compact" disabled/>
                <v-text-field v-model="createdAt" label="Created At" variant="solo" density="compact" disabled/>
                <v-text-field v-model="lastModifiedAt" label="Last Updated" variant="solo" density="compact" disabled/>
                <v-text-field v-model.number="planting.numPlants" type="number" label="Number of Plants" variant="solo" density="compact"/>

                <div class="d-flex">
                  <v-text-field v-model="planting.seedSource" label="source" variant="solo" density="compact"/>
                  <v-text-field v-model="planting.lotNumber" label="Lot#" variant="solo" density="compact"/>
                </div>

<!--                TODO hydrate name and link to plots page (once one exists)-->
                <div class="d-flex">
                  <v-text-field v-model="planting.plotId" label="Plot" variant="solo" density="compact" disabled/>
<!--                  <v-btn-->
<!--                      class="px-1"-->
<!--                      color="black"-->
<!--                      @click="navigateToPlotDetails(planting.plotId)"-->
<!--                  ><v-icon>mdi-magnify</v-icon></v-btn>-->
                </div>
<!--                TODO hydrate name and link to plant details page-->
                <div class="d-flex">
                  <v-text-field v-model="planting.plantId" label="Plant" variant="solo" density="compact" disabled />
                  <v-btn
                      class="px-1"
                      color="black"
                      @click.stop="navigateToPlantDetails(planting.plantId)"
                      :disabled="false"
                  ><v-icon>mdi-magnify</v-icon></v-btn>
                </div>
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
import { usePlantingsStore } from "@/store";

export default {
  name: "PlantingDetailsPage",

  components: {
    FadeOutAlert,
    PageTitle,
  },

  computed: {
    ...mapState(usePlantingsStore, {
      plantingsById: 'plantingsById',
      alertType: 'alertType',
      alertMessage: 'alertMessage',
      alertVisible: 'alertVisible',
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
    }
  },

  methods: {
    ...mapActions(usePlantingsStore, [
        'fetchPlantingById',
    ]),

    async refreshData() {
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
  },

  mounted() {
    this.refreshData();
  },
}
</script>

<style scoped>

</style>