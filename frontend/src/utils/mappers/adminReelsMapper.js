import { toAbsoluteUrl } from '../url';

export const mapReelForAdmin = (reel) => ({
  id: reel?._id || reel?.id,
  mongoId: reel?._id || reel?.id,
  title: reel?.title || '',
  description: reel?.description || '',
  videoUrl: reel?.videoUrl || '',
  thumbnailUrl: reel?.thumbnailUrl || '',
  storeName: reel?.storeName || '',
  category: reel?.category || 'All',
  productTitle: reel?.linkedProduct?.title || '',
  productPrice: reel?.linkedProduct?.price || 0,
  productMrp: reel?.linkedProduct?.mrp || 0,
  productUrl: reel?.linkedProduct?.url || '',
  productImageUrl: reel?.linkedProduct?.imageUrl || '',
  likes: reel?.metrics?.likes || 0,
  views: reel?.metrics?.views || 0,
  status: reel?.status === 'published' ? 'Active' : 'Draft',
  raw: reel,
});

export const mapAdminReelToPayload = ({
  title,
  description,
  videoId,
  thumbnailId,
  storeName,
  category,
  productTitle,
  productPrice,
  productMrp,
  productUrl,
  productImageId,
  isActive,
}) => ({
  title: title?.trim(),
  description: description?.trim(),
  videoId,
  thumbnailId,
  storeName: storeName?.trim(),
  category: category || 'All',
  musicLabel: storeName ? `Original Audio - ${storeName}` : undefined,
  linkedProduct: productTitle
    ? {
        title: productTitle.trim(),
        price: Number.parseFloat(productPrice) || 0,
        mrp: Number.parseFloat(productMrp) || 0,
        url: productUrl?.trim() || undefined,
        imageId: productImageId || undefined,
      }
    : undefined,
  status: isActive ? 'published' : 'draft',
});

const formatViews = (views = 0) => {
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k`;
  return String(views);
};

export const mapPublicReel = (reel) => ({
  id: reel?._id || reel?.id,
  title: reel?.title || '',
  description: reel?.description || '',
  thumb: toAbsoluteUrl(reel?.thumbnailUrl) || '',
  videoUrl: toAbsoluteUrl(reel?.videoUrl) || '',
  views: formatViews(reel?.metrics?.views || 0),
  music: reel?.musicLabel || `Original Audio - ${reel?.storeName || 'School E-Mart'}`,
  category: reel?.category || 'All',
  product: reel?.linkedProduct?.title
    ? {
        id: reel.linkedProduct.url || '#',
        name: reel.linkedProduct.title,
        image: toAbsoluteUrl(reel.linkedProduct.imageUrl),
        price: `₹${Number(reel.linkedProduct.price || 0).toLocaleString()}`,
        originalPrice: `₹${Number(reel.linkedProduct.mrp || 0).toLocaleString()}`,
        badge: reel.linkedProduct.badge || 'RECOMMENDED',
      }
    : null,
  comments: [],
});
