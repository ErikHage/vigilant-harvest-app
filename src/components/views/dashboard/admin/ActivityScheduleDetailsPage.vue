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
              <!--              add an edit dialog -->
              <!--              <v-btn-->
              <!--                  variant="outlined"-->
              <!--                  size="small"-->
              <!--                  prepend-icon="mdi-pencil"-->
              <!--              >-->
              <!--                Edit-->
              <!--              </v-btn>-->
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
<!--              Add item dialog -->
              <v-btn
                  color="primary"
                  size="small"
                  prepend-icon="mdi-plus"
                  :disabled="true"
                  @click="$emit('add-item')"
              >
                Add item
              </v-btn>
            </div>

            <v-table density="comfortable">
              <thead>
              <tr>
                <th>Activity</th>
                <th>Recurrence</th>
                <th>Date range</th>
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
                  <code v-if="item.recurrenceRule" class="text-caption">{{ item.recurrenceRule }}</code>
                  <span v-else class="text-disabled">—</span>
                </td>
                <td class="text-no-wrap">
                <span v-if="item.startDate || item.endDate">
                  {{ formatDate(item.startDate) }} – {{ formatDate(item.endDate) }}
                </span>
                  <span v-else class="text-disabled">—</span>
                </td>
                <td>
                  <span v-if="item.notes">{{ item.notes }}</span>
                  <span v-else class="text-disabled">—</span>
                </td>
                <td class="text-right text-no-wrap">
<!--                  add schedule item details page where we can edit -->
<!--                  <v-btn-->
<!--                      icon="mdi-pencil"-->
<!--                      variant="text"-->
<!--                      size="small"-->
<!--                      @click="$emit('edit-item', item)"-->
<!--                  />-->
                  <!--                <v-btn-->
                  <!--                    icon="mdi-delete"-->
                  <!--                    variant="text"-->
                  <!--                    size="small"-->
                  <!--                    @click="$emit('delete-item', item)"-->
                  <!--                />-->
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
import dayjs from "dayjs";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import PageTitle from "@/components/layout/PageTitle.vue";

export default {
  name: "ActivityScheduleDetailsPage",
  components: {PageTitle, FadeOutAlert},

  computed: {
    ...mapState(useActivitySchedulesStore, {
      activitySchedule: 'selectedActivitySchedule',
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
  },

  methods: {
    ...mapActions(useActivitySchedulesStore, [
      'getScheduleById',
    ]),

    async refreshData() {
      await this.getScheduleById(this.$route.params.activityScheduleId);
    },

    formatDate(dateString) {
      return dayjs.utc(dateString).format('MMM D');
    },
  },

  mounted() {
    this.refreshData();
  }
}
</script>
