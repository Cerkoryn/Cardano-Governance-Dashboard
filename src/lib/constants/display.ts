import type { ProposalCategory } from '$lib/types/types';

export const SITE_NAME = 'ChangWatch';
export const SITE_TAGLINE = 'Cardano governance concentration and voting-threshold dashboard';

// Map canonical proposal.title (logic key, never edited) -> display metadata.
export const proposalDisplay: Record<string, { title: string; description: string }> = {
	'Fewest # Needed to Pass a Vote of No Confidence in Constitutional Committee': {
		title: 'No confidence in Constitutional Committee',
		description: 'Smallest voter coalition that could pass a no-confidence motion.'
	},
	'Fewest # Needed to Elect a New Constitutional Committee while in a Normal State': {
		title: 'Elect a new Constitutional Committee (normal state)',
		description: 'Smallest coalition to elect a new committee under normal conditions.'
	},
	'Fewest # Needed to Elect a New Constitutional Committee while in a State of No Confidence': {
		title: 'Elect a new Constitutional Committee (no-confidence state)',
		description: 'Smallest coalition to elect a new committee while in a state of no confidence.'
	},
	'Fewest # Needed to Update the Cardano Constitution': {
		title: 'Update the Constitution',
		description: 'Smallest coalition to amend the Cardano constitution.'
	},
	'Fewest # Needed to Initiate a Hard Fork': {
		title: 'Initiate a hard fork',
		description: 'Smallest coalition to trigger a hard-fork combinator event.'
	},
	'Fewest # Needed to Withdraw from the Cardano Treasury': {
		title: 'Treasury withdrawal',
		description: 'Smallest coalition to approve a treasury withdrawal.'
	},
	'Fewest # Needed to Change a Network, Economic, or Technical Parameter': {
		title: 'Change a network, economic or technical parameter',
		description: 'Smallest coalition to change a protocol parameter. SPOs only vote when it is a security parameter.'
	},
	'Fewest # Needed to Change a Governance Parameter': {
		title: 'Change a governance parameter',
		description: 'Smallest coalition to change a governance parameter. SPOs only vote when it is a security parameter.'
	}
};

export const proposalCategoryByTitle: Record<string, ProposalCategory> = {
	'Fewest # Needed to Pass a Vote of No Confidence in Constitutional Committee': 'Constitutional Committee',
	'Fewest # Needed to Elect a New Constitutional Committee while in a Normal State': 'Constitutional Committee',
	'Fewest # Needed to Elect a New Constitutional Committee while in a State of No Confidence': 'Constitutional Committee',
	'Fewest # Needed to Update the Cardano Constitution': 'Constitution',
	'Fewest # Needed to Initiate a Hard Fork': 'Hard Fork',
	'Fewest # Needed to Withdraw from the Cardano Treasury': 'Treasury',
	'Fewest # Needed to Change a Network, Economic, or Technical Parameter': 'Protocol Parameters',
	'Fewest # Needed to Change a Governance Parameter': 'Protocol Parameters'
};

export const categoryOrder: ProposalCategory[] = [
	'Constitutional Committee', 'Constitution', 'Protocol Parameters', 'Hard Fork', 'Treasury'
];
