const generateOrderNumber = () => {
  const ts = Date.now().toString();
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `ORD${ts}${suffix}`;
};

module.exports = { generateOrderNumber };
