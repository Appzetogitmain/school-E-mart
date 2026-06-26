import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, UploadCloud, FileSpreadsheet, Plus, 
  Trash2, HelpCircle, AlertCircle, Sparkles, Check, 
  Users, Layers, Play, Loader2
} from 'lucide-react';
import { registerStudent } from '../../../services/schoolApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { parseClassGrade, parseSection } from '../../../utils/mappers/teacherMapper';
import { useTeacherSchoolId } from '../../../utils/teacherContext';
import { useTeacherClassOptions } from '../../../hooks/useTeacherClassOptions';

const parseCsvStudents = (text) => {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const col = (keys) => headers.findIndex((h) => keys.some((k) => h.includes(k)));

  return lines.slice(1).map((line, index) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const rollIdx = col(['roll']);
    const nameIdx = col(['name', 'student']);
    const parentIdx = col(['parent', 'guardian']);
    const phoneIdx = col(['phone', 'mobile']);
    return {
      rollNo: rollIdx >= 0 ? cols[rollIdx] : String(index + 1),
      name: nameIdx >= 0 ? cols[nameIdx] : '',
      parentName: parentIdx >= 0 ? cols[parentIdx] : '',
      phone: phoneIdx >= 0 ? cols[phoneIdx] : '',
    };
  });
};

