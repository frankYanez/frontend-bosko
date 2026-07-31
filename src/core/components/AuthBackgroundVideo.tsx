import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, StyleSheet, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const VIDEO_SRC = require('@/assets/videos/5758671-uhd_2160_3840_30fps.mp4');

// Degradado oscuro fijo, de arriba (casi transparente) a abajo (bien oscuro) — no depende del tema.
const DEFAULT_OVERLAY = ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.88)'] as const;

export function AuthBackgroundVideo({
  overlayColors = DEFAULT_OVERLAY,
}: {
  overlayColors?: readonly [string, string, ...string[]];
}) {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    videoRef.current?.playAsync();

    // El OS puede pausar el video al perder foco (permisos, notificación) — lo retoma al volver.
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') videoRef.current?.playAsync();
    });
    return () => sub.remove();
  }, []);

  return (
    // renderToHardwareTextureAndroid: el SurfaceView del video ignora el z-order de RN
    // en Android y pinta siempre arriba de los hermanos — forzamos composición a textura
    // para que el gradiente de encima se vea.
    <View style={StyleSheet.absoluteFill} collapsable={false} renderToHardwareTextureAndroid>
      <Video
        ref={videoRef}
        source={VIDEO_SRC}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted
        shouldPlay
        onLoad={() => videoRef.current?.playAsync()}
      />
      <LinearGradient
        colors={overlayColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { zIndex: 1, elevation: 1 }]}
        pointerEvents="none"
      />
    </View>
  );
}
