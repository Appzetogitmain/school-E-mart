// Picks which login token an API request may use.
//
// Rule: a page may only ever send the token of ITS OWN portal. There is no
// fallback to another portal's token. The old fallback (school page with no
// school session -> parent token) made the server answer 403 ROLE_FORBIDDEN
// ("You do not have permission...") instead of sending the user to login.

export const portalFromPathname = (pathname = '') => {
  const path = String(pathname).toLowerCase();
  if (path.startsWith('/superadmin') || path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/vendor')) return 'vendor';
  if (path.startsWith('/school/teacher') || path.startsWith('/teacher')) return 'teacher';
  if (path.startsWith('/school')) return 'school';
  return 'parent';
};

/**
 * @param {object} state        auth store state ({ portalSessions, token })
 * @param {string} currentPortal portal of the page that is open
 * @returns {string|null} token to send, or null (=> request goes out unauthenticated
 *                        and the 401 handler sends the user to that portal's login)
 */
export const pickPortalToken = (state = {}, currentPortal = 'parent') => {
  const sessions = state.portalSessions || {};
  const own = sessions[currentPortal]?.token;
  if (own) return own;

  // Old persisted storage (before portalSessions existed) only has a global token.
  // Only a parent page may use it, and only when there are no portal sessions at all.
  if (currentPortal === 'parent' && Object.keys(sessions).length === 0) {
    return state.token || null;
  }
  return null;
};
