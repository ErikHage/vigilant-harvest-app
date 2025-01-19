<template>
  <v-container>
    <v-row>
      <v-col cols="2"></v-col>
      <v-col cols="8">

        <v-row v-if="alertVisible">
          <fade-out-alert :is-visible="alertVisible" :alert-type="alertType" :message="alertMessage"/>
        </v-row>

        <v-snackbar v-model="snackbar.show" timeout="2000">{{ snackbar.message }}</v-snackbar>

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
                color="primary"
                :disabled="!updateButtonEnabled"
                @click="updatePlant"
            >Update
            </v-btn>
            <v-btn
                size="small"
                color="warning"
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
                <v-label class="mx-2" >Description</v-label>
                <text-box-dialog title="Description"
                                 subtitle="describe the plant"
                                 :on-submit="updateDescription"
                                 :value="plantCopy.description"/>
                <pre class="ml-2 mt-2">{{ plantCopy.description }}</pre>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="6">
            <v-card>
              <v-card-title>Details</v-card-title>
              <v-card-text>
                <v-text-field v-model="plantCopy.friendlyName" label="Name" variant="solo" density="compact"/>
                <v-text-field v-model="plantCopy.category" label="Category" variant="solo" density="compact"/>
                <v-text-field v-model="plantCopy.seedSource" label="Seed Source" variant="solo" density="compact"/>
                <v-label class="mx-2">Tags</v-label>
                <plant-tags-dialog :on-submit="updateTags" :tags="plantCopy.tags"/>
                <v-chip-group column>
                  <v-chip v-for="tag in plantCopy.tags" disabled>{{ tag }}</v-chip>
                </v-chip-group>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card>
              <v-card-title>Taxonomy</v-card-title>
              <v-card-text>
                <v-text-field v-model="plantCopy.taxonomy.family" label="Family" variant="solo" density="compact"/>
                <v-text-field v-model="plantCopy.taxonomy.genus" label="Genus" variant="solo" density="compact"/>
                <v-text-field v-model="plantCopy.taxonomy.species" label="Species" variant="solo" density="compact"/>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card>
              <v-card-title>Sowing</v-card-title>
              <v-card-text>
                <v-text-field v-model="plantCopy.sowing.indoor" label="Indoor Sow" variant="solo" density="compact"/>
                <v-text-field v-model="plantCopy.sowing.direct" label="Direct Sow" variant="solo" density="compact"/>
                <v-text-field v-model="plantCopy.sowing.germinationDaysRange" label="Germination Days" variant="solo" density="compact"/>
                <v-text-field v-model="plantCopy.sowing.germinationTempRange" label="Germination Temp" variant="solo" density="compact"/>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card>
              <v-card-title>Planting</v-card-title>
              <v-card-text>
                <v-text-field v-model.number="plantCopy.planting.depthInInches" type="number" label="Planting Depth (in.)" variant="solo" density="compact"/>
                <v-text-field v-model.number="plantCopy.planting.plantSpacingInches" type="number" label="Plant Spacing (in.)" variant="solo" density="compact"/>
                <v-text-field v-model.number="plantCopy.planting.rowSpacingInches" type="number" label="Row Spacing (in.)" variant="solo" density="compact"/>
                <v-text-field v-model="plantCopy.planting.instructions" label="Instructions" variant="solo" density="compact"/>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card>
              <v-card-title>Growing</v-card-title>
              <v-card-text>
                <v-select v-model="plantCopy.growing.requiredSun" label="Required Sun" variant="solo" density="compact" :items="sunOptions"/>
                <v-text-field v-model.number="plantCopy.growing.daysToMaturity" type="number" label="Days to Maturity" variant="solo" density="compact"/>
                <div class="d-flex">
                  <v-checkbox class="pr-5" v-model.number="plantCopy.growing.isClimbing" label="Is Climbing" variant="solo" density="compact"/>
                  <v-text-field v-if="plantCopy.growing.isClimbing" v-model.number="plantCopy.growing.climbingHeightFeet" type="number" label="Climbing Height (ft.)" variant="solo" density="compact"/>
                </div>
                <v-text-field v-model="plantCopy.growing.plantSize" label="Plant Size" variant="solo" density="compact"/>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card>
              <v-card-title>Harvesting</v-card-title>
              <v-card-text>
                <v-text-field v-model="plantCopy.harvesting.fruitSize" label="Fruit Size" variant="solo" density="compact"/>
                <v-text-field v-model="plantCopy.harvesting.shelfStability" label="Shelf Stability" variant="solo" density="compact"/>
                <v-text-field v-model="plantCopy.harvesting.harvestInstructions" label="Instructions" variant="solo" density="compact"/>
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
import TextBoxDialog from "@/components/utils/TextBoxDialog.vue";
import PlantTagsDialog from "@/components/plants/PlantTagsDialog.vue";

