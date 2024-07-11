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

    redirectAfterVerify() {
      if (this.isAuthenticated) {
        this.$router.push('/dashboard');
      } else {
        this.clearToken();
        this.$router.push('/login');
      }
    },

    redirectToLanding(ssoToken) {
      this.$router.push(`/landing?sso=${ssoToken}`);
    },

    maybeGetSsoTokenQueryParam() {
      const urlParams = new URLSearchParams(window.location.search);
      console.log('sso query param: ', urlParams.get('sso'));
      return urlParams.get('sso');
    },
  },

  async mounted() {
    const maybeSsoToken = this.maybeGetSsoTokenQueryParam()

    if (maybeSsoToken) {
      this.redirectToLanding(maybeSsoToken);
    } else {
      const isTokenPresent = this.tokenPresent();

      if (isTokenPresent) {
        try {
          await this.verifyToken();
          this.redirectAfterVerify();
        } catch (err) {
          this.clearToken();
          this.$router.push('/login');
        }
      } else {
        this.$router.push('/login');
      }
    }
  },
}
</script>
