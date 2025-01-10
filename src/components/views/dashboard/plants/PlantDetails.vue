<template>
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
</template>

<script>
import PageTitle from "@/components/layout/PageTitle.vue";

export default {
  name: "PlantDetails",

  components: { PageTitle },

  props: {
    plant: {
      type: Object,
      required: true,
    },
  },

  computed: {
    createdAt() {
      return this.plant ? new Date(this.plant.dateCreated).toLocaleString() : '--';
    },

    lastModifiedAt() {
      return this.plant ? new Date(this.plant.dateModified).toLocaleString() : '--';
    }
  },
}
</script>