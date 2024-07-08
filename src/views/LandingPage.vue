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
    ])
  },

  async mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    console.log('urlParams.get(\'authn\')', urlParams.get('authn'));

    if (urlParams.get('authn') !== null) {
      console.log('found application token, attempting to verify');
      await this.authenticate(urlParams.get('authn'));

      if (this.isAuthenticated) {
        this.$router.push('/dashboard');
      } else {
        this.$router.push('/');
      }
    } else {
      console.log('no application token, redirecting to login');
      this.$router.push('/');
    }
  }
}
</script>
