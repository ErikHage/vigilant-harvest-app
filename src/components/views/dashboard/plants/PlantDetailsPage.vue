<template>
  <v-container>
    <v-row v-if="alertVisible">
      <fade-out-alert :is-visible="alertVisible" :alert-type="alertType" :message="alertMessage"/>
    </v-row>

    <v-row v-if="loading" class="mt-10 d-flex justify-center">
      <v-progress-circular size="100" width="10" color="green" indeterminate/>
    </v-row>

    <v-row>
      <v-col cols="12" class="text-center">
        <page-title :title="plant.friendlyName"/>
        <v-spacer></v-spacer>
        <span>todo: category</span>
      </v-col>
      <v-col cols="2"></v-col>
      <v-col cols="4">
        <v-card>
          <v-card-title>Taxonomy</v-card-title>
          <v-card-text>
            <v-table density="compact">
              <tbody>
              <tr>
                <th>Family</th>
                <td>{{ plant.family }}</td>
              </tr>
              <tr>
                <th>Genus</th>
                <td>{{ plant.genus }}</td>
              </tr>
              <tr>
                <th>Species</th>
                <td>{{ plant.species }}</td>
              </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card>
          <v-card-title>Metadata</v-card-title>
          <v-card-text>
            <v-table density="compact">
              <tbody>
              <tr>
                <th>Id</th>
                <td>{{ plant.plantId }}</td>
              </tr>
              <tr>
                <th>Created At</th>
                <td>{{ createdAt }}</td>
              </tr>
              <tr>
                <th>Last Updated</th>
                <td>{{ lastModifiedAt }}</td>
              </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="2"></v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "pinia";
import { usePlantsStore } from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";

export default {
  name: "PlantDetailsPage",

  components: {
    FadeOutAlert,
    PageTitle,
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
      return this.plant ? new Date(this.plant.dateCreated).toLocaleString() : '--';
    },

    lastModifiedAt() {
      return this.plant ? new Date(this.plant.dateModified).toLocaleString() : '--';
    }
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