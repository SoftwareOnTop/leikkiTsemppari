import 'react-native-gesture-handler';

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useSessionStore } from '../src/state/useSessionStore';

export default function RootLayout() {
  const init = useSessionStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
