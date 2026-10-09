import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
globalThis.window = { AI_CORE: {} };
require('../ai-evolution-v5.js');
const { EvolutionAdvisor } = require('../ai-core/ai-evolution-advisor.js');
const bridgeSource = readFileSync(new URL('../ai-core/ai-chat-bridge.js', import.meta.url), 'utf8');
const builderSource = readFileSync(new URL('../build-bundle.js', import.meta.url), 'utf8');

const advisor = new EvolutionAdvisor({ threshold: 3, maxSignals: 20, maxProposals: 5 });
assert.equal(advisor.observe('[RAZONAMIENTO LOCAL] Resuelto con datos suficientes.').observed, false);

for (let i = 0; i < 2; i++) {
    assert.equal(advisor.observe('[INVESTIGACIÓN FALLIDA] Sin evidencia suficiente.').proposal, null);
}
const signal = advisor.observe('[INVESTIGACIÓN FALLIDA] Sin evidencia suficiente.');
assert.equal(signal.proposal.status, 'PROPOSED');
assert.equal(signal.proposal.evidenceCount, 3);
assert.equal(signal.proposal.requiresHumanReview, true);
assert.equal(signal.proposal.authority, 'NONE');
assert.equal(signal.proposal.recommendation.includes('Revisar'), true);
assert.equal(JSON.stringify(signal.proposal).includes('INVESTIGACIÓN FALLIDA'), false);

const proposalList = advisor.getProposals();
assert.equal(Object.isFrozen(proposalList), true);
assert.equal(Object.isFrozen(proposalList[0]), true);
assert.throws(() => { proposalList[0].status = 'APPROVED'; }, TypeError);
assert.equal(advisor.getProposals()[0].status, 'PROPOSED');
assert.equal(advisor.reviewProposal(signal.proposal.id, signal.proposal.revision, 'ACCEPT_FOR_MANUAL_IMPLEMENTATION'), true);
assert.equal(advisor.getProposals()[0].status, 'ACCEPTED_FOR_MANUAL_IMPLEMENTATION');
assert.equal(typeof advisor.stateMachine.execute, 'undefined', 'La revisión no debe ejecutar ni aplicar cambios.');

advisor.observe('[FAIL_CLOSED] operación denegada');
advisor.observe('[RAZONAMIENTO LOCAL]\nFalta información: rendimiento');
advisor.observe('[INVESTIGACIÓN COMPLETA]\nContradicciones: fuentes distintas');
assert.equal(advisor.getProposals().length, 1, 'No debe crear una propuesta antes del umbral por categoría.');

for (let i = 0; i < 30; i++) advisor.observe('[ERROR DE INVESTIGACIÓN] sin red');
assert.equal(advisor.signals.length, 20, 'La memoria de observaciones debe permanecer acotada.');
assert.match(bridgeSource, /new window\.AI_CORE\.EvolutionAdvisor/);
assert.match(bridgeSource, /getEvolutionProposals\(\)/);
assert.match(builderSource, /ai-core\/ai-evolution-advisor\.js/);

console.log('PASS: Evolution local observa señales, genera propuestas acotadas y versionadas, y permanece sin autoridad.');
