import React, { useEffect, useState } from 'react';

const AnimatedPage = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Set visible after component mounts for enter animation
    setIsVisible(true);
    
    return () => {
      // Set invisible when component unmounts for exit animation
      setIsVisible(false);
    };
  }, []);

  return (
    <div 
      className={`animate-fadeIn w-full h-full transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {children}
    </div>
  );
};

export default AnimatedPage; 