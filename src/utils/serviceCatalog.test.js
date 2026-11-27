import { resolveServiceCatalog } from './serviceCatalog';

describe('resolveServiceCatalog', () => {
  test('prioritizes an existing global catalog even when it is empty', () => {
    const projectServices = [{ nomenclatura: 'LEG', nombreOriginal: 'Legado' }];

    expect(resolveServiceCatalog({ globalServices: [], projectServices })).toEqual([]);
  });

  test('uses project services only when the global catalog does not exist', () => {
    const projectServices = [{ nomenclatura: 'LEG', nombreOriginal: 'Legado' }];

    expect(resolveServiceCatalog({ globalServices: undefined, projectServices })).toEqual(projectServices);
  });

  test('falls back to an empty catalog when neither source exists', () => {
    expect(resolveServiceCatalog()).toEqual([]);
    expect(resolveServiceCatalog({ globalServices: undefined, projectServices: undefined })).toEqual([]);
  });
});
