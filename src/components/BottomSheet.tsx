import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  State,
  type HandlerStateChangeEvent,
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapHeightPct?: number; // 0..1
};

export function BottomSheet({ open, onClose, children, snapHeightPct = 0.75 }: Props) {
  const { height } = useWindowDimensions();

  const sheetHeight = useMemo(() => Math.max(300, Math.floor(height * snapHeightPct)), [height, snapHeightPct]);

  const translateY = useSharedValue(sheetHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (open) {
      translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: 180 });
    } else {
      translateY.value = withTiming(sheetHeight, { duration: 220, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: 180 });
    }
  }, [backdropOpacity, open, sheetHeight, translateY]);

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (!open) return;
    const dy = Math.max(0, event.nativeEvent.translationY);
    translateY.value = dy;
    backdropOpacity.value = Math.max(0, 1 - dy / sheetHeight);
  };

  const onHandlerStateChange = (event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
    if (!open) return;
    if (event.nativeEvent.state !== State.END) return;

    const dy = Math.max(0, event.nativeEvent.translationY ?? 0);
    const vy = event.nativeEvent.velocityY ?? 0;
    const shouldClose = dy > sheetHeight * 0.35 || vy > 900;

    if (shouldClose) {
      translateY.value = withTiming(sheetHeight, { duration: 200, easing: Easing.out(Easing.cubic) }, () => {
        runOnJS(onClose)();
      });
      backdropOpacity.value = withTiming(0, { duration: 160 });
    } else {
      translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: 160 });
    }
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!open) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
        <Animated.View style={[styles.sheet, { height: sheetHeight }, sheetStyle]}>
          <View style={styles.handle} />
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  content: { flex: 1 },
});
