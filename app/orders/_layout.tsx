import { Stack } from 'expo-router';

export default function OrdersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="payment-success" />
      <Stack.Screen name="status" />
      <Stack.Screen name="quote" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
