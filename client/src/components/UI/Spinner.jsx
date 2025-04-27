import React from 'react';

const Spinner = ({ size = 'medium', className = '' }) => {
  // Size class map
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  };

  // Get appropriate size class or default to medium
  const sizeClass = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className={`${className} flex justify-center items-center`}>
      <div className={`${sizeClass} border-t-purple-600 border-r-purple-200 border-b-purple-200 border-l-purple-200 rounded-full animate-spin`}></div>
    </div>
  );
};

export default Spinner; 