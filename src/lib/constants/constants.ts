import type { Proposal } from '$lib/types/types';

export const proposalTypes: Proposal[] = [
    {
        title: 'Fewest # of SPOs Capable of Performing a 51% Attack',
        charts: [
            {
                title: 'SPOs',
                threshold: 50,
                size: 'large',
                tooltipMessage: 'The fewest number of stake pool operators who could collude to conduct an uncontrolled hard fork, otherwise known as a 51% attack.'
            }
        ]
    },
    {
        title: '% of Circulating ADA Delegated to dReps',
        charts: [
            {
                title: 'Total',
                threshold: 50,
                size: 'medium',
                tooltipMessage: 'The percentage of total circulating ADA that is delegated to dReps as voting power.'
            }
        ]
    },
    {
        title: '% of Circulating ADA Delegated to Stake Pools',
        charts: [
            {
                title: 'Total',
                threshold: 50,
                size: 'medium',
                tooltipMessage: 'The percentage of total circulating ADA that is delegated to stake pools.<br/><br/>Cardano stake pools (known as validators in other blockchain ecosystems) have a limit to the total amount of delegated stake they can manage. However, some stake pool operators open additional stake pools to bypass this constraint. Therefore, stake pools and stake pool operators are tracked separately here.'
            }
        ]
    },
    {
        title: 'Fewest # Needed to Pass a Vote of No Confidence in Constitutional Committee',
        charts: [
            {
                title: 'Total',
                threshold: 50,
                size: 'medium',
                tooltipMessage: 'The fewest number of entities totaled across CC, dReps, and SPOs who could collaborate to pass this proposal.'
            },
            {
                title: 'CC',
                threshold: 71.42857143,
                subtitle: 'Threshold - 5 of 7',
                chartType: 'gray',
                tooltipMessage: 'The minimum number of constitutional committee members who must approve this proposal for it to pass.'
            },
            {
                title: 'dReps',
                threshold: 67,
                subtitle: 'Threshold - 67%',
                tooltipMessage: 'The fewest number of dReps needed to surpass the required voting power threshold for this proposal.'
            },
            {
                title: 'SPOs',
                threshold: 51,
                subtitle: 'Threshold - 51%',
                tooltipMessage: 'The fewest number of stake pool operators needed to surpass the required stake threshold for this proposal.'
            }
        ]
    },
    {
        title: 'Fewest # Needed to Elect a New Constitutional Committee while in a Normal State',
        charts: [
            {
                title: 'Total',
                threshold: 50,
                size: 'medium',
                tooltipMessage: 'The fewest number of entities totaled across CC, dReps, and SPOs who could collaborate to pass this proposal.'
            },
            {
                title: 'CC',
                threshold: 71.42857143,
                subtitle: 'Threshold - 5 of 7',
                chartType: 'gray',
                tooltipMessage: 'The minimum number of constitutional committee members who must approve this proposal for it to pass.'
            },
            {
                title: 'dReps',
                threshold: 67,
                subtitle: 'Threshold - 67%',
                tooltipMessage: 'The fewest number of dReps needed to surpass the required voting power threshold for this proposal.'
            },
            {
                title: 'SPOs',
                threshold: 51,
                subtitle: 'Threshold - 51%',
                tooltipMessage: 'The fewest number of stake pool operators needed to surpass the required stake threshold for this proposal.'
            }
        ]
    },
    {
        title: 'Fewest # Needed to Elect a New Constitutional Committee while in a State of No Confidence',
        charts: [
            {
                title: 'Total',
                threshold: 50,
                size: 'medium',
                tooltipMessage: 'The fewest number of entities totaled across CC, dReps, and SPOs who could collaborate to pass this proposal.'
            },
            {
                title: 'CC',
                threshold: 71.42857143,
                subtitle: 'Threshold - 5 of 7',
                chartType: 'gray',
                tooltipMessage: 'The minimum number of constitutional committee members who must approve this proposal for it to pass.'
            },
            {
                title: 'dReps',
                threshold: 60,
                subtitle: 'Threshold - 60%',
                tooltipMessage: 'The fewest number of dReps needed to surpass the required voting power threshold for this proposal.'
            },
            {
                title: 'SPOs',
                threshold: 51,
                subtitle: 'Threshold - 51%',
                tooltipMessage: 'The fewest number of stake pool operators needed to surpass the required stake threshold for this proposal.'
            }
        ]
    },
    {
        title: 'Fewest # Needed to Update the Cardano Constitution',
        charts: [
            {
                title: 'Total',
                threshold: 50,
                size: 'medium',
                tooltipMessage: 'The fewest number of entities totaled across CC, dReps, and SPOs who could collaborate to pass this proposal.'
            },
            {
                title: 'CC',
                threshold: 71.42857143,
                subtitle: 'Threshold - 5 of 7',
                tooltipMessage: 'The minimum number of constitutional committee members who must approve this proposal for it to pass.'
            },
            {
                title: 'dReps',
                threshold: 75,
                subtitle: 'Threshold - 75%',
                tooltipMessage: 'The fewest number of dReps needed to surpass the required voting power threshold for this proposal.'
            },
            {
                title: 'SPOs',
                threshold: 51,
                subtitle: 'Threshold - 51%',
                chartType: 'gray',
                tooltipMessage: 'The fewest number of stake pool operators needed to surpass the required stake threshold for this proposal.'
            }
        ]
    },
    {
        title: 'Fewest # Needed to Initiate a Hard Fork',
        charts: [
            {
                title: 'Total',
                threshold: 50,
                size: 'medium',
                tooltipMessage: 'The fewest number of entities totaled across CC, dReps, and SPOs who could collaborate to pass this proposal.'
            },
            {
                title: 'CC',
                threshold: 71.42857143,
                subtitle: 'Threshold - 5 of 7',
                tooltipMessage: 'The minimum number of constitutional committee members who must approve this proposal for it to pass.'
            },
            {
                title: 'dReps',
                threshold: 67,
                subtitle: 'Threshold - 67%',
                tooltipMessage: 'The fewest number of dReps needed to surpass the required voting power threshold for this proposal.'
            },
            {
                title: 'SPOs',
                threshold: 51,
                subtitle: 'Threshold - 51%',
                tooltipMessage: 'The fewest number of stake pool operators needed to surpass the required stake threshold for this proposal.'
            }
        ]
    },
    {
        title: 'Fewest # Needed to Withdraw from the Cardano Treasury',
        charts: [
            {
                title: 'Total',
                threshold: 50,
                size: 'medium',
                tooltipMessage: 'The fewest number of entities totaled across CC, dReps, and SPOs who could collaborate to pass this proposal.'
            },
            {
                title: 'CC',
                threshold: 71.42857143,
                subtitle: 'Threshold - 5 of 7',
                tooltipMessage: 'The minimum number of constitutional committee members who must approve this proposal for it to pass.'
            },
            {
                title: 'dReps',
                threshold: 67,
                subtitle: 'Threshold - 67%',
                tooltipMessage: 'The fewest number of dReps needed to surpass the required voting power threshold for this proposal.'
            },
            {
                title: 'SPOs',
                threshold: 51,
                subtitle: 'Threshold - 51%',
                chartType: 'gray',
                tooltipMessage: 'The fewest number of stake pool operators needed to surpass the required stake threshold for this proposal.'
            }
        ]
    },
    {
        title: 'Fewest # Needed to Change a Network, Economic, or Technical Parameter',
        charts: [
            {
                title: 'Total',
                threshold: 50,
                size: 'medium',
                tooltipMessage: 'The fewest number of entities totaled across CC, dReps, and SPOs who could collaborate to pass this proposal.<br/><br/>The smaller number in orange is used when the parameter to change is ALSO a security parameter, which counts SPO votes in addition to dReps and CC members.  If it is not a security parameter, SPOs votes are not counted.'
            },
            {
                title: 'CC',
                threshold: 71.42857143,
                subtitle: 'Threshold - 5 of 7',
                tooltipMessage: 'The minimum number of constitutional committee members who must approve this proposal for it to pass.'
            },
            {
                title: 'dReps',
                threshold: 67,
                subtitle: 'Threshold - 67%',
                tooltipMessage: 'The fewest number of dReps needed to surpass the required voting power threshold for this proposal.'
            },
            {
                title: 'SPOs',
                threshold: 51,
                subtitle: 'Threshold - 51%',
                chartType: 'yellow',
                tooltipMessage: 'The fewest number of stake pool operators needed to surpass the required stake threshold for this proposal.<br/><br/>SPOs only vote on this proposal if the parameter to be changed is a security parameter.'
            }
        ]
    },
    {
        title: 'Fewest # Needed to Change a Governance Parameter',
        charts: [
            {
                title: 'Total',
                threshold: 50,
                size: 'medium',
                tooltipMessage: 'The fewest number of entities totaled across CC, dReps, and SPOs who could collaborate to pass this proposal.<br/><br/>The smaller number in orange is used when the parameter to change is ALSO a security parameter, which counts SPO votes in addition to dReps and CC members.  If it is not a security parameter, SPOs votes are not counted.'
            },
            {
                title: 'CC',
                threshold: 71.42857143,
                subtitle: 'Threshold - 5 of 7',
                tooltipMessage: 'The minimum number of constitutional committee members who must approve this proposal for it to pass.'
            },
            {
                title: 'dReps',
                threshold: 75,
                subtitle: 'Threshold - 75%',
                tooltipMessage: 'The fewest number of dReps needed to surpass the required voting power threshold for this proposal.'
            },
            {
                title: 'SPOs',
                threshold: 51,
                subtitle: 'Threshold - 51%',
                chartType: 'yellow',
                tooltipMessage: 'The fewest number of stake pool operators needed to surpass the required stake threshold for this proposal.<br/><br/>SPOs only vote on this proposal if the parameter to be changed is a security parameter.'
            }
        ]
    }
];

export const ccNames = [
    { label: 'IOG', stake: 1 },
    { label: 'Cardano Foundation', stake: 1 },
    { label: 'Emurgo', stake: 1 },
    { label: 'Intersect', stake: 1 },
    { label: 'Cardano Atlantic Council', stake: 1 },
    { label: 'Cardano Japan', stake: 1 },
    { label: 'Eastern Cardano Council', stake: 1 }
];