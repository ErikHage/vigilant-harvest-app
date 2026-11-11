<template>
  <v-dialog max-width="500px" persistent>
    <template #activator="{ props }">
      <v-btn v-bind="props" color="primary" size="small">
        <v-icon left>mdi-plus</v-icon>
        Create Activity Schedule
      </v-btn>
    </template>

    <template #default="{ isActive }">
      <v-card>
        <v-card-title>
          <span class="headline">Create Activity Schedule</span>
        </v-card-title>
        <v-card-text>
          <v-alert v-if="saveError" type="error" density="compact" class="mb-4">{{ saveError }}</v-alert>
          <v-form ref="scheduleForm">
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
          <v-btn color="primary" text :disabled="isCreateDisabled" @click="handleSaveSchedule(isActive)">Create</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
import { saveFailureMessage } from '@/utils/save-failures';

export default {
  name: 'CreateScheduleDialog',

  props: {
    onSubmit: {
      type: Function,
    },
  },

  data() {
    return {
      saveError: '',
      form: {
        activityScheduleName: '',
        description: '',
      },
    };
  },

  computed: {
    isCreateDisabled() {
      return !this.form.activityScheduleName || !this.form.description;
    },
  },

  methods: {
    resetForm() {
      this.form = {
        activityScheduleName: '',
        description: '',
      };
    },

    async handleSaveSchedule(isActive) {
      this.saveError = '';
      try {
        await this.onSubmit({
          name: this.form.activityScheduleName.trim(),
          description: this.form.description,
        });
      } catch (err) {
        this.saveError = saveFailureMessage(err);
        return;
      }
      this.resetForm();
      isActive.value = false;
    },

    handleOnCancel(isActive) {
      this.saveError = '';
      this.resetForm();
      isActive.value = false;
    },
  },
};
</script>
