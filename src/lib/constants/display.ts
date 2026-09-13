import type { ActionId, ProposalCategory } from '$lib/types/types';
export const SITE_NAME = 'ChangWatch';
export const SITE_TAGLINE = 'Cardano governance concentration and voting-threshold dashboard';
export const categoryOrder: ProposalCategory[] = ['Constitutional Committee', 'Constitution', 'Protocol Parameters', 'Hard Fork', 'Treasury'];
export const actions: { id: ActionId; title: string; category: ProposalCategory; description: string; cc: boolean; securityConditional?: boolean }[] = [
  { id: 'no_confidence', title: 'No confidence in Constitutional Committee', category: 'Constitutional Committee', description: 'Automatic no-confidence stake contributes Yes without adding a voter to the coalition.', cc: false },
  { id: 'committee_normal', title: 'Elect a committee (normal state)', category: 'Constitutional Committee', description: 'Committee update under normal conditions.', cc: false },
  { id: 'committee_no_confidence', title: 'Elect a committee (no-confidence state)', category: 'Constitutional Committee', description: 'Committee update following a no-confidence motion.', cc: false },
  { id: 'constitution', title: 'Update the Constitution', category: 'Constitution', description: 'Constitution or guardrails-script update.', cc: true },
  { id: 'network', title: 'Change a network parameter', category: 'Protocol Parameters', description: 'SPO approval is required only for security-relevant changes.', cc: true, securityConditional: true },
  { id: 'economic', title: 'Change an economic parameter', category: 'Protocol Parameters', description: 'SPO approval is required only for security-relevant changes.', cc: true, securityConditional: true },
  { id: 'technical', title: 'Change a technical parameter', category: 'Protocol Parameters', description: 'SPO approval is required only for security-relevant changes.', cc: true, securityConditional: true },
  { id: 'governance', title: 'Change a governance parameter', category: 'Protocol Parameters', description: 'SPO approval is required only for security-relevant changes.', cc: true, securityConditional: true },
  { id: 'hard_fork', title: 'Initiate a hard fork', category: 'Hard Fork', description: 'Uses the current on-chain hard-fork voting thresholds.', cc: true },
  { id: 'treasury', title: 'Treasury withdrawal', category: 'Treasury', description: 'Estimated approvals for a treasury withdrawal.', cc: true }
];
