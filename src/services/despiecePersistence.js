const secondaryResult = async (operation) => {
  if (!operation) return 'skipped';
  try {
    await operation();
    return 'ok';
  } catch (error) {
    return 'failed';
  }
};

export const persistDespieceSnapshot = async (snapshot, firestore, options = {}) => {
  const { db, collection, doc, writeBatch } = firestore;
  const collectionRef = collection(db, 'despieces');
  const reference = snapshot.documentId ? doc(db, 'despieces', snapshot.documentId) : doc(collectionRef);
  const documentId = snapshot.documentId || reference.id;
  const envelope = { ...snapshot };
  delete envelope.documentId;
  const batch = writeBatch(db);
  batch.set(reference, envelope);
  await batch.commit();
  if (options.onPrimaryCommit) options.onPrimaryCommit({ documentId, snapshot: envelope });

  const history = await secondaryResult(options.history);
  const defaults = await secondaryResult(options.defaults);
  const failed = Object.entries({ history, defaults }).filter(([, status]) => status === 'failed').map(([name]) => name);
  return {
    documentId,
    primary: 'committed',
    secondary: { history, defaults },
    retry: failed.length ? { snapshot, failed } : null
  };
};
