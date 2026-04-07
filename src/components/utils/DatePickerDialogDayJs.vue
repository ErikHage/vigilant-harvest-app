<template>
  <v-dialog v-model="show" max-width="500px" persistent>
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
          v-bind="activatorProps"
          icon="mdi-calendar"
          color="default"
          :disabled="disabled"
          density="comfortable"
          @click="show = true"/>
    </template>

    <v-card>
      <v-card-title>
        <span class="headline">{{ title }}</span>
      </v-card-title>
      <v-card-text>
        <v-form>
          <v-date-picker
              v-model="selectedDate"
              label="Select Date"
              required
              locale="en"
              full-width
              show-adjacent-months
          ></v-date-picker>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" @click="handleOnCancel">Cancel</v-btn>
        <v-btn color="primary" @click="handleOnSubmit">Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import dayjs from 'dayjs';

export default {
  name: 'DatePickerDialogActivator',

  props: {
    title: String,
    date: [Date, Object, String], // accepts Date, dayjs object, or ISO string
    onSubmit: Function, // dayjs date consumer: (dayJsDate) => {}
    disabled: Boolean,
  },

  data() {
    return {
      show: false,
      selectedDate: this.date ? dayjs(this.date).toDate() : null,
    }
  },

  methods: {
    handleOnCancel() {
      this.show = false;
    },

    handleOnSubmit() {
      this.onSubmit(dayjs(this.selectedDate));
      this.show = false;
    },
  },
}
</script>
