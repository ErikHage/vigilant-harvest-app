<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
          <h2>Plants</h2>
      </v-col>

      <v-col cols="12">
        <v-card>
          <v-card-title>
            <span class="headline">Manage Plants</span>
            <v-spacer></v-spacer>
<!--            <v-btn class="mr-2" color="primary" @click="openDialog()">Add</v-btn>-->
            <v-btn color="primary" @click="refreshData()">Refresh</v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
                :headers="headers"
                :items="tempPlantData"
                item-key="applicationId"
                class="elevation-1"
            >
              <template #item.actions="{ item }">
                <v-icon small>mdi-pencil</v-icon>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

function getPlant(id, name) {
  return {
    plantId: id,
    family: 'something',
    genus: 'something',
    species: 'something',
    friendlyName: name,
  };
}

export default {
  name: 'PlantsPage',

  components: {

  },

  data: () => ({
    tempPlantData: [
        getPlant('1', 'a'),
        getPlant('2', 'b'),
        getPlant('3', 'c'),
        getPlant('4', 'd'),
        getPlant('5', 'e'),
        getPlant('6', 'f'),
    ],
    headers: [
      // { title: 'Id', key: 'plantId' }, // don't need to show this on table, maybe not the taxonomy either
      { title: 'Name', key: 'friendlyName' },
      { title: 'Family', key: 'family' },
      { title: 'Genus', key: 'genus' },
      { title: 'Species', key: 'species' },
      { title: 'Actions', key: 'actions', sortable: false },
    ],
  }),

  computed: {

  },

  methods: {
    async refreshData() {
      // load plants
    }
  },

  mounted() {
    this.refreshData();
  }
}
</script>
