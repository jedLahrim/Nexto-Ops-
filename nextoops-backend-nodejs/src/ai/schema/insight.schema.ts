export const INSIGHT_OUTPUT_JSON_SCHEMA = {
  type: 'object',
  required: ['insight', 'whyItIsImportant', 'tip'],
  properties: {
    insight: { type: 'string' },
    whyItIsImportant: { type: 'string' },
    tip: { type: 'string' }
  },
  additionalProperties: true
};
