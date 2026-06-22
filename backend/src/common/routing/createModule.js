/**
 * Standard module bootstrap helper for domain modules.
 */
const createModule = ({ name, mountPath, routes }) => {
  if (!name || !mountPath || !routes) {
    throw new Error('createModule requires name, mountPath, and routes');
  }

  return Object.freeze({
    name,
    mountPath,
    routes,
  });
};

module.exports = createModule;
