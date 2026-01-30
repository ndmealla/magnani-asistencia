/**
 * Biometric Authentication Module - Fase 4
 * Soporta Fingerprint (TouchID/Windows Hello) y FaceID
 * Integración con Web Authentication API (WebAuthn)
 */

class BiometricAuthManager {
  constructor() {
    this.isAvailable = this.checkAvailability();
    this.enrolledCredentials = [];
    this.attemptCount = 0;
    this.maxAttempts = 5;
    this.lockoutTime = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Verifica disponibilidad de autenticación biométrica
   */
  checkAvailability() {
    const available = {
      webauthn: typeof window !== 'undefined' && window.PublicKeyCredential !== undefined,
      fingerprint: 'FingerprintBrowser' in window || 'FaceidBrowser' in window,
      touchid: navigator.appVersion.includes('Mac') && window.PublicKeyCredential,
      windowsHello: navigator.appVersion.includes('Windows') && window.PublicKeyCredential,
    };
    return Object.values(available).some(v => v);
  }

  /**
   * Registra credenciales biométricas del usuario
   */
  async registerBiometric(userId, userName, userEmail) {
    try {
      if (!this.isAvailable) {
        throw new Error('Autenticación biométrica no disponible en este dispositivo');
      }

      const challenge = this.generateChallenge();
      const publicKeyOptions = {
        challenge: challenge,
        rp: {
          name: 'Magnani Asistencia',
          id: window.location.hostname,
        },
        user: {
          id: new Uint8Array(userId.split('').map(c => c.charCodeAt(0))),
          name: userEmail,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        timeout: 60000,
        attestation: 'direct',
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Biométrico del dispositivo
          residentKey: 'preferred',
          userVerification: 'required',
        },
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      });

      if (!credential) {
        throw new Error('Error al registrar credencial biométrica');
      }

      // Guardar credencial en servidor
      await this.saveCredentialToServer(userId, credential);

      this.enrolledCredentials.push({
        id: credential.id,
        userId: userId,
        type: credential.type,
        createdAt: new Date(),
        lastUsed: null,
      });

      return {
        success: true,
        message: 'Credencial biométrica registrada correctamente',
        credentialId: credential.id,
      };
    } catch (error) {
      console.error('Error en registro biométrico:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Autentica usando biometría
   */
  async authenticateWithBiometric(userId) {
    try {
      // Verificar intentos
      if (this.attemptCount >= this.maxAttempts) {
        throw new Error(`Demasiados intentos fallidos. Intente en ${Math.ceil(this.lockoutTime / 1000)} segundos`);
      }

      const challenge = this.generateChallenge();
      const allowCredentials = this.enrolledCredentials
        .filter(c => c.userId === userId)
        .map(c => ({
          type: 'public-key',
          id: new Uint8Array(Object.values(c.id)),
        }));

      const publicKeyOptions = {
        challenge: challenge,
        timeout: 60000,
        userVerification: 'required',
        allowCredentials: allowCredentials,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
        mediation: 'optional',
      });

      if (!assertion) {
        this.attemptCount++;
        throw new Error('Autenticación biométrica fallida');
      }

      // Verificar en servidor
      const verified = await this.verifyAssertionOnServer(userId, assertion);

      if (verified) {
        this.attemptCount = 0; // Reset intentos
        return {
          success: true,
          message: 'Autenticado exitosamente con biometría',
          userId: userId,
          timestamp: new Date(),
        };
      } else {
        this.attemptCount++;
        throw new Error('Verificación de servidor fallida');
      }
    } catch (error) {
      console.error('Error en autenticación biométrica:', error);
      return {
        success: false,
        error: error.message,
        attemptsRemaining: this.maxAttempts - this.attemptCount,
      };
    }
  }

  /**
   * Genera challenge seguro
   */
  generateChallenge() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array;
  }

  /**
   * Guarda credencial en servidor
   */
  async saveCredentialToServer(userId, credential) {
    const response = await fetch('/api/biometric/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        credentialId: credential.id,
        publicKey: credential.response.publicKey,
        credentialType: credential.type,
      }),
    });

    if (!response.ok) {
      throw new Error('Error al guardar credencial en servidor');
    }

    return await response.json();
  }

  /**
   * Verifica assertion en servidor
   */
  async verifyAssertionOnServer(userId, assertion) {
    const response = await fetch('/api/biometric/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        assertionId: assertion.id,
        authenticatorData: assertion.response.authenticatorData,
        clientDataJSON: assertion.response.clientDataJSON,
        signature: assertion.response.signature,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.verified;
  }

  /**
   * Revoca credenciales biométricas
   */
  async revokeBiometric(userId, credentialId) {
    try {
      const response = await fetch('/api/biometric/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          credentialId: credentialId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al revocar credencial');
      }

      this.enrolledCredentials = this.enrolledCredentials.filter(
        c => c.id !== credentialId
      );

      return {
        success: true,
        message: 'Credencial revocada exitosamente',
      };
    } catch (error) {
      console.error('Error al revocar biometría:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtiene lista de credenciales registradas
   */
  async getEnrolledCredentials(userId) {
    return this.enrolledCredentials.filter(c => c.userId === userId);
  }

  /**
   * Resetea intentos fallidos
   */
  resetAttempts() {
    this.attemptCount = 0;
  }
}

// Exportar para uso en navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BiometricAuthManager;
}
