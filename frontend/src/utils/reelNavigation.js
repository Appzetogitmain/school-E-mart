/**
 * Resolves a reel's linked product URL or ID to a safe navigation target.
 * Prevents "Page Not Found" errors caused by concatenating full URLs to route prefixes.
 *
 * Supported formats:
 * 1. Full URLs: "https://schoolemart.com/user/product/673..." -> "/user/product/673..."
 * 2. Full URLs with ports/localhost -> "/user/product/673..."
 * 3. Relative paths: "/user/product/673..." or "/school/product/673..."
 * 4. Raw Mongo ObjectId or slug: "673..." -> "/user/product/673..."
 * 5. External URLs -> opens safely in a new browser tab
 */
export const resolveReelProductNavigation = (link, defaultRole = 'user') => {
  const fallbackPath = defaultRole === 'school' ? '/school/products' : '/user/products';
  if (!link || link === '#' || link === 'undefined' || link === 'null') {
    return { type: 'internal', path: fallbackPath };
  }

  const str = String(link).trim();

  // Handle absolute HTTP/HTTPS URLs
  if (/^https?:\/\//i.test(str)) {
    try {
      const parsed = new URL(str);
      const isInternalHost =
        parsed.hostname === window.location.hostname ||
        parsed.hostname.includes('schoolemart.com') ||
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1';

      if (isInternalHost) {
        const path = (parsed.pathname + parsed.search + parsed.hash) || fallbackPath;
        return { type: 'internal', path };
      }

      // External website URL
      return { type: 'external', url: str };
    } catch {
      return { type: 'internal', path: fallbackPath };
    }
  }

  // Handle path starting with '/'
  if (str.startsWith('/')) {
    return { type: 'internal', path: str };
  }

  // Handle raw product ID or slug
  const rolePrefix = defaultRole === 'school' ? '/school' : '/user';
  return { type: 'internal', path: `${rolePrefix}/product/${str}` };
};

export const navigateToReelProduct = (navigate, link, defaultRole = 'user') => {
  const result = resolveReelProductNavigation(link, defaultRole);
  if (result.type === 'external') {
    window.open(result.url, '_blank', 'noopener,noreferrer');
  } else {
    navigate(result.path);
  }
};

