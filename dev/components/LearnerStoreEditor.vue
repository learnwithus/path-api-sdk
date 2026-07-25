<template>
  <div class="section">
    <h2>Learner Store</h2>

    <div class="form-group">
      <button id="loadLearnerStoreBtn" :disabled="loading" @click="loadLearnerStore">
        {{ loading ? "Loading..." : "Load Learner Store" }}
      </button>
      <button v-if="fields.length" :disabled="saving || !dirtyKeys.length" @click="save">
        {{ saving ? "Saving..." : `Save${dirtyKeys.length ? ` (${dirtyKeys.length})` : ""}` }}
      </button>
      <button v-if="dirtyKeys.length" :disabled="saving" @click="resetDraft">Discard changes</button>
      <div class="hint">Only changed fields are sent, matching how updateLearnerStore is meant to be used.</div>
    </div>

    <div v-if="apiError" class="error"><strong>✗ Error:</strong> {{ apiError }}</div>

    <div v-if="saved" class="success">
      <strong>✓ Saved.</strong> Server stored:
      <pre>{{ JSON.stringify(saved, null, 2) }}</pre>
    </div>

    <div v-if="loaded && !fields.length">This course has no learnerStore fields configured.</div>

    <div v-for="field in fields" :key="field.key" class="form-group">
      <label>
        {{ field.label || field.key }}
        <span class="hint">{{ field.key }} · {{ field.fieldType }}{{ field.updatedAt ? " · edited" : "" }}</span>
      </label>

      <!-- Scalar -->
      <LearnerStoreScalarInput
        v-if="isScalar(field.fieldType)"
        v-model="draft[field.key] as LearnerStoreScalarValue | null"
        :field-type="field.fieldType as LearnerStoreScalarType"
        :options="field.options"
      />

      <!-- Object: one group of sub-fields -->
      <div v-else-if="field.fieldType === 'object'" class="section">
        <div v-for="subField in field.fields ?? []" :key="subField.key" class="form-group">
          <label>{{ subField.label || subField.key }}</label>
          <LearnerStoreScalarInput
            v-model="(draft[field.key] as LearnerStoreObjectValue)[subField.key]"
            :field-type="subField.fieldType"
            :options="subField.options"
          />
        </div>
      </div>

      <!-- Repeatable: a list of such groups -->
      <div v-else class="section">
        <div v-for="(item, index) in draft[field.key] as LearnerStoreObjectValue[]" :key="index" class="section">
          <div v-for="subField in field.fields ?? []" :key="subField.key" class="form-group">
            <label>{{ subField.label || subField.key }} #{{ index + 1 }}</label>
            <LearnerStoreScalarInput
              v-model="item[subField.key]"
              :field-type="subField.fieldType"
              :options="subField.options"
            />
          </div>
          <button @click="removeItem(field, index)">Remove #{{ index + 1 }}</button>
        </div>
        <button @click="addItem(field)">Add {{ field.label || field.key }}</button>
      </div>
    </div>

    <details v-if="loaded" style="margin-top: 20px">
      <summary style="cursor: pointer; font-weight: bold">Full Learner Store (JSON)</summary>
      <pre style="margin-top: 10px; background: rgba(0, 0, 0, 0.05); padding: 10px; border-radius: 4px">{{
        JSON.stringify(learnerStore, null, 2)
      }}</pre>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import LearnerStoreScalarInput from "./LearnerStoreScalarInput.vue";
import type {
  PathSDKInstance,
  LearnerStore,
  LearnerStoreField,
  LearnerStoreObjectValue,
  LearnerStoreScalarType,
  LearnerStoreScalarValue,
  LearnerStoreUpdate,
  LearnerStoreValue,
} from "../../src/index";

const { pathInstance } = defineProps<{ pathInstance?: PathSDKInstance }>();

const SCALAR_TYPES = ["text", "textarea", "number", "checkbox", "select", "multiselect"];
const isScalar = (fieldType: string) => SCALAR_TYPES.includes(fieldType);

const learnerStore = ref<LearnerStore | null>(null);
const draft = ref<LearnerStoreUpdate>({});
const loading = ref(false);
const saving = ref(false);
const loaded = ref(false);
const apiError = ref<string | null>(null);
const saved = ref<LearnerStoreUpdate | null>(null);

// Object key order follows the order the course configured, so this drives display order too.
const fields = computed<LearnerStoreField[]>(() => Object.values(learnerStore.value ?? {}));

const dirtyKeys = computed(() =>
  fields.value
    .filter((field) => JSON.stringify(draft.value[field.key]) !== JSON.stringify(field.value))
    .map((field) => field.key),
);

/** Composite fields need a container to edit into, even when the learner has written nothing yet. */
function toEditable(field: LearnerStoreField): LearnerStoreValue {
  if (field.fieldType === "object") return { ...((field.value as LearnerStoreObjectValue) ?? {}) };
  if (field.fieldType === "repeatable") return structuredClone((field.value as LearnerStoreObjectValue[]) ?? []);
  return field.value;
}

function resetDraft() {
  draft.value = Object.fromEntries(fields.value.map((field) => [field.key, toEditable(field)]));
  saved.value = null;
}

async function loadLearnerStore() {
  if (!pathInstance) return;
  loading.value = true;
  apiError.value = null;
  saved.value = null;
  try {
    learnerStore.value = await pathInstance.getLearnerStore();
    resetDraft();
    loaded.value = true;
    console.log("Learner store loaded:", learnerStore.value);
  } catch (error: any) {
    apiError.value = error.message;
    console.error("Failed to load learnerStore:", error);
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!pathInstance) return;
  saving.value = true;
  apiError.value = null;
  saved.value = null;
  try {
    const changed = Object.fromEntries(dirtyKeys.value.map((key) => [key, draft.value[key] as LearnerStoreValue]));
    saved.value = await pathInstance.updateLearnerStore(changed);
    console.log("Learner store saved:", saved.value);
    await loadLearnerStore();
  } catch (error: any) {
    apiError.value = error.message;
    console.error("Failed to save learnerStore:", error);
  } finally {
    saving.value = false;
  }
}

function addItem(field: LearnerStoreField) {
  const items = draft.value[field.key] as LearnerStoreObjectValue[];
  items.push(Object.fromEntries((field.fields ?? []).map((subField) => [subField.key, subField.defaultValue ?? ""])));
}

function removeItem(field: LearnerStoreField, index: number) {
  (draft.value[field.key] as LearnerStoreObjectValue[]).splice(index, 1);
}

defineExpose({ loadLearnerStore });
</script>
