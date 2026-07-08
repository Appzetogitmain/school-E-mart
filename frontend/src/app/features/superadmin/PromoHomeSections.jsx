import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home, Edit3, Trash2, Plus, RefreshCw, X, ChevronRight, CheckCircle, Info, Loader2
} from 'lucide-react';
import { listCmsSections } from '../../../services/adminApi';
import { getCategoryTree } from '../../../services/catalogApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapSectionForAdmin } from '../../../utils/mappers/adminCmsMapper';

const PromoHomeSections = () => {
  // Mock promotional home sections matching your screenshot exactly
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSections = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listCmsSections({ limit: 100 });
      setSections((data || []).map(mapSectionForAdmin));
    } catch (err) {
      setSections([]);
      setError(getErrorMessage(err, 'Unable to load homepage sections'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const [allCategories, setAllCategories] = useState([]);

  const loadCategories = useCallback(async () => {
    try {
      const tree = await getCategoryTree();
      setAllCategories(
        (tree || []).flatMap((header) =>
          (header.categories || []).map((cat) => ({
            name: cat.name,
            checked: false,
            id: cat._id || cat.id,
          }))
        )
      );
    } catch {
      setAllCategories([]);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [pageLocation, setPageLocation] = useState('Home Page');
  const [displayType, setDisplayType] = useState('Products');
  const [numColumns, setNumColumns] = useState('4 Columns');
  const [itemLimit, setItemLimit] = useState('8');
  const [isActive, setIsActive] = useState(true);

  // Pagination count
  const [perPage, setPerPage] = useState('10');

  // Handle Title change & Autogenerate slug
  const handleTitleChange = (val) => {
    setSectionTitle(val);
    // Auto generate lowercase-hyphenated slug
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
      .replace(/\s+/g, '-')       // replace spaces with hyphens
      .replace(/-+/g, '-');       // collapse duplicate hyphens
    setSlug(generatedSlug);
  };

  // Toggle checklist categories
  const handleCategoryCheckbox = (idx) => {
    setAllCategories(prev => prev.map((c, i) => {
      if (i === idx) {
        return { ...c, checked: !c.checked };
      }
      return c;
    }));
  };

  // Count selected categories
  const selectedCategoriesCount = allCategories.filter(c => c.checked).length;

  // Add / Update Section action
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sectionTitle.trim() || !slug.trim()) {
      alert('Please fill out Section Title and URL slug.');
      return;
    }

    const selectedCats = allCategories.filter(c => c.checked).map(c => c.name);

    if (isEditing) {
      // Edit mode: Update existing section
      setSections(prev => prev.map(s => {
        if (s.id === editId) {
          return {
            ...s,
            title: sectionTitle.trim(),
            slug: slug.trim(),
            location: pageLocation,
            type: displayType,
            categories: selectedCats,
            columns: parseInt(numColumns),
            limit: parseInt(itemLimit),
            status: isActive ? 'Active' : 'Inactive'
          };
        }
        return s;
      }));
      alert('Section updated successfully!');
      resetForm();
    } else {
      // Add mode: Create new section
      const nextId = sections.length > 0 ? Math.max(...sections.map(s => s.id)) + 1 : 1;
      const nextOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order)) + 1 : 1;
      
      const newSec = {
        id: nextId,
        order: nextOrder,
        title: sectionTitle.trim(),
        slug: slug.trim(),
        location: pageLocation,
        type: displayType,
        categories: selectedCats,
        columns: parseInt(numColumns),
        limit: parseInt(itemLimit),
        status: isActive ? 'Active' : 'Inactive'
      };

      setSections(prev => [...prev, newSec]);
      alert('Promotional section added successfully!');
      resetForm();
    }
  };

  // Trigger edit populate
  const handleEdit = (section) => {
    setIsEditing(true);
    setEditId(section.id);
    setSectionTitle(section.title);
    setSlug(section.slug);
    setPageLocation(section.location);
    setDisplayType(section.type);
    setNumColumns(`${section.columns} Columns`);
    setItemLimit(section.limit.toString());
    setIsActive(section.status === 'Active');

    // Sync categories checkboxes
    setAllCategories(prev => prev.map(c => ({
      ...c,
      checked: section.categories.includes(c.name)
    })));
  };

  // Decommission / Delete section
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this promotional section?')) {
      setSections(prev => prev.filter(s => s.id !== id).map((s, idx) => ({
        ...s,
        order: idx + 1 // recalculate serial orders
      })));
    }
  };

  // Cancel edit reset
  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setSectionTitle('');
    setSlug('');
    setPageLocation('Home Page');
    setDisplayType('Products');
    setNumColumns('4 Columns');
    setItemLimit('8');
    setIsActive(true);

    // Reset default checkboxes (e.g. Bread, Buffalo Milk, Camel Milk)
    const defaultChecks = ['Bread', 'Buffalo Milk', 'Camel Milk', 'Cow Milk'];
    setAllCategories(prev => prev.map(c => ({
      ...c,
      checked: defaultChecks.includes(c.name)
    })));
  };

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Home Sections</h1>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              PROMOTIONS FEED
            </span>
          </div>
          <p className="text-xs text-gray-400 font-bold mt-1.5">Configure landing category spotlights, product grids, best sellers row layouts, and promotional filters.</p>
        </div>

        {/* Breadcrumb right align */}
        <div className="text-xs text-gray-400 font-bold flex items-center gap-1.5 self-start sm:self-auto bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/50">
          <span className="hover:text-gray-600 cursor-pointer">Home</span>
          <ChevronRight size={10} className="text-gray-300" />
          <span className="text-gray-700">Home Sections</span>
        </div>
      </div>

      {/* TWO COLUMN GRID PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: EDIT/ADD PANEL */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 text-left shadow-xs">
          
          <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider border-b border-gray-100 pb-3 select-none">
            {isEditing ? 'Edit Section' : 'Add Section'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-gray-700">
            
            {/* Section Title */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">
                Section Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter Section Title"
                value={sectionTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
              />
            </div>

            {/* Slug URL identifier */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black">
                Slug <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. fresh-milk"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
              />
              <span className="block text-[8px] text-gray-400 font-medium">URL-friendly identifier (lowercase, hyphens only)</span>
            </div>

            {/* Page Location Radios */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">
                Page Location <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-4 text-xs pt-1 select-none">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pageLocation"
                    checked={pageLocation === 'Home Page'}
                    onChange={() => setPageLocation('Home Page')}
                    className="accent-indigo-600 cursor-pointer h-4 w-4"
                  />
                  <span>Home Page</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pageLocation"
                    checked={pageLocation === 'Header Category Page'}
                    onChange={() => setPageLocation('Header Category Page')}
                    className="accent-indigo-600 cursor-pointer h-4 w-4"
                  />
                  <span>Header Category Page</span>
                </label>
              </div>
            </div>

            {/* Display Type Select */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">
                Display Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={displayType}
                onChange={(e) => setDisplayType(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold cursor-pointer"
              >
                <option value="Products">Products</option>
                <option value="Banners">Banners</option>
                <option value="Grids">Grids</option>
              </select>
            </div>

            {/* Categories scroll checklist */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">Categories</label>
              <div className="border border-gray-200 rounded-xl bg-gray-50 overflow-y-auto max-h-[140px] p-3 space-y-2 select-none">
                {allCategories.map((c, idx) => (
                  <label key={idx} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold py-0.5 hover:text-gray-950 transition-colors">
                    <input
                      type="checkbox"
                      checked={c.checked}
                      onChange={() => handleCategoryCheckbox(idx)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
              <span className="block text-[8px] text-gray-400 font-bold select-none">{selectedCategoriesCount} selected</span>
            </div>

            {/* Subcategories (disabled matching screenshot) */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">SubCategories</label>
              <input
                type="text"
                disabled
                value="No subcategories available"
                className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none font-bold text-gray-400 cursor-not-allowed select-none"
              />
              <span className="block text-[8px] text-gray-400 font-bold select-none">0 selected</span>
            </div>

            {/* Number of Columns */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">
                Number of Columns <span className="text-rose-500">*</span>
              </label>
              <select
                value={numColumns}
                onChange={(e) => setNumColumns(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold cursor-pointer"
              >
                <option value="4 Columns">4 Columns</option>
                <option value="6 Columns">6 Columns</option>
                <option value="8 Columns">8 Columns</option>
              </select>
            </div>

            {/* Item Limit */}
            <div className="space-y-1.5">
              <label className="block text-gray-400 uppercase tracking-wide text-[9px] font-black select-none">
                Item Limit <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={itemLimit}
                onChange={(e) => setItemLimit(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 font-bold"
              />
            </div>

            {/* Active Checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer text-xs select-none pt-1">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
              />
              <span>Active (Show on home page)</span>
            </label>

            {/* Submit & Reset actions */}
            <div className="pt-4 space-y-2 select-none">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#0B1528] hover:bg-[#15253F] text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all shadow-xs"
              >
                {isEditing ? 'Update Section' : 'Add Section'}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-black uppercase tracking-wider py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>

          </form>

        </div>

        {/* RIGHT COLUMN: VIEW SECTIONS LEDGER */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 text-left shadow-xs">
          
          <h3 className="text-sm font-black text-[#0B1528] uppercase tracking-wider border-b border-gray-100 pb-3 select-none">
            View Sections
          </h3>

          {/* Show entry limit row */}
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 select-none pb-2 border-b border-gray-50">
            <span>Show</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none cursor-pointer font-bold"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>entries</span>
          </div>

          {/* SECTIONS LOG TABLE */}
          <div className="overflow-x-auto border border-gray-150 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-150 select-none">
                  <th className="px-4 py-3 w-16 text-center">Order</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Categories</th>
                  <th className="px-4 py-3 text-center w-20">Columns</th>
                  <th className="px-4 py-3 text-center w-24">Status</th>
                  <th className="px-4 py-3 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
                {sections.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-400 font-extrabold select-none">
                      No promotional home sections registered.
                    </td>
                  </tr>
                ) : (
                  sections.slice(0, parseInt(perPage)).map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      
                      {/* Serial Order */}
                      <td className="px-4 py-4 text-center text-gray-400 font-extrabold tabular-nums select-none">
                        {s.order}
                      </td>

                      {/* Title */}
                      <td className="px-4 py-4 text-gray-900 font-extrabold select-text">
                        {s.title}
                      </td>

                      {/* Location Page */}
                      <td className="px-4 py-4 text-gray-500 font-semibold select-none">
                        {s.location}
                      </td>

                      {/* Type format */}
                      <td className="px-4 py-4 text-gray-500 font-semibold select-none">
                        {s.type}
                      </td>

                      {/* Active Categories list */}
                      <td className="px-4 py-4 text-gray-400 font-medium max-w-[200px] truncate select-text">
                        {s.categories.join(', ')}
                      </td>

                      {/* Columns */}
                      <td className="px-4 py-4 text-center text-gray-900 font-extrabold tabular-nums select-none">
                        {s.columns}
                      </td>

                      {/* Status badge pill */}
                      <td className="px-4 py-4 text-center select-none">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          s.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-gray-50 text-gray-400 border-gray-150'
                        }`}>
                          {s.status}
                        </span>
                      </td>

                      {/* Dual Action items */}
                      <td className="px-4 py-4 text-center select-none whitespace-nowrap">
                        <div className="inline-flex gap-2">
                          
                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleEdit(s)}
                            className="bg-black hover:bg-slate-800 text-white p-2 rounded-xl shadow-xs transition-all"
                          >
                            <Edit3 size={12} className="stroke-[2.5]" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl shadow-xs transition-all"
                          >
                            <Trash2 size={12} className="stroke-[2.5]" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Ledger footer entries */}
          <div className="flex items-center justify-between gap-4 select-none pt-2 text-xs font-bold text-gray-500">
            <span>
              Showing 1 to {sections.length} of {sections.length} entries
            </span>

            <div className="inline-flex items-center gap-1.5">
              <button className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 cursor-pointer">
                &lt;
              </button>
              <span className="w-8 h-8 rounded-lg bg-[#0B1528] text-white flex items-center justify-center text-xs font-black shadow-xs">
                1
              </span>
              <button className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 cursor-pointer">
                &gt;
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* FOOTER COPYRIGHT BAR */}
      <div className="pt-8 pb-4 text-center border-t border-gray-200 select-none">
        <p className="text-[10px] font-bold text-gray-400">
          Copyright © 2026. Developed By <span className="text-[#0B1528] font-black">School E-Mart</span>
        </p>
      </div>

    </div>
  );
};

export default PromoHomeSections;
