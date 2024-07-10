<template>
</template>

<script>
import { mapActions, mapState } from "pinia";

import { useAuthenticationStore } from "@/store";

export default {
  name: 'LandingPage',

  computed: {
    ...mapState(useAuthenticationStore, [
      'isAuthenticated',
    ]),
  },

  methods: {
    ...mapActions(useAuthenticationStore, [
      'authenticate',
    ]),

    maybeGetSsoTokenQueryParam() {
      const urlParams = new URLSearchParams(window.location.search);
      console.log('sso query param: ', urlParams.get('sso'));
      return urlParams.get('sso');
    },

    redirectToDashboard() {
      console.log('redirecting to dashboard');
      this.$router.push('/dashboard');
    },

    redirectToApp() {
      console.log('redirecting to app');
      this.$router.push('/');
    },
  },

  async mounted() {
    const maybeSsoToken = this.maybeGetSsoTokenQueryParam();

    if (maybeSsoToken) {
      console.log('found application token');
      await this.authenticate(maybeSsoToken);

      if (this.isAuthenticated) {
        this.redirectToDashboard();
      } else {
        this.redirectToApp();
      }
    } else {
      console.log('no application token');
      this.redirectToApp();
    }
  }
}
</script>
