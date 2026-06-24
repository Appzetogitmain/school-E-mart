const PLACEHOLDER =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=120&h=120&fit=crop';

const formatStatus = (status) => (status === 'active' ? 'Active' : 'Inactive');

export const mapCategoryTreeForAdmin = (tree = []) =>
  tree.flatMap((header) =>
    (header?.categories || []).map((category) => ({
      id: category?._id?.toString?.() || category?.id,
      mongoId: category?._id?.toString?.() || category?.id,
      name: category?.name,
      image: category?.imageUrl || category?.iconUrl || PLACEHOLDER,
      status: formatStatus(category?.status),
      header: header?.name || '—',
      headerId: header?._id?.toString?.(),
      order: category?.displayOrder ?? 0,
      subcategories: (category?.subcategories || []).map((sub) => ({
        id: sub?._id?.toString?.() || sub?.id,
        mongoId: sub?._id?.toString?.() || sub?.id,
        name: sub?.name,
        status: formatStatus(sub?.status),
        order: sub?.displayOrder ?? 0,
        raw: sub,
      })),
      raw: category,
    }))
  );

export const mapHeaderCategoryForAdmin = (header) => ({
  id: header?._id?.toString?.() || header?.id,
  mongoId: header?._id?.toString?.() || header?.id,
  name: header?.name,
  slug: header?.slug,
  status: formatStatus(header?.status),
  order: header?.displayOrder ?? 0,
  icon: header?.iconKey || header?.icon || 'layers',
  raw: header,
});
