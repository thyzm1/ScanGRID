import React from 'react';

interface IconDisplayProps {
  icon?: string;
  className?: string;
}

export const IconDisplay: React.FC<IconDisplayProps> = ({ icon, className = '' }) => {
  if (!icon) return null;

  // Material Symbols only.
  return <span className={`material-symbols-outlined ${className} align-middle`}>{icon}</span>;
};
