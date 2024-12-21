export type Pool = {
    stake: number;
    label: string;
};

export type dRep = {
    is_active: boolean;
    active_power: number;
    drep_id: string;
    given_name?: string;
};

export type Chart = {
    title: string;
    threshold: number;
    size?: 'large' | 'medium' | 'small';
    chartType?: 'default' | 'gray' | 'yellow';
    subtitle?: string;
    values?: { label: string; stake: number }[] | { label: string; active_power: number }[];
    displayValue?: string;
    secondaryDisplayValue?: string;
    minPools?: number;
    secondaryMinPools?: number;
};

export type Proposal = {
    title: string;
    charts: Chart[];
};