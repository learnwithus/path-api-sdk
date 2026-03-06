<template>
  <div class="section">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2 style="margin: 0">User Enrollment & Progress</h2>
      <button id="loadProgressBtn" @click="loadProgress" :disabled="loading">
        {{ loading ? "Loading..." : "Load Progress" }}
      </button>
    </div>

    <div id="progressDisplay">
      <!-- Loading State -->
      <div v-if="loading">Loading user progress...</div>

      <!-- Success State -->
      <div v-else-if="enrollment" class="success">
        <strong>✓ Enrollment & Progress Loaded</strong>

        <div style="margin-top: 15px">
          <strong>User:</strong>
          <div style="margin-left: 15px">
            <div>ID: {{ enrollment.user.id }}</div>
            <div>Email: {{ enrollment.user.email || "N/A" }}</div>
          </div>
        </div>

        <div style="margin-top: 15px">
          <strong>Course:</strong>
          <div style="margin-left: 15px">
            <div>ID: {{ enrollment.course.id }}</div>
            <div>Title: {{ enrollment.course.title }}</div>
            <div v-if="enrollment.course.description">Description: {{ enrollment.course.description }}</div>
          </div>
        </div>

        <div v-if="enrollment.progress && enrollment.progress.length > 0" style="margin-top: 15px">
          <strong>Progress Records ({{ enrollment.progress.length }}):</strong>
          <div
            v-for="progress in enrollment.progress"
            :key="progress.id"
            style="
              margin-left: 15px;
              margin-top: 10px;
              padding: 10px;
              background: rgba(0, 0, 0, 0.05);
              border-radius: 4px;
            "
          >
            <div>Progress ID: {{ progress.id }}</div>
            <div>Milestone ID: {{ progress.courseMilestoneId }}</div>
            <div>Value: {{ progress.value }}</div>
            <div>
              Created:
              {{ new Date(progress.createdAt).toLocaleString() }}
            </div>
          </div>
        </div>
        <div v-else style="margin-top: 15px">
          <em>No progress records yet</em>
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
            >{{ JSON.stringify(enrollment, null, 2) }}</pre
          >
        </details>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error"><strong>✗ Error:</strong> {{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { PathSDKInstance, Enrollment } from "../../src/index";

const { pathInstance } = defineProps<{
  pathInstance?: PathSDKInstance;
}>();

const loading = ref(false);
const enrollment = ref<Enrollment | null>(null);
const error = ref<string | null>(null);

async function loadProgress() {
  if (!pathInstance) return;

  loading.value = true;
  enrollment.value = null;
  error.value = null;

  try {
    const info = await pathInstance.getEnrollmentAndProgress();
    enrollment.value = info;
    console.log("Enrollment & progress:", info);
  } catch (err: any) {
    error.value = err.message;
    console.error("Failed to load progress:", err);
  } finally {
    loading.value = false;
  }
}

// Expose loadProgress so parent can call it
defineExpose({ loadProgress });

// Auto-load on mount
loadProgress();
</script>
