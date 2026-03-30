<template>
  <v-container v-if="schedules != null">
    <v-row>
      <v-col cols="12">

        <v-row v-if="alertVisible">
          <fade-out-alert :is-visible="alertVisible" :alert-type="alertType" :message="alertMessage"/>
        </v-row>

        <v-row class="mb-4 align-center">
          <v-col>
            <page-title title="Activity Schedules"/>
            <v-spacer></v-spacer>
            <span class="text-medium-emphasis text-body-2">
               {{ filteredSchedules.length }} of {{ schedules.length }} activity schedules
            </span>
          </v-col>
        </v-row>

        <v-card>
          <v-card-text>
            <div class="d-flex justify-space-between align-center mb-4">
              <v-text-field
                  v-model="filter"
                  prepend-inner-icon="mdi-magnify"
                  label="Filter schedules"
                  density="compact"
                  variant="solo"
                  clearable
                  hide-details
              />
              <v-spacer></v-spacer>
              <CreateScheduleDialog :on-submit="createActivitySchedule"/>
            </div>

            <v-table density="compact">
              <thead>
              <tr>
                <th style="width: 220px">Schedule Name</th>
                <th>Description</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="schedule in filteredSchedules" :key="schedule.activityScheduleId">
                <!-- TODO link name field to details page -->
                <td class="font-weight-medium">{{ schedule.name }}</td>
                <td>{{ schedule.description }}</td>
              </tr>
              <tr v-if="filteredSchedules.length === 0">
                <td colspan="3" class="text-center text-medium-emphasis py-6">No schedules found</td>
              </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import PageTitle from "@/components/layout/PageTitle.vue";
import {mapActions, mapState} from "pinia";
import {useActivitySchedulesStore} from "@/store";
import CreateScheduleDialog from "@/components/admin/schedules/CreateScheduleDialog.vue";

export default {
  name: "ActivitySchedulesPage",

  components: {
    CreateScheduleDialog,
    PageTitle,
    FadeOutAlert,
  },

  data() {
    return {
      filter: '',
    };
  },

  computed: {
    ...mapState(useActivitySchedulesStore, {
      schedules: 'schedules',
      alertType: 'alertType',
      alertMessage: 'alertMessage',
      alertVisible: 'alertVisible',
    }),

    alert() {
      return {
        isVisible: this.alertVisible,
        type: this.alertType,
        message: this.alertMessage,
      };
    },

    filteredSchedules() {
      let result = this.schedules;
      if (this.filter) {
        const upper = this.filter.toUpperCase();
        result = result.filter(s => {
          const matchString = s.name.toUpperCase() + s.description.toUpperCase();
          return matchString.includes(upper);
        });
      }
      return [...result];
    }
  },

  methods: {
    ...mapActions(useActivitySchedulesStore, [
      'fetchSchedules',
      'createSchedule',
    ]),

    async createActivitySchedule(schedule) {
      await this.createSchedule(schedule);
      await this.refreshData();
    },

    async refreshData() {
      await this.fetchSchedules();
    },
  },

  mounted() {
    this.refreshData();
  },
}
</script>

<style scoped>

</style>
