import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Search, Download, ChevronDown, ChevronRight, Edit, Trash2,
  X, LayoutGrid, List, Upload, Loader2, Camera
} from 'lucide-react';
import { 
  getCategoryTree, 
  listHeaderCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory
} from '../../../services/catalogApi';
import { uploadAdminFile } from '../../../services/adminApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapCategoryTreeForAdmin, mapHeaderCategoryForAdmin } from '../../../utils/mappers/categoryAdminMapper';

const CategoryManagement = () => {
  // Views toggle: 'tree' | 'list'
  const [viewType, setViewType] = useState('tree');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Collapse/Expand state for category nodes, keyed by category id
  const [expandedNodes, setExpandedNodes] = useState({});

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddSubModalOpen, setIsAddSubModalOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);

  // Modal form advanced fields states
  const [activeStatus, setActiveStatus] = useState(true);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // New category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatHeader, setNewCatHeader] = useState('');
  const [newCatOrder, setNewCatOrder] = useState('0');
  const [newCatImage, setNewCatImage] = useState(null);
  const [newCatImagePreview, setNewCatImagePreview] = useState('');
  const newCatFileInputRef = React.useRef(null);
  const newCatCameraInputRef = React.useRef(null);

  // New subcategory form state (kept separate so the two modals never share values)
  const [newSubName, setNewSubName] = useState('');
  const [newSubOrder, setNewSubOrder] = useState('0');

  // Edit Category/Subcategory Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingIsSub, setEditingIsSub] = useState(false);
  const [editCatName, setEditCatName] = useState('');
  const [editCatHeader, setEditCatHeader] = useState('');
  const [editCatParent, setEditCatParent] = useState('none');
  const [editCatOrder, setEditCatOrder] = useState('0');
  const [editCatStatus, setEditCatStatus] = useState(true);
  const [editCatImage, setEditCatImage] = useState('');

  // Subcategory image upload states
  const [newSubcatImage, setNewSubcatImage] = useState(null);
  const [newSubcatImagePreview, setNewSubcatImagePreview] = useState('');
  const newSubcatFileInputRef = React.useRef(null);
  const newSubcatCameraInputRef = React.useRef(null);

  // Edit category image upload states
  const [editCatImageFile, setEditCatImageFile] = useState(null);
  const [editCatImagePreview, setEditCatImagePreview] = useState('');
  const editCatFileInputRef = React.useRef(null);
  const editCatCameraInputRef = React.useRef(null);

  const [categories, setCategories] = useState([]);
  const [headerCategories, setHeaderCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Admin manages inactive nodes too, so ask for the unfiltered tree.
      const tree = await getCategoryTree({ status: 'all' });
      const mapped = mapCategoryTreeForAdmin(tree);
      setCategories(mapped);
      setExpandedNodes((prev) =>
        Object.fromEntries(mapped.map((cat) => [cat.id, prev[cat.id] ?? true]))
      );
    } catch (err) {
      setCategories([]);
      setError(getErrorMessage(err, 'Unable to load categories'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHeaderCategories = useCallback(async () => {
    try {
      const { data } = await listHeaderCategories({ limit: 100 });
      const mapped = (data || []).map(mapHeaderCategoryForAdmin);
      setHeaderCategories(mapped);
      if (mapped.length > 0) {
        setNewCatHeader(mapped[0].id);
      }
    } catch (err) {
      console.error('Unable to load header categories', err);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadHeaderCategories();
  }, [loadCategories, loadHeaderCategories]);

  const toggleNode = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    setExpandedNodes(Object.fromEntries(categories.map((cat) => [cat.id, true])));
  };

  const handleCollapseAll = () => {
    setExpandedNodes(Object.fromEntries(categories.map((cat) => [cat.id, false])));
  };

  // Category and subcategory ids are both Mongo ObjectIds, so they can only be
  // told apart by looking them up in the loaded tree.
  const findNode = useCallback((id) => {
    for (const cat of categories) {
      if (cat.id === id) return { node: cat, parent: null, isSub: false };
      const sub = cat.subcategories.find((s) => s.id === id);
      if (sub) return { node: sub, parent: cat, isSub: true };
    }
    return null;
  }, [categories]);

  const resetAddCategoryForm = () => {
    setNewCatName('');
    setNewCatOrder('0');
    setNewCatHeader(headerCategories[0]?.id || '');
    setNewCatImage(null);
    setNewCatImagePreview('');
    setActiveStatus(true);
    setIsAdvancedOpen(false);
  };

  const resetAddSubcategoryForm = () => {
    setNewSubName('');
    setNewSubOrder('0');
    setNewSubcatImage(null);
    setNewSubcatImagePreview('');
    setActiveStatus(true);
    setIsAdvancedOpen(false);
  };

  // Add Category Handler
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setLoading(true);
      let headerId = newCatHeader;
      const matchedHeader = headerCategories.find(hc => hc.id === newCatHeader || hc.name === newCatHeader);
      if (matchedHeader) {
        headerId = matchedHeader.id;
      }

      let imageUrl;
      if (newCatImage) {
        const formData = new FormData();
        formData.append('file', newCatImage);
        formData.append('purpose', 'category_image');
        const attachment = await uploadAdminFile(formData);
        imageUrl = attachment?.url;
      }

      await createCategory({
        name: newCatName,
        headerId,
        displayOrder: parseInt(newCatOrder) || 0,
        status: activeStatus ? 'active' : 'inactive',
        ...(imageUrl ? { imageUrl } : {})
      });
      resetAddCategoryForm();
      setIsAddModalOpen(false);
      await loadCategories();
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to create category'));
    } finally {
      setLoading(false);
    }
  };

  // Add Subcategory Handler
  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    if (!newSubName.trim() || !selectedParentId) return;

    try {
      setLoading(true);

      let imageUrl;
      if (newSubcatImage) {
        const formData = new FormData();
        formData.append('file', newSubcatImage);
        formData.append('purpose', 'category_image');
        const attachment = await uploadAdminFile(formData);
        imageUrl = attachment?.url;
      }

      await createSubcategory({
        name: newSubName,
        categoryId: selectedParentId,
        displayOrder: parseInt(newSubOrder) || 0,
        status: activeStatus ? 'active' : 'inactive',
        ...(imageUrl ? { imageUrl } : {})
      });
      resetAddSubcategoryForm();
      setIsAddSubModalOpen(false);
      await loadCategories();
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to create subcategory'));
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Dialog pre-populating current attributes
  const openEditModal = (catOrSubId) => {
    const found = findNode(catOrSubId);
    if (!found) return;
    const { node, parent, isSub } = found;

    setEditingCategoryId(catOrSubId);
    setEditingIsSub(isSub);
    setIsAdvancedOpen(false);
    setEditCatImageFile(null);
    setEditCatImagePreview('');

    setEditCatName(node.name);
    setEditCatHeader((isSub ? parent.headerId : node.headerId) || '');
    setEditCatParent(isSub ? parent.id : 'none');
    setEditCatOrder(String(node.order));
    setEditCatStatus(node.status === 'Active');
    // Use the stored url, never the display placeholder, or saving would
    // persist the placeholder as the record's real image.
    setEditCatImage(node.imageUrl || '');

    setIsEditModalOpen(true);
  };

  // Edit / Update Category Handler
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editCatName.trim() || !editingCategoryId) return;

    if (editingIsSub && editCatParent === 'none') {
      alert('Please choose a parent category for this subcategory.');
      return;
    }

    try {
      setLoading(true);

      let imageUrl = editCatImage;
      if (editCatImageFile) {
        const formData = new FormData();
        formData.append('file', editCatImageFile);
        formData.append('purpose', 'category_image');
        const attachment = await uploadAdminFile(formData);
        imageUrl = attachment?.url;
      }

      if (!editingIsSub) {
        let headerId = editCatHeader;
        const matchedHeader = headerCategories.find(hc => hc.id === editCatHeader || hc.name === editCatHeader);
        if (matchedHeader) {
          headerId = matchedHeader.id;
        }
        await updateCategory(editingCategoryId, {
          name: editCatName,
          headerId,
          displayOrder: parseInt(editCatOrder) || 0,
          status: editCatStatus ? 'active' : 'inactive',
          imageUrl
        });
      } else {
        await updateSubcategory(editingCategoryId, {
          name: editCatName,
          categoryId: editCatParent,
          displayOrder: parseInt(editCatOrder) || 0,
          status: editCatStatus ? 'active' : 'inactive',
          imageUrl
        });
      }
      setEditCatImageFile(null);
      setEditCatImagePreview('');
      setIsEditModalOpen(false);
      await loadCategories();
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to update category'));
    } finally {
      setLoading(false);
    }
  };

  // Deactivate Handler
  const handleDeactivate = async (id) => {
    const found = findNode(id);
    if (!found) return;
    const { node, isSub } = found;

    const nextStatus = node.status === 'Active' ? 'inactive' : 'active';
    try {
      setLoading(true);
      if (!isSub) {
        await updateCategory(id, { status: nextStatus });
      } else {
        await updateSubcategory(id, { status: nextStatus });
      }
      await loadCategories();
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to change status'));
    } finally {
      setLoading(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    const found = findNode(id);
    if (!found) return;
    const { node, isSub } = found;

    const label = isSub ? 'subcategory' : 'category';
    const warning = !isSub && node.subcategories.length > 0
      ? `\n\nIt has ${node.subcategories.length} subcategory(ies).`
      : '';
    if (confirm(`Are you sure you want to delete the ${label} "${node.name}"?${warning}`)) {
      try {
        setLoading(true);
        if (!isSub) {
          await deleteCategory(id);
        } else {
          await deleteSubcategory(id);
        }
        await loadCategories();
      } catch (err) {
        alert(getErrorMessage(err, 'Unable to delete category'));
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter logic
  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || cat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Parent Category dynamic helpers
  const parentCategory = categories.find(cat => cat.id === selectedParentId);
  const parentName = parentCategory ? parentCategory.name : '—';
  const parentHeader = parentCategory ? parentCategory.header : '—';

  return (
    <div className="space-y-6 font-sans antialiased text-gray-800">
      
      {/* Page Title & Breadcrumbs Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-black text-[#0B1528] tracking-tight">Manage Categories</h1>
        </div>
        <div className="text-[11px] font-extrabold text-gray-400 tracking-wider flex items-center gap-1.5 uppercase">
          <span>Dashboard</span>
          <ChevronRight size={10} className="text-gray-300 stroke-[3]" />
          <span className="text-indigo-600">Categories</span>
        </div>
      </div>

      {/* Main Category Management Card */}
      <div className="bg-white rounded-[1.25rem] border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-black text-gray-900 mb-6">Category Management</h2>

        {/* Action Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* + Add Category Button */}
            <button 
              onClick={() => { resetAddCategoryForm(); setIsAddModalOpen(true); }}
              className="border border-indigo-950 text-[#0B1528] font-black text-xs px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Add Category</span>
            </button>

            {/* Tree View Toggle Option */}
            <div className="flex items-center bg-gray-50 border border-gray-200 p-1 rounded-xl shrink-0">
              <button 
                onClick={() => setViewType('tree')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  viewType === 'tree' 
                    ? 'bg-[#0B1528] text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <LayoutGrid size={12} className="stroke-[3]" />
                <span>Tree View</span>
              </button>
              <button 
                onClick={() => setViewType('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  viewType === 'list' 
                    ? 'bg-[#0B1528] text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <List size={12} className="stroke-[3]" />
                <span>List View</span>
              </button>
            </div>

            {/* Status Dropdown Filter */}
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <span>Status:</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            {/* Search Input Box */}
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 flex-1 min-w-[200px]">
              <span>Search:</span>
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name..." 
                  className="w-full bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Export Action Button */}
          <button className="bg-black hover:bg-gray-800 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 self-start lg:self-auto shrink-0 shadow-sm">
            <Download size={14} className="stroke-[3]" />
            <span>Export</span>
          </button>
        </div>

        {/* Tree Actions Sub-row (Only for Tree View) */}
        {viewType === 'tree' && (
          <div className="flex items-center gap-2 py-4 select-none">
            <button 
              onClick={handleExpandAll}
              className="border border-gray-200 hover:bg-gray-50 text-gray-500 font-extrabold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-all"
            >
              Expand All
            </button>
            <button 
              onClick={handleCollapseAll}
              className="border border-gray-200 hover:bg-gray-50 text-gray-500 font-extrabold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-all"
            >
              Collapse All
            </button>
          </div>
        )}

        {/* Load failure banner */}
        {error && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <span className="text-xs font-bold text-red-700">{error}</span>
            <button
              onClick={loadCategories}
              className="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-[10px] font-black uppercase text-red-700 transition-all hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* Data View viewport */}
        <div className="mt-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-xs font-black text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span>Loading categories…</span>
            </div>
          ) : viewType === 'tree' ? (
            /* TREE STRUCTURE VIEW MODE */
            <div className="space-y-3.5">
              {filteredCategories.length === 0 ? (
                <div className="py-12 text-center text-xs font-black text-gray-400">
                  No matching categories found.
                </div>
              ) : (
                filteredCategories.map(cat => {
                  const isNodeExpanded = expandedNodes[cat.id];
                  return (
                    <div key={cat.id} className="border border-gray-150 rounded-2xl overflow-hidden shadow-sm hover:border-gray-300 transition-all bg-[#FCFDFE]">
                      
                      {/* Main Category Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 bg-white select-none">
                        
                        {/* Left Details block */}
                        <div className="flex items-center gap-3">
                          {/* Toggle expand chevron */}
                          <button 
                            onClick={() => toggleNode(cat.id)}
                            className="p-1 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all shrink-0"
                          >
                            {isNodeExpanded ? (
                              <ChevronDown size={16} className="stroke-[3]" />
                            ) : (
                              <ChevronRight size={16} className="stroke-[3]" />
                            )}
                          </button>

                          {/* Category Image */}
                          <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 shrink-0 bg-gray-50 flex items-center justify-center">
                            <img 
                              src={cat.image} 
                              alt={cat.name} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=120&auto=format&fit=crop&q=60';
                              }}
                            />
                          </div>

                          {/* Category Identifiers */}
                          <div className="leading-tight">
                            <h3 className="font-extrabold text-sm text-[#0B1528] tracking-tight">{cat.name}</h3>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {/* Status Badge */}
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                cat.status === 'Active' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-red-50 text-red-700 border-red-100'
                              }`}>
                                {cat.status}
                              </span>
                              {/* Association header category */}
                              <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 text-[9px] font-bold">
                                Header: {cat.header}
                              </span>
                              {/* Subcategory count */}
                              <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 text-[9px] font-bold">
                                {cat.subcategories.length} subcategory
                              </span>
                              {/* Order Badge */}
                              <span className="text-[9px] font-black text-gray-400 ml-1">
                                Order: {cat.order}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Control Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          {/* Add Subcategory */}
                          <button 
                            onClick={() => {
                              resetAddSubcategoryForm();
                              setSelectedParentId(cat.id);
                              setIsAddSubModalOpen(true);
                            }}
                            className="border border-indigo-950 text-[#0B1528] hover:bg-indigo-50/40 text-[10px] font-black px-3 py-2 rounded-xl transition-all"
                          >
                            + Add Subcategory
                          </button>
                          
                          {/* Toggle Active status */}
                          <button 
                            onClick={() => handleDeactivate(cat.id)}
                            className={`text-[10px] font-black px-3 py-2 rounded-xl border transition-all ${
                              cat.status === 'Active'
                                ? 'border-amber-500 text-amber-600 hover:bg-amber-50/40'
                                : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50/40'
                            }`}
                          >
                            {cat.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>

                          {/* Edit Category */}
                          <button 
                            onClick={() => openEditModal(cat.id)}
                            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 transition-all shrink-0"
                          >
                            <Edit size={14} className="stroke-[2.5]" />
                          </button>

                          {/* Delete Category */}
                          <button 
                            onClick={() => handleDelete(cat.id)}
                            className="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all shrink-0"
                          >
                            <Trash2 size={14} className="stroke-[2.5]" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Subcategory List Grid */}
                      {isNodeExpanded && cat.subcategories.length > 0 && (
                        <div className="border-t border-gray-150 bg-gray-50/40 p-4 pl-9 space-y-2 select-none">
                          {cat.subcategories.map(sub => (
                            <div 
                              key={sub.id} 
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-xl border border-gray-150/70 hover:shadow-sm transition-all gap-4"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                                <span className="text-xs font-black text-gray-800">{sub.name}</span>
                                <span className={`px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ml-2 ${
                                  sub.status === 'Active'
                                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                    : 'border-red-100 bg-red-50 text-red-700'
                                }`}>
                                  {sub.status}
                                </span>
                                <span className="text-[9px] text-gray-400 font-bold ml-1">Order: {sub.order}</span>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                <button
                                  onClick={() => handleDeactivate(sub.id)}
                                  className="text-[9px] font-bold border border-gray-200 hover:bg-gray-50 text-gray-500 px-2.5 py-1.5 rounded-lg transition-all"
                                >
                                  {sub.status === 'Active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => openEditModal(sub.id)}
                                  className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 transition-all shrink-0"
                                >
                                  <Edit size={11} className="stroke-[2.5]" />
                                </button>
                                <button
                                  onClick={() => handleDelete(sub.id)}
                                  className="p-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition-all shrink-0"
                                >
                                  <Trash2 size={11} className="stroke-[2.5]" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* FLAT LIST VIEW MODE */
            <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-sm bg-white">
              <table className="w-full text-left text-xs font-medium text-gray-600 border-collapse">
                <thead>
                  <tr className="border-b border-gray-250 bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    <th className="py-3 px-4">Image</th>
                    <th className="py-3 px-4">Category Name</th>
                    <th className="py-3 px-4">Header Association</th>
                    <th className="py-3 px-4">Sort Order</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-xs font-black text-gray-400">
                        No matching category records found.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map(cat => (
                      <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-black text-gray-900">{cat.name}</td>
                        <td className="py-3 px-4 font-bold text-gray-500">{cat.header}</td>
                        <td className="py-3 px-4 font-bold text-gray-400">{cat.order}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black border ${
                            cat.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {cat.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center gap-1 ml-auto justify-end">
                            <button 
                              onClick={() => handleDeactivate(cat.id)}
                              className="border border-gray-200 hover:bg-gray-50 text-gray-500 font-extrabold text-[9px] px-2 py-1.5 rounded-lg transition-all"
                            >
                              {cat.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button 
                              onClick={() => openEditModal(cat.id)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 transition-all shrink-0"
                            >
                              <Edit size={12} />
                            </button>
                            <button 
                              onClick={() => handleDelete(cat.id)}
                              className="p-1.5 rounded-lg border border-red-150 text-red-500 hover:bg-red-50 transition-all shrink-0"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Render Add Category Modal via Portal */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Add New Category</h3>
              <button 
                onClick={() => { resetAddCategoryForm(); setIsAddModalOpen(false); }}
                className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-400 hover:text-gray-900 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddCategory} className="p-5 space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Category Name</label>
                <input 
                  type="text" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Sweets, Books" 
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Header Category</label>
                  <select 
                    value={newCatHeader}
                    onChange={(e) => setNewCatHeader(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {headerCategories.length > 0 ? (
                      headerCategories.map(hc => (
                        <option key={hc.id} value={hc.id}>
                          {hc.name}
                        </option>
                      ))
                    ) : (
                      <option value="">No header categories available</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Sort Order</label>
                  <input
                    type="number"
                    value={newCatOrder}
                    onChange={(e) => setNewCatOrder(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Category Image Upload */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Category Image</label>
                <input
                  type="file"
                  ref={newCatFileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewCatImage(file);
                      setNewCatImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  accept=".png,.jpg,.jpeg,.webp"
                  className="hidden"
                />
                {/* capture="environment" opens the device's camera app directly
                    on mobile; desktop browsers that don't support it fall back
                    to the normal file picker, same as the input above. */}
                <input
                  type="file"
                  ref={newCatCameraInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewCatImage(file);
                      setNewCatImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  accept=".png,.jpg,.jpeg,.webp"
                  capture="environment"
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center bg-gray-50/50 min-h-[110px]">
                  {newCatImagePreview ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <img
                        src={newCatImagePreview}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-xl border border-gray-200 shadow-sm mb-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewCatImage(null);
                          setNewCatImagePreview('');
                        }}
                        className="text-[10px] text-red-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={22} className="text-gray-400 mb-2 stroke-[2.5]" />
                      <span className="text-xs font-black text-gray-700">Choose File or Take a Photo</span>
                      <span className="text-[10px] text-gray-400 mt-1 font-bold mb-3">Max 5MB</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => newCatCameraInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 bg-white text-[11px] font-black text-gray-700 flex items-center gap-1.5 transition-colors"
                        >
                          <Camera size={13} /> Take Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => newCatFileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 bg-white text-[11px] font-black text-gray-700 flex items-center gap-1.5 transition-colors"
                        >
                          <Upload size={13} /> Choose File
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Active Status Checkbox */}
              <div className="flex items-center gap-2 select-none py-1">
                <input
                  type="checkbox"
                  id="newCatActiveStatus"
                  checked={activeStatus}
                  onChange={(e) => setActiveStatus(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 accent-indigo-600 cursor-pointer"
                />
                <label htmlFor="newCatActiveStatus" className="text-xs font-black text-gray-700 cursor-pointer">
                  Active Status
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => { resetAddCategoryForm(); setIsAddModalOpen(false); }}
                  className="text-xs font-bold text-gray-500 px-4 py-2 hover:bg-gray-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white text-xs font-black px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10"
                >
                  Save Category
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

      {/* Render Create Subcategory Popup via Portal */}
      {isAddSubModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-gray-250 shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-white px-6 shrink-0">
              <h3 className="text-base font-black text-[#0B1528]">Create Subcategory</h3>
              <button 
                type="button"
                onClick={() => { resetAddSubcategoryForm(); setIsAddSubModalOpen(false); }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleAddSubcategory} className="p-6 space-y-5 overflow-y-auto max-h-[75vh] text-left flex-1">
              
              {/* Parent Category Readonly Box */}
              <div className="border border-gray-200 rounded-xl p-4 bg-white select-none">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Parent Category</div>
                <div className="text-sm font-black text-gray-900">{parentName}</div>
              </div>

              {/* Subcategory Name Input */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 mb-1.5 block">
                  Subcategory Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="Enter subcategory name"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              {/* Header Category Readonly Input */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 mb-1.5 block">Header Category</label>
                <input 
                  type="text" 
                  value={parentHeader}
                  disabled
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-400 cursor-not-allowed focus:outline-none select-none"
                />
                <span className="text-[10px] text-gray-400 font-semibold mt-1 block">Inherited from parent category</span>
              </div>

              {/* Category Image Upload Dropzone */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 mb-1.5 block">Category Image</label>
                <input
                  type="file"
                  ref={newSubcatFileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewSubcatImage(file);
                      setNewSubcatImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  accept=".png,.jpg,.jpeg,.webp"
                  className="hidden"
                />
                {/* capture="environment" opens the device's camera app directly
                    on mobile; desktop browsers that don't support it fall back
                    to the normal file picker, same as the input above. */}
                <input
                  type="file"
                  ref={newSubcatCameraInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewSubcatImage(file);
                      setNewSubcatImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  accept=".png,.jpg,.jpeg,.webp"
                  capture="environment"
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50/50 relative overflow-hidden min-h-[120px]">
                  {newSubcatImagePreview ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <img
                        src={newSubcatImagePreview}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-xl border border-gray-200 shadow-sm mb-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewSubcatImage(null);
                          setNewSubcatImagePreview('');
                        }}
                        className="text-[10px] text-red-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-400 mb-2 stroke-[2.5]" />
                      <span className="text-xs font-black text-gray-700">Choose File or Take a Photo</span>
                      <span className="text-[10px] text-gray-400 mt-1 font-bold mb-3">Max 5MB</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => newSubcatCameraInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 bg-white text-[11px] font-black text-gray-700 flex items-center gap-1.5 transition-colors"
                        >
                          <Camera size={13} /> Take Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => newSubcatFileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 bg-white text-[11px] font-black text-gray-700 flex items-center gap-1.5 transition-colors"
                        >
                          <Upload size={13} /> Choose File
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Display Order Input */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 mb-1.5 block">Display Order</label>
                <input
                  type="number"
                  value={newSubOrder}
                  onChange={(e) => setNewSubOrder(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Active Status Checkbox */}
              <div className="flex items-center gap-2 select-none py-1">
                <input 
                  type="checkbox" 
                  id="activeStatus" 
                  checked={activeStatus}
                  onChange={(e) => setActiveStatus(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 accent-indigo-600 cursor-pointer"
                />
                <label htmlFor="activeStatus" className="text-xs font-black text-gray-700 cursor-pointer">
                  Active Status
                </label>
              </div>

              {/* Advanced Settings Collapsible Accordion */}
              <div className="border-t border-gray-100 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl hover:bg-gray-100 transition-all text-xs font-black text-gray-700"
                >
                  <span>Advanced Settings</span>
                  <ChevronDown size={14} className={`text-gray-500 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isAdvancedOpen && (
                  <div className="p-4 mt-2 bg-gray-50/50 rounded-xl border border-gray-150 text-[11px] text-gray-500 font-bold space-y-2 select-none">
                    <div>• Configure custom meta tag header templates.</div>
                    <div>• Override parent discount exclusions parameters.</div>
                  </div>
                )}
              </div>

              {/* Modal Actions Footer Bar */}
              <div className="pt-4 border-t border-gray-150 flex items-center justify-end gap-2.5 shrink-0">
                <button 
                  type="button"
                  onClick={() => { resetAddSubcategoryForm(); setIsAddSubModalOpen(false); }}
                  className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs px-5 py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#0B1528] hover:bg-gray-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-950/10"
                >
                  Create Subcategory
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

      {/* Render Edit Category / Subcategory Popup via Portal (centering it perfectly over the active body) */}
      {isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-gray-250 shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-white px-6 shrink-0">
              <h3 className="text-base font-black text-[#0B1528]">{editingIsSub ? 'Edit Subcategory' : 'Edit Category'}</h3>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleUpdateCategory} className="p-6 space-y-5 overflow-y-auto max-h-[75vh] text-left flex-1">
              
              {/* Category Name Input */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 mb-1.5 block">
                  {editingIsSub ? 'Subcategory Name' : 'Category Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  placeholder="Enter category name" 
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              {/* Header Category Select Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 mb-1.5 block">
                  Header Category {!editingIsSub && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={editCatHeader}
                  onChange={(e) => setEditCatHeader(e.target.value)}
                  disabled={editingIsSub}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    editingIsSub
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700'
                  }`}
                >
                  <option value="">-- Select Header Category --</option>
                  {headerCategories.map(hc => (
                    <option key={hc.id} value={hc.id}>
                      {hc.name}
                    </option>
                  ))}
                </select>
                {editingIsSub && (
                  <span className="text-[10px] text-gray-400 font-semibold mt-1 block">
                    Inherited from the parent category
                  </span>
                )}
              </div>

              {/* Category Image upload/preview dropzone */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 mb-1.5 block">Category Image</label>
                <input
                  type="file"
                  ref={editCatFileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditCatImageFile(file);
                      setEditCatImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  accept=".png,.jpg,.jpeg,.webp"
                  className="hidden"
                />
                {/* capture="environment" opens the device's camera app directly
                    on mobile; desktop browsers that don't support it fall back
                    to the normal file picker, same as the input above. */}
                <input
                  type="file"
                  ref={editCatCameraInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditCatImageFile(file);
                      setEditCatImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  accept=".png,.jpg,.jpeg,.webp"
                  capture="environment"
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50/50 relative overflow-hidden min-h-[140px]">
                  {editCatImagePreview ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <img
                        src={editCatImagePreview}
                        alt="Preview"
                        className="w-28 h-28 object-cover rounded-xl border border-gray-200 shadow-sm mb-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditCatImageFile(null);
                          setEditCatImagePreview('');
                        }}
                        className="text-[10px] text-red-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : editCatImage ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <img
                        src={editCatImage}
                        alt="Current Category Image"
                        className="w-28 h-28 object-cover rounded-xl border border-gray-200 shadow-sm mb-2"
                      />
                      <span className="text-[10px] text-gray-400 font-bold">Current image</span>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => editCatCameraInputRef.current?.click()}
                          className="text-[10px] text-[#3b2d7d] font-black hover:underline flex items-center gap-1"
                        >
                          <Camera size={11} /> Retake
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditCatImage('')}
                          className="text-[10px] text-red-500 font-black hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full select-none">
                      <Upload size={24} className="text-gray-400 mb-2 stroke-[2.5]" />
                      <span className="text-xs font-black text-gray-700">Choose File or Take a Photo</span>
                      <span className="text-[10px] text-gray-400 mt-1 font-bold mb-3">Max 5MB</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => editCatCameraInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 bg-white text-[11px] font-black text-gray-700 flex items-center gap-1.5 transition-colors"
                        >
                          <Camera size={13} /> Take Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => editCatFileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 bg-white text-[11px] font-black text-gray-700 flex items-center gap-1.5 transition-colors"
                        >
                          <Upload size={13} /> Choose File
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Parent Category Select Dropdown — subcategories only; a category's
                  parent is its header category, set above. */}
              {editingIsSub && (
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-700 mb-1.5 block">
                    Parent Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editCatParent}
                    onChange={(e) => setEditCatParent(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Display Order Input */}
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 mb-1.5 block">Display Order</label>
                <input 
                  type="number" 
                  value={editCatOrder}
                  onChange={(e) => setEditCatOrder(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Active Status Checkbox */}
              <div className="flex items-center gap-2 select-none py-1">
                <input 
                  type="checkbox" 
                  id="editCatStatus" 
                  checked={editCatStatus}
                  onChange={(e) => setEditCatStatus(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 accent-indigo-600 cursor-pointer"
                />
                <label htmlFor="editCatStatus" className="text-xs font-black text-gray-700 cursor-pointer">
                  Active Status
                </label>
              </div>

              {/* Advanced Settings Collapsible Accordion */}
              <div className="border-t border-gray-100 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl hover:bg-gray-100 transition-all text-xs font-black text-gray-700"
                >
                  <span>Advanced Settings</span>
                  <ChevronDown size={14} className={`text-gray-500 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isAdvancedOpen && (
                  <div className="p-4 mt-2 bg-gray-50/50 rounded-xl border border-gray-150 text-[11px] text-gray-500 font-bold space-y-2 select-none">
                    <div>• Configure custom SEO tags and search keywords templates.</div>
                    <div>• Configure region constraints or vendor exclusions options.</div>
                  </div>
                )}
              </div>

              {/* Modal Actions Footer Bar */}
              <div className="pt-4 border-t border-gray-150 flex items-center justify-end gap-2.5 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs px-5 py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#0B1528] hover:bg-gray-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-950/10"
                >
                  {editingIsSub ? 'Update Subcategory' : 'Update Category'}
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default CategoryManagement;
