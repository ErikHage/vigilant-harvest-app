<template>
  <!-- permanent and temporary are set outright: Vuetify's own guess at mobile starts below lg, not md -->
  <v-navigation-drawer
      :model-value="isOpen"
      :permanent="!isPhone"
      :temporary="isPhone"
      :rail="isRailShown"
      @update:model-value="updateOpen"
  >
    <v-list nav density="compact">
      <template v-for="section in sections" :key="section.heading || 'pages'">
        <template v-if="section.heading">
          <v-divider v-if="isRailShown"/>
          <v-list-subheader v-else>{{ section.heading }}</v-list-subheader>
        </template>

        <v-tooltip
            v-for="page in section.pages"
            :key="page.path"
            :text="page.title"
            :disabled="!isRailShown"
            location="end"
        >
          <template #activator="{ props }">
            <v-list-item
                v-bind="props"
                :to="page.path"
                :prepend-icon="page.icon"
                :title="page.title"
            />
          </template>
        </v-tooltip>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
import { mapActions, mapState } from "pinia";
import { useNavigationStore } from "@/store/navigation";
import { views } from "@/utils/constants";

const pathTo = child => views.dashboard.path + "/" + views.dashboard.children[child].path;

// Each page, in the drawer's order. A year-specific page needs a planting year
const pages = [
  { title: 'Planning', icon: 'mdi-calendar-edit', path: pathTo('planning'), isYearSpecific: true },
  { title: 'Garden', icon: 'mdi-sprout-outline', path: pathTo('garden'), isYearSpecific: true },
  { title: 'Plants', icon: 'mdi-leaf', path: pathTo('plants') },
  { title: 'Plots', icon: 'mdi-vector-square', path: pathTo('plots') },
  { title: 'Years', icon: 'mdi-calendar-range', path: pathTo('years') },
  { title: 'Plantings', icon: 'mdi-shovel', path: pathTo('plantings'), isYearSpecific: true },
  { title: 'Harvests', icon: 'mdi-basket', path: pathTo('harvests'), isYearSpecific: true },
  { title: 'Stats', icon: 'mdi-chart-bar', path: pathTo('stats'), isYearSpecific: true },
];

const adminPages = [
  { title: 'Categories', icon: 'mdi-shape-outline', path: pathTo('categories') },
  { title: 'Activity Schedules', icon: 'mdi-calendar-clock', path: pathTo('activitySchedules') },
];

export default {
  name: "DashboardNavDrawer",

  props: {
    isPlantingYearSelected: {
      type: Boolean,
      required: true,
    },
  },

  computed: {
    ...mapState(useNavigationStore, [
      'isRail',
      'isOpenOnPhone',
    ]),

    isPhone() {
      return this.$vuetify.display.smAndDown;
    },

    // Elsewhere the drawer is always there, expanded or as a rail
    isOpen() {
      return this.isPhone ? this.isOpenOnPhone : true;
    },

    isRailShown() {
      return !this.isPhone && this.isRail;
    },

    sections() {
      return [
        { heading: null, pages: pages.filter(page => !page.isYearSpecific || this.isPlantingYearSelected) },
        { heading: 'Admin', pages: adminPages },
      ];
    },
  },

  methods: {
    ...mapActions(useNavigationStore, [
      'setOpenOnPhone',
    ]),

    // A phone's drawer closes on a click outside it, and on leaving the page
    updateOpen(isOpen) {
      if (this.isPhone) {
        this.setOpenOnPhone(isOpen);
      }
    },
  },
}
</script>
