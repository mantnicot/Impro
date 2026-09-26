export const DEFAULT_SUBMISSION_LABEL = "Objeto";
export const DEFAULT_SUBMISSION_PROMPT = "Escribe un objeto concreto para el sorteo";

export const SUBMISSION_PRESETS = [
  {
    label: "Objeto",
    prompt: "Escribe un objeto concreto para el sorteo",
  },
  {
    label: "Piropo",
    prompt: "Escribe un piropo",
  },
  {
    label: "Premisa",
    prompt: "Escribe una premisa para improvisar",
  },
] as const;

export function resolveSubmissionLabel(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_SUBMISSION_LABEL;
}

export function resolveSubmissionPrompt(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_SUBMISSION_PROMPT;
}
