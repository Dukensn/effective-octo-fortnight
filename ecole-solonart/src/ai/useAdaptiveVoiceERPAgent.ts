// Hook React autour du service partagé AdaptiveVoiceERPAgent.
import { useSyncExternalStore } from 'react';
import { AdaptiveVoiceERPAgent } from './AdaptiveVoiceERPAgent';

export function useAdaptiveVoiceERPAgent() {
  const agent = AdaptiveVoiceERPAgent.shared();
  const snapshot = useSyncExternalStore((cb) => agent.subscribe(cb), () => agent.snapshot);
  return { agent, ...snapshot, ready: agent.ready };
}
