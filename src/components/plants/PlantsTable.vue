<template>
  <v-card>
    <v-card-text>
      <v-table density="compact" height="60vh">
        <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="item in filteredPlants">
          <td>{{ item.friendlyName }}</td>
          <td>{{ item.category }}</td>
          <td>
            <v-icon small @click="onViewClicked(item)">mdi-magnify</v-icon>
            <v-icon class="pl-2" small @click="onEditClicked(item)">mdi-pencil</v-icon>
          </td>
        </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script>
  export default {
    name: 'PlantsTable',

    props: {
      plants: {
        type: Array,
      },
      filter: {
        type: String,
      },
      onViewClicked: {
        type: Function,
      },
      onEditClicked: {
        type: Function,
      },
    },

    computed: {
      filteredPlants() {
        if (this.filter === null) {
          return this.plants;
        }
        return this.plants.filter(plant => {
          const matchString = plant.friendlyName.toUpperCase() + (plant.category?.toUpperCase() ?? "");

          return matchString.includes(this.filter.toUpperCase());
        });
      }
    },
  }
</script>

<style scoped>

</style>