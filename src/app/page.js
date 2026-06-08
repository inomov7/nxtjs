'use client';

import { CrmProvider } from '@/lib/CrmContext';
import { ToastProvider } from '@/components/SharedComponents';
import CrmApp from '@/components/CrmApp';

export default function Home() {
  return (
    <CrmProvider>
      <ToastProvider>
        <CrmApp />
      </ToastProvider>
    </CrmProvider>
  );
}
