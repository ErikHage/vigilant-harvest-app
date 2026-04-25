import {RRule} from "rrule";
import dayjs from "dayjs";

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

const yearOffsetItems = [
    {
        label: 'previous',
        value: -1,
    },
    {
        label: 'current',
        value: 0,
    },
    {
        label: 'next',
        value: 1,
    }
];

const labelToYearOffset = {
    'previous': -1,
    'current': 0,
    'next': 1,
};

const labelToRRuleFrequency = (label) => freqMap[label];
const rRuleFrequencyToLabel = (frequency) => freqLabels[frequency];

function formatDate(dateString) {
    return dayjs.utc(dateString).format('MMM D');
}

// expects dates in year-less MM-dd format (ex: 05-15)
function getFormattedDateRange(start, end) {
    if (start && end) {
        if (start === end) {
            return formatDate(`2000-${start}`);
        } else {
            return formatDate(`2000-${start}`) + " - " + formatDate(`2000-${end}`);
        }
    }
    return "";
}

export default {
    iCal: {
        frequencies: rRuleFrequencies,
        labelToRRuleFrequency,
        rRuleFrequencyToLabel,
    },
    yearOffset: {
        items: yearOffsetItems,
        labelToYearOffset,
    },
    getFormattedDateRange,
}
