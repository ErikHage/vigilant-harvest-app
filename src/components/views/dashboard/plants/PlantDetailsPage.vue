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

              <v-card-text>
                <v-tabs-window v-model="tab">
                  <v-tabs-window-item value="details">
                    Details
                  </v-tabs-window-item>

                  <v-tabs-window-item value="taxonomy">
                    Taxonomy
                  </v-tabs-window-item>

                  <v-tabs-window-item value="sowing">
                    Sowing
                  </v-tabs-window-item>

                  <v-tabs-window-item value="planting">
                    Planting
                  </v-tabs-window-item>

                  <v-tabs-window-item value="growing">
                    Growing
                  </v-tabs-window-item>

                  <v-tabs-window-item value="harvesting">
                    Harvesting
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

export default {
  name: "PlantDetailsPage",

  components: {
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

</style>