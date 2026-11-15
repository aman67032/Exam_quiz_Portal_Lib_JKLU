'use client';

import React, { useEffect, useState } from 'react';
import App from '@/App';

export default function ClientRouterApp() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] dark:bg-[#0A0A0C] text-[#0A0A0C] dark:text-[#F5F4F0]">
        <div className="flex items-center gap-3 font-mono-tabular text-xs">
          <div className="w-6 h-6 rounded bg-[#0A0A0C] dark:bg-[#F5F4F0] text-[#FAF9F6] dark:text-[#0A0A0C] flex items-center justify-center font-bold">
            JK
          </div>
          <span>Loading Learn JKLU 2.0...</span>
        </div>
      </div>
    );
  }

  return <App />;
}
