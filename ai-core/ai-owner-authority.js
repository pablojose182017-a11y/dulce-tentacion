window.AI_CORE = window.AI_CORE || {};

class OwnerAuthority {
    constructor(options = {}) {
        this.enrolledOwners = new Map(); // fingerprint -> publicKey
        this.consumedNonces = new Set();
        this.testMode = options.testMode === true;
        this.cryptoAdapter = new (window.AI_CORE.CryptoAdapter || DefaultCryptoAdapter)();
    }

    get cryptographicVerificationAvailable() {
        return !!(window.crypto && window.crypto.subtle);
    }

    /**
     * Bootstrap mechanism to enroll an owner.
     * Cannot be called by untrusted data. In a real system, this happens via a trusted secure path.
     */
    async enrollOwner(publicKey) {
        const fingerprint = await this.cryptoAdapter.fingerprint(publicKey);
        if (!this.enrolledOwners.has(fingerprint)) {
            this.enrolledOwners.set(fingerprint, publicKey);
        }
        return fingerprint;
    }

    isOwnerEnrolled(fingerprint) {
        return this.enrolledOwners.has(fingerprint);
    }

    /**
     * Canonicalizes the payload deterministically to ensure exact signature matching
     */
    canonicalizeRequest(request) {
        if (!request) return "";
        const clean = {
            authorizationRequestId: request.authorizationRequestId || "",
            ownerKeyFingerprint: request.ownerKeyFingerprint || "",
            action: request.action || "",
            target: request.target || "",
            toolId: request.toolId || "",
            parameters: request.parameters || {},
            scope: request.scope || "",
            issuedAt: request.issuedAt || 0,
            expiresAt: request.expiresAt || 0,
            nonce: request.nonce || "",
            intent: request.intent || "",
            riskClassification: request.riskClassification || ""
        };
        // Reuse existing canonicalize if available
        return window.AI_CORE.canonicalize ? window.AI_CORE.canonicalize(clean) : JSON.stringify(clean);
    }

    /**
     * Verifies the cryptographic signature of an authorization request
     */
    async verifyAuthorizationRequest(request, signature) {
        if (!request || !signature) throw new Error("INVALID_AUTHORIZATION_REQUEST");
        
        if (!this.testMode && !this.cryptographicVerificationAvailable) {
            throw new Error("CRYPTOGRAPHIC_VERIFICATION_UNAVAILABLE");
        }

        // 1. Verify owner is enrolled
        const publicKey = this.enrolledOwners.get(request.ownerKeyFingerprint);
        if (!publicKey) throw new Error("UNAUTHORIZED_OWNER");

        // 2. Expiration check
        const now = Date.now();
        if (now > request.expiresAt) throw new Error("AUTHORIZATION_EXPIRED");

        // 3. Replay protection (Nonce tracking)
        const uniqueId = `${request.authorizationRequestId}_${request.nonce}`;
        if (this.consumedNonces.has(uniqueId)) throw new Error("AUTHORIZATION_REPLAY_DETECTED");

        // 4. Canonicalize & Verify Signature
        const payloadStr = this.canonicalizeRequest(request);
        const isValid = await this.cryptoAdapter.verify(publicKey, signature, payloadStr, this.testMode);
        if (!isValid) throw new Error("INVALID_SIGNATURE");

        // 5. Consume Nonce
        this.consumedNonces.add(uniqueId);

        return true;
    }
}

class DefaultCryptoAdapter {
    async fingerprint(publicKey) {
        if (window.crypto && window.crypto.subtle && typeof publicKey === "object" && publicKey.type) {
            try {
                const exported = await window.crypto.subtle.exportKey("spki", publicKey);
                const digest = await window.crypto.subtle.digest("SHA-256", exported);
                const array = Array.from(new Uint8Array(digest));
                return array.map(b => b.toString(16).padStart(2, '0')).join('');
            } catch (e) {
                // fall through
            }
        }
        return window.AI_CORE.hash ? window.AI_CORE.hash.sha256(String(publicKey)) : String(publicKey);
    }

    async verify(publicKey, signature, data, testMode) {
        if (!testMode && (!window.crypto || !window.crypto.subtle)) {
            throw new Error("CRYPTOGRAPHIC_VERIFICATION_UNAVAILABLE");
        }
        if (window.crypto && window.crypto.subtle && typeof publicKey === "object" && publicKey.type) {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            const sigBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
            try {
                if (publicKey.algorithm.name === "ECDSA") {
                    return await window.crypto.subtle.verify(
                        { name: "ECDSA", hash: { name: "SHA-256" } },
                        publicKey,
                        sigBuffer,
                        dataBuffer
                    );
                } else if (publicKey.algorithm.name === "RSASSA-PKCS1-v1_5") {
                    return await window.crypto.subtle.verify(
                        "RSASSA-PKCS1-v1_5",
                        publicKey,
                        sigBuffer,
                        dataBuffer
                    );
                }
            } catch (e) {
                return false;
            }
        }
        
        if (testMode) {
            return signature === "mock_signature_" + await this.fingerprint(publicKey) + "_" + data;
        }
        throw new Error("CRYPTOGRAPHIC_VERIFICATION_UNAVAILABLE");
    }
}

window.AI_CORE.OwnerAuthority = OwnerAuthority;
window.AI_CORE.CryptoAdapter = DefaultCryptoAdapter;
