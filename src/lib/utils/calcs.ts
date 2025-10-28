import type { Proposal, Pool, dRep, FetchDataResult } from '$lib/types/types';
import { proposalTypes, ccNames } from '$lib/constants/constants';

export async function fetchData(): Promise<FetchDataResult & { totalData: { total_spos: number; total_pools: number; circulating_ada: number, total_dreps: number } }> {
    const [spoData, drepData, spoTotal, drepTotal] = await Promise.all([
      fetch('/api/get_spos')
        .then((res) => res.json())
        .then((data) => data.value),
      fetch('/api/get_dreps')
        .then((res) => res.json())
        .then((data) => data.value),
      fetch('/api/get_spo_totals')
        .then((res) => res.json())
        .then((data) => data.value),
      fetch('/api/get_drep_totals')
        .then((res) => res.json())
        .then((data) => data.value),
    ]);
  
    const totalData = {
      total_spos: spoTotal.total_spos,
      total_pools: spoTotal.total_pools,
      circulating_ada: Math.round(spoTotal.circulating_ada),
      total_dreps: drepTotal.total_dreps,
    };
  
    return { spoData, drepData, totalData };
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

export function calculateProposals(spoData: Pool[], drepData: dRep[], circulatingADA: number, includeInactive: boolean): Proposal[] {
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

    proposalTypes.forEach(proposal => {
        if (proposal.title === '% of Circulating ADA Delegated to dReps') {
            let totalVotingPowerDelegated = filteredDrepData.reduce((acc, drep) => acc + drep.active_power, 0) / 1_000_000;
            let delegatedPercent = (totalVotingPowerDelegated / circulatingADA) * 100;
            let undelegatedPercent = 100 - delegatedPercent;
            proposal.charts[0].values = [
                { label: 'Delegated Voting Power', active_power: delegatedPercent } as dRep,
                { label: 'Undelegated Voting Power', active_power: undelegatedPercent } as dRep
            ];
            proposal.charts[0].displayValue = `${delegatedPercent.toFixed(1)}%`;
        } else if (proposal.title === '% of Circulating ADA Delegated to Stake Pools') {
            let totalStakeDelegated = spoData.reduce((acc, pool) => acc + pool.stake, 0);
            let delegatedPercent = (totalStakeDelegated / circulatingADA) * 100;
            let undelegatedPercent = 100 - delegatedPercent;
            proposal.charts[0].values = [
                { label: 'Delegated Stake', stake: delegatedPercent } as Pool,
                { label: 'Undelegated Stake', stake: undelegatedPercent } as Pool
            ];
            proposal.charts[0].displayValue = `${delegatedPercent.toFixed(1)}%`;
        } else {
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

                    if (proposal.title === 'Fewest # Needed to Change a Network, Economic, or Technical Parameter' || proposal.title === 'Fewest # Needed to Change a Governance Parameter') {
                        chart.secondaryDisplayValue = totalMav.toString();
                        chart.displayValue = (totalMav - spoMAV).toString();
                        chart.secondaryMinPools = totalMAV - spoMAV;
                    } else {
                        chart.displayValue = totalMav.toString();
                    }
                }
            });
        }
    });

    return proposalTypes;
}