<template>
  <v-container>
    <v-row>
      <v-col cols="2"></v-col>
      <v-col cols="8">

        <v-row v-if="alertVisible">
          <fade-out-alert :is-visible="alertVisible" :alert-type="alertType" :message="alertMessage"/>
        </v-row>

        <v-snackbar
            v-model="snackbar.show"
            timeout="2000"
        >{{ snackbar.message }}
        </v-snackbar>

        <v-row v-if="loading" class="mt-10 d-flex justify-center">
          <v-progress-circular size="100" width="10" color="green" indeterminate/>
        </v-row>

        <v-row>
          <v-col cols="12" class="text-center">
            <page-title :title="plant.friendlyName"/>
            <v-spacer/>
            <span>{{ plant.category }}</span>
          </v-col>

          <v-col cols="12" class="text-center">
            <v-btn
                class="mr-4"
                size="small"
                color="blue darken-1"
                :disabled="!updateButtonEnabled"
                @click="updatePlant"
            >Update
            </v-btn>
            <v-btn
                size="small"
                color="gray darken-1"
                :disabled="!updateButtonEnabled"
                @click="refreshData"
            >Reset
            </v-btn>
          </v-col>

          <v-col cols="12">
            <v-card>
              <v-card-text>
                <v-text-field v-model="plantId" label="Id" variant="solo" density="compact" disabled/>
                <v-text-field v-model="createdAt" label="Created At" variant="solo" density="compact" disabled/>
                <v-text-field v-model="lastModifiedAt" label="Last Updated" variant="solo" density="compact" disabled/>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="6">
            <v-card>
              <v-card-title>Details</v-card-title>
              <v-card-text>
                <v-text-field v-model="plantCopy.friendlyName" label="Name" variant="solo" density="compact" required/>
                <v-text-field v-model="plantCopy.category" label="Category" variant="solo" density="compact" required/>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card>
              <v-card-title>Taxonomy</v-card-title>
              <v-card-text>
                <v-text-field v-model="plantCopy.taxonomy.family" label="Family" variant="solo" density="compact"
                              required/>
                <v-text-field v-model="plantCopy.taxonomy.genus" label="Genus" variant="solo" density="compact"
                              required/>
                <v-text-field v-model="plantCopy.taxonomy.species" label="Species" variant="solo" density="compact"
                              required/>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

      </v-col>
      <v-col cols="2"></v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "pinia";
import { usePlantsStore } from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";

export default {
  name: "PlantDetailsPage",

  components: {
    FadeOutAlert,
    PageTitle,
  },

  data() {
    return {
      snackbar: {
        show: false,
        message: '',
      },
      plantCopy: {
        taxonomy: {},
      },
    };
  },

  computed: {
    ...mapState(usePlantsStore, [
      'plantsById',
      'loading',
      'alertVisible',
      'alertType',
      'alertMessage',
    ]),

    plantId() {
      return this.$route.params.plantId;
    },

    plant() {
      return this.plantsById ? this.plantsById[this.plantId] : null;
    },

    createdAt() {
      return this.plantCopy ? new Date(this.plantCopy.dateCreated).toLocaleString() : '--';
    },

    lastModifiedAt() {
      return this.plantCopy ? new Date(this.plantCopy.dateModified).toLocaleString() : '--';
    },

    updateButtonEnabled() {
      return this.plant.friendlyName !== this.sanitize(this.plantCopy.friendlyName)
          || this.plant.category !== this.sanitize(this.plantCopy.category)
          || this.plant.taxonomy.family !== this.sanitize(this.plantCopy.taxonomy.family)
          || this.plant.taxonomy.genus !== this.sanitize(this.plantCopy.taxonomy.genus)
          || this.plant.taxonomy.species !== this.sanitize(this.plantCopy.taxonomy.species);
    },
  },

  methods: {
    ...mapActions(usePlantsStore, [
      'fetchPlantById',
      'upsertPlant',
    ]),

    async refreshData() {
      await this.fetchPlantById(this.plantId);
      this.plantCopy = JSON.parse(JSON.stringify(this.plantsById[this.plantId]));
    },

    async updatePlant() {
      await this.upsertPlant({
        plantId: this.plantCopy.plantId,
        category: this.sanitize(this.plantCopy.category),
        friendlyName: this.sanitize(this.plantCopy.friendlyName),
        seedSource: '',
        tags: [],
        description: '',
        taxonomy: {
          family: this.sanitize(this.plantCopy.taxonomy.family),
          genus: this.sanitize(this.plantCopy.taxonomy.genus),
          species: this.sanitize(this.plantCopy.taxonomy.species),
        },
      });
      await this.refreshData();

      this.snackbar = {
        show: true,
        message: 'Updated successfully!',
      };
    },

    sanitize(value) {
      return value?.trim();
    }
  },

  mounted() {
    this.refreshData();
  },
}
</script>