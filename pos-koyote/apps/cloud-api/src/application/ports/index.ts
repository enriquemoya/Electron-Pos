import type { AuthTokens } from "../../domain/entities/auth";

export type { AuthTokens };

export type AuthRepository = {
  requestMagicLink: (email: string) => Promise<{ token: string; userId: string }>;
  verifyMagicLink: (token: string) => Promise<AuthTokens | null>;
  refreshTokens: (refreshToken: string) => Promise<AuthTokens | null>;
  revokeRefreshToken: (refreshToken: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<AuthTokens | null>;
  buildMagicLink: (locale: string, token: string) => string;
};

export type EmailService = {
  sendMagicLinkEmail: (params: { to: string; subject: string; html: string; text: string }) => Promise<void>;
};

export type CatalogRepository = {
  getCatalogFilters: () => Promise<{
    categories: Array<{ id: string; label: string }>;
    games: Array<{ id: string; label: string }>;
  }>;
  getFeaturedCatalog: () => Promise<{ items: Array<Record<string, unknown>>; meta: { total: number } }>;
};

export type CatalogAdminRepository = {
  listCatalogProducts: (params: {
    page: number;
    pageSize: number;
    query?: string;
    sort?: "updatedAt" | "name" | "price";
    direction?: "asc" | "desc";
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  getCatalogProduct: (productId: string) => Promise<Record<string, unknown> | null>;
  createCatalogProduct: (params: {
    actorUserId: string;
    reason: string;
    name: string;
    slug: string;
    game: string;
    categoryId: string;
    expansionId: string | null;
    price: number;
    imageUrl: string;
    description: string | null;
    rarity: string | null;
    tags: string[] | null;
    isActive: boolean;
    isFeatured: boolean;
    featuredOrder: number | null;
  }) => Promise<Record<string, unknown>>;
  updateCatalogProduct: (params: {
    productId: string;
    data: Record<string, unknown>;
    actorUserId: string;
    reason: string;
  }) => Promise<Record<string, unknown>>;
  listTaxonomies: (params: {
    type?: "CATEGORY" | "GAME" | "EXPANSION" | "OTHER";
    page: number;
    pageSize: number;
    query?: string;
    sort?: "name" | "type";
    direction?: "asc" | "desc";
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  createTaxonomy: (data: {
    type: "CATEGORY" | "GAME" | "EXPANSION" | "OTHER";
    name: string;
    slug: string;
    description: string | null;
  }) => Promise<Record<string, unknown>>;
  updateTaxonomy: (id: string, data: { name?: string; slug?: string; description?: string | null }) => Promise<Record<string, unknown>>;
  deleteTaxonomy: (id: string) => Promise<Record<string, unknown>>;
};

export type InventoryRepository = {
  listInventory: (params: {
    page: number;
    pageSize: number;
    query?: string;
    sort?: "updatedAt" | "available" | "name";
    direction?: "asc" | "desc";
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  adjustInventory: (params: { productId: string; delta: number; reason: string; actorUserId: string }) => Promise<{
    item: Record<string, unknown>;
    adjustment: Record<string, unknown>;
  } | null>;
};

export type CheckoutRepository = {
  createOrUpdateDraft: (params: {
    userId: string;
    items: Array<{
      productId: string;
      quantity: number;
      priceSnapshot?: number | null;
      availabilitySnapshot?: string | null;
    }>;
  }) => Promise<{
    draftId: string;
    items: Array<{
      productId: string;
      quantity: number;
      priceSnapshot: number;
      currency: string;
      availabilitySnapshot: string;
    }>;
    removedItems: Array<{ productId: string; reason: "insufficient" | "missing" }>;
  }>;
  getActiveDraft: (params: {
    userId: string;
  }) => Promise<{
    draftId: string;
    items: Array<{
      productId: string;
      quantity: number;
      priceSnapshot: number;
      currency: string;
      availabilitySnapshot: string;
      name: string | null;
      slug: string | null;
      imageUrl: string | null;
      game: string | null;
    }>;
  } | null>;
  revalidateItems: (params: {
    items: Array<{ productId: string; quantity: number }>;
  }) => Promise<{
    items: Array<{
      productId: string;
      quantity: number;
      priceSnapshot: number;
      currency: string;
      availabilitySnapshot: string;
    }>;
    removedItems: Array<{ productId: string; reason: "insufficient" | "missing" }>;
  }>;
  createOrder: (params: {
    userId: string;
    draftId: string;
    paymentMethod: "PAY_IN_STORE";
    pickupBranchId: string | null;
  }) => Promise<{ orderId: string; status: string; expiresAt: string }>;
  getOrder: (params: { userId: string; orderId: string }) => Promise<Record<string, unknown> | null>;
};

export type BranchRepository = {
  listBranches: () => Promise<Array<Record<string, unknown>>>;
  createBranch: (data: {
    name: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    imageUrl?: string | null;
  }) => Promise<Record<string, unknown>>;
  updateBranch: (id: string, data: {
    name?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    imageUrl?: string | null;
  }) => Promise<Record<string, unknown> | null>;
  deleteBranch: (id: string) => Promise<Record<string, unknown> | null>;
};

export type SyncRepository = {
  recordEvents: (events: any[]) => Promise<{ accepted: string[]; duplicates: string[] }>;
  getPendingEvents: (posId: string, since: string | null) => Promise<any[]>;
  acknowledgeEvents: (posId: string, eventIds: string[]) => Promise<void>;
  createOrder: (orderId: string, items: any[]) => Promise<{ duplicate: boolean }>;
  readProducts: (page: number, pageSize: number, id: string | null) => Promise<{ items: any[]; total: number }>;
};

export type AdminDashboardRepository = {
  getAdminSummary: () => Promise<{ pendingShipments: number; onlineSalesTotal: number; currency: string }>;
};

export type ProfileRepository = {
  getProfile: (userId: string) => Promise<Record<string, unknown> | null>;
  updateProfile: (userId: string, payload: {
    user: { firstName?: string | null; lastName?: string | null; phone?: string | null };
    address?: {
      street: string;
      externalNumber: string;
      internalNumber?: string | null;
      postalCode: string;
      neighborhood: string;
      city: string;
      state: string;
      country: string;
      references?: string | null;
    };
  }) => Promise<Record<string, unknown>>;
  updatePassword: (userId: string, password: string) => Promise<void>;
};

export type UsersRepository = {
  listUsers: (page: number, pageSize: number) => Promise<{ items: any[]; total: number }>;
  getUserById: (id: string) => Promise<Record<string, unknown> | null>;
  createUser: (data: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    birthDate?: Date | null;
    role?: "CUSTOMER" | "ADMIN";
    status?: "ACTIVE" | "DISABLED";
  }) => Promise<Record<string, unknown>>;
  updateUser: (id: string, data: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    birthDate?: Date | null;
    role?: "CUSTOMER" | "ADMIN";
    status?: "ACTIVE" | "DISABLED";
  }) => Promise<Record<string, unknown>>;
  disableUser: (id: string) => Promise<Record<string, unknown>>;
  listAddresses: (userId: string) => Promise<any[]>;
  createAddress: (userId: string, data: {
    street: string;
    externalNumber: string;
    internalNumber?: string | null;
    postalCode: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
    references?: string | null;
  }) => Promise<Record<string, unknown>>;
  updateAddress: (addressId: string, data: {
    street?: string | null;
    externalNumber?: string | null;
    internalNumber?: string | null;
    postalCode?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    references?: string | null;
  }) => Promise<Record<string, unknown>>;
  findAddress: (addressId: string, userId: string) => Promise<Record<string, unknown> | null>;
  deleteAddress: (addressId: string) => Promise<Record<string, unknown>>;
};
