import type { MilestoneFlag, MilestoneValue, SubmitProgressInput, SubmitProgressPayload } from "./types.js";

/**
 * Normalize the second argument of `submitProgress` into a request body.
 *
 * Accepts either a bare {@link MilestoneValue} or a {@link SubmitProgressPayload}
 * `{ data, complete, flag }` object. A bare boolean is interpreted by the API as completeness for a
 * data-less `completion` milestone; for every other milestone type, a bare value is stored as data
 * and implies completeness.
 *
 * Any plain (non-array) object is a payload, so an `object` milestone's value must be sent as
 * `{ data: { ... } }`; a bare object would be misread as `{ data, complete, flag }`.
 */
export function toSubmitBody(
  milestoneSlug: string,
  valueOrPayload?: SubmitProgressInput,
): { milestoneSlug: string; value?: MilestoneValue; complete?: boolean; flag?: MilestoneFlag | null } {
  if (valueOrPayload === undefined) return { milestoneSlug };

  if (typeof valueOrPayload === "object" && valueOrPayload !== null && !Array.isArray(valueOrPayload)) {
    const { data, complete, flag } = valueOrPayload as SubmitProgressPayload;
    return {
      milestoneSlug,
      ...(data !== undefined && { value: data }),
      ...(complete !== undefined && { complete }),
      ...(flag !== undefined && { flag }),
    };
  }
  return { milestoneSlug, value: valueOrPayload };
}
