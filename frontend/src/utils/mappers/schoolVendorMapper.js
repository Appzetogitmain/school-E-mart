const LOGO_PALETTE = [
  'bg-purple-100 text-purple-700',
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
];

const getLogoInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'VN';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

const getLogoBg = (id = '') => {
  const hash = String(id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return LOGO_PALETTE[hash % LOGO_PALETTE.length];
};

export const mapSchoolVendorForInvite = (vendor) => {
  const id = vendor?._id?.toString?.() || vendor?.id;
  const name = vendor?.storeName || vendor?.name || 'Vendor';

  return {
    id,
    name,
    location: vendor?.location || '—',
    rating: Number(vendor?.rating || 0).toFixed(1),
    completed: vendor?.ordersCount || 0,
    verified: Boolean(vendor?.verifiedBadge),
    checked: false,
    logo: getLogoInitials(name),
    logoBg: getLogoBg(id),
    raw: vendor,
  };
};
