<template>
  <v-app>
    <AppBar/>
    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>

import { mapActions, mapState } from "pinia";

import AppBar from "@/components/layout/AppBar.vue";

import { useAuthenticationStore } from "@/store";

export default {
  name: 'App',

  components: {
    AppBar
  },
}
</script>
