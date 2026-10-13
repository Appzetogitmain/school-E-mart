const mongoose = require('mongoose');
const Product = require('../../src/database/models/Product');
const Attachment = require('../../src/database/models/Attachment');
const vendorProductService = require('../../src/modules/vendor/services/product.service');
const productService = require('../../src/modules/marketplace/services/product.service');

describe('vendor product listing pagination and sorting', () => {
  test('Next page returns different products and oldest sort uses creation date', async () => {
    const vendorId = new mongoose.Types.ObjectId();
    const headerId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();
    await Product.insertMany(Array.from({ length: 25 }, (_, index) => ({
      vendorId, headerId, categoryId,
      name: `Product ${String(index).padStart(2, '0')}`,
      slug: `pagination-product-${index}`,
      sku: `PAGINATION-${index}`,
      pricePaise: 10000,
      stock: 1,
      audit: { createdAt: new Date(Date.UTC(2025, 0, index + 1)) },
    })));

    const first = await vendorProductService.listProducts(vendorId, { page: 1, limit: 20, sort: 'oldest' });
    const next = await vendorProductService.listProducts(vendorId, { page: 2, limit: 20, sort: 'oldest' });
    expect(first.pagination).toMatchObject({ total: 25, totalPages: 2, hasNextPage: true });
    expect(first.data).toHaveLength(20);
    expect(next.data).toHaveLength(5);
    expect(first.data[0].name).toBe('Product 00');
    expect(next.data[0].name).toBe('Product 20');
    expect(new Set([...first.data, ...next.data].map((product) => String(product._id))).size).toBe(25);

    const newest = await vendorProductService.listProducts(vendorId, { page: 1, limit: 20, sort: 'newest' });
    expect(newest.data[0].name).toBe('Product 24');
  });

  test('product detail includes an optional uploaded size chart', async () => {
    const chart = await Attachment.create({
      ownerUserId: new mongoose.Types.ObjectId(), purpose: 'product_image',
      storageKey: '/uploads/chart.png', mime: 'image/png', sizeBytes: 100,
    });
    const product = await Product.create({
      vendorId: new mongoose.Types.ObjectId(), headerId: new mongoose.Types.ObjectId(),
      categoryId: new mongoose.Types.ObjectId(), name: 'School Shirt',
      slug: 'school-shirt-chart', sku: 'CHART-1', pricePaise: 50000,
      approvalStatus: 'approved', publishStatus: 'published',
      sizeChartAttachmentId: chart._id,
    });
    const detail = await productService.getProduct(product._id, { publicOnly: true });
    expect(detail.sizeChartAttachmentId.storageKey).toBe('/uploads/chart.png');
  });
});
