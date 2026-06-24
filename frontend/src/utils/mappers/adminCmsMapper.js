export const mapFaqForAdmin = (faq) => ({
  id: faq?._id?.toString?.() || faq?.id,
  mongoId: faq?._id?.toString?.() || faq?.id,
  question: faq?.question || '',
  answer: faq?.answer || '',
  category: faq?.category || 'General',
  status: faq?.status || 'active',
  raw: faq,
});

export const mapBannerForAdmin = (banner) => ({
  id: banner?._id?.toString?.() || banner?.id,
  mongoId: banner?._id?.toString?.() || banner?.id,
  slug: banner?.title?.toLowerCase?.().replace(/\s+/g, '_') || 'banner',
  category: banner?.position || 'home_top',
  orderRank: banner?.displayOrder ?? 0,
  imageUrl: banner?.imageUrl || banner?.image?.url || null,
  targetUrl: banner?.linkUrl || '',
  status: banner?.status === 'active' ? 'Active' : 'Inactive',
  raw: banner,
});

export const mapSectionForAdmin = (section) => ({
  id: section?._id?.toString?.() || section?.id,
  mongoId: section?._id?.toString?.() || section?.id,
  title: section?.title || 'Section',
  type: section?.type || 'product_carousel',
  orderRank: section?.displayOrder ?? 0,
  status: section?.status === 'active' ? 'Active' : 'Inactive',
  raw: section,
});
