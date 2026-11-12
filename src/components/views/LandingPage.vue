<template>
</template>

<script>
import { mapActions, mapState } from "pinia";

import { useAuthenticationStore } from "@/store";
import { views } from "@/utils/constants";
import { takeDestination } from "@/utils/sign-on-destination";

export default {
  name: 'LandingPage',

  data() {
    return {
      ssoToken: null,
    };
  },

  computed: {
    ...mapState(useAuthenticationStore, {
      isAuthenticated: 'isAuthenticated',
    }),
  },

  methods: {
    ...mapActions(useAuthenticationStore, [
      'authenticate',
    ]),

    maybeGetSsoTokenQueryParam() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('sso');
    },

    // where the guard found them going, if anywhere
    redirectToDashboard() {
      console.log('redirecting to dashboard');
      this.$router.push(takeDestination() ?? views.dashboard.path);
    },

    redirectToLogin() {
      console.log('redirecting to login');
      this.$router.push(views.login.path);
    },
  },

  async mounted() {
    this.ssoToken = this.maybeGetSsoTokenQueryParam();

    if (this.ssoToken) {
      console.log('found sso token');
      await this.authenticate(this.ssoToken);

      if (this.isAuthenticated) {
        this.redirectToDashboard();
      } else {
        this.redirectToLogin();
      }
    } else {
      console.log('no sso token');
      this.redirectToLogin();
    }
  }
}
</script>
