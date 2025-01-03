import type { Proposal, Pool, dRep, FetchDataResult } from '$lib/types';

export async function fetchData(): Promise<FetchDataResult> {
    const [spoResponse, drepResponse] = await Promise.all([
        fetch('/api/get_spos'),
        fetch('/api/get_dreps')
    ]);

    const [spoData, drepData] = await Promise.all([
        spoResponse.json(),
        drepResponse.json()
    ]);
    
    return { spoData, drepData };
}

export function calculateSPOMAV(values: { label: string; stake: number }[], threshold: number) {
    const totalStake = values.reduce((acc, value) => acc + value.stake, 0);
    const thresholdValue = (threshold / 100) * totalStake;
    let sum = 0;
    let count = 0;
    for (let value of values) {
        sum += value.stake;
        count++;
        if (sum >= thresholdValue) break;
    }
    return count;
}

export function calculatedRepMAV(values: { label: string; active_power: number }[], threshold: number) {
    const totalStake = values.reduce((acc, value) => acc + value.active_power, 0); 
    const thresholdValue = (threshold / 100) * totalStake;
    let sum = 0;
    let count = 0;
    for (let value of values) {
        sum += value.active_power;
        count++;
        if (sum >= thresholdValue) break;
    }
    return count;
}

export function calculateCombinedMAV(drepValues: { label: string; stake: number }[], spoValues: { label: string; stake: number }[], drepThreshold: number, spoThreshold: number, greyStatus: { CC: boolean; dRep: boolean; SPO: boolean }) {
    const drepMAV = calculatedRepMAV(drepValues.map(({ label, stake }) => ({ label, active_power: stake })), drepThreshold);
    const spoMAV = calculateSPOMAV(spoValues, spoThreshold);
    const ccMAV = 5
    const ccLength = 7;
    const totalMAV = (greyStatus.dRep ? 0 : drepMAV) + (greyStatus.SPO ? 0 : spoMAV) + (greyStatus.CC ? 0 : ccMAV);
    let totalValues: { label: string; stake: number }[] = [];

    if (!greyStatus.CC) {
        const ccValues = Array.from({ length: ccLength }, () => ({ label: 'Any CC Member', stake: 1 }));
        ccValues.forEach((value, index) => {
            if (index < ccMAV) {
                totalValues.push(value);
            }
        });
    }

    if (!greyStatus.dRep) {
        drepValues.forEach((value, index) => {
            if (index < drepMAV) {
                totalValues.push({ label: value.label, stake: 1 });
            }
        });
    }

    if (!greyStatus.SPO) {
        spoValues.forEach((value, index) => {
            if (index < spoMAV) {
                totalValues.push({ label: value.label, stake: 1 });
            }
        });
    }

    totalValues.push({ label: 'Other', stake: totalMAV });

    return { totalMAV, totalValues };
}

