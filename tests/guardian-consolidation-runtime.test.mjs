import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = { AI_CORE: {}, crypto: globalThis.crypto };
require('../ai-core/ai-hash.js');
const { ProvenanceGraph } = require('../ai-core/ai-provenance.js');
const { IntegratedConsolidationEngine } = require('../ai-core/ai-integrated-consolidation.js');
const { ResearchEngine } = require('../ai-core/ai-research-engine.js');

const provenanceGraph = new ProvenanceGraph();
const consolidationEngine = new IntegratedConsolidationEngine(provenanceGraph);
const research = new ResearchEngine({
  offlineResolver: {
    async query() {
      return { status: 'INSUFFICIENT', results: [], staleDocs: [], freshnessWarnings: [] };
    }
  },
  reasoningEngine: {},
  webFetcher: {
    async search() {
      return [{
        url: 'https://local-fixture.invalid/bizcocho',
        title: 'Bizcocho artesanal',
        snippet: 'Bizcocho artesanal: receta local de prueba con harina, azúcar y horno.'
      }];
    },
    async fetchPage() {
      return { text: 'Bizcocho artesanal: receta local de prueba con harina, azúcar y horno.' };
    }
  },
  provenanceGraph,
  consolidationEngine
});

const report = await research.investigate('bizcocho artesanal', {});
assert.equal(report.status, 'COMPLETED');
assert.equal(report.webResultsUsed.length, 1);
assert.equal(provenanceGraph.claims.size, 1);
assert.equal(report.consolidationResults.length, 1);
assert.equal(report.consolidationResults[0].state, 'SUPPORTED');
assert.equal(consolidationEngine.getConsolidatedState(report.consolidationResults[0].claimId), 'SUPPORTED');
assert.equal(report.auditTrail.some(entry => entry.event.includes('Estado epistémico')), true);

console.log('PASS: ResearchEngine registra procedencia y conecta evidencia real del flujo con consolidación integrada.');
