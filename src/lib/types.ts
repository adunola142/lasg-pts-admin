// Shared types mirroring the real backend's Prisma enums and the shapes
// returned by its `include` blocks (see prisma/schema.prisma and the
// *.service.ts files in lasg-pts-backend/src). Nothing here is
// speculative — every field matches what the API actually returns.

export type Role = 'ADMIN' | 'SUPERVISOR' | 'AUDITOR' | 'ENUMERATOR' | 'DELIVERY_AGENT';

// Only these two roles can do anything useful in this portal — every
// read/write endpoint the portal calls is restricted to them by the
// backend's RolesGuard (ADMIN/SUPERVISOR/AUDITOR for reads, ADMIN/SUPERVISOR
// for enumeration status changes). ENUMERATOR and DELIVERY_AGENT are
// mobile-app-only accounts.
export const PORTAL_ROLES: Role[] = ['ADMIN', 'SUPERVISOR', 'AUDITOR'];

export interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  role: Role;
}

/** The shape GET /users and its siblings return — see UsersService's
    SAFE_SELECT on the backend. Never includes a password hash. */
export interface ManagedUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ALL_ROLES: Role[] = ['ADMIN', 'SUPERVISOR', 'AUDITOR', 'ENUMERATOR', 'DELIVERY_AGENT'];

export function roleLabel(role: Role): string {
  return role
    .split('_')
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(' ');
}

export interface ReferenceOption {
  id: number;
  name: string;
}

export interface Property {
  id: string;
  pin: string;
  paymentCode?: string | null;
  address: string;
  localGovernmentId: number;
  localGovernment?: ReferenceOption;
  propertyUsageId?: number | null;
  propertyUsage?: ReferenceOption | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
}

export type OccupancyStatus = 'OWNER_OCCUPIED' | 'TENANT' | 'VACANT' | 'UNDER_CONSTRUCTION';
export type EnumerationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface Enumeration {
  id: string;
  propertyId: string;
  property?: Property;
  enumeratorId: string;
  enumerator?: { id: string; fullName: string; phoneNumber: string; role: Role };
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string | null;
  occupancyStatus: OccupancyStatus;
  buildingType?: string | null;
  numberOfFloors?: number | null;
  numberOfUnits?: number | null;
  capturedLatitude?: number | null;
  capturedLongitude?: number | null;
  photoUrls: string[];
  signatureUrl?: string | null;
  notes?: string | null;
  status: EnumerationStatus;
  createdAt: string;
}

export type GapType = 'UNREGISTERED_PROPERTY' | 'INCORRECT_RECORD' | 'DUPLICATE_RECORD' | 'OTHER';
export type GapStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';

export interface Gap {
  id: string;
  reporterId: string;
  reporter?: { id: string; fullName: string; phoneNumber: string; role: Role };
  gapType: GapType;
  description: string;
  address?: string | null;
  localGovernmentId?: number | null;
  localGovernment?: ReferenceOption | null;
  latitude?: number | null;
  longitude?: number | null;
  propertyId?: string | null;
  property?: Property | null;
  photoUrl?: string | null;
  status: GapStatus;
  resolutionNotes?: string | null;
  createdAt: string;
}

export type DeliveryStatus = 'DELIVERED' | 'FAILED' | 'RESCHEDULED';

export interface Delivery {
  id: string;
  propertyId: string;
  property?: Property;
  deliveryAgentId: string;
  deliveryAgent?: { id: string; fullName: string; phoneNumber: string; role: Role };
  status: DeliveryStatus;
  receiverName?: string | null;
  receiverPhone?: string | null;
  relationshipToOwner?: string | null;
  failureReason?: string | null;
  signatureUrl?: string | null;
  photoUrl?: string | null;
  capturedLatitude?: number | null;
  capturedLongitude?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  skip: number;
}
