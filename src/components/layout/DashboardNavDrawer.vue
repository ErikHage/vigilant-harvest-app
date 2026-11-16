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
      <template v-for="(group, i) in visibleGroups" :key="group.heading">
        <!-- a rail has no room for headings: a divider stands between its groups -->
        <v-divider v-if="isRailShown && i > 0"/>
        <v-list-subheader v-if="!isRailShown">{{ group.heading }}</v-list-subheader>

        <v-tooltip
            v-for="page in group.pages"
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

// The drawer's groups, and each one's pages, in order. A year-specific page
// needs a planting year
const groups = [
  {
    heading: 'Planning',
    pages: [
      { title: 'Plan', icon: 'mdi-calendar-edit', path: pathTo('planning'), isYearSpecific: true },
    ],
  },
  {
    heading: 'Garden',
    pages: [
      { title: 'Overview', icon: 'mdi-sprout-outline', path: pathTo('garden'), isYearSpecific: true },
      { title: 'Plots', icon: 'mdi-vector-square', path: pathTo('plots') },
      { title: 'Plants', icon: 'mdi-leaf', path: pathTo('plants') },
      { title: 'Plantings', icon: 'mdi-shovel', path: pathTo('plantings'), isYearSpecific: true },
      { title: 'Harvests', icon: 'mdi-basket', path: pathTo('harvests'), isYearSpecific: true },
    ],
  },
  {
    heading: 'Recordkeeping',
    pages: [
      { title: 'Journal', icon: 'mdi-book-open-page-variant', path: pathTo('journal'), isYearSpecific: true },
      { title: 'Activity Log', icon: 'mdi-clipboard-list-outline', path: pathTo('activityLog'), isYearSpecific: true },
      { title: 'Stats', icon: 'mdi-chart-bar', path: pathTo('stats'), isYearSpecific: true },
    ],
  },
  {
    heading: 'Config',
    pages: [
      { title: 'Years', icon: 'mdi-calendar-range', path: pathTo('years') },
      { title: 'Categories', icon: 'mdi-shape-outline', path: pathTo('categories') },
      { title: 'Activity Schedules', icon: 'mdi-calendar-clock', path: pathTo('activitySchedules') },
    ],
  },
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

    // A group left with no pages (none of its year pages, with no year) goes, heading and all
    visibleGroups() {
      return groups
          .map(group => ({
            ...group,
            pages: group.pages.filter(page => !page.isYearSpecific || this.isPlantingYearSelected),
          }))
          .filter(group => group.pages.length > 0);
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
