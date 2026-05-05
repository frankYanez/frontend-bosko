/**
 * Tipos de dominio para el módulo KYC (Know Your Customer).
 * El proveedor necesita KYC aprobado para publicar servicios y crear órdenes.
 */

export type KYCStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired';

export type DocumentType = 'DNI' | 'CEDULA' | 'PASAPORTE' | 'RUT';

export interface KYCVerification {
  id: string;
  userId: string;
  status: KYCStatus;
  documentType: DocumentType;
  submittedAt: string;
  reviewedAt?: string;
  attemptCount: number; // Máximo 3 intentos
  rejectionReason?: string;
  notes?: string;
}

/** Payload para enviar verificación (POST /kyc/submit) */
export interface SubmitKYCPayload {
  documentType: DocumentType;
  documentFront: string; // URI local del archivo
  documentBack: string;  // URI local del archivo
  selfie: string;        // URI local del archivo
}
