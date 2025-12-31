'use client';

import { useState, useEffect } from 'react';

export default function ClientDate() {
  const [dateString, setDateString] = useState<string>('');

  useEffect(() => {
    // Format date using client's local timezone
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    setDateString(today);
  }, []);

  // Return placeholder during SSR to avoid hydration mismatch
  if (!dateString) {
    return <p className="text-orange-200 mt-2 font-medium h-6"></p>;
  }

  return <p className="text-orange-200 mt-2 font-medium">{dateString}</p>;
}
