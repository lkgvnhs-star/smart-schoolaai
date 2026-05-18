/**
 * Utility to clean AI response text and ensure it's valid JSON.
 */
export function cleanAiJson(text: string | undefined): string {
  if (!text) return '{}';
  
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/```$/, '').trim();
  }
  
  // Sometimes Gemini adds "json\n" at the start without the backticks
  if (cleaned.startsWith('json\n')) {
    cleaned = cleaned.replace(/^json\n/, '').trim();
  }

  return cleaned;
}
