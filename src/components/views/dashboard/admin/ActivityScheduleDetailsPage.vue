<template>
  <v-container v-if="activitySchedule != null">
    <v-row>
      <v-col cols="12">

        <v-row v-if="alertVisible">
          <fade-out-alert :is-visible="alertVisible" :alert-type="alertType" :message="alertMessage"/>
        </v-row>

        <v-row class="mb-4 align-center">
          <v-col>
            <page-title :title="activitySchedule.name"/>
          </v-col>
        </v-row>

        <v-card variant="tonal" class="mb-4">
          <v-card-text>
            <div class="d-flex align-start justify-space-between ga-4">
              <div>
                <div class="text-caption text-disabled text-uppercase" style="letter-spacing:.05em">Description</div>
                <div class="text-body-2 text-medium-emphasis">{{ activitySchedule.description }}</div>
              </div>
              <edit-schedule-dialog
                  :activity-schedule="activitySchedule"
                  :on-submit="onUpdateActivitySchedule"/>
            </div>

            <v-divider class="my-3"/>

            <div class="d-flex ga-6">
              <div>
                <div class="text-caption text-disabled text-uppercase" style="letter-spacing:.05em">Items</div>
                <div class="text-body-2 text-medium-emphasis">{{ activitySchedule.items.length }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card variant="tonal">
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-4">
              <span class="text-subtitle-1 font-weight-medium">Schedule items</span>
              <AddScheduleItemDialog
                  :activity-types="activityTypes"
                  :on-submit="onAddScheduleItem"/>
            </div>

            <v-table density="comfortable">
              <thead>
              <tr>
                <th>Activity</th>
                <th>Recurrence</th>
                <th>Date(s)</th>
                <th>Notes</th>
                <th></th>
              </tr>
              </thead>
              <tbody>
              <tr v-if="activitySchedule.items.length === 0">
                <td colspan="5" class="text-center text-medium-emphasis text-body-2 py-8">
                  No items yet — add one to get started
                </td>
              </tr>
              <tr v-for="item in activitySchedule.items" :key="item.entryId">
                <td>
                  <div class="font-weight-medium">{{ item.activityType }}</div>
                  <div v-if="item.subType" class="text-caption text-disabled">{{ item.subType }}</div>
                </td>
                <td>
                  <div v-if="item.recurrenceRule">
                    <div>{{ toRRuleString(item.recurrenceRule) }}</div>
                    <code class="text-caption text-disabled">{{ item.recurrenceRule }}</code>
                  </div>
                  <span v-else class="text-disabled">—</span>
                </td>
                <td class="text-no-wrap">
                  {{ getItemDateRange(item) }}
                </td>
                <td>
                  <span v-if="item.notes">{{ item.notes }}</span>
                  <span v-else class="text-disabled">—</span>
                </td>
                <td class="text-right text-no-wrap">
                  <div class="d-flex align-center justify-end ga-2">
                    <EditScheduleItemDialog
                        :activity-types="activityTypes"
                        :schedule-item="item"
                        :on-submit="onUpdateActivityScheduleItem"/>
                    <DeleteScheduleItemDialog
                        :schedule-item="item"
                        :on-submit="onDeleteActivityScheduleItem"/>
                  </div>
                </td>
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
import {mapActions, mapState} from "pinia";
import {useActivitySchedulesStore} from "@/store";
import { RRule } from 'rrule';
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import PageTitle from "@/components/layout/PageTitle.vue";
import AddScheduleItemDialog from "@/components/admin/schedules/AddScheduleItemDialog.vue";
import EditScheduleDialog from "@/components/admin/schedules/EditScheduleDialog.vue";
import EditScheduleItemDialog from "@/components/admin/schedules/EditScheduleItemDialog.vue";
import DeleteScheduleItemDialog from "@/components/admin/schedules/DeleteScheduleItemDialog.vue";
import scheduling from "@/utils/scheduling";

export default {
  name: "ActivityScheduleDetailsPage",

  components: {
    DeleteScheduleItemDialog,
    EditScheduleItemDialog,
    EditScheduleDialog,
    AddScheduleItemDialog,
    PageTitle,
    FadeOutAlert,
  },

  computed: {
    ...mapState(useActivitySchedulesStore, {
      activitySchedule: 'selectedActivitySchedule',
      activityTypes: 'activityTypes',
      alertType: 'alertType',
      alertMessage: 'alertMessage',
      alertVisible: 'alertVisible',
    }),

    activityScheduleId() {
      return this.$route.params.activityScheduleId;
    },

    alert() {
      return {
        isVisible: this.alertVisible,
        type: this.alertType,
        message: this.alertMessage,
      };
    },
  },

  methods: {
    ...mapActions(useActivitySchedulesStore, [
      'getScheduleById',
      'updateSchedule',
      'fetchActivityTypes',
      'addScheduleItem',
      'updateScheduleItem',
      'deleteScheduleItem',
    ]),

    async refreshData() {
      await this.getScheduleById(this.activityScheduleId);
      await this.fetchActivityTypes();
    },

    getItemDateRange(item) {
      return scheduling.getFormattedDateRange(item.startDate, item.endDate);
    },

    async onUpdateActivitySchedule(schedule) {
      await this.updateSchedule(schedule);
    },

    async onAddScheduleItem(scheduleItem) {
      await this.addScheduleItem(this.activityScheduleId, scheduleItem);
      await this.refreshData();
    },

    async onUpdateActivityScheduleItem(scheduleItem) {
      await this.updateScheduleItem(scheduleItem);
      await this.refreshData();
    },

    async onDeleteActivityScheduleItem(entryId) {
      await this.deleteScheduleItem(this.activityScheduleId, entryId);
      await this.refreshData();
    },

    toRRuleString(recurrenceRule) {
      return RRule.fromString(recurrenceRule).toText();
    },
  },

  mounted() {
    this.refreshData();
  }
}
</script>
