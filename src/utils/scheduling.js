import {RRule} from "rrule";

const rRuleFrequencies = [
    'yearly',
    'monthly',
    'weekly',
    'daily',
    'hourly',
];

const freqMap = {
    yearly:  RRule.YEARLY,
    monthly: RRule.MONTHLY,
    weekly:  RRule.WEEKLY,
    daily:   RRule.DAILY,
    hourly:  RRule.HOURLY,
};

const freqLabels = {
    [RRule.YEARLY]:  'yearly',
    [RRule.MONTHLY]: 'monthly',
    [RRule.WEEKLY]:  'weekly',
    [RRule.DAILY]:   'daily',
    [RRule.HOURLY]:  'hourly',
}

export const labelToRRuleFrequency = (label) => freqMap[label];
export const rRuleFrequencyToLabel = (frequency) => freqLabels[frequency];

export default {
    iCal: {
        frequencies: rRuleFrequencies,
        labelToRRuleFrequency,
        rRuleFrequencyToLabel,
    },
}
