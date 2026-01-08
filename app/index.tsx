import React from 'react';
import { Redirect } from 'expo-router';

import { useSessionStore } from '../src/state/useSessionStore';

export default function Index() {
  const session = useSessionStore((s) => s.session);
  return <Redirect href={session ? '/(app)' : '/(auth)/sign-in'} />;
}
