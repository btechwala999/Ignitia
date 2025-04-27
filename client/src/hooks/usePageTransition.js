import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to force page transitions when navigating between routes
 * This ensures animations are triggered consistently using CSS only
 */
const usePageTransition = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Force a repaint to trigger animations
    window.scrollTo(0, 0);
    
    // Add a class to the body to indicate a page transition
    document.body.classList.add('page-transitioning');
    
    // Remove the class after animation completes
    const timeout = setTimeout(() => {
      document.body.classList.remove('page-transitioning');
    }, 400); // Match this to your animation duration
    
    return () => {
      clearTimeout(timeout);
      document.body.classList.remove('page-transitioning');
    };
  }, [location.pathname]);
  
  return null;
};

export default usePageTransition; 