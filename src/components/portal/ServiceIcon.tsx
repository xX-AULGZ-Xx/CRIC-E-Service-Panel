'use client';

import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

interface ServiceIconProps {
  src?: string | null;
  alt?: string;
  className?: string;
  iconSizeClass?: string;
  fallbackIconSizeClass?: string;
}

export default function ServiceIcon({
  src,
  alt = '',
  className = 'w-8 h-8 object-contain',
  fallbackIconSizeClass = 'w-5 h-5 text-neutral-400',
}: ServiceIconProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return <Globe className={fallbackIconSizeClass} />;
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
