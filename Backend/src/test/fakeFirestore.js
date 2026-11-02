export function createFakeFirestore(initialDocuments = new Map()) {
  const documents = new Map(initialDocuments);
  const writes = [];

  const snapshot = (path) => {
    const data = documents.get(path);
    return {
      exists: data !== undefined,
      id: path.split("/").at(-1),
      ref: documentReference(path),
      get: (field) => data?.[field],
      data: () => data,
    };
  };

  const querySnapshot = (path, filters = []) => {
    const docs = [...documents.keys()]
      .filter((documentPath) => {
        const parts = documentPath.split("/");
        if (parts.length !== path.split("/").length + 1) return false;
        if (!documentPath.startsWith(`${path}/`)) return false;
        return filters.every(([field, value]) => documents.get(documentPath)?.[field] === value);
      })
      .map(snapshot);
    return {
      docs,
      size: docs.length,
      empty: docs.length === 0,
    };
  };

  const queryReference = (path, filters = []) => ({
    path,
    filters,
    where(field, _operator, value) {
      return queryReference(path, [...filters, [field, value]]);
    },
    orderBy() {
      return this;
    },
    get: async () => querySnapshot(path, filters),
  });

  function documentReference(path) {
    return {
      path,
      collection: (name) => collectionReference(`${path}/${name}`),
      get: async () => snapshot(path),
    };
  }

  function collectionReference(path) {
    return {
      path,
      doc: (id) => documentReference(`${path}/${id}`),
      where: (field, operator, value) =>
        queryReference(path).where(field, operator, value),
      orderBy: () => queryReference(path),
      get: async () => querySnapshot(path),
    };
  }

  const applyWrite = ([operation, path, value, options]) => {
    writes.push({ operation, path, value, options });
    if (operation === "delete") {
      documents.delete(path);
      return;
    }
    if (operation === "update" || operation === "create") {
      documents.set(path, { ...documents.get(path), ...value });
      return;
    }
    if (operation === "set") {
      documents.set(
        path,
        options?.merge
          ? { ...documents.get(path), ...value }
          : { ...value },
      );
    }
  };

  return {
    writes,
    collection: collectionReference,
    async runTransaction(callback) {
      const operations = [];
      const transaction = {
        get: async (reference) =>
          reference.filters
            ? querySnapshot(reference.path, reference.filters)
            : snapshot(reference.path),
        create: (reference, value) =>
          operations.push(["create", reference.path, value]),
        update: (reference, value) =>
          operations.push(["update", reference.path, value]),
        delete: (reference) =>
          operations.push(["delete", reference.path]),
        set: (reference, value, options) =>
          operations.push(["set", reference.path, value, options]),
      };
      const result = await callback(transaction);
      operations.forEach(applyWrite);
      return result;
    },
    get(path) {
      return documents.get(path);
    },
  };
}
