# Path Learner API SDK

A fully typesafe TypeScript SDK for integrating custom course websites with **Path**, the patient education tracking hub used by Vancouver Coastal Health.

## What is this SDK?

This SDK enables custom course websites to:

- **Authenticate learners** through Path's authentication system
- **Track user progress** on a per-learner, per-course basis
- **Submit progress updates** when learners complete milestones
- **Retrieve enrollment data** and historical progress records

**One SDK instance per course** - Each course website creates a single `pathSDK` instance configured with that course's ID. The SDK handles all communication with Path's backend to sync learner progress.

## Use Case

VCH uses Path to track patient care training across multiple custom course websites. When a healthcare professional completes a training module on your custom course website, this SDK reports that progress back to Path's centralized tracking system. This allows VCH to monitor training compliance and progress across their entire organization.

## Installation

```bash
npm install @vch-lt/path
```

## Quick Start

```typescript
import { pathSDK } from "@vch-lt/path";

// Create one SDK instance per course
// This connects your course website to Path's tracking system
const path = pathSDK({
  courseId: 1, // Your course's ID in Path
  courseUrl: "https://mycourse.com", // Your course website URL (for login redirects)
});

// Check authentication status
const authStatus = await path.checkAuth();
if (authStatus.isAuthenticated) {
  console.log("Logged in as:", authStatus.enrollment?.user.email);
}

// Get enrollment and progress
const enrollment = await path.getEnrollmentAndProgress();
console.log("Progress records:", enrollment.progress);

// Submit progress
await path.submitProgress(1, true);
```

## API Reference

### pathSDK(config)

Create a new Path API instance.

**Parameters:**

- `config.courseId` (number, required) - The course ID in Path
- `config.pathUrl` (string, optional) - Path backend URL (default: `https://path.vchlearn.ca`)
- `config.courseUrl` (string, required) - Your course website URL for login redirects

**Example:**

```typescript
const path = pathSDK({
  courseId: 1,
  pathUrl: "https://path.vchlearn.ca", // Usually you don't need to set this
  courseUrl: "https://mycourse.com",
});
```

### Methods

#### `path.checkAuth(): Promise<AuthStatus>`

Check authentication status.

**Returns:**

```typescript
{
  isAuthenticated: boolean;
  enrollment?: Enrollment;
}
```

**Example:**

```typescript
const authStatus = await api.checkAuth();
if (authStatus.isAuthenticated) {
  console.log("User:", authStatus.enrollment?.user);
}
```

#### `login(callbackUrl?: string): void`

Redirect to login page.

**Parameters:**

- `callbackUrl` (string, optional) - Override the default callback URL

**Example:**

```typescript
api.login("https://example.com/after-login");
```

#### `logout(): Promise<void>`

Logout the current user.

**Throws:** Error if logout fails

**Example:**

```typescript
try {
  await api.logout();
  console.log("Logged out successfully");
} catch (error) {
  console.error("Logout failed:", error.message);
}
```

#### `getEnrollmentAndProgress(): Promise<Enrollment>`

Get enrollment and progress data.

**Returns:**

```typescript
{
  id: number;
  user: User;
  course: Course;
  progress?: Progress[];
}
```

**Throws:** Error if not authenticated or request fails

**Example:**

```typescript
try {
  const enrollment = await api.getEnrollmentAndProgress();
  console.log("Course:", enrollment.course.title);
  console.log("Progress:", enrollment.progress);
} catch (error) {
  console.error("Failed to fetch:", error.message);
}
```

#### `submitProgress(milestoneSlug: string, value: MilestoneValue): Promise<SubmitProgressResponse>`

Submit progress for a milestone.

**Parameters:**

- `milestoneSlug` (string) - The milestone slug
- `value` (MilestoneValue) - The progress value (boolean, string, number, array, or object)

**Returns:**

```typescript
{
  success: boolean;
  progress: Progress;
}
```

**Throws:** Error if submission fails

**Example:**

```typescript
// Boolean value
await api.submitProgress('module-1-complete', true);

// String value
await api.submitProgress('lesson-1-notes', "Completed lesson 1");

// Number value
await api.submitProgress('quiz-1-score', 95);

// Array value
await api.submitProgress('selected-answers', ["item1", "item2"]);

// Object value
await api.submitProgress('quiz-1-result', { score: 95, completed: true });
```

## Error Handling

All async methods may throw errors. Always wrap them in try-catch blocks:

```typescript
try {
  await api.submitProgress(1, true);
} catch (error) {
  console.error("Submission failed:", error.message);
  // Handle error appropriately
}
```
