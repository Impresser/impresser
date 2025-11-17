'use client';

import React from 'react';
import CommonLoader from '@/components/ui/CommonLoader';

export default function AppLoading() {
  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
      <CommonLoader className="w-[240px] h-[180px]" color="#0059FF" timeScale={3} />
    </div>
  );
}


