<template>
  <select v-if="fieldType === 'select'" v-model="model">
    <option value="">—</option>
    <option v-for="option in options ?? []" :key="option" :value="option">{{ option }}</option>
  </select>

  <select v-else-if="fieldType === 'multiselect'" v-model="model" multiple>
    <option v-for="option in options ?? []" :key="option" :value="option">{{ option }}</option>
  </select>

  <label v-else-if="fieldType === 'checkbox'">
    <input v-model="model" type="checkbox" />
    {{ model ? "Yes" : "No" }}
  </label>

  <input v-else-if="fieldType === 'number'" v-model.number="model" type="number" />

  <textarea v-else-if="fieldType === 'textarea'" v-model="model" rows="3" />

  <input v-else v-model="model" type="text" />
</template>

<script setup lang="ts">
import type { LearnerStoreScalarType, LearnerStoreScalarValue } from "../../src/index";

/** One input for a scalar field. Used for root-level fields and for sub-fields alike. */
defineProps<{
  fieldType: LearnerStoreScalarType;
  options?: string[] | null;
}>();

const model = defineModel<LearnerStoreScalarValue | null>();
</script>
