<template>
  <div>
    <h1>Learner API Tester</h1>

    <div class="section">
      <div class="form-group">
        <label for="progressCourseId">Course ID:</label>
        <input type="text" id="progressCourseId" v-model="courseId" placeholder="Enter course ID" />
      </div>
    </div>

    <AuthStatus ref="authStatusRef" :path-instance="pathInstance" @auth-changed="onAuthChanged" />

    <ProgressDisplay ref="progressDisplayRef" :path-instance="pathInstance" />

    <ProgressSubmit :path-instance="pathInstance" @progress-submitted="onProgressSubmitted" />
  </div>
</template>

<script setup lang="ts">
/// <reference types="vite/client" />

import { ref, watch, computed, nextTick } from "vue";
import { pathSDK } from "../src/index";
import AuthStatus from "./components/AuthStatus.vue";
import ProgressDisplay from "./components/ProgressDisplay.vue";
import ProgressSubmit from "./components/ProgressSubmit.vue";

// Get courseId from URL query parameter
function getCourseIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("courseId");
  return id ?? null;
}

// Update URL with courseId query parameter
function updateUrlWithCourseId(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("courseId", id.toString());
  window.history.replaceState({}, "", url.toString());
}

// Initialize courseId from URL or default to 1
const courseId = ref<string>(getCourseIdFromUrl() || "");

const pathUrl = import.meta.env.VITE_PATH_URL;

// Create path SDK instance - reactive based on courseId
const pathInstance = computed(() => {
  if (!courseId.value) return undefined;
  return pathSDK({
    pathUrl: pathUrl ?? "http://localhost:9474",
    courseId: courseId.value,
    courseUrl: window.location.origin,
  });
});

// Component refs
const authStatusRef = ref<InstanceType<typeof AuthStatus>>();
const progressDisplayRef = ref<InstanceType<typeof ProgressDisplay>>();

// Watch courseId changes
watch(courseId, async (newCourseId) => {
  updateUrlWithCourseId(newCourseId);

  // Wait for Vue to update the computed pathInstance and pass it to child components
  await nextTick();

  // Now refresh auth and progress with the new pathInstance
  authStatusRef.value?.checkAuth();
  progressDisplayRef.value?.loadProgress();
});

// Handle auth changes
function onAuthChanged(isAuthenticated: boolean) {
  console.log("Auth changed:", isAuthenticated);
}

// Handle progress submission
function onProgressSubmitted() {
  // Reload progress after submission
  progressDisplayRef.value?.loadProgress();
}
</script>

<style>
/* Import existing styles */
@import "./styles.css";
</style>
