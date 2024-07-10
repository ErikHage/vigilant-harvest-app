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
      'tokenPresent',
      'clearToken',
      'verifyToken',
    ]),
  },

  async mounted() {
    if (this.tokenPresent()) {
      this.verifyToken()
          .then(() => {
            if (this.isAuthenticated) {
              this.$router.push('/dashboard');
            } else {
              this.clearToken();
            }
          })
          .catch(() => {
            this.clearToken();
          });
    }
  }
}
</script>
