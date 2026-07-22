/**
 * Whether a vendor's coordinates represent a real, chosen location.
 *
 * VendorProfile.location.coordinates is `required` on the model, so every vendor
 * has *some* value — but registration stamps in DEFAULT_COORDINATES when the
 * vendor never supplied one. That default is New Delhi, a real, plausible place,
 * so plotting it naively piles every unset vendor onto India Gate and presents a
 * placeholder as though it were surveyed data. Treat it as "not set" instead.
 *
 * Must stay in sync with DEFAULT_COORDINATES in
 * backend/src/modules/vendor/services/registration.service.js.
 */
export const PLACEHOLDER_COORDS = [77.209, 28.6139];

// [0, 0] is Null Island in the Gulf of Guinea — never a real Indian vendor, and
// what a partially-filled document ends up with.
const isNullIsland = (lng, lat) => lng === 0 && lat === 0;

const isPlaceholder = (lng, lat) =>
  lng === PLACEHOLDER_COORDS[0] && lat === PLACEHOLDER_COORDS[1];

/** Accepts the lng/lat pair as stored (GeoJSON order is [lng, lat]). */
export const hasRealLocation = (longitude, latitude) => {
  const lng = Number(longitude);
  const lat = Number(latitude);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
  // Out-of-range values would silently land somewhere wrong on the map.
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (isNullIsland(lng, lat)) return false;
  if (isPlaceholder(lng, lat)) return false;

  return true;
};

/** Convenience for the mapped vendor shape used by the admin screens. */
export const vendorHasLocation = (vendor) =>
  hasRealLocation(vendor?.longitude, vendor?.latitude);
