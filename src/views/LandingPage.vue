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

    maybeGetApplicationTokenQueryParam() {
      const urlParams = new URLSearchParams(window.location.search);
      console.log('authn query param: ', urlParams.get('authn'));
      return urlParams.get('authn');
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
    const maybeApplicationToken = this.maybeGetApplicationTokenQueryParam();

    if (maybeApplicationToken) {
      console.log('found application token');
      await this.authenticate(maybeApplicationToken);

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
