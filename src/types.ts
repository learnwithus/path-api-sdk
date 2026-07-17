export type ActivityValue = boolean | number | string | Array<string | number>;
export type ActivityType = "boolean" | "string" | "array" | "number" | "completion";
export type CompletionRule =
  | "learner_attestation"
  | "submission_exists"
  | "trusted_application_assertion"
  | "value_predicate"
  | "manager_approval";

export interface ActivityProgress {
  activityId: string;
  value: ActivityValue | null;
  complete: boolean;
  completedAt: string | null;
  updatedAt: string;
}

export interface Activity {
  activityId: string;
  title: string;
  slug: string;
  type: ActivityType;
  order: number;
  required: boolean;
  completionRule: CompletionRule;
  progress: ActivityProgress | null;
}

export interface SectionProgress {
  sectionId: string;
  available: boolean;
  startedAt: string | null;
  completedAt: string | null;
}

export interface Section {
  sectionId: string;
  title: string;
  slug: string;
  order: number;
  progress: SectionProgress | null;
  activities: Activity[];
}

export interface Registration {
  id: string;
  courseId: string;
  courseVersionId: string;
  attemptNumber: number;
  status: "not_started" | "in_progress" | "complete" | "cancelled";
  derivedComplete: boolean;
  overrideComplete: boolean;
  startedAt: string | null;
  completedAt: string | null;
}

export interface RegistrationView {
  registration: Registration;
  sections: Section[];
}

export interface ProgressEvent {
  id: string;
  registrationId: string;
  activityId: string | null;
  kind: string;
  value: ActivityValue | null;
  assertedComplete: boolean | null;
  sourceType: "learner_api" | "manager" | "migration" | "system" | "xapi";
  reason: string | null;
  occurredAt: string;
  storedAt: string;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  registration?: RegistrationView;
}

export interface LearnerAPIConfig {
  courseId?: string;
  pathUrl?: string;
  courseUrl: string;
}

export interface TokenResponse {
  tokenType: "Bearer";
  accessToken: string;
  expiresIn: number;
  scope: string;
  refreshToken?: string;
  refreshExpiresIn?: number;
}

export interface APIError {
  message: string;
  statusCode?: number;
}
