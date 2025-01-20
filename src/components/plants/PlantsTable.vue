<template>
  <v-card>
    <v-card-text>
      <v-data-table
          v-model:items-per-page="itemsPerPage"
          :headers="headers"
          :items="plants"
          item-key="plantId"
          class="elevation-1"
          density="compact"
      >
        <template #item.actions="{ item }">
          <v-icon small @click="onViewClicked(item)">mdi-magnify</v-icon>
          <v-icon class="pl-2" small @click="onEditClicked(item)">mdi-pencil</v-icon>
          <!-- TODO add delete button, with confirm dialog. only admin can see/use it -->
        </template>
      </v-data-table>
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
      onViewClicked: {
        type: Function,
      },
      onEditClicked: {
        type: Function,
      },
    },

    data: () => ({
      itemsPerPage: 25,
      headers: [
        { title: 'Name', key: 'friendlyName', align: 'start' },
        { title: 'Category', key: 'category' },
        { title: 'Species', key: 'taxonomy.species' },
        { title: 'Actions', key: 'actions', sortable: false },
      ],
    }),
  }
</script>

<style scoped>

</style>