const WORD_CHARACTER_PATTERN = /^[a-z0-9]$/i;

const isWordCharacter = (character) => WORD_CHARACTER_PATTERN.test(character || '');

const normalizeCharacters = (value) => {
  const source = value == null ? '' : String(value);
  const characters = [];

  Array.from(source).forEach((character, rawIndex) => {
    const decomposed = character
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (!decomposed) return;

    Array.from(decomposed).forEach((normalizedCharacter) => {
      if (isWordCharacter(normalizedCharacter)) {
        characters.push({ character: normalizedCharacter, rawIndex });
      } else {
        characters.push({ character: ' ', rawIndex });
      }
    });
  });

  const compacted = [];
  characters.forEach((item) => {
    if (item.character === ' ') {
      if (compacted.length > 0 && compacted[compacted.length - 1].character !== ' ') {
        compacted.push(item);
      }
      return;
    }
    compacted.push(item);
  });

  while (compacted[0]?.character === ' ') compacted.shift();
  while (compacted[compacted.length - 1]?.character === ' ') compacted.pop();

  return {
    text: compacted.map((item) => item.character).join(''),
    starts: compacted.map((item) => item.rawIndex),
    ends: compacted.map((item) => item.rawIndex + 1)
  };
};

export const normalizeServiceText = (value) => normalizeCharacters(value).text;

export const getCanonicalServiceIdentity = (service) => {
  if (!service || typeof service !== 'object') return '';
  return String(service.nomenclatura || service.id || service.nombreOriginal || '').trim();
};

const getServiceTerms = (service) => {
  if (!service || typeof service !== 'object') return [];

  const values = [
    { value: service.nomenclatura, source: 'canonical' },
    { value: service.nombreOriginal, source: 'canonical' },
    ...(Array.isArray(service.aliases) ? service.aliases : [])
      .map((value) => ({ value, source: 'alias' }))
  ];
  const seen = new Set();

  return values
    .map((term) => ({
      displayAlias: term.value == null ? '' : String(term.value).trim(),
      normalizedAlias: normalizeServiceText(term.value),
      source: term.source,
      termPriority: term.source === 'canonical' ? 0 : 1
    }))
    .filter((term) => {
      if (!term.normalizedAlias || seen.has(term.normalizedAlias)) return false;
      seen.add(term.normalizedAlias);
      return true;
    });
};

const hasTokenBoundaries = (text, start, end) => {
  const before = text[start - 1];
  const after = text[end];
  const numericPrefix = /(?:^|[^a-z0-9])\d+l?$/i.test(text.slice(0, start));
  const numericSuffix = /^\d+l?(?:$|[^a-z0-9])/i.test(text.slice(end));
  const beforeIsBoundary = !isWordCharacter(before)
    || (/[0-9l]/i.test(before || '') && numericPrefix);
  const afterIsBoundary = !isWordCharacter(after)
    || (/[0-9]/.test(after || '') && numericSuffix);
  return beforeIsBoundary && afterIsBoundary;
};

const getAdjacentQuantity = (text, start, end) => {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const beforeMatch = before.match(/(?:^|[^a-z0-9])(\d+)l?\s*$/i);
  const afterMatch = after.match(/^\s*(?:x\s*)?(\d+)(?:l)?(?:$|[^a-z0-9])/i);
  const beforeQuantity = beforeMatch ? parseInt(beforeMatch[1], 10) : null;
  const afterQuantity = afterMatch ? parseInt(afterMatch[1], 10) : null;
  const hasBeforeQuantity = Number.isFinite(beforeQuantity) && beforeQuantity > 0;
  const hasAfterQuantity = Number.isFinite(afterQuantity) && afterQuantity > 0;
  const hasExplicitQuantity = hasBeforeQuantity || hasAfterQuantity;
  const quantity = hasBeforeQuantity ? beforeQuantity : hasAfterQuantity ? afterQuantity : 1;
  const quantityMatch = hasBeforeQuantity ? beforeMatch : hasAfterQuantity ? afterMatch : null;
  const quantityText = quantityMatch ? (hasBeforeQuantity ? quantityMatch[1] : quantityMatch[1]) : null;
  const quantityOffset = quantityMatch && quantityText
    ? quantityMatch[0].indexOf(quantityText)
    : -1;
  const quantityToken = quantityMatch && quantityOffset >= 0
    ? {
      start: (hasBeforeQuantity ? quantityMatch.index : end + quantityMatch.index) + quantityOffset,
      end: (hasBeforeQuantity ? quantityMatch.index : end + quantityMatch.index) + quantityOffset + quantityText.length
    }
    : null;

  return { quantity: quantity || 1, hasExplicitQuantity, quantityToken };
};

const spansOverlap = (first, second) => first.start < second.end && second.start < first.end;

