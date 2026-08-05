export const DEFAULT_PARTICIPANT_MESSAGE = `Bienvenido a la Impro
1-) Disfruta
2-) Juego
3-) Sigue el ritmo
4-) Cada vez que comience un conteo debes decir "TAVA"
5-) Si te piden algo hazlo , seguro te divertiras

:D mucha mierda`;

export function resolveParticipantMessage(message?: string | null): string {
  const trimmed = message?.trim();
  return trimmed ? trimmed : DEFAULT_PARTICIPANT_MESSAGE;
}
