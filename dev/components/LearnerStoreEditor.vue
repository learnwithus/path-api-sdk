<template>
  <div class="section">
    <h2>Learner Store</h2>

    <div class="form-group">
      <button id="loadLearnerStoreBtn" :disabled="loading" @click="loadLearnerStore">
        {{ loading ? "Loading..." : "Load Learner Store" }}
      </button>
      <button v-if="keys.length" :disabled="saving || !dirtyKeys.length || !!invalidKeys.length" @click="save">
        {{ saving ? "Saving..." : `Save${dirtyKeys.length ? ` (${dirtyKeys.length})` : ""}` }}
      </button>
      <button v-if="dirtyKeys.length" :disabled="saving" @click="resetDraft">Discard changes</button>
      <div class="hint">
        Only changed keys are sent, matching how updateLearnerStore is meant to be used. The learner API returns values
        without definitions, so each value is edited as JSON — exactly what an SDK consumer sees.
      </div>
    </div>

    <div v-if="apiError" class="error"><strong>✗ Error:</strong> {{ apiError }}</div>

    <div v-if="saved" class="success">
      <strong>✓ Saved.</strong> Server stored:
      <pre>{{ JSON.stringify(saved, null, 2) }}</pre>
    </div>

    <div v-if="loaded && !keys.length">This course has no learner store fields configured.</div>

    <div v-for="key in keys" :key="key" class="form-group">
      <label :for="`ls-${key}`">
        {{ key }}
        <span class="hint">{{ describe(store?.[key]) }}</span>
      </label>
      <textarea :id="`ls-${key}`" v-model="draft[key]" rows="3" />
      <div v-if="invalidKeys.includes(key)" class="error">Not valid JSON — fix it or discard to save.</div>
    </div>

    <details v-if="loaded" style="margin-top: 20px">
      <summary style="cursor: pointer; font-weight: bold">Full Learner Store (JSON)</summary>
      <pre style="margin-top: 10px; background: rgba(0, 0, 0, 0.05); padding: 10px; border-radius: 4px">{{
        JSON.stringify(store, null, 2)
      }}</pre>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { LearnerStore, LearnerStoreValue, PathSDKInstance } from "../../src/index";

const { pathInstance } = defineProps<{ pathInstance?: PathSDKInstance }>();

const store = ref<LearnerStore | null>(null);
/** Each value is edited as JSON text: without definitions there is no type to pick a control from. */
const draft = ref<Record<string, string>>({});
const loading = ref(false);
const saving = ref(false);
const loaded = ref(false);
const apiError = ref<string | null>(null);
const saved = ref<LearnerStore | null>(null);

// Key order is the order staff configured, so it drives display order too.
const keys = computed(() => Object.keys(store.value ?? {}));

function parse(text: string): { ok: true; value: LearnerStoreValue } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) as LearnerStoreValue };
  } catch {
    return { ok: false };
  }
}

const invalidKeys = computed(() => keys.value.filter((key) => !parse(draft.value[key] ?? "").ok));

const dirtyKeys = computed(() =>
  keys.value.filter((key) => {
    const parsed = parse(draft.value[key] ?? "");
    return parsed.ok && JSON.stringify(parsed.value) !== JSON.stringify(store.value?.[key]);
  }),
);

/** A one-word hint of the value's shape, standing in for the field type we no longer receive. */
function describe(value: LearnerStoreValue | undefined): string {
  if (Array.isArray(value)) return `array(${value.length})`;
  if (value === null) return "null";
  return typeof value;
}

function resetDraft() {
  draft.value = Object.fromEntries(keys.value.map((key) => [key, JSON.stringify(store.value?.[key] ?? null, null, 2)]));
  saved.value = null;
}

async function loadLearnerStore() {
  if (!pathInstance) return;
  loading.value = true;
  apiError.value = null;
  saved.value = null;
  try {
    store.value = await pathInstance.getLearnerStore();
    resetDraft();
    loaded.value = true;
    console.log("Learner store loaded:", store.value);
  } catch (error: any) {
    apiError.value = error.message;
    console.error("Failed to load learner store:", error);
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
    const changed: LearnerStore = {};
    for (const key of dirtyKeys.value) {
      const parsed = parse(draft.value[key] ?? "");
      if (parsed.ok) changed[key] = parsed.value;
    }
    const savedResponse = await pathInstance.updateLearnerStore(changed);
    console.log("Learner store saved:", savedResponse);
    await loadLearnerStore();
    saved.value = savedResponse;
  } catch (error: any) {
    apiError.value = error.message;
    console.error("Failed to save learner store:", error);
  } finally {
    saving.value = false;
  }
}

defineExpose({ loadLearnerStore });
</script>
