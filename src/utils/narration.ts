const KILL_NARRATIONS = [
  '{killer} sends {victim} to the void.',
  '{victim} falls. {killer} doesn\'t even look back.',
  'And just like that, {victim} is gone. {killer} claims another.',
  '{killer} ends {victim}\'s run. No mercy.',
  '{victim} crumbles. {killer} stands over the remains.',
  'A clean kill. {killer} erases {victim} from the board.',
  '{killer}\'s {weapon} speaks. {victim} listens — permanently.',
  '{victim} never saw it coming. {killer} was already gone.',
];

const ZONE_KILL_NARRATIONS = [
  '{victim} couldn\'t outrun the zone. Nobody can.',
  'The zone claims {victim}. A slow, burning end.',
  '{victim} chokes on toxic air. The zone doesn\'t negotiate.',
];

const TURN_OPENERS = [
  'The zone hums with tension.',
  'Silence. Then—',
  'The air crackles.',
  'Something shifts in the darkness.',
  'Footsteps echo across the grid.',
  'The zone tightens its grip.',
];

export function generateKillNarration(killerName: string, victimName: string, weapon: string, isZoneKill: boolean): string {
  if (isZoneKill) {
    const template = ZONE_KILL_NARRATIONS[Math.floor(Math.random() * ZONE_KILL_NARRATIONS.length)];
    return template.replace(/{victim}/g, victimName);
  }
  const template = KILL_NARRATIONS[Math.floor(Math.random() * KILL_NARRATIONS.length)];
  return template
    .replace(/{killer}/g, killerName)
    .replace(/{victim}/g, victimName)
    .replace(/{weapon}/g, weapon);
}

export function generateTurnOpener(): string {
  return TURN_OPENERS[Math.floor(Math.random() * TURN_OPENERS.length)];
}

export function generateVictorySpeechPrompt(winnerName: string, kills: number, turnsAlive: number): string {
  return `You won the survival zone. You are the last one standing. ${kills} kills across ${turnsAlive} turns.

Reflect on what happened. What did you feel? What was your strategy? Address the fallen — those you killed and those who fell before you could reach them.

Stay in character. Be raw. Be honest. Maximum 200 words.`;
}
