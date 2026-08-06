import apiClient from './apiClient';
import { unwrapData } from '../utils/apiHelpers';

// "Learn more about platform" — tutorial videos the super admin uploads for
// parents/students, teachers, and school admins, surfaced from each portal's
// Profile page. The backend scopes results to the signed-in user's role
// (plus anything targeted at "all") based on the auth token, so no role
// parameter is sent from here.
export const listPlatformTutorials = async (params = {}) => {
  const response = await apiClient.get('/content/tutorials', { params });
  const { data, pagination } = response.data;
  return {
    data: data?.tutorials || [],
    pagination: pagination || null,
  };
};

export const recordTutorialView = async (tutorialId) => {
  const response = await apiClient.post(`/content/tutorials/${tutorialId}/view`);
  return unwrapData(response)?.tutorial;
};
