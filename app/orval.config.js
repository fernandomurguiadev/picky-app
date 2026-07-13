/** @type {import('orval').Options} */
module.exports = {
  pickyApi: {
    input: 'http://localhost:1000/api/docs-json',
    output: {
      mode: 'tags-split',
      target: 'src/api/generated/endpoints',
      schemas: 'src/api/generated/model',
      client: 'react-query',
      mock: false,
      override: {
        mutator: {
          path: 'src/lib/api/mutator.ts',
          name: 'customMutator'
        }
      }
    }
  }
};
