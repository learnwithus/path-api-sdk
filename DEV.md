# Development Environment

This document explains the development environment for testing the Path API SDK.

## Overview

The dev environment is a Vue.js application that provides an interactive interface for testing all SDK functionality. It's **only used for development** and is **not included in the published npm package**.

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

This starts a Vite dev server at `http://localhost:5500` with hot module replacement (HMR).

### Build Library

```bash
npm run build
```

This builds the SDK library (without Vue) to the `dist/` directory.

## Architecture

### Technology Stack

- **Vue 3** - Component framework for the test UI
- **TypeScript** - Type safety throughout
- **Vite** - Build tool and dev server
- **Composition API** - Modern Vue patterns with `<script setup>`

### File Structure

```
dev/
├── App.vue                      # Main app component
├── dev-app.ts                   # Vue app entry point
├── vue-shim.d.ts               # TypeScript support for .vue files
├── styles.css                   # Global styles
└── components/
    ├── AuthStatus.vue           # Authentication status display
    ├── ProgressDisplay.vue      # Learner state viewer
    ├── ProgressSubmit.vue       # Progress submission form
    └── LearnerStoreEditor.vue   # Learner store viewer & editor
```

## Components

### App.vue

The root component that:

- Manages the `courseId` input field
- Syncs `courseId` with URL query parameters (e.g., `?courseId=my-course-slug`)
- Creates a reactive `pathSDK` instance based on `courseId`
- Coordinates child component updates when `courseId` changes

**Key Features:**

- URL persistence: Course ID is saved in the URL and restored on page refresh
- Reactive SDK: The SDK instance updates automatically when `courseId` changes
- Coordinated updates: Uses Vue's `nextTick` to ensure child components receive updated props before refreshing

### AuthStatus.vue

Displays authentication status and provides login/logout actions.

**States:**

- Loading: "Checking authentication..."
- Authenticated: Shows user ID, email, and read-only learner attributes
- Not Authenticated: Shows "Not logged in" with login button
- Error: Displays error message

**Actions:**

- Refresh: Manually re-check authentication
- Login: Redirects to Path login page
- Logout: Logs out and re-checks auth status

### ProgressDisplay.vue

Shows user enrollment and progress data.

**Features:**

- Displays user information (ID, email)
- Shows enrolled course details (ID, title, description)
- Lists all progress records with details
- Collapsible JSON view for raw API response
- Auto-loads on mount and when course ID changes

### ProgressSubmit.vue

Form for submitting progress to milestones.

**Features:**

- Milestone slug input
- Data-less completion milestone mode
- Value input (supports JSON or plain text)
- Automatic JSON parsing
- Complete selector (omit / true / false) to exercise the `{ data, complete }` and `{ complete }`
  payload forms
- Detailed success/error feedback
- Triggers progress reload after successful submission

### LearnerStoreEditor.vue

Reads and writes the learner store, exercising `getLearnerStore()` and `updateLearnerStore()`.

**Features:**

- One JSON textarea per key. The learner API returns values without definitions, so there is no
  field type to pick a typed control from — this is exactly what an SDK consumer sees
- Infers a shape hint per key (`string`, `object`, `array(3)`, …) from the value itself
- Tracks which keys changed and sends only those, so partial writes are exercised rather than assumed
- Shows the dirty count on the Save button, and a Discard button to reset the draft
- Blocks saving while any value is invalid JSON, and says which one
- Prints what the server stored after a save, so normalization is visible
- Reloads when the course ID changes

## Configuration

### Vite Config

The Vite config is set up for dual purposes:

1. **Dev mode**: Serves the Vue app with HMR
2. **Build mode**: Bundles the SDK library (excludes Vue)

### TypeScript

TypeScript is configured to:

- Support `.vue` files via `dev/vue-shim.d.ts`
- Provide full type safety throughout the app
- Import types from the SDK (`PathSDKInstance`, `LearnerState`, etc.)

## Testing Workflow

1. **Start dev server**: `npm run dev`
2. **Set course ID**: Enter a course ID in the input field
3. **Check authentication**: See if you're logged in for that course
4. **Login if needed**: Click login button to authenticate
5. **View progress**: See the flattened learner state and progress data
6. **Submit progress**: Test submitting new progress values
7. **Change course**: Update course ID to test with different courses

## Notes

- Vue and `@vitejs/plugin-vue` are **dev dependencies only**
- The `dev/` folder is excluded from the npm package (via `files` field in `package.json`)
- The library build explicitly externalizes Vue (via `rollupOptions.external`)
- Dev server automatically opens browser on `npm run dev`
