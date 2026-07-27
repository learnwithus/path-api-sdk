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
export function toLearnerState(response: LearnerOverviewResponse): LearnerState {
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
