<template>
  <v-dialog v-model="show" max-width="50vw" persistent>
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
          v-bind="activatorProps"
          class="py-1 px-2"
          size="xs"
          color="black"
          @click="show = true"
      ><v-icon>mdi-pencil</v-icon></v-btn>
    </template>

    <v-card>
      <v-card-title>Plant Tags</v-card-title>
      <v-card-subtitle>select plant tags</v-card-subtitle>

      <v-card-text>
        <v-chip-group v-model="selectedTags" multiple column>
          <v-chip
              v-for="tag in offeredTags"
              color="green"
              :key="tag"
              :value="tag">
            {{ tag }}
          </v-chip>
        </v-chip-group>
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
// The tags every plant is offered
const commonTags = [
  'Container Friendly',
  'Cold Tolerant',
  'Determinate',
  'Indeterminate',
];

export default {
  name: "PlantTagsDialog",

  props: {
    onSubmit: {
      type: Function,
      required: true,
    },
    tags: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    return {
      selectedTags: [],
      show: false,
    };
  },

  computed: {
    // The common tags, then the plant's others. The chip group drops a value
    // with no chip once any chip is toggled, so each of the plant's tags needs
    // one
    offeredTags() {
      return [...commonTags, ...this.tags.filter(tag => !commonTags.includes(tag))];
    },
  },

  methods: {
    handleSubmit() {
      this.onSubmit(this.selectedTags);
      this.show = false;
    },

    handleCancel() {
      this.show = false;
    },
  },

  mounted() {
    this.selectedTags = this.tags;
  },

  watch: {
    tags: {
      immediate: true,
      handler(selectedTags) {
        this.selectedTags = selectedTags;
      },
    },

    // each open starts from the plant's tags, so a cancelled toggle is gone
    show(open) {
      if (open) {
        this.selectedTags = [...this.tags];
      }
    },
  },
}
</script>

<style scoped>

</style>