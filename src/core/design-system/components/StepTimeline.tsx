import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TOKENS } from '../tokens';
import { GRADIENTS } from '../gradients';
import { Text } from './Text';

export type StepStatus = 'done' | 'active' | 'pending';

export interface TimelineStep {
  label: string;
  status: StepStatus;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

/**
 * Timeline de pasos — OrderDetail, OrderStatus, KYCIntro, BecomeProvider.
 * Dot 28px + conector 2px. done → var(--brand) sólido, active → brand-gradient
 * con glow (0 0 12px rgba(255,45,111,.5)), pending → surface-2 + borde.
 */
export function StepTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <View key={i} style={styles.row}>
            <View style={styles.rail}>
              <Dot status={step.status} icon={step.icon} />
              {!isLast && (
                <View style={[styles.connector, step.status === 'done' && styles.connectorDone]} />
              )}
            </View>
            <Text
              variant={step.status === 'pending' ? 'body' : 'label'}
              color={step.status === 'pending' ? 'rgba(237,234,245,0.55)' : '#EDEAF5'}
              style={styles.label}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Dot({ status, icon }: { status: StepStatus; icon: TimelineStep['icon'] }) {
  if (status === 'pending') {
    return (
      <View style={[styles.dot, styles.dotPending]}>
        <Ionicons name={icon} size={12} color="rgba(237,234,245,0.3)" />
      </View>
    );
  }
  return (
    <View style={[styles.dot, status === 'active' && styles.dotActiveGlow]}>
      <LinearGradient colors={GRADIENTS.brand} style={StyleSheet.absoluteFillObject} />
      <Ionicons name={icon} size={12} color="#fff" style={{ zIndex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 28 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dotPending: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dotActiveGlow: {
    shadowColor: TOKENS.color.signal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  connector: { width: 2, height: 22, backgroundColor: 'rgba(255,255,255,0.1)' },
  connectorDone: { backgroundColor: TOKENS.color.primary },
  label: { paddingTop: 5, paddingBottom: 16 },
});
