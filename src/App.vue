<template>
  <v-app>
    <AppBar/>
    <v-main>
      <h2 v-if="sessionId">You have a sessionId, yay! {{sessionId}}</h2>
      <h2 v-else>Hmm, don't see a sessionId</h2>
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
    sessionId: null,
  }),

  created() {
    const urlParams = new URLSearchParams(window.location.search);
    this.sessionId = urlParams.get('sessionId');
  }
}
</script>
