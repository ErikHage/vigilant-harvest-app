<template>
  <v-app>
    <AppBar/>
    <v-main>
      <h2 v-if="token">You have a token, yay! {{token}}</h2>
      <h2 v-else>Hmm, don't see a token</h2>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script>

import AppBar from "@/components/AppBar.vue";

export default {
  name: 'App',

  components: {
    AppBar
  },

  data: () => ({
    token: null,
  }),

  created() {
    const urlParams = new URLSearchParams(window.location.search);
    this.token = urlParams.get('session');
  }
}
</script>
