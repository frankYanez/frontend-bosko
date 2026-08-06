import React, { useEffect, useRef, useState } from 'react';
import { Modal, Animated, StyleSheet, ViewStyle } from 'react-native';
import { MOTION } from '../motion';

export interface FullScreenModalProps {
  visible: boolean;
  /** Llamado en el back-gesture/hardware-back de Android. Debe cerrar el estado que controla `visible` — el fade-out lo maneja el componente solo. */
  onRequestClose?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Modal a pantalla completa con fade in/out — vive fuera de cualquier stack de
 * navegación (RN `Modal` nativo), así tapar toda la pantalla nunca cambia el
 * tab activo ni empuja una entrada al back stack de la pantalla que lo abrió
 * (el bug que tenía Notifications viviendo dentro del stack de Perfil).
 *
 * Se queda montado durante el fade-out: `visible=false` dispara la animación
 * y recién al terminar se desmonta, para que el cierre nunca sea un corte seco.
 */
export function FullScreenModal({ visible, onRequestClose, children, style }: FullScreenModalProps) {
  const [mounted, setMounted] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(opacity, { toValue: 1, ...MOTION.modalFadeIn, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacity, { toValue: 0, ...MOTION.modalFadeOut, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onRequestClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }, style]}>{children}</Animated.View>
    </Modal>
  );
}
