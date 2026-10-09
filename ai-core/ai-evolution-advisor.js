if (typeof window !== 'undefined') {
    window.AI_CORE = window.AI_CORE || {};
}

/**
 * Evolution Advisor: bounded local self-evaluation, not self-modifying code.
 * It stores only counters and response categories in memory. It never receives
 * user text, persists data, changes knowledge/permissions, or executes actions.
 */
class EvolutionAdvisor {
    constructor(options = {}) {
        this.threshold = Math.max(2, Math.min(10, options.threshold || 3));
        this.maxSignals = Math.max(20, Math.min(200, options.maxSignals || 100));
        this.maxProposals = Math.max(5, Math.min(30, options.maxProposals || 20));
        const EvolutionStateMachine = typeof window !== 'undefined' && window.AI_CORE && window.AI_CORE.EvolutionStateMachine;
        this.stateMachine = EvolutionStateMachine
            ? new EvolutionStateMachine({ maxProposals: this.maxProposals })
            : null;
        this.signals = [];
        this.counts = new Map();
        this.proposals = new Map();
        this.sequence = 0;
    }

    _classify(response) {
        const text = String(response || '').slice(0, 2000);
        if (/\[FAIL_CLOSED\]|\[SEMANTIC_VALIDATION_REJECTED\]/i.test(text)) return 'SAFE_BLOCK';
        if (/\[ERROR DE INVESTIGACI[ÓO]N\]|\[INVESTIGACI[ÓO]N FALLIDA\]/i.test(text)) return 'RESEARCH_INSUFFICIENT';
        if (/\[RAZONAMIENTO LOCAL\][\s\S]*Falta información:|\[CLARIFICACI[ÓO]N\]/i.test(text)) return 'MISSING_INFORMATION';
        if (/Contradicciones?:/i.test(text)) return 'CONFLICTING_EVIDENCE';
        return null;
    }

    observe(response) {
        const category = this._classify(response);
        if (!category) return Object.freeze({ observed: false, reason: 'NO_QUALIFIED_SIGNAL' });

        const signal = Object.freeze({ category, sequence: ++this.sequence });
        this.signals.push(signal);
        if (this.signals.length > this.maxSignals) this.signals.shift();

        const count = (this.counts.get(category) || 0) + 1;
        this.counts.set(category, count);

        let proposal = this.proposals.get(category) || null;
        if (count >= this.threshold && count % this.threshold === 0) {
            const advice = this._adviceFor(category);
            const revision = proposal ? proposal.revision + 1 : 1;
            const fallbackProposal = Object.freeze({
                id: `evo-${category.toLowerCase()}`,
                category,
                revision,
                status: 'PROPOSED',
                evidenceCount: count,
                recommendation: advice,
                verification: 'INCONCLUSIVE',
                authority: 'NONE',
                requiresHumanReview: true
            });
            proposal = this.stateMachine
                ? this.stateMachine.createImprovementProposal({ category, evidenceCount: count, recommendation: advice })
                : fallbackProposal;
            if (proposal.status !== 'PROPOSED') {
                return Object.freeze({ observed: true, category, count, proposal: null, evolutionStatus: proposal.status });
            }
            this.proposals.set(category, proposal);
            this._trimProposals();
        }
        return Object.freeze({ observed: true, category, count, proposal });
    }

    _adviceFor(category) {
        const recommendations = {
            SAFE_BLOCK: 'Revisar manualmente las solicitudes bloqueadas y comprobar si falta una herramienta segura o una explicación más clara. No relajar permisos.',
            RESEARCH_INSUFFICIENT: 'Revisar qué conocimiento local o evidencia verificable falta para las consultas de investigación sin suficiente respaldo.',
            MISSING_INFORMATION: 'Revisar si las preguntas de aclaración solicitan el dato mínimo necesario y si existe una fuente local para recuperarlo.',
            CONFLICTING_EVIDENCE: 'Revisar las fuentes en conflicto y su procedencia; no consolidar automáticamente ninguna como hecho.'
        };
        return recommendations[category] || 'Revisar manualmente las señales locales antes de proponer un cambio.';
    }

    _trimProposals() {
        while (this.proposals.size > this.maxProposals) {
            const oldest = this.proposals.keys().next().value;
            this.proposals.delete(oldest);
        }
    }

    getProposals() {
        if (this.stateMachine) return this.stateMachine.getProposals();
        return Object.freeze(Array.from(this.proposals.values(), proposal => Object.freeze({ ...proposal })));
    }

    reviewProposal(id, revision, decision) {
        if (!this.stateMachine) return false;
        return this.stateMachine.reviewImprovementProposal(id, revision, decision);
    }
}

if (typeof window !== 'undefined') window.AI_CORE.EvolutionAdvisor = EvolutionAdvisor;
if (typeof module !== 'undefined') module.exports = { EvolutionAdvisor };
