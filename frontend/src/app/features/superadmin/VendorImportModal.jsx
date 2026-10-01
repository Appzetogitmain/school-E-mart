import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import {
  X, UploadCloud, FileSpreadsheet, Download, CheckCircle2,
  AlertTriangle, AlertCircle, Loader2, ArrowRight, RefreshCw, FileText
} from 'lucide-react';
import { bulkImportVendors } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';

export const downloadVendorSampleTemplate = () => {
  // 1. Data rows (Headers strictly match DB properties with 2 realistic examples)
  const sampleData = [
    {
      'Store Name': 'Apex School Uniforms',
      'Owner Name': 'Rajesh Sharma',
      'Email': 'rajesh.apex@example.com',
      'Phone': '9829012345',
      'Commission %': 10,
      'City': 'Jaipur',
      'State': 'Rajasthan',
      'Pincode': '302001',
      'Address': 'Shop 12, Station Road, MI Road',
      'GSTIN': '08AAAAA0000A1Z5',
      'PAN': 'ABCDE1234F',
      'Password': 'Vendor@1234',
    },
    {
      'Store Name': 'National Book & Stationery Depot',
      'Owner Name': 'Sanjay Gupta',
      'Email': 'nationalbooks@example.com',
      'Phone': '9876543210',
      'Commission %': 12,
      'City': 'New Delhi',
      'State': 'Delhi',
      'Pincode': '110001',
      'Address': '45 Nai Sarak Book Market',
      'GSTIN': '',
      'PAN': '',
      'Password': '',
    },
  ];

  // 2. Instructions Sheet
  const instructions = [
    {
      'Column Name': 'Store Name',
      'Required?': 'YES (Zaroori)',
      'Description': 'Vendor ki dukaan ya business ka naam.',
      'Example': 'Apex School Uniforms',
    },
    {
      'Column Name': 'Owner Name',
      'Required?': 'YES (Zaroori)',
      'Description': 'Vendor / Malik ka pura naam.',
      'Example': 'Rajesh Sharma',
    },
    {
      'Column Name': 'Email',
      'Required?': 'YES (Zaroori)',
      'Description': 'Unique email address jo vendor ke login ke liye use hoga.',
      'Example': 'rajesh.apex@example.com',
    },
    {
      'Column Name': 'Phone',
      'Required?': 'YES (Zaroori)',
      'Description': '10-digit Indian mobile number (6, 7, 8 ya 9 se shuru hone wala).',
      'Example': '9829012345',
    },
    {
      'Column Name': 'Commission %',
      'Required?': 'NO (Optional)',
      'Description': 'Platform commission percent. Agar khali chhodenge to default 10% set hoga.',
      'Example': '10',
    },
    {
      'Column Name': 'City',
      'Required?': 'NO (Optional)',
      'Description': 'Shahar ka naam. Khali chhodne par bad me profile edit karke bhar sakte hain.',
      'Example': 'Jaipur',
    },
    {
      'Column Name': 'State',
      'Required?': 'NO (Optional)',
      'Description': 'State / Rajya ka naam.',
      'Example': 'Rajasthan',
    },
    {
      'Column Name': 'Pincode',
      'Required?': 'NO (Optional)',
      'Description': '6 digit postal code.',
      'Example': '302001',
    },
    {
      'Column Name': 'Address',
      'Required?': 'NO (Optional)',
      'Description': 'Dukaan ya godown ka pura address.',
      'Example': 'Shop 12, Station Road',
    },
    {
      'Column Name': 'GSTIN',
      'Required?': 'NO (Optional)',
      'Description': '15-digit GST number (agar available hai).',
      'Example': '08AAAAA0000A1Z5',
    },
    {
      'Column Name': 'PAN',
      'Required?': 'NO (Optional)',
      'Description': '10-digit PAN card number.',
      'Example': 'ABCDE1234F',
    },
    {
      'Column Name': 'Password',
      'Required?': 'NO (Optional)',
      'Description': 'Vendor login password. Khali chhodne par default "Vendor@1234" set hoga.',
      'Example': 'Vendor@1234',
    },
    {
      'Column Name': 'IMPORTANT NOTE',
      'Required:': 'NOTE',
      'Description': 'Agar koi bhi optional field khali chhut jaye to chinta na karein, vendor create ho jayega aur baad me Super Admin panel me Edit button se manually update kiya ja sakta hai.',
      'Example': '—',
    },
  ];

  const wb = XLSX.utils.book_new();

  const wsVendors = XLSX.utils.json_to_sheet(sampleData);
  // Set nice column widths
  wsVendors['!cols'] = [
    { wch: 30 }, // Store Name
    { wch: 22 }, // Owner Name
    { wch: 28 }, // Email
    { wch: 16 }, // Phone
    { wch: 15 }, // Commission %
    { wch: 18 }, // City
    { wch: 18 }, // State
    { wch: 12 }, // Pincode
    { wch: 35 }, // Address
    { wch: 20 }, // GSTIN
    { wch: 15 }, // PAN
    { wch: 16 }, // Password
  ];

  const wsInstructions = XLSX.utils.json_to_sheet(instructions);
  wsInstructions['!cols'] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 65 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, wsVendors, 'Vendors');
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions Guide');

  XLSX.writeFile(wb, 'Vendor_Import_Template.xlsx');
};

const VendorImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parsingError, setParsingError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setParsingError('');
    setImportResult(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = (file) => {
    if (!file) return;
    setParsingError('');
    setImportResult(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setParsingError('The uploaded file is empty or does not contain any data rows.');
          setParsedRows([]);
          return;
        }

        // Map and validate rows
        const normalized = rawJson.map((row, index) => {
          const storeName = String(row['Store Name'] || row.storeName || row.Store || '').trim();
          const name = String(row['Owner Name'] || row.ownerName || row.name || row.Name || '').trim();
          const email = String(row['Email'] || row.email || '').trim().toLowerCase();
          const rawPhone = String(row['Phone'] || row.phone || row['Mobile'] || row.mobile || '').replace(/\D/g, '');
          let phone = rawPhone;
          if (phone.length === 12 && phone.startsWith('91')) phone = phone.slice(2);
          if (phone.length === 11 && phone.startsWith('0')) phone = phone.slice(1);

          const missingFields = [];
          if (!storeName) missingFields.push('Store Name');
          if (!name) missingFields.push('Owner Name');
          if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) missingFields.push('Valid Email');
          if (!/^[6-9]\d{9}$/.test(phone)) missingFields.push('10-digit Phone (6-9)');

          return {
            rowNumber: index + 1,
            storeName,
            name,
            email,
            phone,
            commissionPercent: row['Commission %'] || row.commissionPercent || '10',
            city: String(row['City'] || row.city || '').trim(),
            state: String(row['State'] || row.state || '').trim(),
            pinCode: String(row['Pincode'] || row.pinCode || row.pincode || '').replace(/\D/g, ''),
            address: String(row['Address'] || row.address || row.line1 || '').trim(),
            gstin: String(row['GSTIN'] || row.gstin || '').trim().toUpperCase(),
            panCard: String(row['PAN'] || row.panCard || row.pan || '').trim().toUpperCase(),
            password: String(row['Password'] || row.password || '').trim(),
            isValid: missingFields.length === 0,
            missingFields,
          };
        });

        setParsedRows(normalized);
      } catch (err) {
        setParsingError('Unable to parse file. Please make sure it is a valid .xlsx or .csv spreadsheet.');
        setParsedRows([]);
      }
    };

    reader.onerror = () => {
      setParsingError('Failed to read the file from disk.');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleStartImport = async () => {
    if (!parsedRows.length) return;

    setIsUploading(true);
    setParsingError('');

    try {
      const response = await bulkImportVendors(parsedRows);
      setImportResult(response);
      if (response?.successCount > 0 && onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      setParsingError(getErrorMessage(err, 'Failed to import vendors. Please verify data format.'));
    } finally {
      setIsUploading(false);
    }
  };

  const validRowsCount = parsedRows.filter((r) => r.isValid).length;
  const invalidRowsCount = parsedRows.length - validRowsCount;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={!isUploading ? handleClose : undefined}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-150 overflow-hidden my-6 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-gray-150 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 tracking-tight">Import Vendors (.xlsx / .csv)</h2>
              <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                Bulk onboarding with automatic validation & default fallback support.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X size={16} className="stroke-[2.5]" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800">
          {/* STEP 1: DOWNLOAD TEMPLATE */}
          {!importResult && (
            <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Download size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950">Step 1: Download Standard Sample Template</h4>
                  <p className="text-[11px] text-emerald-800/80 font-bold mt-0.5">
                    Pre-formatted Excel sheet with column instructions and 2 example rows.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={downloadVendorSampleTemplate}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0 active:scale-95"
              >
                <Download size={14} className="stroke-[3]" />
                <span>DOWNLOAD TEMPLATE (.XLSX)</span>
              </button>
            </div>
          )}

          {/* INSTRUCTIONS NOTICE */}
          {!importResult && (
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 space-y-1.5 text-amber-900">
              <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                <AlertCircle size={15} className="text-amber-600 shrink-0" />
                <span>Format Guidelines & Tolerant Defaults</span>
              </div>
              <ul className="text-[11px] text-amber-800 font-bold space-y-1 list-disc list-inside pl-1">
                <li>
                  <span className="font-black text-amber-950">Zaroori (Required) Fields:</span> Store Name, Owner Name, Email, Phone (10 Digits).
                </li>
                <li>
                  <span className="font-black text-amber-950">Optional Fields:</span> Commission %, City, State, Pincode, Address, GSTIN, PAN, Password.
                </li>
                <li>
                  <span className="font-black text-amber-950">Koi Field Khali Chhut Jaye:</span> Chinta na karein! Account create ho jayega, aur aap baad me Super Admin panel se vendor edit karke address/GST update kar sakte hain.
                </li>
                <li>
                  <span className="font-black text-amber-950">Default Password:</span> Khali chhodne par auto <code className="bg-amber-100/80 px-1 py-0.5 rounded text-amber-950 font-black">Vendor@1234</code> set ho jayega.
                </li>
              </ul>
            </div>
          )}

          {/* STEP 2: FILE UPLOAD ZONE (WHEN NOT IMPORTED YET) */}
          {!importResult && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">
                Step 2: Select or Drag & Drop File (.xlsx / .csv)
              </label>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/40 scale-[0.99]'
                    : selectedFile
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50/40 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-emerald-600">
                  <UploadCloud size={24} className="stroke-[2.2]" />
                </div>

                <div>
                  <p className="text-xs font-black text-gray-800">
                    {selectedFile ? selectedFile.name : 'Click to browse or drag & drop file here'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files up to 10MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PARSING ERROR BANNER */}
          {parsingError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-bold">
              <AlertTriangle size={16} className="shrink-0 text-rose-600" />
              <span>{parsingError}</span>
            </div>
          )}

          {/* PREVIEW TABLE (BEFORE SUBMITTING) */}
          {!importResult && parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-900">
                    Detected Vendors Preview ({parsedRows.length} Rows)
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black">
                    {validRowsCount} Ready
                  </span>
                  {invalidRowsCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-black">
                      {invalidRowsCount} Incomplete
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={resetState}
                  className="text-[11px] font-bold text-gray-500 hover:text-gray-800 underline"
                >
                  Clear Selection
                </button>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-400 tracking-wider sticky top-0">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Store Name</th>
                      <th className="p-2.5">Owner</th>
                      <th className="p-2.5">Phone</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">City</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {parsedRows.slice(0, 50).map((r) => (
                      <tr key={`row-${r.rowNumber}`} className={r.isValid ? 'hover:bg-gray-50/50' : 'bg-rose-50/30'}>
                        <td className="p-2.5 font-bold text-gray-400">{r.rowNumber}</td>
                        <td className="p-2.5 font-black text-gray-900 max-w-[140px] truncate" title={r.storeName}>
                          {r.storeName || <span className="text-rose-500 font-bold">—</span>}
                        </td>
                        <td className="p-2.5 text-gray-700 max-w-[120px] truncate">{r.name || '—'}</td>
                        <td className="p-2.5 font-mono text-gray-700">{r.phone || '—'}</td>
                        <td className="p-2.5 text-gray-600 max-w-[140px] truncate" title={r.email}>
                          {r.email || '—'}
                        </td>
                        <td className="p-2.5 text-gray-500">{r.city || '—'}</td>
                        <td className="p-2.5">
                          {r.isValid ? (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              Valid
                            </span>
                          ) : (
                            <span
                              className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100"
                              title={r.missingFields.join(', ')}
                            >
                              Missing: {r.missingFields.join(', ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 50 && (
                <p className="text-[10px] text-gray-400 font-bold text-center">
                  Showing first 50 of {parsedRows.length} rows. All valid rows will be imported.
                </p>
              )}
            </div>
          )}

          {/* RESULTS VIEW (AFTER IMPORT) */}
          {importResult && (
            <div className="space-y-4 py-2">
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <CheckCircle2 size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-950">Bulk Import Completed!</h3>
                    <p className="text-xs text-emerald-800 font-bold mt-0.5">
                      {importResult.successCount} of {importResult.total} vendor account(s) successfully created.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-700 block leading-tight">
                    {importResult.successCount}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Created</span>
                </div>
              </div>

              {/* Error list if any rows failed */}
              {importResult.failedCount > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-600" />
                      <span>{importResult.failedCount} Row(s) Skipped:</span>
                    </h4>
                    <span className="text-[10px] font-bold text-amber-700">Please review and re-import these rows</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 text-[11px] divide-y divide-amber-100">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="pt-1.5 first:pt-0 flex items-center justify-between text-amber-900">
                        <span className="font-bold">
                          Row {err.row}: <span className="font-black">{err.storeName}</span>
                        </span>
                        <span className="text-rose-600 font-bold">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-150 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-xs font-black text-gray-700 transition-colors disabled:opacity-50"
          >
            {importResult ? 'Close' : 'Cancel'}
          </button>

          {importResult ? (
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl bg-[#0B1528] hover:bg-gray-900 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>Done & View Vendors</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartImport}
              disabled={isUploading || validRowsCount === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 transition-all shadow-md shadow-emerald-700/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Importing Vendors…</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet size={15} className="stroke-[2.5]" />
                  <span>Start Import ({validRowsCount} Vendors)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VendorImportModal;
