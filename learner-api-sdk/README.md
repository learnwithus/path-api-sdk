# Learner API SDK

A fully typesafe TypeScript SDK for interacting with the Learner API.

## Features

- ✅ **Fully Typesafe** - Written in TypeScript with complete type definitions
- ✅ **Simple API** - Clean, intuitive interface for all operations
- ✅ **Great DX** - Excellent developer experience with IntelliSense support
- ✅ **Universal** - Compiled to JavaScript for use anywhere
- ✅ **Zero Dependencies** - Lightweight with no external dependencies

## Installation

```bash
npm install learner-api-sdk
```

## Quick Start

```typescript
import { pathAPI } from 'learner-api-sdk';

// Create the API instance
const path = pathAPI({
  courseId: 1,
  callbackUrl: 'http://localhost:5500'
});

// Check authentication status
const authStatus = await path.checkAuth();
if (authStatus.isAuthenticated) {
  console.log('Logged in as:', authStatus.enrollment?.user.email);
}

// Get enrollment and progress
const enrollment = await path.getEnrollmentAndProgress();
console.log('Progress records:', enrollment.progress);

// Submit progress
await path.submitProgress(1, true);
```

## API Reference

### pathAPI(config)

Create a new Path API instance.

**Parameters:**
- `config.courseId` (number, required) - The course ID
- `config.baseUrl` (string, optional) - Base URL for the API (default: `http://localhost:3000`)
- `config.callbackUrl` (string, optional) - Callback URL for login redirects (default: current page)

**Example:**
```typescript
const path = pathAPI({
  courseId: 1,
  baseUrl: 'https://api.example.com',
  callbackUrl: 'https://example.com/callback'
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
  console.log('User:', authStatus.enrollment?.user);
}
```

#### `login(callbackUrl?: string): void`

Redirect to login page.

**Parameters:**
- `callbackUrl` (string, optional) - Override the default callback URL

**Example:**
```typescript
api.login('https://example.com/after-login');
```

#### `logout(): Promise<void>`

Logout the current user.

**Throws:** Error if logout fails

**Example:**
```typescript
try {
  await api.logout();
  console.log('Logged out successfully');
} catch (error) {
  console.error('Logout failed:', error.message);
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
  console.log('Course:', enrollment.course.title);
  console.log('Progress:', enrollment.progress);
} catch (error) {
  console.error('Failed to fetch:', error.message);
}
```

#### `submitProgress(milestoneId: number, value: MilestoneValue): Promise<SubmitProgressResponse>`

Submit progress for a milestone.

**Parameters:**
- `milestoneId` (number) - The milestone ID
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
await api.submitProgress(1, true);

// String value
await api.submitProgress(2, "Completed lesson 1");

// Number value
await api.submitProgress(3, 95);

// Array value
await api.submitProgress(4, ["item1", "item2"]);

// Object value
await api.submitProgress(5, { score: 95, completed: true });
```

### Static Methods

#### `LearnerAPI.parseValue(input: string): MilestoneValue`

Parse value from string input. Attempts to parse as JSON first, falls back to string.

**Example:**
```typescript
const value1 = LearnerAPI.parseValue('true');        // boolean: true
const value2 = LearnerAPI.parseValue('42');          // number: 42
const value3 = LearnerAPI.parseValue('["a","b"]');  // array: ["a","b"]
const value4 = LearnerAPI.parseValue('hello');       // string: "hello"
```

## TypeScript Types

All types are exported for your convenience:

```typescript
import type {
  User,
  Course,
  Progress,
  Enrollment,
  AuthStatus,
  SubmitProgressResponse,
  MilestoneValue,
  LearnerAPIConfig,
  APIError
} from 'learner-api-sdk';
```

## Browser Usage

For browser usage without a build step:

```html
<script type="module">
  import { LearnerAPI } from './path/to/learner-api-sdk/dist/index.js';

  const api = new LearnerAPI({ courseId: 1 });
  // ... use the API
</script>
```

## Error Handling

All async methods may throw errors. Always wrap them in try-catch blocks:

```typescript
try {
  await api.submitProgress(1, true);
} catch (error) {
  console.error('Submission failed:', error.message);
  // Handle error appropriately
}
```

## License

ISC
