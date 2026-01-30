/**
 * Rutas de Autenticación Biométrica - Backend
 * Endpoints para registro, verificación y revocación de credenciales biométricas
 */

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const crypto = require('crypto');
const { verifyAuth } = require('./auth-middleware');

// Almacenamiento en memoria (usar Firestore en producción)
const biometricStore = {};

/**
 * POST /api/biometric/register
 * Registra una credencial biométrica del usuario
 */
router.post('/register', verifyAuth, async (req, res) => {
  try {
    const { userId, credentialId, publicKey, credentialType } = req.body;

    // Validar datos
    if (!userId || !credentialId || !publicKey) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: userId, credentialId, publicKey',
      });
    }

    // Guardar en Firestore
    const db = admin.firestore();
    const credRef = db.collection('users').doc(userId).collection('biometricCredentials').doc(credentialId);

    await credRef.set({
      credentialId: credentialId,
      publicKey: publicKey,
      type: credentialType,
      createdAt: new Date(),
      lastUsed: null,
      attempts: 0,
      locked: false,
      lockUntil: null,
    });

    // Log de auditoría
    await logBiometricEvent(userId, 'BIOMETRIC_REGISTERED', {
      credentialId: credentialId,
      type: credentialType,
    });

    res.json({
      success: true,
      message: 'Credencial biométrica registrada exitosamente',
      credentialId: credentialId,
    });
  } catch (error) {
    console.error('Error registrando credencial biométrica:', error);
    res.status(500).json({
      error: 'Error al registrar credencial biométrica',
      details: error.message,
    });
  }
});

/**
 * POST /api/biometric/verify
 * Verifica una assertion de autenticación biométrica
 */
router.post('/verify', verifyAuth, async (req, res) => {
  try {
    const { userId, assertionId, authenticatorData, clientDataJSON, signature } = req.body;

    // Validar datos
    if (!userId || !assertionId || !authenticatorData || !clientDataJSON || !signature) {
      return res.status(400).json({
        error: 'Faltan datos requeridos para verificación',
      });
    }

    // Obtener credencial del usuario
    const db = admin.firestore();
    const credRef = db.collection('users').doc(userId).collection('biometricCredentials').doc(assertionId);
    const credDoc = await credRef.get();

    if (!credDoc.exists) {
      return res.status(404).json({
        error: 'Credencial biométrica no encontrada',
      });
    }

    const credData = credDoc.data();

    // Verificar si la credencial está bloqueada
    if (credData.locked && credData.lockUntil > new Date()) {
      return res.status(429).json({
        error: 'Credencial bloqueada temporalmente por intentos fallidos',
        retryAfter: Math.ceil((credData.lockUntil - new Date()) / 1000),
      });
    }

    // Verificar signature (simplificado, usar librería WebAuthn en producción)
    const verified = verifySignature(
      credData.publicKey,
      authenticatorData + clientDataJSON,
      signature
    );

    if (!verified) {
      // Incrementar intentos fallidos
      const newAttempts = (credData.attempts || 0) + 1;
      const lockout = newAttempts >= 5;

      await credRef.update({
        attempts: newAttempts,
        locked: lockout,
        lockUntil: lockout ? new Date(Date.now() + 5 * 60 * 1000) : null,
      });

      // Log de auditoría
      await logBiometricEvent(userId, 'BIOMETRIC_VERIFICATION_FAILED', {
        credentialId: assertionId,
        attempts: newAttempts,
        locked: lockout,
      });

      if (lockout) {
        return res.status(429).json({
          error: 'Demasiados intentos fallidos. Credencial bloqueada por 5 minutos',
        });
      }

      return res.status(401).json({
        error: 'Verificación biométrica fallida',
        attemptsRemaining: 5 - newAttempts,
      });
    }

    // Verificación exitosa
    await credRef.update({
      lastUsed: new Date(),
      attempts: 0,
      locked: false,
    });

    // Log de auditoría
    await logBiometricEvent(userId, 'BIOMETRIC_VERIFICATION_SUCCESS', {
      credentialId: assertionId,
    });

    // Generar session token
    const sessionToken = generateSessionToken();

    res.json({
      success: true,
      verified: true,
      message: 'Autenticación biométrica exitosa',
      sessionToken: sessionToken,
      userId: userId,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error verificando credencial biométrica:', error);
    res.status(500).json({
      error: 'Error al verificar credencial biométrica',
      details: error.message,
    });
  }
});

/**
 * POST /api/biometric/revoke
 * Revoca una credencial biométrica
 */
router.post('/revoke', verifyAuth, async (req, res) => {
  try {
    const { userId, credentialId } = req.body;

    if (!userId || !credentialId) {
      return res.status(400).json({
        error: 'Faltan datos requeridos: userId, credentialId',
      });
    }

    const db = admin.firestore();
    const credRef = db.collection('users').doc(userId).collection('biometricCredentials').doc(credentialId);

    await credRef.delete();

    // Log de auditoría
    await logBiometricEvent(userId, 'BIOMETRIC_REVOKED', {
      credentialId: credentialId,
    });

    res.json({
      success: true,
      message: 'Credencial biométrica revocada exitosamente',
    });
  } catch (error) {
    console.error('Error revocando credencial biométrica:', error);
    res.status(500).json({
      error: 'Error al revocar credencial biométrica',
      details: error.message,
    });
  }
});

/**
 * GET /api/biometric/list
 * Lista todas las credenciales biométricas del usuario
 */
router.get('/list', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.uid;

    const db = admin.firestore();
    const credsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('biometricCredentials')
      .get();

    const credentials = [];
    credsSnapshot.forEach((doc) => {
      const data = doc.data();
      credentials.push({
        id: doc.id,
        type: data.type,
        createdAt: data.createdAt?.toDate(),
        lastUsed: data.lastUsed?.toDate(),
        locked: data.locked,
      });
    });

    res.json({
      success: true,
      credentials: credentials,
      count: credentials.length,
    });
  } catch (error) {
    console.error('Error listando credenciales biométricas:', error);
    res.status(500).json({
      error: 'Error al listar credenciales',
      details: error.message,
    });
  }
});

/**
 * Funciones auxiliares
 */

function verifySignature(publicKey, data, signature) {
  // Implementación simplificada
  // En producción, usar librería cbor, @webauthn/server, etc.
  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(data);
    return verifier.verify(publicKey, Buffer.from(signature, 'base64'));
  } catch (error) {
    console.error('Error verificando firma:', error);
    return false;
  }
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function logBiometricEvent(userId, eventType, details) {
  try {
    const db = admin.firestore();
    await db.collection('auditLogs').add({
      userId: userId,
      eventType: eventType,
      details: details,
      timestamp: new Date(),
      ipAddress: null, // Obtener del request en contexto real
      userAgent: null,
    });
  } catch (error) {
    console.error('Error logging biometric event:', error);
  }
}

module.exports = router;
