export type Ratio = { numerator: number; denominator: number };
export type ActionId = 'no_confidence' | 'committee_normal' | 'committee_no_confidence' | 'constitution' | 'hard_fork' | 'network' | 'economic' | 'technical' | 'governance' | 'treasury';
export type ProposalCategory = 'Constitutional Committee' | 'Constitution' | 'Protocol Parameters' | 'Hard Fork' | 'Treasury';
export type Pool = { label: string; stake_lovelace: string; is_aggregate: boolean };
export type DRep = { drep_id: string; is_active: boolean; voting_power_lovelace: string };
export type Snapshot<T, Totals> = {
  schema_version: 1;
  snapshot_id: string;
  kind: 'spo' | 'governance';
  updated_at: string;
  source_epochs: Record<string, number>;
  rows: T[];
  totals: Totals;
};
export type Dashboard = {
  spo: Snapshot<Pool, { total_pools: number; total_spos: number; circulating_lovelace: string }>;
  governance: Snapshot<DRep, { registered_dreps: number; active_dreps: number }> & {
    thresholds: Record<ActionId, { drep: Ratio; spo: Ratio | null }>;
    committee: { eligible_members: number; minimum_size: number; quorum: Ratio };
  };
};
export type VoteEstimate = { count: number | null; threshold: Ratio | null; required: boolean; reason?: string };
export type Proposal = {
  id: ActionId;
  title: string;
  description: string;
  category: ProposalCategory;
  securityConditional: boolean;
  drep: VoteEstimate;
  spo: VoteEstimate;
  cc: VoteEstimate;
  total: number | null;
  securityTotal: number | null;
};
