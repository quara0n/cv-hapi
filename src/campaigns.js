// Public campaign codes only; never accept raw URLs, click IDs or document text.
export const CAMPAIGNS=['mk-search-cv','mk-students','mk-jobs','mk-organic-guide'];
export const campaignCode=value=>CAMPAIGNS.includes(value)?value:'none';
