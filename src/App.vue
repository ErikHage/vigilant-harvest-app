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

  data: () => ({
    token: null,
  }),

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
    const urlParams = new URLSearchParams(window.location.search);
    this.token = urlParams.get('authn');

    await this.authenticate(this.token);

    if (this.isAuthenticated) {
      this.$router.push('/dashboard');
    } else {
      // send to feral-auth login with a redirect app id for this app
    }
  }
}
</script>
