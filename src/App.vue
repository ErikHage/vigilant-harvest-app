<template>
  <v-app>
    <v-main>
      <VigilantHarvestApp/>
    </v-main>
  </v-app>
</template>

<script>
import VigilantHarvestApp from "@/components/VigilantHarvestApp.vue";

export default {
  name: 'App',

  components: {
    VigilantHarvestApp,
  },

  data: () => ({
    //
  }),
}
</script>
