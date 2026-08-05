import { toAbsoluteUrl } from '../url';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=120&h=120&fit=crop';

const formatStatus = (status) => (status === 'active' ? 'Active' : 'Inactive');

export const mapCategoryTreeForAdmin = (tree = []) =>
  tree.flatMap((header) =>
    (header?.categories || []).map((category) => {
      const categoryId = category?._id?.toString?.() || category?.id;
      return {
        id: categoryId,
        mongoId: categoryId,
        type: 'category',
        name: category?.name,
        // `imageUrl` is what the record actually holds; `image` is display-only and
        // may be a placeholder, so never write `image` back to the API.
        imageUrl: category?.imageUrl || category?.iconUrl || '',
        image: toAbsoluteUrl(category?.imageUrl || category?.iconUrl) || PLACEHOLDER,
        status: formatStatus(category?.status),
        header: header?.name || '—',
        headerId: header?._id?.toString?.(),
        order: category?.displayOrder ?? 0,
        subcategories: (category?.subcategories || []).map((sub) => ({
          id: sub?._id?.toString?.() || sub?.id,
          mongoId: sub?._id?.toString?.() || sub?.id,
          type: 'subcategory',
          name: sub?.name,
          imageUrl: sub?.imageUrl || '',
          image: toAbsoluteUrl(sub?.imageUrl) || PLACEHOLDER,
          status: formatStatus(sub?.status),
          order: sub?.displayOrder ?? 0,
          categoryId,
          headerId: header?._id?.toString?.(),
          header: header?.name || '—',
          raw: sub,
        })),
        raw: category,
      };
    })
  );

export const mapHeaderCategoryForAdmin = (header) => ({
  id: header?._id?.toString?.() || header?.id,
  mongoId: header?._id?.toString?.() || header?.id,
  name: header?.name,
  slug: header?.slug,
  status: formatStatus(header?.status),
  order: header?.displayOrder ?? 0,
  icon: header?.iconKey || header?.icon || 'layers',
  // `imageUrl` is what the record actually holds; `image` is the absolute,
  // display-ready URL — never write `image` back to the API.
  imageUrl: header?.imageUrl || '',
  image: toAbsoluteUrl(header?.imageUrl) || '',
  raw: header,
});
