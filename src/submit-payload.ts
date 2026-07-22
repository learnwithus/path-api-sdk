import type { MilestoneValue, SubmitProgressInput, SubmitProgressPayload } from "./types.js";

/**
 * Normalize the second argument of `submitProgress` into a request body.
 *
 * Accepts either a bare {@link MilestoneValue} (which implies the milestone is complete) or a
 * {@link SubmitProgressPayload} `{ data, complete }` object.
 *
 * A `MilestoneValue` is never a plain (non-array) object, so any plain object is a payload. If
 * object-valued milestones are ever introduced, this discriminator must be revisited.
 */
export function toSubmitBody(
  milestoneSlug: string,
  valueOrPayload?: SubmitProgressInput,
): { milestoneSlug: string; value?: MilestoneValue; complete?: boolean } {
  if (valueOrPayload === undefined) return { milestoneSlug };

  if (typeof valueOrPayload === "object" && valueOrPayload !== null && !Array.isArray(valueOrPayload)) {
    const { data, complete } = valueOrPayload as SubmitProgressPayload;
    return {
      milestoneSlug,
      ...(data !== undefined && { value: data }),
      ...(complete !== undefined && { complete }),
    };
  }
  return { milestoneSlug, value: valueOrPayload };
}
