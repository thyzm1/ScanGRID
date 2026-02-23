import React from 'react';

interface IconDisplayProps {
  icon?: string;
  className?: string;
}

export const IconDisplay: React.FC<IconDisplayProps> = ({ icon, className = '' }) => {
  if (!icon) return null;

  // Check for Remix Icon pattern (starts with ri-)
  if (icon.startsWith('ri-')) {
    return <i className={`${icon} ${className}`} />;
  }
  
  // FontAwesome (starts with fa-) compatibility just in case
  if (icon.startsWith('fa-') || icon.startsWith('fas ')) {
     return <i className={`${icon} ${className}`} />;
  }

  // Default to Material Symbols
  // We need to ensure className doesn't override critical display properties, but usually it's fine.
  // Material Symbols uses font-size, so text-xl etc works.
  return <span className={`material-symbols-outlined ${className} align-middle`}>{icon}</span>;
};
