export const resolveServiceCatalog = ({ globalServices, projectServices } = {}) => {
  if (Array.isArray(globalServices)) return globalServices;
  if (Array.isArray(projectServices)) return projectServices;
  return [];
};
