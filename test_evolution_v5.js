'use strict';
const assert = require('node:assert/strict');
const { GlobalResourceGovernor, ProgressOracle, EvolutionStateMachine } = require('./ai-evolution-v5');

async function runTests() {
    let passed = 0;
    const check = async (name, fn) => {
        await fn();
        passed++;
        console.log(`[PASS] ${name}`);
    };

    console.log('=== GUARDED EVOLUTION V5 TESTS ===');

    let now = 100;
    const governor = new GlobalResourceGovernor({
        clock: () => now,
        limits: { cpuTime: 10000, memoryMb: 512, toolCalls: 50, concurrentObjectives: 2 }
    });
    await check('reservation accepts valid bounded resources', () => {
        assert.equal(governor.reserveAtomically('r1', { cpuTime: 5000, memoryMb: 128 }), true);
    });
    await check('resource overrun fails without partial reservation', () => {
        assert.equal(governor.reserveAtomically('r2', { cpuTime: 6000, memoryMb: 128 }), false);
        assert.equal(governor.snapshot().usage.cpuTime, 5000);
        assert.equal(governor.snapshot().reservations.length, 1);
    });
    await check('duplicate reservation and negative values are rejected', () => {
        assert.equal(governor.reserveAtomically('r1', { cpuTime: 1 }), false);
        assert.equal(governor.reserveAtomically('r2', { cpuTime: -1 }), false);
        assert.equal(governor.reserveAtomically('r2', { cpuTime: 0, concurrentObjectives: 0 }), false);
    });
    await check('release is idempotent and restores reserved budget', () => {
        assert.equal(governor.release('r1'), true);
        assert.equal(governor.release('r1'), false);
        assert.equal(governor.snapshot().usage.cpuTime, 0);
    });
    await check('expired lease is reclaimed using the monotonic clock source', () => {
        assert.equal(governor.reserveAtomically('lease', { toolCalls: 1 }, 10), true);
        now += 11;
        assert.equal(governor.releaseExpired(), 1);
        assert.equal(governor.snapshot().reservations.length, 0);
    });

    const noOracle = new ProgressOracle();
    const forgedEvidence = { confidence: 0.99, independentSources: 99 };
    await check('self-reported confidence is never treated as independent verification', async () => {
        assert.equal((await noOracle.verify({ objectiveId: 'x' }, forgedEvidence)).status, 'INCONCLUSIVE');
    });
    const independentOracle = new ProgressOracle({ verifier: async (_claim, evidence) => evidence.localCheck === true });
    await check('independent verifier controls verified result', async () => {
        assert.equal((await independentOracle.verify({ objectiveId: 'x' }, { localCheck: true })).status, 'VERIFIED');
        assert.equal((await independentOracle.verify({ objectiveId: 'x' }, { localCheck: false })).status, 'NOT_VERIFIED');
    });
    const failingOracle = new ProgressOracle({ verifier: async () => { throw new Error('failure'); } });
    await check('verifier errors fail closed to inconclusive', async () => {
        assert.equal((await failingOracle.verify({ objectiveId: 'x' }, {})).status, 'INCONCLUSIVE');
    });

    const machine = new EvolutionStateMachine();
    await check('objective proposal reserves bounded resources', () => {
        assert.equal(machine.proposeObjective('guardian-feedback', 'research-gap-1', { cpuTime: 10, memoryMb: 1 }).status, 'PROPOSED');
    });
    await check('duplicate objective cannot reset its budget', () => {
        assert.equal(machine.proposeObjective('guardian-feedback', 'research-gap-1', { cpuTime: 10 }).status, 'REJECTED_DUPLICATE_OBJECTIVE');
    });
    await check('progress remains inconclusive without independent verifier', async () => {
        assert.equal((await machine.claimProgress('guardian-feedback', 'research-gap-1', forgedEvidence)).status, 'INCONCLUSIVE');
    });
    await check('closing a review releases its resource reservation', () => {
        assert.equal(machine.closeObjective('research-gap-1'), true);
        assert.equal(machine.governor.snapshot().reservations.length, 0);
    });
    await check('improvement proposals are versioned and require human review', () => {
        const p1 = machine.createImprovementProposal({ category: 'RESEARCH_INSUFFICIENT', evidenceCount: 3, recommendation: 'Revisar evidencia local.' });
        const p2 = machine.createImprovementProposal({ category: 'RESEARCH_INSUFFICIENT', evidenceCount: 4, recommendation: 'Revisar evidencia local.' });
        assert.equal(p1.revision, 1);
        assert.equal(p2.revision, 2);
        assert.equal(p2.authority, 'NONE');
        assert.equal(p2.requiresHumanReview, true);
        assert.equal(p2.verification, 'INCONCLUSIVE');
    });
    await check('audit collection and entries cannot be mutated by callers', () => {
        const audit = machine.auditLog;
        assert.throws(() => audit.push({ actionId: 'TAMPERED' }), TypeError);
        assert.throws(() => { audit[0].actionId = 'TAMPERED'; }, TypeError);
        assert.notEqual(machine.auditLog[0].actionId, 'TAMPERED');
    });
    await check('audit capacity stops evolution without affecting other subsystems', () => {
        const bounded = new EvolutionStateMachine({ maxAuditEvents: 10 });
        let result;
        for (let i = 0; i < 20; i++) {
            result = bounded.createImprovementProposal({ category: 'SAFE_BLOCK', evidenceCount: i + 1, recommendation: 'Revisar.' });
            if (result.status === 'EVOLUTION_STOPPED') break;
        }
        assert.equal(result.status, 'EVOLUTION_STOPPED');
        assert.equal(bounded.stopped, true);
        assert.equal(typeof bounded.execute, 'undefined');
    });

    console.log(`\n=== RESUMEN: ${passed} PASS / 0 FAIL ===`);
}

runTests().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
