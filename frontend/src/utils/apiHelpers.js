export const unwrapData = (response) => response?.data?.data;

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || error?.message || fallback;
