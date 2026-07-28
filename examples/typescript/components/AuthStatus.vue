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
      <div v-else-if="user" class="success">
        <strong>✓ Logged in</strong>
        <div style="margin-top: 10px">
          <div>User ID: {{ user.id }}</div>
          <div>Email: {{ user.email || "N/A" }}</div>
          <div>Attributes: {{ JSON.stringify(user.attributes) }}</div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error">✗ Error: {{ error }}</div>

      <!-- Not Authenticated State -->
      <div v-else-if="checked" class="error">✗ Not logged in</div>
    </div>

    <div id="authButtons" style="margin-top: 10px">
      <button v-if="!isAuthenticated" @click="login">Login</button>
      <button v-else @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { PathApiError, type PathSDKInstance, type AuthenticatedUser } from "../../../src/typescript/index";

const { pathInstance } = defineProps<{
  pathInstance?: PathSDKInstance;
}>();

const emit = defineEmits<{
  authChanged: [isAuthenticated: boolean];
}>();

const loading = ref(false);
const isAuthenticated = ref(false);
const checked = ref(false);
const user = ref<AuthenticatedUser | null>(null);
const error = ref<string | null>(null);

async function checkAuth() {
  if (!pathInstance) return;

  loading.value = true;
  error.value = null;
  user.value = null;
  checked.value = false;

  try {
    user.value = await pathInstance.checkAuth();
    isAuthenticated.value = user.value !== null;
    checked.value = true;
    emit("authChanged", isAuthenticated.value);
  } catch (reason: unknown) {
    error.value = reason instanceof PathApiError
      ? `${reason.code}: ${reason.message}`
      : reason instanceof Error ? reason.message : "Path request failed.";
    isAuthenticated.value = false;
    emit("authChanged", false);
  } finally {
    loading.value = false;
  }
}

function login() {
  if (!pathInstance) return;

  pathInstance.login(window.location.href);
}

async function logout() {
  if (!pathInstance) return;

  try {
    await pathInstance.logout();
    await checkAuth();
    alert("Logged out successfully");
  } catch (reason: unknown) {
    alert("Failed to logout: " + (reason instanceof Error ? reason.message : "Path request failed."));
  }
}

// Expose checkAuth so parent can call it
defineExpose({ checkAuth });

// Check auth on mount
checkAuth();
</script>
