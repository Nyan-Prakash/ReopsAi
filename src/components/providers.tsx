'use client';

import { useEffect } from 'react';
import { initRuntimeConfig } from '@/shared/runtime_config';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize runtime config on client mount
    initRuntimeConfig();
  }, []);

  return <>{children}</>;
}