const PROJECT_ID = 'demo-adn-e2e';
const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';
const FIRESTORE_EMULATOR_URL = 'http://127.0.0.1:8080';
const { ADN_PROJECT_ID, createAdnProjectData } = require('../fixtures/adn-project');

// This account is intentionally local, deterministic, and not a production secret.
const TEST_USER = Object.freeze({
  email: 'adn-e2e-smoke@example.test',
  password: 'adn-e2e-password-not-secret'
});

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch (error) {
      body = text;
    }
  }

  if (!response.ok) {
    throw new Error(`Emulator request failed (${response.status}) ${url}: ${text}`);
  }

  return body;
}

const toFirestoreValue = (value) => {
  if (value === null || value === undefined) return { nullValue: null };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, entry]) => [key, toFirestoreValue(entry)])
        )
      }
    };
  }
  return { stringValue: String(value) };
};

async function writeFirestoreDocument(collectionName, documentId, data) {
  return requestJson(
    `${FIRESTORE_EMULATOR_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}/${documentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        fields: Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)])
        )
      })
    }
  );
}

async function resetEmulatorState() {
  await requestJson(
    `${AUTH_EMULATOR_URL}/emulator/v1/projects/${PROJECT_ID}/accounts`,
    { method: 'DELETE' }
  );
  await requestJson(
    `${FIRESTORE_EMULATOR_URL}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' }
  );
}

async function seedEmulatorData() {
  await resetEmulatorState();

  const account = await requestJson(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`,
    {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        returnSecureToken: true
      })
    }
  );

  if (!account || !account.localId) {
    throw new Error('Auth Emulator did not return a generated test user id.');
  }

  const userDocument = {
    fields: {
      Nombre: { stringValue: 'Usuario E2E' },
      Cargo: { stringValue: 'Vendedor' },
      email: { stringValue: TEST_USER.email },
      bloqueado: { booleanValue: false },
      creationTime: { stringValue: '2024-01-01T00:00:00.000Z' }
    }
  };

  await requestJson(
    `${FIRESTORE_EMULATOR_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/usuarios/${account.localId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(userDocument)
    }
  );

  await writeFirestoreDocument(
    'despieces',
    ADN_PROJECT_ID,
    createAdnProjectData(account.localId)
  );

  return { ...TEST_USER, uid: account.localId, projectId: ADN_PROJECT_ID };
}

module.exports = {
  PROJECT_ID,
  AUTH_EMULATOR_URL,
  FIRESTORE_EMULATOR_URL,
  TEST_USER,
  resetEmulatorState,
  seedEmulatorData,
  writeFirestoreDocument
};
