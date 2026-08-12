const { BadRequestError } = require('../../../common/errors');

/**
 * A kit item "requires a choice" when the school configured more than zero
 * options for it. An item with a single size/color still requires the parent
 * to explicitly pick it — it's their child's kit, and a silent default could
 * easily be wrong (a Boy's uniform accidentally shipped in a Girl's cut, a
 * size 24 shipped for a size 38 student, etc).
 */
const needsSize = (item) => (item?.attributes?.sizes || []).length > 0;
const needsColor = (item) => (item?.attributes?.colors || []).length > 0;

/**
 * Validates the parent's per-item size/color choices against what the kit
 * actually offers, and returns a normalized array (one entry per kit item,
 * positionally matched) ready to store on a cart line or snapshot onto an
 * order's kitItems. Shared by cart.service.js (add-to-cart time) and
 * checkout.service.js (checkout time, since the kit can change in between).
 */
const validateAndNormalizeKitSelections = (kit, kitSelections) => {
  const items = kit?.items || [];
  const selectionByIndex = new Map((kitSelections || []).map((s) => [Number(s.itemIndex), s]));

  return items.map((item, index) => {
    const selection = selectionByIndex.get(index) || {};
    const itemName = item.name || `Item ${index + 1}`;

    let size = selection.size ? String(selection.size).trim() : '';
    let color = selection.color ? String(selection.color).trim() : '';

    if (needsSize(item)) {
      if (!size) {
        throw new BadRequestError(`Please select a size for "${itemName}"`, null, 'KIT_SIZE_REQUIRED');
      }
      if (!item.attributes.sizes.includes(size)) {
        throw new BadRequestError(`"${size}" is not an available size for "${itemName}"`, null, 'KIT_INVALID_SIZE');
      }
    } else {
      size = '';
    }

    if (needsColor(item)) {
      if (!color) {
        throw new BadRequestError(`Please select a color for "${itemName}"`, null, 'KIT_COLOR_REQUIRED');
      }
      if (!item.attributes.colors.includes(color)) {
        throw new BadRequestError(`"${color}" is not an available color for "${itemName}"`, null, 'KIT_INVALID_COLOR');
      }
    } else {
      color = '';
    }

    return {
      itemIndex: index,
      name: itemName,
      size: size || undefined,
      color: color || undefined,
    };
  });
};

module.exports = { validateAndNormalizeKitSelections, needsSize, needsColor };
