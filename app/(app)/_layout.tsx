import React, { useEffect } from 'react';
import { Stack } from 'expo-router';

import { useSessionStore } from '../../src/state/useSessionStore';
import { useAppDataStore } from '../../src/state/useAppDataStore';

export default function AppLayout() {
  const session = useSessionStore((s) => s.session);
  const refreshAll = useAppDataStore((s) => s.refreshAll);

  useEffect(() => {
    if (!session) return;
    refreshAll();
  }, [session, refreshAll]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
