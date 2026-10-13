const { createProductSchema, updateProductSchema } = require('../../src/modules/vendor/validators/vendor.validator');

describe('vendor product update validation', () => {
  const validProductFields = {
    name: 'School Shirt',
    sku: 'SHIRT-001',
    headerId: '507f1f77bcf86cd799439011',
    categoryId: '507f1f77bcf86cd799439012',
    pricePaise: 50000,
    images: [{ attachmentId: '507f1f77bcf86cd799439013' }],
  };

  test('allows clearing optional MRP and removing all images while editing', () => {
    const { error, value } = updateProductSchema.validate({
      originalPricePaise: null,
      images: [],
    });

    expect(error).toBeUndefined();
    expect(value).toMatchObject({ originalPricePaise: null, images: [] });
  });

  test('still requires a product image on create', () => {
    const { error } = createProductSchema.validate({
      ...validProductFields,
      images: [],
    });

    expect(error).toBeDefined();
  });
});
