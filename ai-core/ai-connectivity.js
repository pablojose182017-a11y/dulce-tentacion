window.AI_CORE = window.AI_CORE || {};

class ConnectivityPolicyEngine {
    constructor() {
        this.currentState = 'ONLINE'; // Can be ONLINE, OFFLINE, UNKNOWN
        // Patterns that shouldn't be automatically transmitted in URLs/queries (Exfiltration protection)
        this.sensitivePatterns = [
            /(?:\b|_)token(?:\b|_)/i,
            /(?:\b|_)secret(?:\b|_)/i,
            /(?:\b|_)password(?:\b|_)/i,
            /(?:\b|_)auth(?:\b|_)/i,
            /authorizationId/i,
            /api[-_]?key/i,
            /192\.168\.\d+\.\d+/,
            /10\.\d+\.\d+\.\d+/,
            /localhost/i,
            /127\.0\.0\.1/
        ];
    }

    setNetworkState(state) {
        if (['ONLINE', 'OFFLINE', 'UNKNOWN'].includes(state)) {
            this.currentState = state;
        }
    }

    /**
     * Evaluates a structured connectivity request.
     * @param {Object} request
     * @param {string} request.type - "RESEARCH", "FETCH", "HOME_SERVER_READ", "HOME_SERVER_SYNC", "ACTION"
     * @param {string} request.destination - URL, endpoint, or query
     * @param {Object} request.payload - Any data being sent
     * @returns {Object} - { category: string, allowAutomatic: boolean, reason: string }
     */
    evaluateRequest(request) {
        if (!request || !request.type || !request.destination) {
            return { category: 'UNKNOWN_EXTERNAL_OPERATION', allowAutomatic: false, reason: 'Invalid request structure' };
        }

        if (this.currentState === 'OFFLINE') {
            return { category: 'LOCAL_ONLY', allowAutomatic: false, reason: 'System is currently OFFLINE' };
        }

        const isSensitive = this._containsSensitiveData(request.destination) || this._containsSensitiveData(JSON.stringify(request.payload || {}));
        
        if (isSensitive) {
            return { category: 'EXTERNAL_DATA_TRANSMISSION', allowAutomatic: false, reason: 'Data exfiltration protection: Sensitive pattern detected' };
        }

        switch (request.type.toUpperCase()) {
            case 'RESEARCH':
                return { category: 'WEB_RESEARCH', allowAutomatic: true, reason: 'Read-only research is allowed automatically' };
            case 'FETCH':
                return { category: 'WEB_FETCH', allowAutomatic: true, reason: 'Read-only document fetching is allowed automatically' };
            case 'HOME_SERVER_READ':
                return { category: 'HOME_SERVER_READ', allowAutomatic: true, reason: 'Home server reads are permitted' };
            case 'HOME_SERVER_SYNC':
                return { category: 'HOME_SERVER_SYNC', allowAutomatic: false, reason: 'Home server sync must be explicitly scheduled/authorized' };
            case 'ACTION':
            case 'MUTATION':
            case 'POST':
                return { category: 'EXTERNAL_ACTION', allowAutomatic: false, reason: 'External actions must pass through AutonomousPolicyEngine and SecurityEngine' };
            default:
                return { category: 'UNKNOWN_EXTERNAL_OPERATION', allowAutomatic: false, reason: 'Unknown connectivity operation type' };
        }
    }

    _containsSensitiveData(text) {
        if (!text) return false;
        for (let pattern of this.sensitivePatterns) {
            if (pattern.test(text)) {
                return true;
            }
        }
        return false;
    }
}

window.AI_CORE.ConnectivityPolicyEngine = ConnectivityPolicyEngine;
