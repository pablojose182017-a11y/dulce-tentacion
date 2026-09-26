/**
 * AI CORE EVOLUTION V5 - EXPERIMENTAL
 * 
 * OWNERSHIP Y DOMINIOS:
 * - COGNITION: Read, Propose
 * - EVOLUTION: Read, Propose
 * - VERIFICATION (Oracle): Verify (NO AUTHORITY)
 * - SECURITY AUTHORITY: Write, Authorize (NO COGNITION WRITES)
 * - EXECUTION: Execute, Halt
 */

class GlobalResourceGovernor {
    constructor(globalLimits) {
        this.globalLimits = globalLimits || {
            cpuTime: 10000,
            memoryMb: 512,
            toolCalls: 50,
            concurrentObjectives: 5
        };
        this.consumed = {
            cpuTime: 0,
            memoryMb: 0,
            toolCalls: 0,
            concurrentObjectives: 0
        };
        this.activeReservations = new Map();
    }

    /**
     * ATOMIC RESOURCE RESERVATION (TODO O NADA)
     */
    reserveAtomically(reservationId, requested) {
        if (
            this.consumed.cpuTime + (requested.cpuTime || 0) > this.globalLimits.cpuTime ||
            this.consumed.memoryMb + (requested.memoryMb || 0) > this.globalLimits.memoryMb ||
            this.consumed.toolCalls + (requested.toolCalls || 0) > this.globalLimits.toolCalls ||
            this.consumed.concurrentObjectives + (requested.concurrentObjectives || 0) > this.globalLimits.concurrentObjectives
        ) {
            // ROLLBACK COMPLETO - Fail Closed
            return false; 
        }

        this.consumed.cpuTime += (requested.cpuTime || 0);
        this.consumed.memoryMb += (requested.memoryMb || 0);
        this.consumed.toolCalls += (requested.toolCalls || 0);
        this.consumed.concurrentObjectives += (requested.concurrentObjectives || 0);

        this.activeReservations.set(reservationId, {
            ...requested,
            timestamp: Date.now(),
            expiresAt: Date.now() + 60000 // Lease
        });

        return true;
    }

    release(reservationId) {
        const res = this.activeReservations.get(reservationId);
        if (res) {
            this.consumed.cpuTime -= (res.cpuTime || 0);
            this.consumed.memoryMb -= (res.memoryMb || 0);
            this.consumed.toolCalls -= (res.toolCalls || 0);
            this.consumed.concurrentObjectives -= (res.concurrentObjectives || 0);
            this.activeReservations.delete(reservationId);
        }
    }
}

class ProgressOracle {
    /**
     * El oráculo solo devuelve: VERIFIED, NOT_VERIFIED, INCONCLUSIVE.
     * NUNCA devuelve GRANT_AUTHORITY.
     */
    verify(progressClaim, evidence) {
        // Deterministic local verification
        let result = "NOT_VERIFIED";
        if (!evidence || !evidence.confidence) {
            result = "INCONCLUSIVE";
        } else if (evidence.confidence > 0.8 && evidence.independentSources > 0) {
            result = "VERIFIED";
        }
        
        return {
            status: result,
            reason: "Deterministic evaluation of evidence",
            timestamp: Date.now()
        };
    }
}

class EvolutionStateMachine {
    constructor() {
        this.governor = new GlobalResourceGovernor();
        this.oracle = new ProgressOracle();
        this.auditLog = [];
        this.securityMemoryBoundary = new Map(); // Simulated read-only for evolution
    }

    proposeObjective(globalOperationId, objectiveId, requiredResources) {
        // Inheritance de budget: The objective doesn't reset global limits.
        const reservationId = `${globalOperationId}-${objectiveId}-${Date.now()}`;
        
        const success = this.governor.reserveAtomically(reservationId, requiredResources);
        
        this._audit({
            globalOperationId,
            objectiveId,
            actionId: "PROPOSE",
            resourceReservation: reservationId,
            decision: success ? "RESERVED" : "REJECTED_RESOURCE_LIMIT",
            timestamp: Date.now()
        });

        if (!success) {
            return { status: "FAILED_RESOURCES", globalOperationId };
        }

        return { status: "PROPOSED", globalOperationId, objectiveId, reservationId };
    }

    claimProgress(globalOperationId, objectiveId, evidence) {
        // Evolution can claim progress, but Oracle verifies
        const verification = this.oracle.verify({ objectiveId }, evidence);
        
        this._audit({
            globalOperationId,
            objectiveId,
            actionId: "PROGRESS_CLAIM",
            evidence: evidence,
            verification: verification.status,
            result: verification.status === "VERIFIED" ? "ACCEPTED" : "REJECTED",
            timestamp: Date.now()
        });

        return verification.status;
    }

    _audit(event) {
        // Immutability enforced locally
        this.auditLog.push(Object.freeze({ ...event }));
    }
}

if (typeof module !== 'undefined') {
    module.exports = {
        GlobalResourceGovernor,
        ProgressOracle,
        EvolutionStateMachine
    };
}
