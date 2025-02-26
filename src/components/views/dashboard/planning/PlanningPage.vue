<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Planning"/>
        <v-spacer></v-spacer>
        <fade-out-alert
            v-for="(alert, i) in alerts"
            :key="'alert' + i"
            :is-visible="alert.isVisible"
            :alert-type="alert.type"
            :message="alert.message"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import PageTitle from "@/components/layout/PageTitle.vue";

export default {
  name: "PlanningPage",

  components: {
    PageTitle,
    FadeOutAlert,
  },

  computed: {
    alerts() {
      return [];
    }
  },
}
</script>

<style scoped>

</style>