export function calculateProposals(spoData: Pool[], drepData: dRep[], includeInactive: boolean): Proposal[] {
    const filteredDrepData = includeInactive ? drepData : drepData.filter(drep => drep.is_active);
    spoData.sort((a, b) => b.stake - a.stake);
    filteredDrepData.sort((a, b) => b.active_power - a.active_power);

    // Move the item with label === "SINGLEPOOL" to the end
    const singlePoolIndex = spoData.findIndex(pool => pool.label === "SINGLEPOOL");
    if (singlePoolIndex !== -1) {
        const [singlePool] = spoData.splice(singlePoolIndex, 1);
        spoData.push(singlePool);
    }

    // Move the item with label === "drep_always_no_confidence" to the end
    const noConfidenceIndex = filteredDrepData.findIndex(drep => drep.drep_id === "drep_always_no_confidence");
    if (noConfidenceIndex !== -1) {
        const [noConfidenceDrep] = filteredDrepData.splice(noConfidenceIndex, 1);
        filteredDrepData.push(noConfidenceDrep);
    }

    // Move the item with label === "drep_always_abstain" to the end
    const abstainIndex = filteredDrepData.findIndex(drep => drep.drep_id === "drep_always_abstain");
    if (abstainIndex !== -1) {
        const [abstainDrep] = filteredDrepData.splice(abstainIndex, 1);
        //filteredDrepData.push(abstainDrep);                               // If we ever need to add this back this is where it would go.
    }

    const proposalTypes: Proposal[] = [
        { title: 'Uncontrolled Hard Fork', charts: [
            { title: 'SPOs', threshold: 50, size: 'large' } 
        ]},
        { title: 'No Confidence in Constitutional Committee', charts: [
            { title: 'Total', threshold: 50, size: 'medium' },
            { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7', chartType: 'gray' },
            { title: 'dReps', threshold: 67, subtitle: 'Threshold - 67%' },
            { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%' }
        ]},
        { title: 'New Constitutional Committee (Normal State)', charts: [
            { title: 'Total', threshold: 50, size: 'medium' },
            { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7', chartType: 'gray' },
            { title: 'dReps', threshold: 67, subtitle: 'Threshold - 67%' },
            { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%' }
        ]},
        { title: 'New Constitutional Committee (State of No Confidence)', charts: [
            { title: 'Total', threshold: 50, size: 'medium' },
            { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7', chartType: 'gray' },
            { title: 'dReps', threshold: 60, subtitle: 'Threshold - 60%' },
            { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%' }
        ]},
        { title: 'Update Constitution', charts: [
            { title: 'Total', threshold: 50, size: 'medium' },
            { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7' },
            { title: 'dReps', threshold: 75, subtitle: 'Threshold - 75%' },
            { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%', chartType: 'gray' }
        ]},
        { title: 'Initiate Hard Fork', charts: [
            { title: 'Total', threshold: 50, size: 'medium' },
            { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7' },
            { title: 'dReps', threshold: 67, subtitle: 'Threshold - 67%' },
            { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%' }
        ]},
        { title: 'Treasury Withdrawal', charts: [
            { title: 'Total', threshold: 50, size: 'medium' },
            { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7' },
            { title: 'dReps', threshold: 67, subtitle: 'Threshold - 67%' },
            { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%', chartType: 'gray' }
        ]},
        { title: 'Parameter Change (Network, Economic, and Technical Groups)', charts: [
            { title: 'Total', threshold: 50, size: 'medium' },
            { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7' },
            { title: 'dReps', threshold: 67, subtitle: 'Threshold - 67%' },
            { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%', chartType: 'yellow' }
        ]},
        { title: 'Parameter Change (Governance Group)', charts: [
            { title: 'Total', threshold: 50, size: 'medium' },
            { title: 'CC', threshold: 71.42857143, subtitle: 'Threshold - 5 of 7' },
            { title: 'dReps', threshold: 75, subtitle: 'Threshold - 75%' },
            { title: 'SPOs', threshold: 51, subtitle: 'Threshold - 51%', chartType: 'yellow' }
        ]},
    ];

    const ccNames = [
        { label: 'IOG', stake: 1 },
        { label: 'Cardano Foundation', stake: 1 },
        { label: 'Emurgo', stake: 1 },
        { label: 'Intersect', stake: 1 },
        { label: 'Cardano Atlantic Council', stake: 1 },
        { label: 'Cardano Japan', stake: 1 },
        { label: 'Eastern Cardano Council', stake: 1 }
    ];

    proposalTypes.forEach(proposal => {
        let totalMav = 0, spoThreshold = 0, drepThreshold = 0;
        let grayStatus = { CC: false, dRep: false, SPO: false };
        proposal.charts.forEach(chart => {
            if (chart.chartType === 'gray') {
                chart.values = [{ label: 'N/A', stake: 100 }];
                chart.displayValue = 'N/A';
                if (chart.title === 'CC') {
                    grayStatus.CC = true;
                } else if (chart.title === 'dReps') {
                    grayStatus.dRep = true;
                } else if (chart.title === 'SPOs') {
                    grayStatus.SPO = true;
                }
            } else if (chart.title === 'CC') {
                chart.values = ccNames;
                chart.displayValue = '5';
                totalMav += 5;
            } else if (chart.title === 'dReps') {
                chart.values = filteredDrepData.map(dRep => ({
                    label: dRep.given_name ? dRep.given_name : dRep.drep_id,
                    active_power: dRep.active_power,
                    is_active: dRep.is_active,
                })) as dRep[];
                chart.minPools = calculatedRepMAV(chart.values, chart.threshold);
                chart.displayValue = chart.minPools.toString();
                totalMav += chart.minPools;
                drepThreshold = chart.threshold
            } else if (chart.title === 'SPOs') {
                chart.values = spoData.map(pool => ({
                    label: pool.label,
                    stake: pool.stake,
                    // is_active: pool.is_active, // uncomment this later to be able to toggle retired SPOs.
                }));
                chart.minPools = calculateSPOMAV(chart.values, chart.threshold);
                chart.displayValue = chart.minPools.toString();
                totalMav += chart.minPools;
                spoThreshold = chart.threshold
            }
        });
        // Calculate the Total chart after all other charts have been processed
        proposal.charts.forEach(chart => {
            if (chart.title === 'Total') {
                const { totalMAV, totalValues } = calculateCombinedMAV(filteredDrepData.map(dRep => ({ label: dRep.drep_id, stake: dRep.active_power})), spoData.map(pool => ({ label: pool.label, stake: pool.stake})), drepThreshold, spoThreshold, grayStatus);
                const spoMAV = calculateSPOMAV(spoData.map(pool => ({ label: pool.label, stake: pool.stake})), 51)
                chart.minPools = totalMAV;
                chart.values = totalValues;

                if (proposal.title === 'Parameter Change (Network, Economic, and Technical Groups)' || proposal.title === 'Parameter Change (Governance Group)') {
                    chart.secondaryDisplayValue = totalMav.toString();
                    chart.displayValue = (totalMav - spoMAV).toString();
                    chart.secondaryMinPools = totalMAV - spoMAV;
                } else {
                    chart.displayValue = totalMav.toString();
                }
            }
        });
    });

    return proposalTypes;
}