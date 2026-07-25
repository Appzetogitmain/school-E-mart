export const unwrapData = (response) => response?.data?.data;

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const data = error?.response?.data;
  if (data?.errors && typeof data.errors === 'object') {
    const errorList = Object.values(data.errors).filter(Boolean);
    if (errorList.length > 0) {
      return errorList.join('. ');
    }
  }
  return data?.message || error?.message || fallback;
};
