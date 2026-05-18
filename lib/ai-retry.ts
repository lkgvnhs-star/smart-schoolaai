/**
 * Utility to handle retries for Gemini API calls with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 2000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Specifically check for 503 Service Unavailable, 429 Quota Exceeded, or high demand
      const isRetryable = 
        error?.message?.includes("503") || 
        error?.message?.includes("429") || 
        error?.message?.includes("SERVICE_UNAVAILABLE") ||
        error?.message?.includes("RESOURCE_EXHAUSTED") ||
        error?.message?.includes("high demand") ||
        error?.message?.includes("quota") ||
        error?.status === 503 ||
        error?.status === 429 ||
        error?.code === 503 ||
        error?.code === 429;

      if (isRetryable && i < maxRetries - 1) {
        console.warn(`Gemini API high demand, retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
