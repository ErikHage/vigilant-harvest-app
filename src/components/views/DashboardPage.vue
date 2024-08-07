<template>
  <v-container>
    <v-app-bar app>
      <v-btn to="/dashboard/garden">Garden</v-btn>
      <v-btn to="/dashboard/plants">Plants</v-btn>
      <v-btn to="/dashboard/plots">Plots</v-btn>
      <v-btn to="/dashboard/plantings">Plantings</v-btn>
    </v-app-bar>
    <v-row class="text-center">
      <router-view/>
    </v-row>
  </v-container>
</template>

<script>

export default {
  name: 'DashboardPage',

  methods: {},
}
</script>