const buildCandidate = (detail, normalizedDetail, service, term, serviceIndex) => {
  const candidates = [];
  let normalizedStart = normalizedDetail.text.indexOf(term.normalizedAlias);

  while (normalizedStart !== -1) {
    const normalizedEnd = normalizedStart + term.normalizedAlias.length;
    if (hasTokenBoundaries(normalizedDetail.text, normalizedStart, normalizedEnd)) {
      const rawStart = normalizedDetail.starts[normalizedStart];
      const rawEnd = normalizedDetail.ends[normalizedEnd - 1];
      candidates.push({
        service,
        serviceId: getCanonicalServiceIdentity(service),
        serviceIndex,
        alias: term.displayAlias,
        normalizedAlias: term.normalizedAlias,
        termPriority: term.termPriority,
        start: rawStart,
        end: rawEnd,
        normalizedStart,
        normalizedEnd,
        rawText: detail.slice(rawStart, rawEnd),
        ...getAdjacentQuantity(normalizedDetail.text, normalizedStart, normalizedEnd)
      });
    }
    normalizedStart = normalizedDetail.text.indexOf(term.normalizedAlias, normalizedStart + 1);
  }

  return candidates;
};

export const findServiceMatches = (detail, services = []) => {
  const rawDetail = detail == null ? '' : String(detail);
  const normalizedDetail = normalizeCharacters(rawDetail);
  const candidates = [];

  (Array.isArray(services) ? services : []).forEach((service, serviceIndex) => {
    getServiceTerms(service).forEach((term) => {
      candidates.push(...buildCandidate(rawDetail, normalizedDetail, service, term, serviceIndex));
    });
  });

  // Specific terms own their region first. An equal-length tie is deterministic
  // by service order, while validation reports exact collisions separately.
  candidates.sort((first, second) => (
    second.normalizedAlias.length - first.normalizedAlias.length
    || first.normalizedStart - second.normalizedStart
    || first.termPriority - second.termPriority
    || first.serviceIndex - second.serviceIndex
    || first.alias.localeCompare(second.alias)
  ));

  const owned = [];
  candidates.forEach((candidate) => {
    if (owned.some((span) => spansOverlap(span, candidate))) return;
    owned.push(candidate);
  });

  owned.sort((first, second) => first.start - second.start || first.end - second.end);
  const claimedQuantityTokens = [];
  const matches = owned.map((match) => {
    if (!match.quantityToken) return match;
    const tokenAlreadyClaimed = claimedQuantityTokens.some((token) => (
      token.start < match.quantityToken.end && match.quantityToken.start < token.end
    ));
    if (tokenAlreadyClaimed) {
      return { ...match, quantity: 1, hasExplicitQuantity: false, quantityToken: null };
    }
    claimedQuantityTokens.push(match.quantityToken);
    return match;
  });

  return {
    detail: rawDetail,
    normalizedDetail: normalizedDetail.text,
    matches
  };
};

export const getServiceMatchCount = (matchResult, serviceIdentity) => {
  const identity = typeof serviceIdentity === 'object'
    ? getCanonicalServiceIdentity(serviceIdentity)
    : String(serviceIdentity || '');
  return (matchResult?.matches || [])
    .filter((match) => match.serviceId === identity)
    .reduce((total, match) => total + (match.quantity || 1), 0);
};

export const getServiceMatchSpans = (matchResult, serviceIdentity) => {
  const identity = typeof serviceIdentity === 'object'
    ? getCanonicalServiceIdentity(serviceIdentity)
    : String(serviceIdentity || '');
  return (matchResult?.matches || []).filter((match) => match.serviceId === identity);
};

export const validateServiceAliasCollisions = (services = []) => {
  const termsByNormalizedValue = new Map();

  const addTerm = (normalizedAlias, entry) => {
    if (!normalizedAlias) return;
    const existing = termsByNormalizedValue.get(normalizedAlias) || [];
    if (!existing.some((current) => current.serviceId === entry.serviceId && current.source === entry.source)) {
      existing.push(entry);
    }
    termsByNormalizedValue.set(normalizedAlias, existing);
  };

  (Array.isArray(services) ? services : []).forEach((service, serviceIndex) => {
    const serviceId = getCanonicalServiceIdentity(service);
    [service.nomenclatura, service.nombreOriginal].forEach((canonicalTerm) => {
      addTerm(normalizeServiceText(canonicalTerm), {
        serviceId,
        alias: canonicalTerm == null ? '' : String(canonicalTerm).trim(),
        serviceIndex,
        source: 'canonical'
      });
    });
    (Array.isArray(service.aliases) ? service.aliases : []).forEach((alias) => {
      addTerm(normalizeServiceText(alias), {
        serviceId,
        alias: alias == null ? '' : String(alias).trim(),
        serviceIndex,
        source: 'alias'
      });
    });
  });

  return Array.from(termsByNormalizedValue.entries())
    .map(([normalizedAlias, entries]) => {
      const aliasEntries = entries.filter((entry) => entry.source === 'alias');
      const serviceIds = Array.from(new Set(entries.map((entry) => entry.serviceId)));
      if (aliasEntries.length === 0 || serviceIds.length < 2) return null;

      const servicesForCollision = serviceIds.map((serviceId) => (
        aliasEntries.find((entry) => entry.serviceId === serviceId)
        || entries.find((entry) => entry.serviceId === serviceId)
      ));
      const displayAlias = aliasEntries[0].alias;
      return {
        normalizedAlias,
        alias: displayAlias,
        services: servicesForCollision,
        message: `El alias "${displayAlias}" coincide con otros servicios (${serviceIds.join(', ')}). Usa un alias distinto para cada servicio.`
      };
    })
    .filter(Boolean);
};

export const getServiceAliasCollisions = validateServiceAliasCollisions;
export const validateServiceAliases = validateServiceAliasCollisions;