const readStudentFile = (file) =>
  new Promise((resolve, reject) => {
    if (!file.name.endsWith('.csv')) {
      reject(new Error('Please upload a .csv file'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(parseCsvStudents(String(reader.result || '')));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsText(file);
  });

const TeacherBulkAddStudents = () => {
  const navigate = useNavigate();
  const schoolId = useTeacherSchoolId();
  const { classLabels, getSections } = useTeacherClassOptions(schoolId);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [rows, setRows] = useState([]);

  // Tab State: 'excel' or 'manual'
  const [activeTab, setActiveTab] = useState('excel');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  // 2. Real-time Roster Statistics
  const [stats, setStats] = useState({ total: 0, valid: 0, empty: 0 });

  useEffect(() => {
    if (classLabels.length > 0 && !selectedClass) {
      setSelectedClass(classLabels[0]);
      const sections = getSections(classLabels[0]);
      if (sections.length > 0) setSelectedSection(sections[0]);
    }
  }, [classLabels, getSections, selectedClass]);

  useEffect(() => {
    const total = rows.length;
    const valid = rows.filter((row) => row.name.trim() !== '').length;
    const empty = rows.filter((row) => row.name.trim() === '').length;
    setStats({ total, valid, empty });
  }, [rows]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // 3. Row Actions
  const handleAddRow = () => {
    const nextRollNo = String(rows.length + 1);
    setRows([...rows, { rollNo: nextRollNo, name: '', parentName: '', phone: '' }]);
    triggerToast('Added New Row!');
  };

  const handleDeleteRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    // Re-sequence Roll Numbers sequentially
    const resequenced = updated.map((row, i) => ({
      ...row,
      rollNo: String(i + 1)
    }));
    setRows(resequenced);
    triggerToast('Removed Row!');
  };

  const handleInputChange = (index, field, value) => {
    const updated = rows.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setRows(updated);
  };

  // 4. Excel drag-drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const importFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
      triggerToast('Please upload a .csv file with student data');
      return;
    }
    setSelectedFileName(file.name);
    try {
      const parsed = await readStudentFile(file);
      if (parsed.length === 0) {
        triggerToast('No student rows found in file');
        setRows([]);
        return;
      }
      setRows(parsed);
      triggerToast('CSV data imported successfully');
    } catch (err) {
      triggerToast(err.message || 'Unable to import file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      importFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      importFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validRows = rows.filter((row) => row.name.trim() !== '');

    if (validRows.length === 0) {
      triggerToast('Please fill at least one student row completely');
      return;
    }
    if (!schoolId) {
      setError('School context is missing. Please log in again.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const classGrade = parseClassGrade(selectedClass);
      const section = parseSection(selectedSection);

      for (const row of validRows) {
        await registerStudent(schoolId, {
          name: row.name.trim(),
          rollNo: row.rollNo.trim() || undefined,
          classGrade,
          section,
          gender: 'unspecified',
        });
      }

      triggerToast(`Added ${validRows.length} Students Successfully!`);
      setTimeout(() => navigate('/school/teacher/students'), 1500);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to add students'));
      triggerToast(getErrorMessage(err, 'Unable to add students'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen select-none font-outfit animate-in fade-in duration-300 pb-28 relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-6 duration-300">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <Check size={14} strokeWidth={3} />
          </div>
          <span className="text-xs font-black">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="px-6 pt-7 pb-4 bg-white flex items-center justify-between border-b border-gray-100 relative z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/school/teacher/students')}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all rounded-full flex items-center justify-center text-deep-purple mr-1"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-lg font-black text-deep-purple leading-none">Bulk Add Students</h1>
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              {selectedClass && selectedSection ? `${selectedClass} • Section ${selectedSection}` : 'Select class and section'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => triggerToast('Interactive Guidance Panel!')}
          className="px-3 py-1.5 hover:bg-gray-50 active:scale-95 transition-all rounded-full flex items-center gap-1 text-[10px] font-black text-gray-450"
        >
          <HelpCircle size={15} />
          <span>Help</span>
        </button>
      </div>

      <div className="space-y-4 px-6 mt-4 relative z-20">
        
        {/* 2. Top Info Alert Box */}
        <div className="bg-[#F8F6FF] border border-[#E9E4FF] rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-primary shrink-0">
            <Layers size={15} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] text-[#4F3F8B] font-bold">
            Add multiple students at once using Excel upload or manual entry.
          </span>
        </div>

        {/* 3. Sliding Tabs Selector */}
        <div className="bg-white border border-gray-200 rounded-2xl p-1 flex shadow-sm shrink-0">
          <button 
            onClick={() => setActiveTab('excel')}
            className={`flex-1 py-3 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'excel' 
                ? 'bg-primary text-white shadow-md' 
                : 'text-gray-450 hover:bg-gray-50'
            }`}
          >
            <UploadCloud size={16} />
            <span>Upload Excel</span>
          </button>

          <button 
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'manual' 
                ? 'bg-primary text-white shadow-md' 
                : 'text-gray-450 hover:bg-gray-50'
            }`}
          >
            <FileSpreadsheet size={16} />
            <span>Enter Manually</span>
          </button>
        </div>

        {/* 4. Tab Contents */}
        {activeTab === 'excel' ? (
          /* Upload Excel View Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Card: Drag & drop Excel */}
            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-black text-deep-purple">Upload Student List</h3>
                <p className="text-[9px] text-gray-400 font-bold mt-0.5">Upload an Excel file with student details.</p>
              </div>

              <button 
                onClick={() => triggerToast('Sample Template Downloaded!')}
                className="px-4 py-2 border border-emerald-250 hover:border-emerald-500 text-emerald-600 bg-emerald-50/30 active:scale-95 transition-all rounded-xl flex items-center gap-1.5 text-[9px] font-black"
              >
                <FileSpreadsheet size={13} className="text-emerald-500" />
                <span>Download Sample Excel</span>
              </button>

              {/* Dashed upload box zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border border-dashed rounded-2xl py-8 px-4 text-center transition-all ${
                  dragActive 
                    ? 'border-primary bg-primary/5 scale-[0.99]' 
                    : 'border-purple-200 bg-[#FAF9FF]'
                }`}
              >
                <UploadCloud size={30} className="text-primary/75 mx-auto mb-2.5 animate-bounce duration-1000" />
                <p className="text-[10px] font-bold text-deep-purple leading-none">
                  {selectedFileName ? 'Selected File:' : 'Drag & drop Excel file here'}
                </p>
                <p className="text-[9px] font-black text-primary mt-1 truncate max-w-[200px] mx-auto">
                  {selectedFileName || 'or'}
                </p>

                <label className="mt-3 inline-block px-5 py-2.5 bg-primary hover:bg-deep-purple active:scale-95 transition-all text-white text-[9px] font-black rounded-xl cursor-pointer shadow-md">
                  Choose File
                  <input 
                    type="file" 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept=".xlsx,.xls,.csv" 
                  />
                </label>
              </div>

              <span className="text-[8px] text-gray-400 font-bold block text-center">
                Supported formats: .xlsx, .xls, .csv (Max 5MB)
              </span>
            </div>

            {/* Right Card: Format structure sample */}
            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-black text-deep-purple">Excel Format</h3>
                <p className="text-[9px] text-gray-400 font-bold mt-0.5">Please match column titles exactly as shown below.</p>
              </div>

              {/* Mini Table Roster representation */}
              <div className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-[9px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 font-black text-deep-purple">
                      <th className="px-3 py-2">Roll No.</th>
                      <th className="px-3 py-2">Student Name</th>
                      <th className="px-3 py-2">Parent Name</th>
                      <th className="px-3 py-2">Parent Phone</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-500 font-bold">
                    <tr className="border-b border-gray-100">
                      <td className="px-3 py-2 text-deep-purple">1</td>
                      <td className="px-3 py-2">Aarav Sharma</td>
                      <td className="px-3 py-2">Rajesh Sharma</td>
                      <td className="px-3 py-2">9876543210</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-3 py-2 text-deep-purple">2</td>
                      <td className="px-3 py-2">Ananya Verma</td>
                      <td className="px-3 py-2">Suresh Verma</td>
                      <td className="px-3 py-2">9876543211</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-3 py-2 text-deep-purple">3</td>
                      <td className="px-3 py-2">Rohan Singh</td>
                      <td className="px-3 py-2">Amit Singh</td>
                      <td className="px-3 py-2">9876543212</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-gray-400 font-black">...</td>
                      <td className="px-3 py-2 text-gray-400">...</td>
                      <td className="px-3 py-2 text-gray-400">...</td>
                      <td className="px-3 py-2 text-gray-400">...</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Purple Alert box format tip */}
              <div className="bg-[#FAF9FF] border border-[#ECE9FC] rounded-2xl p-3.5 flex gap-2.5">
                <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
                <span className="text-[8px] text-primary font-black leading-snug">
                  Make sure the first row contains the column headers exactly as listed.
                </span>
              </div>
            </div>

          </div>
        ) : (
          /* Manual Entry View */
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
            
            {/* manual header row */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-deep-purple">Enter Manually</h3>
                <p className="text-[9px] text-gray-400 font-bold mt-0.5">Add students by entering details below.</p>
              </div>

              <button 
                type="button"
                onClick={handleAddRow}
                className="px-3 py-1.5 hover:bg-primary/5 text-primary active:scale-95 transition-all rounded-xl flex items-center gap-1 text-[10px] font-black"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Add Row</span>
              </button>
            </div>

            {/* Editable entries list table */}
            <div className="border border-gray-150 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse text-[10px] min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 font-black text-deep-purple">
                    <th className="px-3 py-2.5 w-16">Roll No. *</th>
                    <th className="px-3 py-2.5">Student Name *</th>
                    <th className="px-3 py-2.5">Parent Name</th>
                    <th className="px-3 py-2.5">Parent Phone *</th>
                    <th className="px-3 py-2.5 w-14 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2">
                        <input 
                          type="text" 
                          value={row.rollNo}
                          onChange={(e) => handleInputChange(idx, 'rollNo', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 focus:border-primary focus:outline-none rounded-xl text-center text-xs font-black text-deep-purple" 
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="text" 
                          value={row.name}
                          onChange={(e) => handleInputChange(idx, 'name', e.target.value)}
                          placeholder="Enter student name"
                          className="w-full px-3 py-1.5 border border-gray-200 focus:border-primary focus:outline-none rounded-xl font-bold text-deep-purple"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="text" 
                          value={row.parentName}
                          onChange={(e) => handleInputChange(idx, 'parentName', e.target.value)}
                          placeholder="Enter parent name"
                          className="w-full px-3 py-1.5 border border-gray-200 focus:border-primary focus:outline-none rounded-xl font-bold text-deep-purple"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="text" 
                          value={row.phone}
                          onChange={(e) => handleInputChange(idx, 'phone', e.target.value)}
                          placeholder="Enter phone number"
                          className="w-full px-3 py-1.5 border border-gray-200 focus:border-primary focus:outline-none rounded-xl font-bold text-deep-purple"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button 
                          type="button"
                          onClick={() => handleDeleteRow(idx)}
                          className="w-7 h-7 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-full flex items-center justify-center transition-all mx-auto"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom table info bar */}
            <div className="bg-[#FAF9FF] border border-[#ECE9FC] rounded-2xl p-3.5 flex items-center gap-2">
              <AlertCircle size={14} className="text-primary shrink-0" />
              <span className="text-[8px] text-primary font-black">
                You can also copy data from Excel and paste it here.
              </span>
            </div>
          </div>
        )}

        {/* 5. Stat Row Counters Summary */}
        <div className="bg-white border border-gray-200 rounded-3xl p-4 grid grid-cols-3 gap-2 text-center shadow-sm">
          {/* Total */}
          <div className="border-r border-gray-100 flex flex-col justify-center py-1">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Total Students</span>
            <span className="text-sm font-black text-deep-purple leading-none mt-1.5">{stats.total}</span>
          </div>

          {/* Valid */}
          <div className="border-r border-gray-100 flex flex-col justify-center py-1">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Valid Rows</span>
            <span className="text-sm font-black text-emerald-600 leading-none mt-1.5">{stats.valid}</span>
          </div>

          {/* Empty */}
          <div className="flex flex-col justify-center py-1">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Empty Rows</span>
            <span className="text-sm font-black text-amber-500 leading-none mt-1.5">{stats.empty}</span>
          </div>
        </div>

      </div>

      {/* 6. Primary Action Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-4 z-40">
        <button 
          onClick={handleSubmit}
          className="w-full py-4 bg-primary text-white hover:bg-deep-purple active:scale-98 transition-all rounded-[1.8rem] text-sm font-black shadow-lg shadow-purple-100 flex items-center justify-center gap-2"
        >
          <Users size={16} strokeWidth={2.5} />
          <span>Preview & Add Students</span>
        </button>
      </div>

    </div>
  );
};

export default TeacherBulkAddStudents;
