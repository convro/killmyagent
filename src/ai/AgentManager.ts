import { GameState, Player, AgentCodename, PlayerAction } from '@/types/game';
import { callDeepSeekR1 } from './DeepSeekClient';
import { buildTurnPrompt, getSystemPrompt, getRetryPrompt } from './PromptBuilder';
import { parseAgentResponse, getFallbackAction } from './ResponseParser';
import { AGENT_API_DELAY_MS, AGENT_MAX_RETRIES, DIFFICULTY_TEMPERATURE } from '@/utils/constants';

export interface AgentTurnResult {
  playerId: string;
  codename: AgentCodename;
  action: PlayerAction;
  reasoning: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processAgent(
  state: GameState,
  player: Player,
): Promise<AgentTurnResult> {
  const codename = player.codename!;
  const systemPrompt = getSystemPrompt(codename);
  const turnPrompt = buildTurnPrompt(state, player);
  const temperature = DIFFICULTY_TEMPERATURE[state.difficulty] || 0.9;

  let reasoning = '';
  let action: PlayerAction | null = null;

  // First attempt
  const response = await callDeepSeekR1(systemPrompt, turnPrompt, temperature);
  reasoning = response.reasoning;
  action = parseAgentResponse(player.id, response.content);

  // Retry if invalid
  if (!action && AGENT_MAX_RETRIES > 0) {
    const retryResponse = await callDeepSeekR1(systemPrompt, getRetryPrompt(), temperature);
    reasoning += '\n\n[RETRY]\n' + retryResponse.reasoning;
    action = parseAgentResponse(player.id, retryResponse.content);
  }

  // Fallback
  if (!action) {
    action = getFallbackAction(player.id);
    reasoning += '\n\n[SYSTEM: Agent failed to produce valid action. Falling back to HIDE.]';
  }

  return {
    playerId: player.id,
    codename,
    action,
    reasoning,
  };
}

export async function processAllAgents(state: GameState): Promise<AgentTurnResult[]> {
  const agents = Object.values(state.players).filter(
    p => p.type === 'agent' && p.alive
  );

  const results: AgentTurnResult[] = [];

  // Process agents sequentially with delay to avoid rate limiting
  for (const agent of agents) {
    const result = await processAgent(state, agent);
    results.push(result);
    if (agents.indexOf(agent) < agents.length - 1) {
      await sleep(AGENT_API_DELAY_MS);
    }
  }

  return results;
}

export async function processAgentsParallel(state: GameState): Promise<AgentTurnResult[]> {
  const agents = Object.values(state.players).filter(
    p => p.type === 'agent' && p.alive
  );

  // Process up to 2 at a time to manage rate limits
  const results: AgentTurnResult[] = [];
  const batchSize = 2;

  for (let i = 0; i < agents.length; i += batchSize) {
    const batch = agents.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(agent => processAgent(state, agent))
    );
    results.push(...batchResults);
    if (i + batchSize < agents.length) {
      await sleep(AGENT_API_DELAY_MS);
    }
  }

  return results;
}
