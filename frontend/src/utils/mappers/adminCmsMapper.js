import { toAbsoluteUrl } from '../url';

export const mapFaqForAdmin = (faq) => ({
  id: faq?._id?.toString?.() || faq?.id,
  mongoId: faq?._id?.toString?.() || faq?.id,
  question: faq?.question || '',
  answer: faq?.answer || '',
  category: faq?.category || 'General',
  status: faq?.status || 'active',
  raw: faq,
});

export const mapBannerForAdmin = (banner) => {
  const imageUrl = toAbsoluteUrl(
    banner?.imageUrl ||
      (typeof banner?.imageId === 'object' ? banner.imageId?.storageKey : null) ||
      null
  );

  return {
    id: banner?._id?.toString?.() || banner?.id,
    mongoId: banner?._id?.toString?.() || banner?.id,
    slug: banner?.title?.toLowerCase?.().replace(/\s+/g, '_') || 'banner',
    category: banner?.position || 'home_top',
    orderRank: banner?.displayOrder ?? 0,
    imageUrl,
    targetUrl: banner?.linkUrl || '',
    status: banner?.status === 'active' ? 'Active' : 'Inactive',
    raw: banner,
  };
};

const CATEGORY_TO_AUDIENCE = {
  All: 'all',
  Kits: 'parent',
  Uniforms: 'parent',
  Stationery: 'parent',
  Activities: 'parent',
};

export const mapBannerPayload = ({ slug, category, orderRank, targetUrl, isActive, imageId }) => {
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  const trimmedUrl = targetUrl?.trim();
  const linkUrl =
    trimmedUrl && trimmedUrl !== '#' && /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : undefined;

  return {
    title: slug?.trim() || 'promo_banner',
    imageId,
    linkUrl,
    targetAudience: CATEGORY_TO_AUDIENCE[category] || 'all',
    position: 'home_top',
    displayOrder: Number.parseInt(orderRank, 10) || 0,
    validFrom: now.toISOString(),
    validUntil: validUntil.toISOString(),
    status: isActive ? 'active' : 'inactive',
  };
};

export const mapSectionForAdmin = (section) => ({
  id: section?._id?.toString?.() || section?.id,
  mongoId: section?._id?.toString?.() || section?.id,
  title: section?.title || 'Section',
  type: section?.type || 'product_carousel',
  orderRank: section?.displayOrder ?? 0,
  status: section?.status === 'active' ? 'Active' : 'Inactive',
  raw: section,
});
