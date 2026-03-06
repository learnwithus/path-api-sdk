<template>
  <div class="section">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2 style="margin: 0">Authentication Status</h2>
      <button @click="checkAuth">Refresh</button>
    </div>

    <div id="authStatus">
      <!-- Loading State -->
      <div v-if="loading">Checking authentication...</div>

      <!-- Authenticated State -->
      <div v-else-if="authStatus?.isAuthenticated && authStatus.enrollment" class="success">
        <strong>✓ Logged in</strong>
        <div style="margin-top: 10px">
          <div>User ID: {{ authStatus.enrollment.user.id }}</div>
          <div>Email: {{ authStatus.enrollment.user.email || "N/A" }}</div>
          <div>
            Enrolled in Course:
            {{ authStatus.enrollment.course.title }}
          </div>
        </div>
      </div>

      <!-- Not Authenticated State -->
      <div v-else-if="authStatus && !authStatus.isAuthenticated" class="error">✗ Not logged in</div>

      <!-- Error State -->
      <div v-else-if="error" class="error">✗ Error: {{ error }}</div>
    </div>

    <div id="authButtons" style="margin-top: 10px">
      <button v-if="!isAuthenticated" @click="login">Login</button>
      <button v-else @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { PathSDKInstance, AuthStatus } from "../../src/index";

const { pathInstance } = defineProps<{
  pathInstance?: PathSDKInstance;
}>();

const emit = defineEmits<{
  authChanged: [isAuthenticated: boolean];
}>();

const loading = ref(false);
const isAuthenticated = ref(false);
const authStatus = ref<AuthStatus | null>(null);
const error = ref<string | null>(null);

async function checkAuth() {
  if (!pathInstance) return;

  loading.value = true;
  error.value = null;
  authStatus.value = null;

  try {
    const status = await pathInstance.checkAuth();
    authStatus.value = status;
    isAuthenticated.value = status.isAuthenticated;
    emit("authChanged", isAuthenticated.value);
  } catch (err: any) {
    error.value = err.message;
    isAuthenticated.value = false;
    emit("authChanged", false);
  } finally {
    loading.value = false;
  }
}

function login() {
  if (!pathInstance) return;

  pathInstance.login();
}

async function logout() {
  if (!pathInstance) return;

  try {
    await pathInstance.logout();
    await checkAuth();
    alert("Logged out successfully");
  } catch (error: any) {
    alert("Failed to logout: " + error.message);
  }
}

// Expose checkAuth so parent can call it
defineExpose({ checkAuth });

// Check auth on mount
checkAuth();
</script>