export default {
  name: "PlantDetailsPage",

  components: {
    PlantTagsDialog,
    TextBoxDialog,
    FadeOutAlert,
    PageTitle,
  },

  data() {
    return {
      sunOptions: [
        'Full Sun (>= 6 hours)',
        'Part Sun (4-6 hours)',
        'Part Shade (2-4 hours)',
        'Full Shade (< 2 hours)',
      ],
      snackbar: {
        show: false,
        message: '',
      },
      plantCopy: {
        taxonomy: {},
        sowing: {},
        planting: {},
        growing: {},
        harvesting: {},
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
      return this.textFieldEdited(this.plant.friendlyName, this.plantCopy.friendlyName)
          || this.textFieldEdited(this.plant.category, this.plantCopy.category)
          || this.textFieldEdited(this.plant.seedSource, this.plantCopy.seedSource)
          || this.textFieldEdited(this.plant.description, this.plantCopy.description)
          || this.plant.tags?.join(",") !== this.plantCopy.tags?.join(",")
          || this.textFieldEdited(this.plant.taxonomy.family, this.plantCopy.taxonomy.family)
          || this.textFieldEdited(this.plant.taxonomy.genus, this.plantCopy.taxonomy.genus)
          || this.textFieldEdited(this.plant.taxonomy.species, this.plantCopy.taxonomy.species)
          || this.textFieldEdited(this.plant.sowing.indoor, this.plantCopy.sowing.indoor)
          || this.textFieldEdited(this.plant.sowing.direct, this.plantCopy.sowing.direct)
          || this.textFieldEdited(this.plant.sowing.germinationDaysRange, this.plantCopy.sowing.germinationDaysRange)
          || this.textFieldEdited(this.plant.sowing.germinationTempRange, this.plantCopy.sowing.germinationTempRange)
          || this.plant.planting.depthInInches !== this.plantCopy.planting.depthInInches
          || this.plant.planting.plantSpacingInches !== this.plantCopy.planting.plantSpacingInches
          || this.plant.planting.rowSpacingInches !== this.plantCopy.planting.rowSpacingInches
          || this.textFieldEdited(this.plant.planting.instructions, this.plantCopy.planting.instructions)
          || this.textFieldEdited(this.plant.growing.requiredSun, this.plantCopy.growing.requiredSun)
          || this.plant.growing.daysToMaturity !== this.plantCopy.growing.daysToMaturity
          || this.plant.growing.isClimbing !== this.plantCopy.growing.isClimbing
          || this.plant.growing.climbingHeightFeet !== this.plantCopy.growing.climbingHeightFeet
          || this.textFieldEdited(this.plant.growing.plantSize, this.plantCopy.growing.plantSize)
          || this.textFieldEdited(this.plant.harvesting.fruitSize, this.plantCopy.harvesting.fruitSize)
          || this.textFieldEdited(this.plant.harvesting.shelfStability, this.plantCopy.harvesting.shelfStability)
          || this.textFieldEdited(this.plant.harvesting.harvestInstructions, this.plantCopy.harvesting.harvestInstructions);
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

    updateDescription(description) {
      this.plantCopy.description = description;
    },

    updateTags(tags) {
      console.log("updated tags:", tags);
      this.plantCopy.tags = [ ...tags, ];
    },

    async updatePlant() {
      await this.upsertPlant({
        plantId: this.plantCopy.plantId,
        category: this.sanitize(this.plantCopy.category),
        friendlyName: this.sanitize(this.plantCopy.friendlyName),
        seedSource: this.sanitize(this.plantCopy.seedSource),
        tags: this.plantCopy.tags,
        description: this.sanitize(this.plantCopy.description),
        taxonomy: {
          family: this.sanitize(this.plantCopy.taxonomy.family),
          genus: this.sanitize(this.plantCopy.taxonomy.genus),
          species: this.sanitize(this.plantCopy.taxonomy.species),
        },
        sowing: {
          indoor: this.sanitize(this.plantCopy.sowing.indoor),
          direct: this.sanitize(this.plantCopy.sowing.direct),
          germinationDaysRange: this.sanitize(this.plantCopy.sowing.germinationDaysRange),
          germinationTempRange: this.sanitize(this.plantCopy.sowing.germinationTempRange),
        },
        planting: {
          depthInInches: this.plantCopy.planting.depthInInches,
          plantSpacingInches: this.plantCopy.planting.plantSpacingInches,
          rowSpacingInches: this.plantCopy.planting.rowSpacingInches,
          instructions: this.sanitize(this.plantCopy.planting.instructions),
        },
        growing: {
          requiredSun: this.sanitize(this.plantCopy.growing.requiredSun),
          daysToMaturity: this.plantCopy.growing.daysToMaturity,
          isClimbing: this.plantCopy.growing.isClimbing,
          climbingHeightFeet: this.plantCopy.growing.climbingHeightFeet,
          plantSize: this.sanitize(this.plantCopy.growing.plantSize),
        },
        harvesting: {
          fruitSize: this.sanitize(this.plantCopy.harvesting.fruitSize),
          shelfStability: this.sanitize(this.plantCopy.harvesting.shelfStability),
          harvestInstructions: this.sanitize(this.plantCopy.harvesting.harvestInstructions),
        },
      });
      await this.refreshData();

      this.snackbar = {
        show: true,
        message: 'Updated successfully!',
      };
    },

    textFieldEdited(originalValue, currentValue) {
      return originalValue !== this.sanitize(currentValue);
    },

    sanitize(value) {
      if (value === null) {
        return null;
      }
      return value?.trim();
    },
  },

  mounted() {
    this.refreshData();
  },
}
</script>