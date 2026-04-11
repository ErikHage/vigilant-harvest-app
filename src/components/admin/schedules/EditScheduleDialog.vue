<template>
  <v-dialog max-width="500px" persistent>
    <template #activator="{ props }">
      <v-btn v-bind="props" color="primary" size="small">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </template>

    <template #default="{ isActive }">
      <v-card>
        <v-card-title>
          <span class="headline">Edit Activity Schedule</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="updateScheduleForm">
            <v-text-field
                v-model="form.activityScheduleName"
                label="Activity Schedule Name"
                density="compact"
                variant="solo"
                required
            ></v-text-field>
            <v-textarea
                v-model="form.description"
                label="Description"
                density="compact"
                variant="solo"
                required
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="handleOnCancel(isActive)">Cancel</v-btn>
          <v-btn color="primary" text :disabled="isSaveDisabled" @click="handleSaveSchedule(isActive)">Save</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
export default {
  name: 'EditScheduleDialog',

  props: {
    activitySchedule: {
      type: Object,
      required: true,
    },
    onSubmit: {
      type: Function,
    },
  },

  data() {
    return {
      form: {
        activityScheduleId: '',
        activityScheduleName: '',
        description: '',
      },
    };
  },

  computed: {
    isSaveDisabled() {
      return !this.form.activityScheduleName || !this.form.description;
    },
  },

  methods: {
    resetForm(schedule) {
      this.form.activityScheduleId = schedule.activityScheduleId;
      this.form.activityScheduleName = schedule.name;
      this.form.description = schedule.description;
    },

    async handleSaveSchedule(isActive) {
      await this.onSubmit({
        activityScheduleId: this.form.activityScheduleId,
        name: this.form.activityScheduleName.trim(),
        description: this.form.description,
      });
      isActive.value = false;
    },

    handleOnCancel(isActive) {
      isActive.value = false;
    },
  },

  watch: {
    activitySchedule: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.resetForm(newVal);
        }
      },
    },
  }
};
</script>
