<template>
  <v-dialog v-model="show" max-width="500px" persistent>
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn v-bind="activatorProps" text="Sow" color="green" @click="show = true"/>
    </template>

    <v-card>
      <v-card-title>
        <span class="headline">Sow Planting</span>
      </v-card-title>
      <v-card-text>
        <p>indoor vs outdoor</p>
        <p>plot - if outdoor</p>
        <p>number sown</p>
        <p>date sown - default today</p>
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
export default {
  name: "SowPlantingActionDialog",

  props: {
    planting: {
      type: Object,
    },
    onSubmit: {
      type: Function,
      required: true,
    },
  },

  data() {
    return {
      show: false,
    };
  },

  methods: {
    handleSubmit() {
      this.onSubmit({

      });
      this.show = false;
    },

    handleCancel() {
      this.show = false;
    },
  },
}
</script>

<style scoped>

</style>