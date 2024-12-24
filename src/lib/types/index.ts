export interface FetchDataResult {
    spoData: Pool[];
    drepData: dRep[];
}

export type Pool = {
    // is_active: boolean; // uncomment this later to be able to toggle retired SPOs.
    stake: number;
    label: string;
};

export type dRep = {
    is_active: boolean;
    active_power: number;
    drep_id: string;
    given_name?: string;
    label: string;
};

export type Chart = {
    title: string;
    threshold: number;
    size?: 'large' | 'medium' | 'small';
    chartType?: 'default' | 'gray' | 'yellow';
    subtitle?: string;
    values?: Pool[] | dRep[];
    displayValue?: string;
    secondaryDisplayValue?: string;
    minPools?: number;
    secondaryMinPools?: number;
};

export type Proposal = {
    title: string;
    charts: Chart[];
};