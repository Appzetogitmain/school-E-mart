import { useFcm } from '../../hooks/useFcm';

/**
 * Initializes FCM when the user is authenticated.
 * Renders nothing — side-effect only provider.
 */
const FcmProvider = ({ children }) => {
  useFcm();
  return children;
};

export default FcmProvider;
