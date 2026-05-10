<template>
  <v-dialog max-width="800px" min-height="600px" persistent>
    <template #activator="{ props }">
      <v-btn v-bind="props" color="black" size="small">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </template>

    <template #default="{ isActive }">
      <v-card>
        <v-card-title>
          <span class="headline">Manage Schedules</span>
          <div class="text-body-2 text-medium-emphasis mt-1">{{ plantName }}</div>
        </v-card-title>

        <v-card-text>
          <!-- Current schedules -->
          <div class="text-caption text-disabled text-uppercase mb-2" style="letter-spacing:.05em">
            Assigned schedules
          </div>

          <div v-if="workingSchedules.length === 0" class="text-body-2 text-disabled py-2">
            No schedules currently assigned
          </div>

          <v-list density="compact" lines="two" class="mb-4 pa-0">
            <v-list-item
                v-for="item in workingSchedules"
                :key="item.activityScheduleId"
                rounded="lg"
            >
              <template #title>
                <span :class="item.pendingRemove ? 'text-error text-decoration-line-through' : 'text-white'">
                  {{ item.name }}
                </span>
              </template>
              <template #subtitle>
                <span :class="item.pendingRemove ? 'text-error text-decoration-line-through' : ''">
                  {{ item.description }}
                </span>
              </template>
              <template #append>
                <v-btn
                    v-if="!item.pendingRemove"
                    icon
                    variant="text"
                    size="small"
                    color="error"
                    @click="markForRemoval(item)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn
                    v-else
                    icon
                    variant="text"
                    size="small"
                    @click="cancelRemoval(item)"
                >
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>

          <v-divider class="mb-4" />

          <!-- Add a schedule -->
          <div class="text-caption text-disabled text-uppercase mb-2" style="letter-spacing:.05em">
            Add a schedule
          </div>

          <div class="d-flex align-center ga-2">
            <v-select
                v-model="selectedToAdd"
                :items="addableSchedules"
                item-title="name"
                item-value="activitySchedule"
                label="Select schedule"
                density="compact"
                variant="solo"
                clearable
                return-object
                hide-details
            />
            <v-btn
                color="primary"
                size="small"
                :disabled="!selectedToAdd"
                @click="addSchedule"
            >
              Add
            </v-btn>
          </div>

          <!-- Schedules pending add -->
          <div v-if="schedulesToAdd.length > 0">
            <div class="text-caption text-disabled text-uppercase mt-3 mb-1" style="letter-spacing:.05em">
              Pending addition
            </div>
            <v-list density="compact" lines="two" class="pa-0">
              <v-list-item
                  v-for="item in schedulesToAdd"
                  :key="item.activityScheduleId"
                  rounded="lg"
              >
                <template #title>
                  <span class="text-primary">{{ item.name }}</span>
                </template>
                <template #subtitle>
                  <span class="text-primary">{{ item.description }}</span>
                </template>
                <template #append>
                  <v-btn
                      icon
                      variant="text"
                      size="small"
                      @click="cancelAdd(item)"
                  >
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </div>

        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="handleCancel(isActive)">Cancel</v-btn>
          <v-btn
              color="primary"
              text
              :disabled="schedulesToAdd.length === 0 && schedulesToRemove.length === 0"
              @click="handleSubmit(isActive)"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
import {mapActions, mapState} from "pinia";
import {useActivitySchedulesStore} from "@/store";

export default {
  name: 'ManagePlantSchedulesDialog',

  props: {
    plantName: {
      type: String,
      required: true,
    },
    assignedSchedules: {
      type: Array,
      required: true,
    },
    onSubmit: {
      type: Function,
      default: () => {},
    },
  },

  data() {
    return {
      workingSchedules: [],
      schedulesToAdd: [],
      selectedToAdd: null,
    };
  },

  computed: {
    ...mapState(useActivitySchedulesStore, {
      schedules: 'schedules',
    }),

    schedulesToRemove() {
      return this.workingSchedules.filter(s => s.pendingRemove);
    },

    assignedAndPendingIds() {
      const assignedIds = this.workingSchedules.map(s => s.activityScheduleId);
      const pendingIds  = this.schedulesToAdd.map(s => s.activityScheduleId);
      return new Set([...assignedIds, ...pendingIds]);
    },

    addableSchedules() {
      return this.schedules.filter(s => !this.assignedAndPendingIds.has(s.activityScheduleId));
    },
  },

  methods: {
    ...mapActions(useActivitySchedulesStore, [
        'fetchSchedules',
    ]),

    initState() {
      this.workingSchedules = this.assignedSchedules.map(s => ({ ...s, pendingRemove: false }));
      this.schedulesToAdd   = [];
      this.selectedToAdd    = null;
    },

    markForRemoval(item) {
      item.pendingRemove = true;
    },

    cancelRemoval(item) {
      item.pendingRemove = false;
    },

    addSchedule() {
      if (!this.selectedToAdd) return;
      this.schedulesToAdd.push({ ...this.selectedToAdd });
      this.selectedToAdd = null;
    },

    cancelAdd(item) {
      this.schedulesToAdd = this.schedulesToAdd.filter(s => s.activityScheduleId !== item.activityScheduleId);
    },

    async handleSubmit(isActive) {
      await this.onSubmit(
          this.schedulesToAdd.map(s => s.activityScheduleId),
          this.schedulesToRemove.map(s => s.activityScheduleId),
      );
      isActive.value = false;
    },

    handleCancel(isActive) {
      this.initState();
      isActive.value = false;
    },
  },

  async mounted() {
    await this.fetchSchedules();
  },

  watch: {
    assignedSchedules: {
      immediate: true,
      handler() {
        this.initState();
      },
    },
  },
};
</script>
