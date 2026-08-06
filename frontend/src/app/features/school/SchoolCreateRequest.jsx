import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, HelpCircle, Calendar, Users, 
  Clipboard, Info, Check, ChevronDown, Save, 
  ArrowRight, Sparkles, Plus, Edit2, Trash2,
  Upload, Image as ImageIcon, Search, Star,
  ShieldCheck, Loader2
} from 'lucide-react';
import { listVendors, getVendorsByIds, uploadSchoolFile } from '../../../services/schoolApi';
import { createRfq, getSchoolRfq, updateRfq } from '../../../services/rfqApi';
import { getErrorMessage } from '../../../utils/apiHelpers';
import { mapSchoolVendorForInvite } from '../../../utils/mappers/schoolVendorMapper';
import { buildCreateRfqPayload } from '../../../utils/mappers/rfqMapper';
import { useSchoolId } from '../../../utils/schoolContext';
import { toAbsoluteUrl } from '../../../utils/url';

const SchoolCreateRequest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  const schoolId = useSchoolId();
  
  // Navigation State
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [newComponentNames, setNewComponentNames] = useState({}); // { [setId]: '' }

  // STEP 1 STATES (title/notes may be prefilled via query params,
  // e.g. the "Request Quote" banner on the Supplies category pages)
  const [requestTitle, setRequestTitle] = useState(() => (draftId ? '' : searchParams.get('title') || ''));
  const [academicYear, setAcademicYear] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [totalStudents, setTotalStudents] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState(() => (draftId ? '' : searchParams.get('notes') || ''));
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  // STEP 3 STATES
  const [searchQuery, setSearchQuery] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('2025-12-15');
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState('');
  const [vendorPage, setVendorPage] = useState(1);
  const [hasMoreVendors, setHasMoreVendors] = useState(false);
  const [loadingMoreVendors, setLoadingMoreVendors] = useState(false);

  const [quotationRequirements, setQuotationRequirements] = useState([]);

  const availableClasses = [
    { id: 'nursery', label: 'Nursery' },
    { id: 'lkg', label: 'LKG' },
    { id: 'ukg', label: 'UKG' },
    { id: 'class-1', label: 'Class 1' },
    { id: 'class-2', label: 'Class 2' },
    { id: 'class-3', label: 'Class 3' },
    { id: 'class-4', label: 'Class 4' },
    { id: 'class-5', label: 'Class 5' },
    { id: 'class-6', label: 'Class 6' },
    { id: 'class-7', label: 'Class 7' },
    { id: 'class-8', label: 'Class 8' },
  ];

  const [uniformSets, setUniformSets] = useState([]);

  useEffect(() => {
    if (!schoolId || !draftId) return;
    (async () => {
      setDraftLoading(true);
      try {
        const rfq = await getSchoolRfq(schoolId, draftId);
        if (rfq) {
          setRequestTitle(rfq.title || '');
          setAcademicYear(rfq.academicYear || '');
          if (rfq.targetDeliveryDate) {
            setRequiredDate(rfq.targetDeliveryDate.slice(0, 10));
          }
          setSelectedClasses(rfq.classes || []);
          setTotalStudents(rfq.totalStudents ? String(rfq.totalStudents) : '');
          
          setAdditionalNotes(rfq.meta?.additionalNotes || rfq.additionalNotes || '');
          
          const desc = rfq.description || '';
          const lines = desc.split('\n');
          const instrLine = lines.find(l => !l.startsWith('Academic Year:') && !l.startsWith('Classes:'));
          setSpecialInstructions(instrLine || '');

          if (rfq.quotationDeadline) {
            setDeadlineDate(rfq.quotationDeadline.slice(0, 10));
          }
          if (rfq.meta?.uniformSets) {
            // The server's uniformSetSchema doesn't persist a client-side
            // `id` field (it's stripped on save), so every resumed set would
            // otherwise come back as `id: undefined` — colliding React keys
            // and making Edit/Remove act on every set at once. Re-assign
            // stable sequential ids on hydration; handleAddSet's
            // max(ids)+1 stays collision-free against these.
            setUniformSets(rfq.meta.uniformSets.map((set, idx) => ({ ...set, id: idx + 1 })));
          }
          const invitedIds = (rfq.invitedVendorIds || [])
            .map((vendor) => (typeof vendor === 'object' ? String(vendor._id || vendor.id) : String(vendor)))
            .filter(Boolean);

          if (invitedIds.length) {
            // Resolve the real vendor records (name, rating, etc.) by id —
            // independent of whatever page/search the "Invite Vendors" step's
            // browsing list happens to load — so a previously-invited vendor
            // is never silently dropped or shown as a generic stub. Merged by
            // id (hydrated entries always win as checked) rather than a plain
            // replace, so this stays correct even if the step-3 vendor
            // directory has already started loading (e.g. the school jumped
            // straight to the "Vendors" step via the stepper).
            const applyHydratedVendors = (hydrated) => {
              const hydratedIds = new Set(hydrated.map((v) => v.id));
              setVendors((prev) => [...hydrated, ...prev.filter((v) => !hydratedIds.has(v.id))]);
            };
            try {
              const { data } = await getVendorsByIds(schoolId, invitedIds);
              applyHydratedVendors((data || []).map((v) => ({ ...mapSchoolVendorForInvite(v), checked: true })));
            } catch {
              // Fall back to stub entries so the vendor count/ids are at
              // least preserved even if the lookup call itself fails.
              applyHydratedVendors(invitedIds.map((id) => ({ id, name: 'Vendor', checked: true, logoBg: 'bg-gray-100 text-gray-600', logo: 'VN' })));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load RFQ draft:', err);
      } finally {
        setDraftLoading(false);
      }
    })();
  }, [schoolId, draftId]);

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    } else {
      navigate('/school/admin');
    }
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
      return;
    }

    const validationError = validatePublishForm();
    if (validationError) {
      setPublishError(validationError);
      return;
    }

    setPublishError('');
    setIsPublishing(true);

    try {
      const payload = buildCreateRfqPayload({
        requestTitle,
        academicYear,
        requiredDate,
        deadlineDate,
        selectedClasses,
        totalStudents,
        specialInstructions,
        additionalNotes,
        uniformSets,
        vendors,
        status: 'open',
      });

      if (draftId) {
        await updateRfq(schoolId, draftId, payload);
      } else {
        await createRfq(schoolId, payload);
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        navigate('/school/quotations');
      }, 2000);
    } catch (err) {
      setPublishError(getErrorMessage(err, 'Unable to publish request'));
    } finally {
      setIsPublishing(false);
    }
  };

  const validatePublishForm = () => {
    if (!requestTitle.trim()) return 'Request title is required';
    if (!academicYear) return 'Academic year is required';
    if (!requiredDate) return 'Required by date is required';
    if (!selectedClasses.length) return 'Select at least one class';
    if (!uniformSets.length) return 'Add at least one uniform set';
    if (!uniformSets.some((set) => (parseInt(set.boysQty, 10) || 0) + (parseInt(set.girlsQty, 10) || 0) > 0)) {
      return 'Enter quantity for at least one uniform set';
    }
    if (!vendors.some((v) => v.checked)) return 'Select at least one vendor';
    if (!deadlineDate) return 'Quotation submission deadline is required';
    return '';
  };

  const handleToggleVendor = (vendorId) => {
    setVendors(vendors.map(v => 
      v.id === vendorId ? { ...v, checked: !v.checked } : v
    ));
  };

  const mergeVendorList = (existing, incoming) => {
    const checkedMap = new Map(existing.map((vendor) => [vendor.id, vendor.checked]));
    const merged = incoming.map((vendor) => ({
      ...vendor,
      checked: checkedMap.get(vendor.id) ?? vendor.checked,
    }));

    // A vendor the school already checked (invited on a resumed draft, or
    // checked before typing a search term / turning the page) must not
    // silently drop out of the list just because this fetch's page/search
    // doesn't happen to include them again — that would un-invite them
    // without the school ever noticing.
    const incomingIds = new Set(incoming.map((vendor) => vendor.id));
    const preserved = existing.filter((vendor) => vendor.checked && !incomingIds.has(vendor.id));
    return [...merged, ...preserved];
  };

  const loadVendors = useCallback(async ({ page = 1, append = false, search = '' } = {}) => {
    if (!schoolId) {
      setVendorsError('School context is missing. Please log in again.');
      return;
    }

    if (append) {
      setLoadingMoreVendors(true);
    } else {
      setVendorsLoading(true);
      setVendorsError('');
    }

    try {
      const { data, pagination } = await listVendors(schoolId, {
        page,
        limit: 10,
        search: search.trim() || undefined,
      });

      const mapped = (data || []).map(mapSchoolVendorForInvite);

      setVendors((prev) => {
        if (!append) {
          return mergeVendorList(prev, mapped);
        }

        const existingIds = new Set(prev.map((vendor) => vendor.id));
        const uniqueNew = mapped.filter((vendor) => !existingIds.has(vendor.id));
        return [...prev, ...uniqueNew];
      });
      setVendorPage(page);
      setHasMoreVendors(Boolean(pagination?.hasNextPage));
    } catch (err) {
      if (!append) {
        setVendors([]);
      }
      setVendorsError(getErrorMessage(err, 'Unable to load vendors'));
    } finally {
      setVendorsLoading(false);
      setLoadingMoreVendors(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (currentStep !== 3) return undefined;

    const timer = setTimeout(() => {
      loadVendors({ page: 1, search: searchQuery });
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(timer);
  }, [currentStep, searchQuery, loadVendors]);

  const handleToggleRequirement = (label) => {
    setQuotationRequirements(quotationRequirements.map(req => 
      req.label === label ? { ...req, checked: !req.checked } : req
    ));
  };

  const handleViewMoreVendors = () => {
    if (!hasMoreVendors || loadingMoreVendors) return;
    loadVendors({ page: vendorPage + 1, append: true, search: searchQuery });
  };

  const handleSaveDraft = async () => {
    if (!requestTitle.trim()) {
      setPublishError('Request title is required to save a draft');
      return;
    }

    if (!schoolId) {
      setPublishError('School context is missing. Please log in again.');
      return;
    }

    setPublishError('');
    setIsPublishing(true);

    try {
      const payload = buildCreateRfqPayload({
        requestTitle,
        academicYear,
        requiredDate,
        deadlineDate,
        selectedClasses,
        totalStudents,
        specialInstructions,
        additionalNotes,
        uniformSets,
        vendors,
        status: 'draft',
      });

      if (draftId) {
        await updateRfq(schoolId, draftId, payload);
      } else {
        await createRfq(schoolId, payload);
      }
      setShowDraftModal(true);
    } catch (err) {
      setPublishError(getErrorMessage(err, 'Unable to save draft'));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClassToggle = (classId) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  const handleRemoveSet = (setId) => {
    setUniformSets(uniformSets.filter(set => set.id !== setId));
  };

  const handleAddSet = () => {
    const newId = uniformSets.length > 0 ? Math.max(...uniformSets.map(s => s.id)) + 1 : 1;
    const newSet = {
      id: newId,
      name: `Custom Uniform Set ${newId}`,
      type: 'Secondary Set',
      boysQty: '0',
      girlsQty: '0',
      components: [
        { label: 'Shirt', icon: '👕', checked: true },
        { label: 'Trouser', icon: '👖', checked: true },
        { label: 'Socks', icon: '🧦', checked: true }
      ],
      images: [
        { label: 'Front View', file: null, preview: null },
        { label: 'Back View', file: null, preview: null }
      ]
    };
    setUniformSets([...uniformSets, newSet]);
  };

  const handleToggleComponent = (setId, componentLabel) => {
    setUniformSets(uniformSets.map(set => {
      if (set.id === setId) {
        return {
          ...set,
          components: set.components.map(comp => 
            comp.label === componentLabel ? { ...comp, checked: !comp.checked } : comp
          )
        };
      }
      return set;
    }));
  };

  const updateSetImage = (setId, imageLabel, patch) => {
    setUniformSets((prev) => prev.map((set) => {
      if (set.id !== setId) return set;
      return {
        ...set,
        images: set.images.map((img) => (img.label === imageLabel ? { ...img, ...patch } : img)),
      };
    }));
  };

  const handleImageUpload = async (setId, imageLabel, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (!schoolId) {
      alert('School context is missing. Please log in again.');
      return;
    }

    // Instant local preview while the real upload runs in the background.
    const reader = new FileReader();
    reader.onloadend = () => {
      updateSetImage(setId, imageLabel, { preview: reader.result, uploading: true, uploadError: false });
    };
    reader.readAsDataURL(file);

    try {
      const attachment = await uploadSchoolFile(schoolId, file, 'rfq_attachment');
      updateSetImage(setId, imageLabel, {
        attachmentId: attachment?._id || attachment?.id,
        uploading: false,
        uploadError: false,
      });
    } catch (err) {
      updateSetImage(setId, imageLabel, { uploading: false, uploadError: true });
      alert(getErrorMessage(err, `Unable to upload "${imageLabel}" — please try again.`));
    }
  };

  const handleEditSetName = (setId) => {
    const set = uniformSets.find(s => s.id === setId);
    const newName = prompt('Enter new uniform set name:', set.name);
    if (newName && newName.trim() !== '') {
      setUniformSets(uniformSets.map(s => 
        s.id === setId ? { ...s, name: newName.trim() } : s
      ));
    }
  };

  const handleUploadMoreImage = (setId) => {
    const newLabel = prompt('Enter image label (e.g. Logo close-up, Inner lining):');
    if (newLabel && newLabel.trim() !== '') {
      setUniformSets(uniformSets.map(set => {
        if (set.id === setId) {
          return {
            ...set,
            images: [...set.images, { label: newLabel.trim(), file: null, preview: null }]
          };
        }
        return set;
      }));
    }
  };

  const handleHelpClick = () => {
    alert('Uniform Request Help:\n\nStep 1: Enter basic information about the request (academic year, required date, applicable classes).\n\nStep 2: Add specific uniform sets (Regular, Sports, Winter, etc.), configure quantities, check required items, and upload reference design images.');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-10 font-outfit relative">
      {/* Top Banner Success Notification */}
      {isSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md animate-in fade-in zoom-in slide-in-from-top-2 duration-300">
          <div className="bg-emerald-500 text-white px-5 py-4 rounded-3xl shadow-xl flex items-center gap-3.5 border border-emerald-400/20">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Check size={18} className="text-white" />
            </div>
            <div>
              <span className="text-xs font-black block leading-none">Request Published!</span>
              <span className="text-[10px] text-emerald-100 font-bold block mt-1">Your request is now live for vendors.</span>
            </div>
          </div>
        </div>
      )}

      {/* Draft Saved Success Modal Backdrop & Bottom Sheet */}
      {showDraftModal && (
        <div className="fixed inset-0 z-[999] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="w-full sm:max-w-md bg-white rounded-t-[2.2rem] sm:rounded-[2.2rem] p-8 space-y-6 shadow-2xl border border-gray-100/60 animate-in slide-in-from-bottom duration-300 relative">
            
            {/* Top Indicator Accent for Mobile Sheets */}
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto sm:hidden -mt-2 mb-4" />

            {/* Checkmark Icon Container */}
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto shadow-inner">
              <Check size={28} className="text-emerald-500 stroke-[3.5]" />
            </div>

            {/* Content Stack */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-deep-purple uppercase tracking-wider">
                ✓ Draft Saved Successfully
              </h3>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                Your uniform request has been saved.
                <span className="block mt-0.5">You can continue editing it later.</span>
              </p>
            </div>

            {/* Buttons Grid */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDraftModal(false)}
                className="w-full py-4 bg-[#3b2d7d] text-white hover:bg-[#2b2061] active:scale-95 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-purple-100"
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDraftModal(false);
                  navigate('/school/draft-requests');
                }}
                className="w-full py-4 border-2 border-[#3b2d7d] text-[#3b2d7d] hover:bg-[#3b2d7d]/5 active:scale-95 bg-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
              >
                View Drafts
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Publish error banner */}
      {publishError && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
          {publishError}
        </div>
      )}

      {/* Styled Top Banner Header Area */}
      <div className="bg-[#3b2d7d] text-white px-6 py-6 sticky top-0 z-50 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={handleBack}
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-white"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-xl font-black leading-tight">
                {currentStep === 1 
                  ? 'New Uniform Request' 
                  : currentStep === 2 
                    ? 'Uniform Sets' 
                    : currentStep === 3 
                      ? 'Invite Vendors' 
                      : 'Review Your Request'}
              </h1>
              <span className="text-[12px] text-purple-200 font-bold block mt-1">
                {currentStep === 1 
                  ? 'Create a new uniform requirement' 
                  : currentStep === 2 
                    ? 'Add the different uniform sets required in your school' 
                    : currentStep === 3 
                      ? 'Select vendors to invite for this request' 
                      : 'Please review all details before sending the request to vendors.'}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleHelpClick}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 text-white/95 active:scale-90 transition-transform"
          >
            <HelpCircle size={22} />
          </button>
        </div>

        {/* Stepper Progress Bar Strip */}
        <div className="flex items-center justify-between mt-7 px-2">
          {/* Step 1 */}
          <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => setCurrentStep(1)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md font-black text-xs transition-all ${
              currentStep === 1 
                ? 'bg-white text-[#3b2d7d]' 
                : 'bg-emerald-500 text-white'
            }`}>
              {currentStep > 1 ? <Check size={14} className="stroke-[3.5]" /> : '1'}
            </div>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">Details</span>
          </div>

          <div className={`h-0.5 flex-1 mx-2 -mt-5 transition-colors ${currentStep > 1 ? 'bg-emerald-500' : 'bg-white/20'}`} />

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => setCurrentStep(2)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
              currentStep === 2 
                ? 'bg-white text-[#3b2d7d] shadow-md' 
                : currentStep > 2
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/20 text-white'
            }`}>
              {currentStep > 2 ? <Check size={14} className="stroke-[3.5]" /> : '2'}
            </div>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">Sets</span>
          </div>

          <div className={`h-0.5 flex-1 mx-2 -mt-5 transition-colors ${currentStep > 2 ? 'bg-emerald-500' : 'bg-white/20'}`} />

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => setCurrentStep(3)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
              currentStep === 3 
                ? 'bg-white text-[#3b2d7d] shadow-md' 
                : currentStep > 3
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/20 text-white'
            }`}>
              {currentStep > 3 ? <Check size={14} className="stroke-[3.5]" /> : '3'}
            </div>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">Vendors</span>
          </div>

          <div className={`h-0.5 flex-1 mx-2 -mt-5 transition-colors ${currentStep > 3 ? 'bg-emerald-500' : 'bg-white/20'}`} />

          {/* Step 4 */}
          <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => setCurrentStep(4)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
              currentStep === 4 
                ? 'bg-white text-[#3b2d7d] shadow-md' 
                : currentStep > 4
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/20 text-white'
            }`}>
              {currentStep > 4 ? <Check size={14} className="stroke-[3.5]" /> : '4'}
            </div>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">Review</span>
          </div>

          <div className="h-0.5 flex-1 bg-white/20 mx-2 -mt-5" />

          {/* Step 5 */}
          <div className="flex flex-col items-center gap-1.5 opacity-60">
            <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-xs">
              5
            </div>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">Publish</span>
          </div>
        </div>
      </div>

      {/* STEP 1 FORM DETAILS RENDERING */}
      {currentStep === 1 && (
        <div className="px-6 py-6 space-y-6">
          <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-[#3b2d7d] text-white text-[12px] font-black flex items-center justify-center shadow-md">
                1
              </div>
              <div>
                <h3 className="text-sm font-black text-deep-purple uppercase tracking-wider">
                  Request Details
                </h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                  Provide the basic details for your uniform requirement.
                </p>
              </div>
            </div>

            {/* Request Title */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider">
                  Request Title <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-gray-400 font-bold">
                  {requestTitle.length}/100
                </span>
              </div>
              <input 
                type="text"
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value.slice(0, 100))}
                placeholder="Enter request title"
                className="w-full px-4.5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors placeholder:text-gray-300 leading-relaxed"
              />
            </div>

            {/* Academic Year & Required By Date - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
              {/* Academic Year */}
              <div className="space-y-2">
                <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Calendar size={16} className="absolute left-4.5 text-gray-400" />
                  <select 
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full pl-11 pr-8 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors appearance-none cursor-pointer leading-relaxed"
                  >
                    <option value="">Select academic year</option>
                    <option value="2025-26">Academic Year 2025–26</option>
                    <option value="2026-27">Academic Year 2026–27</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Required By Date */}
              <div className="space-y-2">
                <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                  Required By Date <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Calendar size={16} className="absolute left-4.5 text-gray-400" />
                  <input 
                    type="date"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors cursor-pointer leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Classes Applicable (Multiselect Dropdown) */}
            <div className="space-y-2 relative">
              <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                Classes Applicable <span className="text-red-500">*</span>
              </label>
              
              <div 
                onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                className="w-full pl-11 pr-8 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors cursor-pointer flex items-center justify-between relative shadow-sm min-h-[48px]"
              >
                <Users size={16} className="absolute left-4.5 text-gray-400" />
                <div className="flex flex-wrap gap-1.5 pr-2">
                  {selectedClasses.length === 0 ? (
                    <span className="text-gray-300">Select classes</span>
                  ) : (
                    selectedClasses.map(classId => {
                      const matchedClass = availableClasses.find(c => c.id === classId);
                      return (
                        <span 
                          key={classId}
                          className="px-2 py-0.5 bg-purple-50 text-[10px] font-black text-[#3b2d7d] rounded-lg border border-purple-100/60 leading-none flex items-center gap-1"
                        >
                          {matchedClass ? matchedClass.label : classId}
                        </span>
                      );
                    })
                  )}
                </div>
                <ChevronDown size={14} className="text-gray-400 shrink-0" />
              </div>

              {isClassDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsClassDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto p-2.5 grid grid-cols-2 gap-1.5">
                    {availableClasses.map(c => {
                      const isChecked = selectedClasses.includes(c.id);
                      return (
                        <div 
                          key={c.id}
                          onClick={() => handleClassToggle(c.id)}
                          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-purple-50/50 border border-[#3b2d7d]/20 text-[#3b2d7d] font-black' 
                              : 'hover:bg-gray-50 border border-transparent text-gray-600 font-bold'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="accent-[#3b2d7d] w-4 h-4 rounded shrink-0 pointer-events-none"
                          />
                          <span className="text-xs">{c.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              <span className="text-[9.5px] text-gray-400 font-bold block mt-1.5">Select one or more classes</span>
            </div>

            {/* Total Students */}
            <div className="space-y-2">
              <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                Total Students <span className="text-gray-400 font-bold text-[9px] lowercase">(optional)</span>
              </label>
              <div className="relative flex items-center">
                <Users size={16} className="absolute left-4.5 text-gray-400" />
                <input 
                  type="number"
                  value={totalStudents}
                  onChange={(e) => setTotalStudents(e.target.value)}
                  placeholder="Enter total number of students"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors placeholder:text-gray-300 leading-relaxed"
                />
              </div>
              <span className="text-[9.5px] text-gray-400 font-bold block mt-1.5">
                This helps vendors understand the requirement better
              </span>
            </div>

            {/* Special Instructions */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                  Special Instructions <span className="text-gray-400 font-bold text-[9px] lowercase">(optional)</span>
                </label>
                <span className="text-[10px] text-gray-400 font-bold">
                  {specialInstructions.length}/300
                </span>
              </div>
              <textarea 
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value.slice(0, 300))}
                placeholder="Add any special instructions or notes for vendors..."
                rows={3}
                className="w-full px-4.5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors placeholder:text-gray-300 resize-none leading-relaxed"
              />
              <span className="text-[9.5px] text-gray-400 font-bold block mt-1">
                Any additional information that vendors should know
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 RENDERING - UNIFORM SETS */}
      {currentStep === 2 && (
        <div className="px-6 py-6 space-y-6">
          {/* Header & Add Button */}
          <div className="flex items-center justify-between gap-3 bg-white p-5 border border-gray-200/80 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#3b2d7d] flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-deep-purple">Uniform Sets</h3>
                <span className="text-[9.5px] text-gray-400 font-bold block mt-0.5">
                  Add the different uniform sets required
                </span>
              </div>
            </div>
            <button 
              type="button"
              onClick={handleAddSet}
              className="px-3.5 py-2.5 border-2 border-[#3b2d7d] text-[#3b2d7d] hover:bg-purple-50/30 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Plus size={14} className="stroke-[3]" />
              Add Set
            </button>
          </div>

          {/* List of Uniform Sets */}
          {uniformSets.length === 0 ? (
            <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-[2.2rem]">
              <Sparkles size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-black text-gray-500">No uniform sets added yet</p>
              <p className="text-[10px] text-gray-400 font-bold mt-1">Tap &quot;Add Set&quot; to define uniform requirements.</p>
            </div>
          ) : (
          uniformSets.map((set, setIndex) => (
            <div 
              key={set.id}
              className="bg-white border border-gray-200/80 rounded-[2.2rem] p-6 shadow-sm space-y-6 relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300"
            >
              {/* Card Title & Header Actions */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#3b2d7d] text-white text-[12px] font-black flex items-center justify-center shadow-md shrink-0">
                    {setIndex + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-deep-purple">{set.name}</h4>
                      <span className="px-2 py-0.5 bg-purple-50 text-[9px] font-black text-primary rounded-lg border border-purple-100">
                        {set.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit & Remove Buttons Stacked */}
                <div className="flex gap-2 shrink-0">
                  <button 
                    type="button"
                    onClick={() => handleEditSetName(set.id)}
                    className="w-10 h-10 bg-gray-50 border border-gray-150 hover:bg-purple-50/50 hover:text-[#3b2d7d] active:scale-90 text-gray-400 rounded-xl flex flex-col items-center justify-center transition-all"
                  >
                    <Edit2 size={13} />
                    <span className="text-[7.5px] font-black mt-0.5 uppercase tracking-wider">Edit</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleRemoveSet(set.id)}
                    className="w-10 h-10 bg-red-50/60 border border-red-100 hover:bg-red-50 hover:text-red-600 active:scale-90 text-red-500 rounded-xl flex flex-col items-center justify-center transition-all"
                  >
                    <Trash2 size={13} />
                    <span className="text-[7.5px] font-black mt-0.5 uppercase tracking-wider">Remove</span>
                  </button>
                </div>
              </div>

              {/* Quantities Stacked Vertically as full-width rows to prevent horizontal clutter */}
              <div className="space-y-3">
                {/* Boys Quantity */}
                <div className="bg-[#f8f9fc] border border-gray-150 rounded-2xl p-4.5 flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#e8eaf6] text-indigo-500 flex items-center justify-center shrink-0">
                      <Users size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-black block uppercase tracking-wider">
                        Boys Quantity <span className="text-red-500">*</span>
                      </span>
                      <span className="text-xs font-bold text-gray-500 mt-0.5 block">Students required</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <input 
                      type="text"
                      value={set.boysQty}
                      onChange={(e) => {
                        setUniformSets(uniformSets.map(s => 
                          s.id === set.id ? { ...s, boysQty: e.target.value } : s
                        ));
                      }}
                      className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 text-center leading-relaxed"
                    />
                  </div>
                </div>

                {/* Girls Quantity */}
                <div className="bg-[#fff9fa] border border-[#ffe4e6] rounded-2xl p-4.5 flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#ffe4e6] text-rose-500 flex items-center justify-center shrink-0">
                      <Users size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#f43f5e] font-black block uppercase tracking-wider">
                        Girls Quantity <span className="text-[#f43f5e] font-black">*</span>
                      </span>
                      <span className="text-xs font-bold text-gray-500 mt-0.5 block">Students required</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <input 
                      type="text"
                      value={set.girlsQty}
                      onChange={(e) => {
                        setUniformSets(uniformSets.map(s => 
                          s.id === set.id ? { ...s, girlsQty: e.target.value } : s
                        ));
                      }}
                      className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 text-center leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Components Required Section */}
              <div className="space-y-3">
                <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                  Components Required <span className="text-red-500">*</span>
                </label>
                
                {/* Responsive wrapping component check boxes */}
                <div className="flex flex-wrap gap-2.5">
                  {set.components.map(comp => (
                    <div 
                      key={comp.label}
                      onClick={() => handleToggleComponent(set.id, comp.label)}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl cursor-pointer border transition-all active:scale-95 ${
                        comp.checked 
                          ? 'bg-purple-50/50 border-[#3b2d7d]/20 text-[#3b2d7d] font-black shadow-sm' 
                          : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600 font-bold'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={comp.checked}
                        onChange={() => {}}
                        className="accent-[#3b2d7d] w-4 h-4 rounded shrink-0 pointer-events-none"
                      />
                      <span className="text-xs flex items-center gap-1">
                        <span>{comp.icon}</span>
                        <span>{comp.label}</span>
                      </span>
                    </div>
                  ))}

                  {/* Add Custom Component Input */}
                  <div className="flex items-center gap-1.5 border border-dashed border-gray-300 rounded-xl px-2.5 py-1 bg-gray-50/50">
                    <input
                      type="text"
                      placeholder="e.g. Tie, Blazer"
                      value={newComponentNames[set.id] || ''}
                      onChange={(e) => setNewComponentNames({
                        ...newComponentNames,
                        [set.id]: e.target.value
                      })}
                      className="bg-transparent text-xs font-bold text-deep-purple focus:outline-none w-20 py-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const name = newComponentNames[set.id]?.trim();
                        if (!name) return;
                        setUniformSets(uniformSets.map(s => {
                          if (s.id === set.id) {
                            return {
                              ...s,
                              components: [
                                ...s.components,
                                { label: name, icon: '🏷️', checked: true }
                              ]
                            };
                          }
                          return s;
                        }));
                        setNewComponentNames({
                          ...newComponentNames,
                          [set.id]: ''
                        });
                      }}
                      className="text-[10px] font-black text-[#3b2d7d] px-2 py-1 bg-white border border-gray-250 rounded-lg hover:bg-gray-50 active:scale-90 transition-transform"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Reference Images Section */}
              <div className="space-y-3">
                <div>
                  <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                    Reference Images <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[9.5px] text-gray-400 font-bold block mt-0.5">
                    Upload clear images of design, color, logo, fabric, etc.
                  </span>
                </div>

                {/* Uploder Grid Stacked cleanly in 2 columns on narrow devices instead of 5 cramped horizontal ones */}
                <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
                  {set.images.map((img, imgIndex) => {
                    const fileInputId = `file-input-${set.id}-${imgIndex}`;
                    const previewSrc = img.preview || (img.url ? toAbsoluteUrl(img.url) : null);
                    return (
                      <label
                        key={imgIndex}
                        htmlFor={fileInputId}
                        className={`border border-dashed rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-gray-50/50 cursor-pointer group transition-colors text-center aspect-square relative overflow-hidden ${
                          img.uploadError ? 'border-red-300' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="file"
                          id={fileInputId}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(set.id, img.label, e.target.files[0])}
                        />
                        {previewSrc ? (
                          <>
                            <img src={previewSrc} alt={img.label} className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                            {img.uploading ? (
                              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1.5 text-white">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-[8px] font-black uppercase tracking-wider">Uploading…</span>
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white">
                                <Upload size={14} />
                                <span className="text-[9px] font-black uppercase tracking-wider">Replace</span>
                              </div>
                            )}
                            {img.uploadError && (
                              <span className="absolute bottom-1 inset-x-1 bg-red-500 text-white text-[7px] font-black uppercase tracking-wider rounded-md py-0.5">
                                Upload failed — tap to retry
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="w-9 h-9 rounded-full bg-purple-50 text-[#3b2d7d] flex items-center justify-center transition-all group-hover:scale-110">
                              <Upload size={16} />
                            </div>
                            <span className="text-[9.5px] font-black text-deep-purple leading-tight block">
                              {img.label}
                            </span>
                          </>
                        )}
                      </label>
                    );
                  })}
                  
                  {/* Upload More Card */}
                  <div 
                    onClick={() => handleUploadMoreImage(set.id)}
                    className="border border-dashed border-[#3b2d7d]/30 bg-purple-50/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-[#3b2d7d]/5 cursor-pointer group transition-all text-center aspect-square active:scale-95"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#3b2d7d] text-white flex items-center justify-center shadow-sm">
                      <Plus size={16} />
                    </div>
                    <span className="text-[10px] font-black text-[#3b2d7d] leading-tight block">
                      Upload More
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )))}
        </div>
      )}

      {/* STEP 3 RENDERING - INVITE VENDORS */}
      {currentStep === 3 && (
        <div className="px-6 py-6 space-y-6">
          {/* Invite Vendors Card */}
          <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#3b2d7d] flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-deep-purple">Invite Vendors</h3>
                <span className="text-[9.5px] text-gray-400 font-bold block mt-0.5">
                  Select vendors to invite for this request
                </span>
              </div>
            </div>

            {/* Live Search Input */}
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-4.5 text-gray-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendors by name..."
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors placeholder:text-gray-300 leading-relaxed shadow-inner"
              />
            </div>

            {/* Vendors List */}
            <div className="space-y-3">
              {vendorsLoading ? (
                <div className="text-center py-10 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
                  <Loader2 size={28} className="text-[#3b2d7d] mx-auto mb-2 animate-spin" />
                  <p className="text-xs font-black text-gray-500">Loading vendors...</p>
                </div>
              ) : vendors.length === 0 ? (
                <div className="text-center py-10 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
                  <Users size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-black text-gray-500">No vendors available yet</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">
                    {vendorsError || 'Approved vendors will appear here once available.'}
                  </p>
                </div>
              ) : (
              vendors
                .filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(v => (
                  <div 
                    key={v.id}
                    onClick={() => handleToggleVendor(v.id)}
                    className={`flex items-center justify-between gap-4 p-4 border rounded-2xl cursor-pointer transition-all active:scale-[0.99] ${
                      v.checked 
                        ? 'border-[#3b2d7d]/30 bg-purple-50/10 shadow-sm' 
                        : 'border-gray-200 bg-white hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Custom Checkbox */}
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                        v.checked 
                          ? 'bg-[#3b2d7d] border-[#3b2d7d] text-white' 
                          : 'border-gray-300 bg-white'
                      }`}>
                        {v.checked && <Check size={12} className="stroke-[3.5]" />}
                      </div>

                      {/* Mock Logo Box */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 uppercase tracking-widest shadow-inner ${v.logoBg}`}>
                        {v.logo}
                      </div>

                      {/* Vendor Info Stacked */}
                      <div className="min-w-0">
                        <span className="text-xs font-black text-deep-purple block truncate leading-tight">
                          {v.name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold block mt-0.5 leading-none">
                          {v.location}
                        </span>
                        
                        {/* Rating and Orders Completed */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-[9px] font-black text-emerald-600 rounded-md border border-emerald-100 flex items-center gap-0.5 leading-none shrink-0">
                            <Star size={9} className="fill-emerald-600 stroke-none" />
                            {v.rating}
                          </span>
                          <span className="text-[9.5px] text-gray-400 font-black leading-none shrink-0">
                            • {v.completed} Completed
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Verified Badge */}
                    {v.verified && (
                      <div className="px-2.5 py-1 bg-purple-50 text-[9.5px] font-black text-[#3b2d7d] rounded-lg border border-purple-100/60 leading-none flex items-center gap-1 shrink-0 shadow-sm">
                        <ShieldCheck size={11} className="stroke-[2.5]" />
                        Verified
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Centered View More Button */}
            {hasMoreVendors && (
              <div className="text-center pt-2">
                <button 
                  type="button"
                  onClick={handleViewMoreVendors}
                  disabled={loadingMoreVendors}
                  className="text-xs font-black text-[#3b2d7d] hover:text-[#2b2061] active:scale-95 transition-all inline-flex items-center gap-1.5 uppercase tracking-wider hover:underline disabled:opacity-60"
                >
                  {loadingMoreVendors ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    '+ View More Vendors'
                  )}
                </button>
              </div>
            )}

          </div>

          {/* Request Settings Card */}
          <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#3b2d7d] flex items-center justify-center shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-deep-purple">Request Settings</h3>
                <span className="text-[9.5px] text-gray-400 font-bold block mt-0.5">
                  Set deadline and requirements for quotations
                </span>
              </div>
            </div>

            {/* Quotation Submission Deadline */}
            <div className="space-y-2">
              <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                Quotation Submission Deadline <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Calendar size={16} className="absolute left-4.5 text-gray-400" />
                <input 
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors cursor-pointer leading-relaxed"
                />
              </div>
            </div>

            {/* Quotation Requirements checkboxes stacked beautifully for mobile viewports */}
            <div className="space-y-3 pt-1">
              <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                Quotation Requirements
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {quotationRequirements.length === 0 ? (
                  <p className="text-xs font-bold text-gray-400 col-span-2 py-2">No quotation requirements configured</p>
                ) : (
                quotationRequirements.map(req => (
                  <div 
                    key={req.label}
                    onClick={() => handleToggleRequirement(req.label)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer border transition-all active:scale-95 ${
                      req.checked 
                        ? 'bg-purple-50/50 border-[#3b2d7d]/20 text-[#3b2d7d] font-black shadow-sm' 
                        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600 font-bold'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                      req.checked 
                        ? 'bg-[#3b2d7d] border-[#3b2d7d] text-white' 
                        : 'border-gray-300 bg-white'
                    }`}>
                      {req.checked && <Check size={11} className="stroke-[3.5]" />}
                    </div>
                    <span className="text-xs flex items-center gap-1.5 min-w-0">
                      <span className="text-sm shrink-0">{req.icon}</span>
                      <span className="truncate">{req.label}</span>
                    </span>
                  </div>
                ))
                )}
              </div>
            </div>

            {/* Additional Notes Textarea */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <label className="text-[12px] font-black text-gray-500 uppercase tracking-wider block">
                  Additional Notes <span className="text-gray-400 font-bold text-[9px] lowercase">(optional)</span>
                </label>
                <span className="text-[10px] text-gray-400 font-bold">
                  {additionalNotes.length}/300
                </span>
              </div>
              <textarea 
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value.slice(0, 300))}
                placeholder="Add any specific instructions for vendors..."
                rows={3}
                className="w-full px-4.5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-deep-purple focus:outline-none focus:border-[#3b2d7d]/50 transition-colors placeholder:text-gray-300 resize-none leading-relaxed"
              />
            </div>

          </div>
        </div>
      )}

      {/* STEP 4 RENDERING - REVIEW */}
      {currentStep === 4 && (
        <div className="px-6 py-6 space-y-6">
          {/* Card 1: Request Details */}
          <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-6 shadow-sm space-y-5 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#3b2d7d] flex items-center justify-center">
                  <Clipboard size={16} />
                </div>
                <h3 className="text-sm font-black text-deep-purple">Request Details</h3>
              </div>
              <button 
                type="button"
                onClick={() => { setCurrentStep(1); window.scrollTo(0, 0); }}
                className="px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black text-[#3b2d7d] hover:bg-purple-50/50 transition-all flex items-center gap-1 uppercase active:scale-95"
              >
                <Edit2 size={10} />
                Edit
              </button>
            </div>

            <div className="space-y-3.5 pt-1 text-xs">
              <div className="flex items-start gap-4">
                <span className="w-24 text-gray-400 font-bold shrink-0">Request Title</span>
                <span className="text-deep-purple font-black">{requestTitle || '—'}</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-24 text-gray-400 font-bold shrink-0">Academic Year</span>
                <span className="text-deep-purple font-bold">{academicYear || '—'}</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-24 text-gray-400 font-bold shrink-0">Classes</span>
                <span className="text-deep-purple font-bold">
                  {selectedClasses.length > 0 
                    ? selectedClasses.map(id => availableClasses.find(c => c.id === id)?.label).filter(Boolean).join(', ') 
                    : 'None selected'}
                </span>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-24 text-gray-400 font-bold shrink-0">Total Students</span>
                <span className="text-deep-purple font-black">{totalStudents ? `${totalStudents} Students` : '—'}</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-24 text-gray-400 font-bold shrink-0">Notes</span>
                <span className="text-deep-purple font-bold leading-relaxed">
                  {specialInstructions || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Uniform Sets */}
          <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-6 shadow-sm space-y-5 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#3b2d7d] flex items-center justify-center">
                  <ImageIcon size={16} />
                </div>
                <h3 className="text-sm font-black text-deep-purple">Uniform Sets ({uniformSets.length})</h3>
              </div>
              <button 
                type="button"
                onClick={() => { setCurrentStep(2); window.scrollTo(0, 0); }}
                className="px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black text-[#3b2d7d] hover:bg-purple-50/50 transition-all flex items-center gap-1 uppercase active:scale-95"
              >
                <Edit2 size={10} />
                Edit
              </button>
            </div>

            <div className="space-y-4 pt-1">
              {uniformSets.map((set, idx) => (
                <div key={set.id} className="bg-gray-50/70 border border-gray-200/80 rounded-2.5xl p-4.5 space-y-3.5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#3b2d7d] text-white text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-black text-deep-purple">{set.name}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-purple-50 text-[8px] font-black text-[#3b2d7d] rounded-lg border border-purple-100 uppercase shrink-0">
                      {set.type}
                    </span>
                  </div>

                  {/* Boys and Girls Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-gray-150">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                        <Users size={12} />
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-400 font-bold block leading-none">BOYS</span>
                        <span className="text-[10px] font-black text-deep-purple mt-0.5 block">{set.boysQty || '0'} Students</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                        <Users size={12} />
                      </div>
                      <div>
                        <span className="text-[8px] text-rose-400 font-bold block leading-none">GIRLS</span>
                        <span className="text-[10px] font-black text-deep-purple mt-0.5 block">{set.girlsQty || '0'} Students</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] leading-relaxed">
                    <span className="text-gray-400 font-bold">Components ({set.components.filter(c => c.checked).length}): </span>
                    <span className="text-deep-purple font-semibold">
                      {set.components.filter(c => c.checked).map(c => c.label).join(', ') || 'None selected'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Vendors Invited */}
          <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-6 shadow-sm space-y-5 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#3b2d7d] flex items-center justify-center">
                  <Users size={16} />
                </div>
                <h3 className="text-sm font-black text-deep-purple">Vendors Invited ({vendors.filter(v => v.checked).length})</h3>
              </div>
              <button 
                type="button"
                onClick={() => { setCurrentStep(3); window.scrollTo(0, 0); }}
                className="px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black text-[#3b2d7d] hover:bg-purple-50/50 transition-all flex items-center gap-1 uppercase active:scale-95"
              >
                <Edit2 size={10} />
                Edit
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {vendors.filter(v => v.checked).map((v, idx) => (
                <div key={v.id} className="flex items-center justify-between gap-3 bg-gray-50/50 border border-gray-200 p-3.5 rounded-2xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#3b2d7d] text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm">
                      {idx + 1}
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[8px] shrink-0 shadow-inner uppercase tracking-wider ${v.logoBg}`}>
                      {v.logo}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-deep-purple block truncate leading-tight">{v.name}</span>
                      <span className="text-[9.5px] text-gray-400 font-bold block mt-0.5">{v.location}</span>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-50 text-[9.5px] font-black text-emerald-600 rounded-lg border border-emerald-100 shrink-0 flex items-center gap-1 leading-none shadow-sm">
                    <Check size={9} className="stroke-[3.5]" />
                    Verified
                  </div>
                </div>
              ))}
              {vendors.filter(v => v.checked).length === 0 && (
                <span className="text-xs font-bold text-gray-400 italic block text-center py-2">No vendors selected</span>
              )}
            </div>
          </div>

          {/* Card 4: Submission Deadline */}
          <div className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#3b2d7d] flex items-center justify-center shrink-0">
                <Calendar size={16} />
              </div>
              <span className="text-xs font-black text-deep-purple">Quotation Submission Deadline</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-black text-[#3b2d7d] bg-purple-50/50 px-3.5 py-2 rounded-xl border border-purple-100/60 shrink-0">
              <Calendar size={12} />
              {deadlineDate ? new Date(deadlineDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </div>
          </div>

          {/* Card 5: Quotation Requirements */}
          <div className="bg-white border border-gray-200/80 rounded-[2.2rem] p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">Quotation Requirements</h3>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {quotationRequirements.filter(r => r.checked).map(req => (
                <div key={req.label} className="px-3.5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-black flex items-center gap-2 shadow-sm shrink-0">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check size={10} className="stroke-[3.5]" />
                  </div>
                  <span>{req.icon} {req.label}</span>
                </div>
              ))}
              {quotationRequirements.filter(r => r.checked).length === 0 && (
                <span className="text-xs font-bold text-gray-400 italic block py-1">No requirements selected</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Universal Bottom Actions Bar (Visible on all steps) */}
      <div className="px-6 flex flex-col xs:flex-row items-center justify-between gap-3 mt-8 pb-12">
        <button 
          type="button"
          onClick={handleBack}
          className="w-full xs:w-auto px-6 py-4 border-2 border-[#3b2d7d] text-[#3b2d7d] hover:bg-[#3b2d7d]/5 active:scale-95 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all tracking-wider uppercase bg-white shadow-sm shrink-0"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <button 
          type="button"
          onClick={handleSaveDraft}
          disabled={isPublishing}
          className="w-full xs:w-auto px-6 py-4 border-2 border-[#3b2d7d] text-[#3b2d7d] hover:bg-[#3b2d7d]/5 active:scale-95 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all tracking-wider uppercase bg-white shadow-sm flex-1 disabled:opacity-60"
        >
          <Save size={16} />
          Save Draft
        </button>

        <button 
          type="button"
          onClick={handleNext}
          disabled={isPublishing}
          className="w-full xs:flex-1 py-4 bg-[#3b2d7d] text-white hover:bg-[#2b2061] active:scale-95 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-100/50 tracking-wider uppercase flex-1 disabled:opacity-60"
        >
          {isPublishing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {currentStep === 4 ? 'Publishing...' : 'Saving...'}
            </>
          ) : (
            <>
              {currentStep === 4 ? 'Publish' : 'Save & Next'}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SchoolCreateRequest;
