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

  const querySnapshot = (
    path,
    filters = [],
    ordering = null,
    maxResults = null,
    startAfterPath = null,
  ) => {
    let paths = [...documents.keys()]
      .filter((documentPath) => {
        const parts = documentPath.split("/");
        if (parts.length !== path.split("/").length + 1) return false;
        if (!documentPath.startsWith(`${path}/`)) return false;
        return filters.every(([field, operator, expected]) => {
          const actual = documents.get(documentPath)?.[field];
          if (operator === "==") return actual === expected;
          if (operator === "in") return expected.includes(actual);
          if (operator === "<") return actual < expected;
          if (operator === "<=") return actual <= expected;
          if (operator === ">") return actual > expected;
          if (operator === ">=") return actual >= expected;
          return false;
        });
      })
    if (ordering) {
      paths = paths.sort((left, right) => {
        const leftValue = documents.get(left)?.[ordering.field];
        const rightValue = documents.get(right)?.[ordering.field];
        const result = leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
        if (result !== 0) return ordering.direction === "desc" ? -result : result;
        const pathResult = left.localeCompare(right);
        return ordering.direction === "desc" ? -pathResult : pathResult;
      });
    }
    if (startAfterPath) {
      const cursorIndex = paths.indexOf(startAfterPath);
      if (cursorIndex >= 0) paths = paths.slice(cursorIndex + 1);
    }
    if (maxResults !== null) paths = paths.slice(0, maxResults);
    const docs = paths.map(snapshot);
    return {
      docs,
      size: docs.length,
      empty: docs.length === 0,
    };
  };

  const queryReference = (
    path,
    filters = [],
    ordering = null,
    maxResults = null,
    startAfterPath = null,
  ) => ({
    path,
    filters,
    ordering,
    maxResults,
    where(field, operator, value) {
      return queryReference(
        path,
        [...filters, [field, operator, value]],
        ordering,
        maxResults,
        startAfterPath,
      );
    },
    orderBy(field, direction = "asc") {
      return queryReference(
        path,
        filters,
        { field, direction },
        maxResults,
        startAfterPath,
      );
    },
    limit(count) {
      return queryReference(path, filters, ordering, count, startAfterPath);
    },
    count() {
      return {
        get: async () => ({
          data: () => ({
            count: querySnapshot(
              path,
              filters,
              ordering,
              maxResults,
              startAfterPath,
            ).size,
          }),
        }),
      };
    },
    startAfter(snapshot) {
      return queryReference(
        path,
        filters,
        ordering,
        maxResults,
        snapshot.ref.path,
      );
    },
    get: async () =>
      querySnapshot(path, filters, ordering, maxResults, startAfterPath),
  });

  function documentReference(path) {
    return {
      path,
      collection: (name) => collectionReference(`${path}/${name}`),
      get: async () => snapshot(path),
      set: async (value, options) => applyWrite(["set", path, value, options]),
      update: async (value) => applyWrite(["update", path, value]),
      delete: async () => applyWrite(["delete", path]),
    };
  }

  function collectionReference(path) {
    return {
      ...queryReference(path),
      path,
      doc: (id) => documentReference(`${path}/${id}`),
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
              ? querySnapshot(
                  reference.path,
                  reference.filters,
                  reference.ordering,
                  reference.maxResults,
                  reference.startAfterPath,
                )
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
    batch() {
      const operations = [];
      return {
        create: (reference, value) =>
          operations.push(["create", reference.path, value]),
        set: (reference, value, options) =>
          operations.push(["set", reference.path, value, options]),
        update: (reference, value) =>
          operations.push(["update", reference.path, value]),
        delete: (reference) =>
          operations.push(["delete", reference.path]),
        commit: async () => operations.forEach(applyWrite),
      };
    },
    get(path) {
      return documents.get(path);
    },
  };
}
