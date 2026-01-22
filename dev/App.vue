<template>
  <div>
    <h1>Learner API Tester</h1>

    <div class="section">
      <div class="form-group">
        <label for="progressCourseId">Course ID:</label>
        <input
          type="number"
          id="progressCourseId"
          v-model.number="courseId"
          placeholder="Enter course ID"
        />
      </div>
    </div>

    <AuthStatus
      ref="authStatusRef"
      :path-instance="pathInstance"
      @auth-changed="onAuthChanged"
    />

    <ProgressDisplay
      ref="progressDisplayRef"
      :path-instance="pathInstance"
    />

    <ProgressSubmit
      :path-instance="pathInstance"
      @progress-submitted="onProgressSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { pathSDK } from '../src/index';
import AuthStatus from './components/AuthStatus.vue';
import ProgressDisplay from './components/ProgressDisplay.vue';
import ProgressSubmit from './components/ProgressSubmit.vue';

// Get courseId from URL query parameter
function getCourseIdFromUrl(): number | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('courseId');
  return id ? parseInt(id) : null;
}

// Update URL with courseId query parameter
function updateUrlWithCourseId(id: number) {
  const url = new URL(window.location.href);
  url.searchParams.set('courseId', id.toString());
  window.history.replaceState({}, '', url.toString());
}

// Initialize courseId from URL or default to 1
const courseId = ref<number>(getCourseIdFromUrl() || 1);

// Create path SDK instance - reactive based on courseId
const pathInstance = computed(() => {
  return pathSDK({
    pathUrl: 'http://localhost:3000',
    courseId: courseId.value,
    courseUrl: 'http://localhost:5500'
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
  console.log('Auth changed:', isAuthenticated);
}

// Handle progress submission
function onProgressSubmitted() {
  // Reload progress after submission
  progressDisplayRef.value?.loadProgress();
}
</script>

<style>
/* Import existing styles */
@import './styles.css';
</style>
