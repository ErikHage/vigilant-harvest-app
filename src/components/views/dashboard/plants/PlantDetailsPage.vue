<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title :title="plant.friendlyName"/>
        <v-spacer></v-spacer>
        <span>{{ plant.plantId }}</span>
      </v-col>
      <v-col cols="2"></v-col>
      <v-col cols="4">
        <v-card>
          <v-card-title>Taxonomy</v-card-title>
          <v-card-text>
            <v-table>
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
            <v-table>
              <tbody>
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

export default {
  name: "PlantDetailsPage",

  components: { PageTitle },

  computed: {
    ...mapState(usePlantsStore, [
      'plantsById',
    ]),

    plantId() {
      return this.$route.params.plantId;
    },

    plant() {
      return this.plantsById ? this.plantsById[this.plantId] : 'no plantsById';
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
    }
  },

  mounted() {
    this.refreshData();
  },
}
</script>