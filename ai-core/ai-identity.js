window.AI_CORE = window.AI_CORE || {};

class IdentityManager {
    constructor() {
        this.botIdentity = {
            name: "Guardián Financiero & Copiloto Técnico",
            role: "Asistente personal del negocio y proyectos",
            tone: "amigable, colaborativo y preventivo",
            email: "guardian@local",
            roles: ["system", "admin"]
        };
        this.creatorIdentity = {
            name: "Pablo José Carrascal Contreras",
            email: "pablojose182017@gmail.com"
        };
    }

    getCurrentUser(sessionData) {
        const email = sessionData && sessionData.email ? sessionData.email.toLowerCase().trim() : null;
        const isCreator = email === this.creatorIdentity.email;
        return {
            email: email || 'no_identificado',
            isCreator: isCreator,
            role: isCreator ? 'CREADOR' : (sessionData && sessionData.role ? sessionData.role : 'USUARIO_ESTANDAR')
        };
    }

    getBotIdentity() {
        return this.botIdentity;
    }
}

class PermissionManager {
    constructor() {
        this.levels = {
            0: "OBSERVACIÓN",
            1: "INVESTIGACIÓN",
            2: "PROPUESTA",
            3: "SOLICITUD AUTORIZACIÓN",
            4: "EJECUCIÓN",
            5: "ACCIONES CRÍTICAS"
        };
        this._grantedCapabilities = new Map(); // email -> Set<string>
    }

    grantCapability(userEmail, capability) {
        if (!userEmail || typeof userEmail !== 'string') return false;
        if (!capability || typeof capability !== 'string') return false;
        const email = userEmail.toLowerCase().trim();
        if (!this._grantedCapabilities.has(email)) {
            this._grantedCapabilities.set(email, new Set());
        }
        this._grantedCapabilities.get(email).add(capability);
        return true;
    }

    revokeCapability(userEmail, capability) {
        if (!userEmail || typeof userEmail !== 'string') return false;
        if (!capability || typeof capability !== 'string') return false;
        const email = userEmail.toLowerCase().trim();
        if (this._grantedCapabilities.has(email)) {
            this._grantedCapabilities.get(email).delete(capability);
        }
        return true;
    }

    hasCapability(user, capability) {
        if (!user || typeof user !== 'object' || !user.email) return false;
        if (!capability || typeof capability !== 'string') return false;
        
        const email = user.email.toLowerCase().trim();
        if (!this._grantedCapabilities.has(email)) return false;
        
        return this._grantedCapabilities.get(email).has(capability);
    }

    canExecute(user, level) {
        if (!user) return false;
        if (level <= 2) return true; // Cualquiera puede observar, investigar y proponer
        return user.isCreator === true; // Solo el creador tiene permisos de Nivel 3 a 5
    }
    
    getGovernanceRules(user) {
        if (!user) return { maxLevel: -1, description: "NO AUTORIZADO" };
        if (user.isCreator) {
            return { maxLevel: 5, description: "AUTORIZACIÓN MÁXIMA (Niveles 0-5 habilitados)" };
        }
        return { maxLevel: 2, description: "AUTORIZACIÓN ESTÁNDAR (Solo Niveles 0-2 permitidos. Niveles 3+ bloqueados)" };
    }
}

window.AI_CORE.IdentityManager = IdentityManager;
window.AI_CORE.PermissionManager = PermissionManager;
