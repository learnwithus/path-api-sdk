import type {
  AuthenticatedUser,
  Course,
  LearnerAttributes,
  LearnerState,
  Milestone,
  Progress,
  User,
} from "./types.js";

/** The authenticated wire response returned by Path's protected learner endpoint. */
export interface LearnerOverviewResponse {
  user: User;
  course: Course;
  attributes: LearnerAttributes;
  milestones: Milestone[];
  progress: Progress[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isUser(value: unknown): value is User {
  if (!isRecord(value) || typeof value.id !== "string") return false;
  return (
    isOptionalString(value.name) &&
    isOptionalString(value.email) &&
    isOptionalString(value.firstName) &&
    isOptionalString(value.lastName)
  );
}

function isCourse(value: unknown): value is Course {
  return isRecord(value) && typeof value.id === "string" && typeof value.title === "string";
}

function isLearnerAttributes(value: unknown): value is LearnerAttributes {
  if (!isRecord(value)) return false;
  return Object.values(value).every(
    (attribute) =>
      attribute === null ||
      typeof attribute === "string" ||
      typeof attribute === "number" ||
      typeof attribute === "boolean" ||
      (Array.isArray(attribute) && attribute.every((item) => typeof item === "string")),
  );
}

function isMilestone(value: unknown): value is Milestone {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "number" &&
    typeof value.courseId === "string" &&
    typeof value.title === "string" &&
    typeof value.slug === "string" &&
    ["boolean", "string", "array", "number", "completion"].includes(String(value.type)) &&
    typeof value.order === "number" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isMilestoneValue(value: unknown): boolean {
  return (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string" || typeof item === "number"))
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isProgress(value: unknown): value is Progress {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "number" &&
    typeof value.userId === "string" &&
    typeof value.courseMilestoneId === "number" &&
    isMilestoneValue(value.value) &&
    typeof value.complete === "boolean" &&
    isNullableString(value.updatedBy) &&
    typeof value.milestoneSlug === "string" &&
    isNullableString(value.updatedByName) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

/** Parse and validate the protected learner endpoint before exposing it as SDK state. */
export function parseLearnerOverviewResponse(value: unknown): LearnerOverviewResponse {
  if (
    !isRecord(value) ||
    !isUser(value.user) ||
    !isCourse(value.course) ||
    !isLearnerAttributes(value.attributes) ||
    !Array.isArray(value.milestones) ||
    !value.milestones.every(isMilestone) ||
    !Array.isArray(value.progress) ||
    !value.progress.every(isProgress)
  ) {
    throw new TypeError("Invalid learner response");
  }
  return value as unknown as LearnerOverviewResponse;
}

/** Create a fresh logged-out state so callers never share mutable progress arrays. */
export function emptyLearnerState(): LearnerState {
  return {
    user: null,
    course: null,
    milestones: [],
    progress: [],
  };
}

/** Move course attributes onto the authenticated user and expose learning data at the state root. */
export function toLearnerState(value: unknown): LearnerState {
  const response = parseLearnerOverviewResponse(value);
  const user: AuthenticatedUser = {
    ...response.user,
    attributes: response.attributes,
  };
  return {
    user,
    course: response.course,
    milestones: response.milestones,
    progress: response.progress,
  };
}
