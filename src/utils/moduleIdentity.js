const LEGACY_TOKEN = /(^|[^A-Z0-9])(D\d+-\d+)(?=$|[^A-Z0-9])/i;

export const deterministicServiceId = (nomenclatura) => `svc_${String(nomenclatura || '')
  .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

export const parseLegacyModuleToken = (detalle) => {
  const match = String(detalle || '').match(LEGACY_TOKEN);
  if (!match) return null;
  const legacyToken = match[2].toUpperCase();
  return { legacyToken, moduleId: `module_${legacyToken}` };
};

const hydrateService = (service) => {
  const value = typeof service === 'string'
    ? { nomenclatura: service, nombreOriginal: service, tipoCobro: 'unidad' }
    : { ...service, tipoCobro: service?.tipoCobro || 'unidad' };
  return { ...value, serviceId: value.serviceId || deterministicServiceId(value.nomenclatura) };
};

export const hydrateModuleIdentity = (fila, modules = []) => {
  const parsed = parseLegacyModuleToken(fila?.detalle);
  const byId = fila?.moduleId && modules.find((module) => module.moduleId === fila.moduleId);
  const byToken = parsed && modules.find((module) => (
    String(module.legacyToken || '').toUpperCase() === parsed.legacyToken
  ));
  const module = byId || byToken;

  if (module) return { module, moduleId: module.moduleId || parsed?.moduleId };
  if (parsed) {
    return {
      module: { moduleId: parsed.moduleId, legacyToken: parsed.legacyToken, displayName: parsed.legacyToken },
      moduleId: parsed.moduleId
    };
  }
  return { module: null, moduleId: undefined };
};

export const hydrateDespieceSchema = (despiece, services = []) => {
  const modules = Array.isArray(despiece?.modules) ? despiece.modules.map((module) => ({
    ...module,
    moduleId: module.moduleId || `module_${String(module.legacyToken || '').toUpperCase()}`
  })) : [];
  const byToken = new Map(modules.map((module) => [String(module.legacyToken || '').toUpperCase(), module]));
  const filas = (despiece?.filas || []).map((fila, index) => {
    const parsed = parseLegacyModuleToken(fila.detalle);
    const identity = hydrateModuleIdentity(fila, modules);
    const module = identity.module || (parsed && byToken.get(parsed.legacyToken));
    if (parsed && module && !modules.includes(module)) {
      modules.push(module);
      byToken.set(parsed.legacyToken, module);
    }
    return { ...fila, id: fila.id || `row_${index + 1}`, ...(module || parsed ? { moduleId: module?.moduleId || parsed.moduleId } : {}) };
  });
  return {
    despiece: { ...despiece, modules, filas },
    services: services.map(hydrateService)
  };
};

export const resolveModuleReference = (despiece, fila) => {
  if (fila?.moduleId && despiece?.modules?.some((module) => module.moduleId === fila.moduleId)) return fila.moduleId;
  return parseLegacyModuleToken(fila?.detalle)?.moduleId;
};
