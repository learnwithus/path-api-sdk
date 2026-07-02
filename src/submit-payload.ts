import type { MilestoneValue, SubmitProgressPayload } from "./types.js";

/**
 * Normalize the second argument of `submitProgress` into a request body.
 *
 * Accepts either a bare {@link MilestoneValue} (which implies the milestone is complete) or a
 * {@link SubmitProgressPayload} `{ data, complete }` object.
 *
 * A `MilestoneValue` is never a plain (non-array) object, so the payload form can be detected
 * safely by the presence of a `data` key on a non-array object. If object-valued milestones are
 * ever introduced, this discriminator must be revisited.
 */
export function toSubmitBody(
  milestoneSlug: string,
  valueOrPayload: MilestoneValue | SubmitProgressPayload,
): { milestoneSlug: string; value: MilestoneValue | null; complete?: boolean } {
  if (
    typeof valueOrPayload === "object" &&
    valueOrPayload !== null &&
    !Array.isArray(valueOrPayload) &&
    "data" in valueOrPayload
  ) {
    const { data, complete } = valueOrPayload;
    return { milestoneSlug, value: data, ...(complete !== undefined && { complete }) };
  }
  return { milestoneSlug, value: valueOrPayload };
}
