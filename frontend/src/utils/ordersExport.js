// Excel / PDF export of a list of vendor orders (rows come from mapVendorOrderForList).
//
// Building the file and saving it are separate so the content can be checked without a
// browser: buildOrdersWorkbook / buildOrdersPdf return the file object, download* saves it.
import * as XLSX from 'xlsx';

export const ORDER_EXPORT_COLUMNS = [
  { key: 'orderId', header: 'Order ID' },
  { key: 'date', header: 'Date' },
  { key: 'customer', header: 'Customer' },
  { key: 'student', header: 'Student' },
  { key: 'class', header: 'Class' },
  { key: 'items', header: 'Items' },
  { key: 'paymentMethod', header: 'Payment Method' },
  { key: 'paymentStatus', header: 'Payment Status' },
  { key: 'orderStatus', header: 'Order Status' },
  { key: 'amount', header: 'Amount (INR)' },
];

const itemsSummary = (order) => {
  const raw = order?.raw?.vendorItems || order?.raw?.items;
  const source = Array.isArray(raw) && raw.length ? raw : order?.items || [];
  return source
    .map((item) => {
      const qty = item.quantity ?? item.qty ?? 1;
      return `${item.name || 'Item'} x${qty}`;
    })
    .join(', ');
};

export const buildOrderExportRows = (orders = []) =>
  orders.map((order) => ({
    orderId: order.id || '',
    date: order.orderDate || '',
    customer: order.parentName || order.school || '',
    student: order.studentName && order.studentName !== '—' ? order.studentName : '',
    class: order.studentGrade || '',
    items: itemsSummary(order),
    paymentMethod: order.paymentMethod || '',
    // Same wording as the screen (COD reads "UNPAID (Pay on Delivery)" until delivered)
    paymentStatus: order.paymentStatusFormatted || '',
    orderStatus: order.status || '',
    amount: Number(order.amount) || 0,
  }));

const fileStamp = () => new Date().toISOString().slice(0, 10);

export const buildOrdersWorkbook = (orders) => {
  const rows = buildOrderExportRows(orders);
  const sheetRows = rows.map((row) =>
    Object.fromEntries(ORDER_EXPORT_COLUMNS.map((col) => [col.header, row[col.key]]))
  );
  const sheet = XLSX.utils.json_to_sheet(sheetRows, { header: ORDER_EXPORT_COLUMNS.map((c) => c.header) });
  sheet['!cols'] = [14, 12, 22, 22, 10, 44, 14, 24, 16, 14].map((wch) => ({ wch }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Orders');
  return workbook;
};

export const downloadOrdersExcel = (orders) => {
  const workbook = buildOrdersWorkbook(orders);
  XLSX.writeFile(workbook, `Orders_${fileStamp()}.xlsx`);
};

export const buildOrdersPdf = async (orders, { title = 'Orders Report', subtitle = '' } = {}) => {
  // Loaded on demand: the PDF libraries are large and only needed when someone exports.
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const rows = buildOrderExportRows(orders);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  doc.setFontSize(16);
  doc.text(title, 40, 40);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    [`Generated ${new Date().toLocaleString('en-IN')}`, subtitle].filter(Boolean).join('  |  '),
    40,
    56
  );
  doc.text(`${rows.length} order(s)  |  Total: INR ${total.toFixed(2)}`, 40, 69);

  autoTable(doc, {
    startY: 80,
    head: [ORDER_EXPORT_COLUMNS.map((col) => col.header)],
    body: rows.map((row) =>
      ORDER_EXPORT_COLUMNS.map((col) => (col.key === 'amount' ? row.amount.toFixed(2) : String(row[col.key] ?? '')))
    ),
    styles: { fontSize: 7.5, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [91, 63, 214] },
    columnStyles: { 5: { cellWidth: 150 }, 9: { halign: 'right' } },
    margin: { left: 40, right: 40 },
  });
  return doc;
};

export const downloadOrdersPdf = async (orders, meta) => {
  const doc = await buildOrdersPdf(orders, meta);
  doc.save(`Orders_${fileStamp()}.pdf`);
};
