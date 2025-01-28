<template>
  <v-table>
    <tbody>
    <tr>
      <th class="details-header shrink-column">Plant Id</th>
      <td>{{ plant.plantId }}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Created At</th>
      <td>{{ createdAt }}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Last Modified At</th>
      <td>{{ lastModifiedAt }}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Tags</th>
      <td>
        <v-chip
            v-for="tag in plant.tags"
            class="mr-2"
            color="success"
        >
          {{ tag }}
        </v-chip>
      </td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Description</th>
      <td class="multiline-cell">{{ plant.description }}</td>
    </tr>
    </tbody>
  </v-table>
</template>

<script>
export default {
  name: "PlantDetailsTab",

  props: {
    plant: Object,
  },

  computed: {
    createdAt() {
      return this.plant ? new Date(this.plant.dateCreated).toLocaleString() : '--';
    },

    lastModifiedAt() {
      return this.plant ? new Date(this.plant.dateModified).toLocaleString() : '--';
    },
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