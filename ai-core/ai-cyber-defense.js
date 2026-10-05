window.AI_CORE = window.AI_CORE || {};

class IndicatorExtractor {
    extract(text) {
        if (!text) return [];
        const indicators = [];
        
        // Basic naive extraction for simulation purposes
        const ipMatches = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g);
        if (ipMatches) {
            ipMatches.forEach(ip => indicators.push({ type: 'IP', value: ip }));
        }

        const hashMatches = text.match(/\b[A-Fa-f0-9]{64}\b/g); // SHA256
        if (hashMatches) {
            hashMatches.forEach(h => indicators.push({ type: 'SHA256', value: h }));
        }

        return indicators;
    }
}

class CyberDefenseEngine {
    constructor(deps = {}) {
        this.knowledgeManager = deps.knowledgeManager;
        this.provenanceGraph = deps.provenanceGraph;
        this.retentionEngine = deps.retentionEngine;
        this.autonomousPolicyEngine = deps.autonomousPolicyEngine;
        this.indicatorExtractor = new IndicatorExtractor();
        
        this.incidents = new Map();
    }

    /**
     * Triage an observation into a potential incident.
     */
    analyzeObservation(sourceId, textObservation, context = {}) {
        const indicators = this.indicatorExtractor.extract(textObservation);
        
        // Formulate Hypotheses
        const hypotheses = [
            { id: 'H1', description: 'Legitimate application behavior', confidence: 0.3 },
            { id: 'H2', description: 'Misconfiguration', confidence: 0.3 },
            { id: 'H3', description: 'Malicious activity', confidence: 0.4 }
        ];

        let severity = 'INFO';
        if (indicators.some(i => i.type === 'SHA256')) severity = 'MEDIUM';
        if (textObservation.toLowerCase().includes('malware') || textObservation.toLowerCase().includes('exploit')) {
            severity = 'HIGH';
            hypotheses[2].confidence = 0.8;
            hypotheses[0].confidence = 0.1;
            hypotheses[1].confidence = 0.1;
        }

        const incidentId = 'inc_' + Date.now() + '_' + Math.floor(Math.random()*1000);
        
        const incident = {
            incidentId,
            detectedAt: new Date().toISOString(),
            severity,
            state: 'TRIAGE',
            source: sourceId,
            observations: [textObservation],
            indicators,
            hypotheses,
            recommendedActions: []
        };

        if (severity === 'HIGH' || severity === 'CRITICAL') {
            incident.recommendedActions.push({
                action: 'QUARANTINE_ARTIFACT',
                target: context.targetArtifact || 'unknown',
                reason: 'High severity indicators detected'
            });
            incident.state = 'CONTAINMENT_RECOMMENDED';
        } else {
            incident.state = 'ANALYZING';
        }

        this.incidents.set(incidentId, incident);

        if (this.provenanceGraph) {
            const src = this.provenanceGraph.registerSource({
                sourceId,
                content: textObservation,
                confidence: 0.8
            });
            
            indicators.forEach(ind => {
                this.provenanceGraph.registerClaim({
                    subject: incidentId,
                    predicate: 'has_indicator',
                    objectValue: ind.value
                }, src, { indicatorType: ind.type });
            });
        }

        return incident;
    }

    getIncident(incidentId) {
        return this.incidents.get(incidentId);
    }

    /**
     * Check if indicators have been seen locally before using KM and Provenance
     */
    async correlateIndicators(incidentId) {
        const incident = this.incidents.get(incidentId);
        if (!incident || !this.knowledgeManager) return { correlated: [] };

        const correlations = [];
        for (const ind of incident.indicators) {
            const results = await this.knowledgeManager.search(ind.value);
            if (results && results.length > 0) {
                correlations.push({
                    indicator: ind.value,
                    matches: results.map(r => r.document.id)
                });
            }
        }
        return { correlated: correlations };
    }

    /**
     * Creates an Action Proposal for remediation without executing it.
     */
    proposeRemediation(incidentId, recommendationIndex = 0) {
        const incident = this.incidents.get(incidentId);
        if (!incident || !incident.recommendedActions[recommendationIndex]) {
            throw new Error("Invalid incident or recommendation");
        }

        const rec = incident.recommendedActions[recommendationIndex];
        
        return {
            type: "DEFENSIVE_REMEDIATION",
            action: rec.action,
            target: rec.target,
            reason: rec.reason,
            incidentId: incident.incidentId
        };
    }
}

window.AI_CORE.CyberDefenseEngine = CyberDefenseEngine;
