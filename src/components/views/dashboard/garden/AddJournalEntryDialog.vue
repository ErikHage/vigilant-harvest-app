<template>
  <v-dialog v-model="show" max-width="600px" persistent>
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
          v-bind="activatorProps"
          class="mx-1"
          text="Record Entry"
          color="default"
          prepend-icon="mdi-book-open-page-variant"
          @click="show = true"
      />
    </template>

    <v-card>
      <v-card-title>
        <span class="headline">Record Journal Entry</span>
      </v-card-title>
      <v-card-text>
        <p>Entry Date</p>
        <div class="d-flex align-center">
          <date-picker-dialog-activator
              :on-submit="setDateValue"
              title="Entry Date"
              :date="entryDate"/>
          <h3 class="ml-2">{{ entryDate.toLocaleDateString() }}</h3>
        </div>
        <v-textarea
            v-model="entryText"
            class="mt-4"
            label="Journal entry..."
            rows="10"></v-textarea>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" @click="handleCancel">Cancel</v-btn>
        <v-btn color="primary" @click="handleSubmit">Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import DatePickerDialogActivator from "@/components/utils/DatePickerDialogActivator.vue";

export default {
  name: "AddJournalEntryDialog",
  components: {DatePickerDialogActivator},

  props: {
    onSubmit: {
      type: Function,
      required: true,
    },
    onCancel: {
      type: Function,
      required: true,
    },
  },

  data() {
    return {
      show: false,
      entryDate: new Date(),
      entryText: '',
    };
  },

  methods: {
    setDateValue(date) {
      this.entryDate = date;
    },

    resetData() {
      this.entryDate = new Date();
      this.entryText = '';
    },

    handleCancel() {
      this.show = false;
      this.resetData();
      this.onCancel();
    },

    async handleSubmit() {
      this.onSubmit({
        entryDate: this.entryDate,
        entry: this.entryText,
      });
      // TODO don't close until submitted successfully
      this.show = false;
      this.resetData();
    },
  },
}
</script>

<style scoped>

</style>
