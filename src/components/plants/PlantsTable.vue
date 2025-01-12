<template>
  <v-card>
    <v-card-text>
      <v-data-table
          :headers="headers"
          :items="plants"
          item-key="plantId"
          class="elevation-1"
          density="compact"
      >
        <template #item.actions="{ item }">
          <v-icon small @click="onViewClicked(item)">mdi-magnify</v-icon>
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
      plants: Array,
      onViewClicked: Function,
    },

    data: () => ({
      headers: [
        { title: 'Name', key: 'friendlyName', align: 'start' },
        { title: 'Category', key: 'category' },
        { title: 'Species', key: 'taxonomy.species' },
        { title: '', key: 'actions', sortable: false },
      ],
    }),
  }
</script>

<style scoped>

</style>