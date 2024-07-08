<template>
  <v-app>
    <AppBar/>
    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script>

import { mapActions, mapState } from "pinia";

import AppBar from "@/components/AppBar.vue";

import { useAuthenticationStore } from "@/store";

export default {
  name: 'App',

  components: {
    AppBar
  },

  computed: {
    ...mapState(useAuthenticationStore, [
      'isAuthenticated',
    ]),
  },

  methods: {
    ...mapActions(useAuthenticationStore, [
      'authenticate',
    ])
  },

  async mounted() {
    // TODO check for existing token, or send to feral-auth login
  }
}
</script>
