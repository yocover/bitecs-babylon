/**
 * Make sure a condition is true, otherwise throw an error.
 * @param description If the condition is not true, the description information provided when an error is thrown.
 * @param condition The condition that needs to be confirmed to be true.
 */
export function Ensure(description: string, condition: unknown): asserts condition {
  if (!condition) {
    throw new Error('Ensure failed: ' + description);
  }
}
