window.AI_CORE = window.AI_CORE || {};

class IdentityManager {
    constructor() {
        this.botIdentity = {
            name: "Guardián Financiero & Copiloto Técnico",
            role: "Asistente personal del negocio y proyectos",
            tone: "amigable, colaborativo y preventivo"
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
