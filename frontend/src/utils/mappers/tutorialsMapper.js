import { toAbsoluteUrl } from '../url';

export const AUDIENCE_LABELS = {
  all: 'Everyone',
  parent: 'Student / Parent',
  teacher: 'Teacher',
  school: 'School Admin',
};

export const mapTutorialForAdmin = (tutorial) => ({
  id: tutorial?._id || tutorial?.id,
  mongoId: tutorial?._id || tutorial?.id,
  title: tutorial?.title || '',
  description: tutorial?.description || '',
  videoUrl: toAbsoluteUrl(tutorial?.videoUrl) || '',
  thumbnailUrl: toAbsoluteUrl(tutorial?.thumbnailUrl) || '',
  targetAudience: tutorial?.targetAudience || 'all',
  order: tutorial?.order ?? 0,
  views: tutorial?.metrics?.views || 0,
  status: tutorial?.status === 'published' ? 'Active' : 'Draft',
  raw: tutorial,
});

export const mapAdminTutorialToPayload = ({
  title,
  description,
  videoId,
  thumbnailId,
  targetAudience,
  order,
  isActive,
}) => ({
  title: title?.trim(),
  description: description?.trim() || undefined,
  videoId,
  thumbnailId: thumbnailId || undefined,
  targetAudience: targetAudience || 'all',
  order: Number.parseInt(order, 10) || 0,
  status: isActive ? 'published' : 'draft',
});

export const mapPublicTutorial = (tutorial) => ({
  id: tutorial?._id || tutorial?.id,
  title: tutorial?.title || '',
  description: tutorial?.description || '',
  videoUrl: toAbsoluteUrl(tutorial?.videoUrl) || '',
  thumbnailUrl: toAbsoluteUrl(tutorial?.thumbnailUrl) || '',
  durationSec: tutorial?.durationSec || 0,
  views: tutorial?.metrics?.views || 0,
});
