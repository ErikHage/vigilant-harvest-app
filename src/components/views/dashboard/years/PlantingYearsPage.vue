<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Manage Planting Years"/>
        <v-spacer></v-spacer>
        <fade-out-alert
            v-for="(alert, i) in alerts"
            :key="'alert' + i"
            :is-visible="alert.isVisible"
            :alert-type="alert.type"
            :message="alert.message"
        />
      </v-col>
      <v-col cols="12">
        <v-sheet class="pa-4">
          <div class="d-flex justify-end">
            <v-btn class="mx-4" color="primary" @click="navigateToAddPlantingYearPage">Add Year</v-btn>
          </div>

          <plantings-years-table
              :plantingYears="plantingYears"
              :on-view-clicked="navigateToPlantingYearDetails"
          />
        </v-sheet>
      </v-col>
    </v-row>

  </v-container>
</template>


<script>
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import PageTitle from "@/components/layout/PageTitle.vue";
import PlantingsYearsTable from "@/components/years/PlantingYearsTable.vue";
import {mapActions, mapState} from "pinia";
import {useCommonStore, usePlantingYearsStore} from "@/store";
import {views} from "@/utils/constants";
import {pl} from "vuetify/locale";

export default {
  name: "PlantingYearsPage",

  components: {
    PlantingsYearsTable,
    PageTitle,
    FadeOutAlert,
  },

  data() {
    return {};
  },

  computed: {
    ...mapState(usePlantingYearsStore, {
      plantingYears: 'plantingYears',
    }),

    alerts() {

    },
  },

  methods: {
    ...mapActions(usePlantingYearsStore, [
      'fetchPlantingYears',
    ]),

    navigateToAddPlantingYearPage() {
      this.$router.push({
        name: views.dashboard.children.years.add.name,
      });
    },

    navigateToPlantingYearDetails(plantingYear) {
      this.$router.push({
        name: views.dashboard.children.years.details.name,
        params: {
          year: plantingYear.plantingYear,
        },
      });
    },
  },

  mounted() {
    this.fetchPlantingYears();
  }
}
</script>

<style scoped>

</style>
