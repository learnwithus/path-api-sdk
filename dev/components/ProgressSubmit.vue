<template>
  <div class="section">
    <h2>Submit Progress</h2>
    <div class="form-group">
      <label for="milestoneSlug">Milestone Slug:</label>
      <input type="text" id="milestoneSlug" v-model="milestoneSlug" placeholder="e.g., module-1-complete" />
    </div>
    <div class="form-group">
      <label for="progressValue">Value:</label>
      <input
        type="text"
        id="progressValue"
        v-model="progressValue"
        placeholder="e.g., true, 'Completed', 95, or {score: 95}"
      />
      <div class="hint">Enter any value. JSON will be parsed, otherwise treated as string. Optional when a completeness flag is set below.</div>
    </div>
    <div class="form-group">
      <label for="completeChoice">Complete:</label>
      <select id="completeChoice" v-model="completeChoice">
        <option value="omit">Omit (any data ⇒ complete)</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
      <div class="hint">Send an explicit completeness flag, or omit it to let the value imply completion.</div>
    </div>
    <div class="form-group">
      <button id="submitProgressBtn" @click="submitProgress" :disabled="loading">
        {{ loading ? "Submitting..." : "Submit Progress" }}
      </button>
    </div>

    <div id="progressResult">
      <!-- Loading State -->
      <div v-if="loading">Submitting progress...</div>

      <!-- Validation Error -->
      <div v-else-if="validationError" class="error">
        {{ validationError }}
      </div>

      <!-- Success State -->
      <div v-else-if="result" class="success">
        <strong>✓ Progress submitted successfully!</strong>

        <div style="margin-top: 15px">
          <strong>Progress Details:</strong>
          <div style="margin-left: 15px">
            <div>Progress ID: {{ result.id }}</div>
            <div>User ID: {{ result.userId }}</div>
            <div>
              Milestone ID:
              {{ result.courseMilestoneId }}
            </div>
            <div>Value: {{ result.value }}</div>
            <div>Complete: {{ result.complete }}</div>
            <div>
              Created:
              {{ new Date(result.createdAt).toLocaleString() }}
            </div>
          </div>
        </div>

        <details style="margin-top: 20px">
          <summary style="cursor: pointer; font-weight: bold">Full Response (JSON)</summary>
          <pre
            style="
              margin-top: 10px;
              background: rgba(0, 0, 0, 0.05);
              padding: 10px;
              border-radius: 4px;
              overflow-x: auto;
            "
            >{{ JSON.stringify(result, null, 2) }}</pre
          >
        </details>
      </div>

      <!-- API Error State -->
      <div v-else-if="apiError" class="error">
        <strong>✗ Error:</strong> {{ apiError }}

        <div style="margin-top: 10px">
          This could mean:
          <ul style="margin: 5px 0; padding-left: 20px">
            <li>You're not signed in</li>
            <li>You're not enrolled in the course</li>
            <li v-if="milestoneSlug">The milestone slug {{ milestoneSlug }} doesn't exist</li>
            <li>The milestone doesn't belong to this course</li>
            <li>The value type doesn't match the milestone's expected type</li>
            <li>CORS origin mismatch</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { PathSDKInstance, Progress, SubmitProgressPayload } from "../../src/index";

const { pathInstance } = defineProps<{
  pathInstance?: PathSDKInstance;
}>();

const emit = defineEmits<{
  progressSubmitted: [];
}>();

const milestoneSlug = ref("");
const progressValue = ref("");
const completeChoice = ref<"omit" | "true" | "false">("omit");
const loading = ref(false);
const validationError = ref<string | null>(null);
const result = ref<Progress | null>(null);
const apiError = ref<string | null>(null);

async function submitProgress() {
  if (!pathInstance) {
    return;
  }

  // Clear previous states
  validationError.value = null;
  result.value = null;
  apiError.value = null;

  // Validate inputs
  if (!milestoneSlug.value) {
    validationError.value = "Please enter a milestone slug";
    return;
  }

  // A value is only required when no explicit completeness flag is set. With a flag, an empty
  // value means a data-less submission (data: null).
  if (progressValue.value === "" && completeChoice.value === "omit") {
    validationError.value = "Please enter a value (or set a Complete flag for a data-less submission)";
    return;
  }

  // Parse value - try JSON first, fallback to string. Empty input becomes null.
  let parsedValue: any = null;
  if (progressValue.value !== "") {
    try {
      parsedValue = JSON.parse(progressValue.value);
    } catch {
      parsedValue = progressValue.value;
    }
  }

  loading.value = true;

  try {
    // Use the bare-value form when omitting completeness, otherwise the { data, complete } payload.
    const arg =
      completeChoice.value === "omit"
        ? parsedValue
        : ({ data: parsedValue, complete: completeChoice.value === "true" } satisfies SubmitProgressPayload);
    const response = await pathInstance.submitProgress(milestoneSlug.value, arg);
    result.value = response;
    console.log("Progress submitted:", response);

    // Notify parent to reload progress
    emit("progressSubmitted");
  } catch (error: any) {
    apiError.value = error.message;
    console.error("Failed to submit progress:", error);
  } finally {
    loading.value = false;
  }
}
</script>
