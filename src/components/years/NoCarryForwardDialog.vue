<template>
  <v-dialog v-model="showDialog" max-width="600px" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">Carry nothing forward?</span>
      </v-card-title>
      <v-card-text>
        <v-alert type="warning" variant="tonal" class="mb-4">
          No plantings will be carried into {{ plantingYear }}. Perennials planted in earlier years won't appear in it.
        </v-alert>
        <p class="mb-4">Type <strong>{{ phrase }}</strong> to create the year anyway.</p>
        <v-text-field
            v-model="typed"
            label="Confirmation"
            variant="solo"
            density="compact"
            autocomplete="off"/>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" @click="onCancel">Cancel</v-btn>
        <v-btn color="warning" :disabled="!confirmed" @click="onConfirm">Create without plantings</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
// Typed exactly: case and spaces count, so it can't be confirmed in passing
export const NO_CARRY_FORWARD_PHRASE = 'carry nothing forward';

export default {
  name: "NoCarryForwardDialog",

  props: {
    show: {
      type: Boolean,
      required: true,
    },
    plantingYear: {
      type: Number,
      default: null,
    },
    onConfirm: {
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
      showDialog: false,
      typed: '',
      phrase: NO_CARRY_FORWARD_PHRASE,
    };
  },

  computed: {
    confirmed() {
      return this.typed === NO_CARRY_FORWARD_PHRASE;
    },
  },

  watch: {
    show: {
      immediate: true,
      handler(newVal) {
        this.showDialog = newVal;
        // each opening starts empty
        if (newVal) {
          this.typed = '';
        }
      },
    },
  },
}
</script>
