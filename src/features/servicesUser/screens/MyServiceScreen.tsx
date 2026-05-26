import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "@/features/servicesUser/state/ServicesContext";
import type { Service } from "@/features/servicesUser/services/service";
import { EmptyState } from '@/core/components/EmptyState';

const BRAND = '#850021';

function formatPrice(price?: number | null): string {
  if (!price) return 'A cotizar';
  return `$${new Intl.NumberFormat('es-AR').format(price)}`;
}

function getCategoryLabel(category: Service['category']): string {
  if (!category) return 'Sin categoría';
  if (typeof category === 'object') return category.name ?? 'Sin categoría';
  return category;
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}) {
  const categoryLabel = getCategoryLabel(service.category);
  return (
    <View style={styles.card}>
      {service.image ? (
        <Image source={{ uri: service.image }} style={styles.cardImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>Sin imagen</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{service.title}</Text>
        <Text style={styles.cardDescription}>{service.description}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardCategory}>{categoryLabel}</Text>
          <Text style={styles.cardPrice}>{formatPrice(service.price)}</Text>
        </View>
        <View style={styles.cardActions}>
          <Pressable style={styles.editButton} onPress={() => onEdit(service)}>
            <Text style={styles.editButtonText}>Editar</Text>
          </Pressable>
          <Pressable
            style={styles.deleteButton}
            onPress={() => onDelete(service)}
          >
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function MyServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { myServices: services, myServicesLoading: loading, loadMyServices: loadServices, removeService } = useServices();

  const handleEdit = (service: Service) => {
    router.push({
      pathname: "/service-form",
      params: { serviceId: service.id },
    });
  };

  const handleDelete = (service: Service) => {
    Alert.alert(
      "Eliminar servicio",
      "¿Estás seguro de eliminar este servicio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              if (service.id) {
                await removeService(service.id);
                Alert.alert("Servicio eliminado", "Se eliminó correctamente.");
              }
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  "No se pudo eliminar el servicio"
              );
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadServices().catch((err) => console.error(err));
    }, [loadServices])
  );

  const renderService = ({ item }: { item: Service }) => (
    <ServiceCard service={item} onEdit={handleEdit} onDelete={handleDelete} />
  );

  const planMessage =
    services.length === 0
      ? "Crea tu primer servicio para comenzar a recibir solicitudes."
      : "Administra y actualiza tus servicios publicados.";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header con back */}
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.header}>Mis servicios</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push('/service-form')}
          hitSlop={8}
        >
          <Text style={styles.addBtnText}>+ Publicar</Text>
        </Pressable>
      </View>
      <Text style={styles.planMessage}>{planMessage}</Text>

      {loading && services.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator />
        </View>
      ) : null}

      {services.length === 0 && !loading ? (
        <EmptyState
          icon="construct-outline"
          title="Todavía no publicaste servicios"
          subtitle="Creá tu primer servicio para que los clientes puedan encontrarte y contratarte."
          cta={{
            label: 'Publicar primer servicio',
            onPress: () => router.push("/service-form"),
          }}
        />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item, index) => item.id ?? `service-${index}`}
          renderItem={renderService}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() =>
                loadServices().catch((err) => console.error(err))
              }
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backIcon: {
    fontSize: 28,
    color: '#111',
    lineHeight: 32,
    marginTop: -2,
  },
  header: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
  },
  addBtn: {
    backgroundColor: BRAND,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  planMessage: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 16,
  },
  loader: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyDescription: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: BRAND,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  listContent: {
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  imagePlaceholder: {
    width: "100%",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  imagePlaceholderText: {
    color: "#6B7280",
  },
  cardContent: {
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardDescription: {
    fontSize: 14,
    color: "#4B5563",
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCategory: {
    fontSize: 13,
    color: BRAND,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND,
  },
  editButtonText: {
    color: BRAND,
    fontWeight: "600",
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  deleteButtonText: {
    color: "#DC2626",
    fontWeight: "600",
  },
});
