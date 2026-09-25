window.AI_CORE = window.AI_CORE || {};

/**
 * Investigation Engine
 * Arquitecto analítico que traza rutas para resolver la incertidumbre 
 * dejada por el ReasoningEngine. NO ejecuta el plan.
 */
class InvestigationEngine {
    constructor(aiProvider) {
        this.aiProvider = aiProvider;
    }

    _generateId() {
        return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    _transition(plan, newStatus) {
        plan.status = newStatus;
        plan.trace.push(newStatus);
    }

    /**
     * Falso AI Provider mockeado para pruebas deterministas
     */
    async _mockAIProvider(input) {
        const problem = input.problemStatement.toLowerCase();
        
        const evidenceRequired = [];
        const rawSteps = [];

        if (problem.includes("logs missing")) {
            evidenceRequired.push({
                id: "req_logs",
                targetVariable: "System Logs",
                supportsHypothesis: "h_unknown",
                refutesHypothesis: "none",
                description: "Obtener logs del sistema"
            });
            rawSteps.push({
                stepId: "step_1",
                type: "USER_INTERACTION",
                evidenceRequirementId: "req_logs",
                proposedTool: null,
                governanceLevel: 0,
                dependencies: [],
                expectedResult: "Logs provistos por usuario",
                stopCondition: "User refuses",
                continueCondition: "Logs received"
            });
        }
        
        if (problem.includes("fake tool")) {
            evidenceRequired.push({
                id: "req_fake",
                targetVariable: "Fake Variable",
                supportsHypothesis: "h_fake",
                refutesHypothesis: "none",
                description: "Test fake tool"
            });
            rawSteps.push({
                stepId: "step_fake",
                type: "TOOL_EXECUTION",
                evidenceRequirementId: "req_fake",
                proposedTool: "non_existent_tool_123",
                governanceLevel: 1,
                dependencies: [],
                expectedResult: "Fake result"
            });
        }

        if (problem.includes("nuclear test")) {
            evidenceRequired.push({
                id: "req_nuclear",
                targetVariable: "Nuclear Core State",
                supportsHypothesis: "h_nuclear",
                refutesHypothesis: "none",
                description: "Test destructivo de core"
            });
            rawSteps.push({
                stepId: "step_nuclear",
                type: "TOOL_EXECUTION",
                evidenceRequirementId: "req_nuclear",
                proposedTool: "core_reset_tool", // Asumimos que está en el registry de test
                governanceLevel: 5,
                dependencies: [],
                expectedResult: "Core reset"
            });
        }

        if (problem.includes("complex test")) {
            evidenceRequired.push({
                id: "req_conn", targetVariable: "Connectivity", supportsHypothesis: "h_net", refutesHypothesis: "none", description: "Comprobar ping"
            }, {
                id: "req_dns", targetVariable: "DNS", supportsHypothesis: "h_dns", refutesHypothesis: "none", description: "Comprobar dns"
            });
            
            rawSteps.push({
                stepId: "step_net",
                type: "TOOL_EXECUTION",
                evidenceRequirementId: "req_conn",
                proposedTool: "ping_tool",
                governanceLevel: 1,
                dependencies: [],
                expectedResult: "Ping OK"
            });
            rawSteps.push({
                stepId: "step_dns",
                type: "TOOL_EXECUTION",
                evidenceRequirementId: "req_dns",
                proposedTool: "dns_tool",
                governanceLevel: 1,
                dependencies: ["step_net"],
                expectedResult: "DNS OK"
            });
        }

        return { evidenceRequired, rawSteps };
    }

    async investigate(input) {
        const plan = {
            investigationId: this._generateId(),
            status: "OBSERVE",
            problemStatement: input.problemStatement,
            uncertainty: input.reasoningOutput?.uncertainty?.level || "UNKNOWN",
            hypothesesUnderInvestigation: [],
            evidenceRequired: [],
            investigationSteps: [],
            blockedSteps: [],
            authorizationRequirements: {
                highestLevelRequired: 0,
                authorizationRequired: false
            },
            constraints: input.constraints || [],
            stopConditions: [],
            trace: ["OBSERVE"]
        };

        try {
            // 1. OBSERVE & ANALYZE
            this._transition(plan, "ANALYZE");
            if (plan.uncertainty === "LOW") {
                plan.stopConditions.push("EVIDENCE_ALREADY_SUFFICIENT");
                this._transition(plan, "PLANNING_COMPLETED");
                return plan;
            }

            // 2. IDENTIFY_UNKNOWN & FORM_HYPOTHESES
            this._transition(plan, "IDENTIFY_UNKNOWN");
            this._transition(plan, "FORM_HYPOTHESES");
            if (input.reasoningOutput?.hypotheses) {
                plan.hypothesesUnderInvestigation = input.reasoningOutput.hypotheses
                    .filter(h => h.status === "UNSUPPORTED_HYPOTHESIS")
                    .map(h => h.id);
            }

            // 3. DEFINE_REQUIRED_EVIDENCE & BUILD_INVESTIGATION_PLAN
            this._transition(plan, "DEFINE_REQUIRED_EVIDENCE");
            const aiDraft = await this._mockAIProvider(input);
            plan.evidenceRequired = aiDraft.evidenceRequired;

            this._transition(plan, "BUILD_INVESTIGATION_PLAN");
            
            const toolRegistry = new Set(input.availableToolRegistry || []);

            for (let rawStep of aiDraft.rawSteps) {
                if (rawStep.type === "TOOL_EXECUTION") {
                    if (!toolRegistry.has(rawStep.proposedTool)) {
                        plan.blockedSteps.push({
                            toolId: rawStep.proposedTool,
                            evidenceRequirementId: rawStep.evidenceRequirementId,
                            relatedHypothesis: null, // Mapeo simplificado
                            reason: "La investigación requerida no puede ejecutarse porque no existe una herramienta registrada capaz de obtener esta evidencia.",
                            status: "TOOL_NOT_FOUND"
                        });
                        continue;
                    }
                }

                // Asegurar inmutabilidad de la ejecución
                rawStep.authorizationRequired = rawStep.governanceLevel >= 3;
                rawStep.executionAllowed = false; // NUNCA CONCEDE EJECUCIÓN

                plan.investigationSteps.push(rawStep);
                
                if (rawStep.governanceLevel > plan.authorizationRequirements.highestLevelRequired) {
                    plan.authorizationRequirements.highestLevelRequired = rawStep.governanceLevel;
                    if (rawStep.governanceLevel >= 3) {
                        plan.authorizationRequirements.authorizationRequired = true;
                    }
                }
            }

            if (plan.investigationSteps.length === 0 && plan.blockedSteps.length === 0) {
                plan.stopConditions.push("INVESTIGATION_REDUNDANT");
            }

            // 4. AUTHORIZATION_ASSESSMENT
            this._transition(plan, "AUTHORIZATION_ASSESSMENT");
            
            // 5. WAIT_FOR_EXECUTION_LAYER
            this._transition(plan, "WAIT_FOR_EXECUTION_LAYER");

        } catch (e) {
            plan.error = e.message;
            this._transition(plan, "STRUCTURAL_ERROR");
        }

        return plan;
    }
}

window.AI_CORE.InvestigationEngine = InvestigationEngine;
