import type { AuthTokens } from "../../domain/entities/auth";

export type { AuthTokens };

export type AuthRepository = {
  requestMagicLink: (email: string) => Promise<{
    token: string;
    userId: string;
    emailLocale: "ES_MX" | "EN_US";
    firstName: string | null;
    email: string | null;
  }>;
  verifyMagicLink: (token: string) => Promise<{
    tokens: AuthTokens;
    user: { id: string; email: string | null; emailLocale: "ES_MX" | "EN_US"; firstName: string | null };
    wasUnverified: boolean;
  } | null>;
  refreshTokens: (refreshToken: string) => Promise<AuthTokens | null>;
  revokeRefreshToken: (refreshToken: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<AuthTokens | null>;
  loginPosUserWithPin: (params: {
    pin: string;
    terminalBranchId: string;
  }) => Promise<
    | {
        accessToken: string;
        user: {
          id: string;
          role: string;
          branchId: string | null;
          displayName: string;
        };
      }
    | { forbidden: true }
    | { branchForbidden: true }
    | null
  >;
  findPosUserByPin: (pin: string) => Promise<{ id: string } | null>;
  increasePinFailure: (params: { userId?: string | null; pin?: string }) => Promise<void>;
  buildMagicLink: (locale: "ES_MX" | "EN_US" | null, token: string) => string;
};

export type EmailService = {
  sendMagicLinkEmail: (params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    meta?: { userId?: string | null; template?: string; locale?: string; orderId?: string | null };
  }) => Promise<void>;
  sendEmail: (params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    meta?: { userId?: string | null; template?: string; locale?: string; orderId?: string | null };
  }) => Promise<void>;
};

export type CatalogRepository = {
  getCatalogFilters: () => Promise<{
    categories: Array<{ id: string; label: string }>;
    games: Array<{ id: string; label: string }>;
  }>;
  getFeaturedCatalog: () => Promise<{ items: Array<Record<string, unknown>>; meta: { total: number } }>;
  listGames: () => Promise<Array<Record<string, unknown>>>;
  listCategories: (params: {
    gameId?: string | "misc" | null;
    expansionId?: string | null;
  }) => Promise<Array<Record<string, unknown>>>;
  listExpansions: (params: { gameId?: string | null }) => Promise<Array<Record<string, unknown>>>;
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
    gameId: string | null;
    categoryId: string;
    expansionId: string | null;
    price: number;
    imageUrl: string;
    description: string | null;
    rarity: string | null;
    tags: string[] | null;
    availabilityState: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" | "PENDING_SYNC";
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
    parentId?: string | null;
    releaseDate?: Date | null;
    labels?: { es: string | null; en: string | null } | null;
  }) => Promise<Record<string, unknown>>;
  updateTaxonomy: (id: string, data: {
    name?: string;
    slug?: string;
    description?: string | null;
    parentId?: string | null;
    releaseDate?: Date | null;
    labels?: { es: string | null; en: string | null } | null;
  }) => Promise<Record<string, unknown>>;
  deleteTaxonomy: (id: string) => Promise<Record<string, unknown>>;
};

export type InventoryRepository = {
  listInventory: (params: {
    page: number;
    pageSize: number;
    query?: string;
    sort?: "updatedAt" | "available" | "name";
    direction?: "asc" | "desc";
    scopeType?: "ONLINE_STORE" | "BRANCH";
    branchId?: string | null;
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  adjustInventory: (params: {
    productId: string;
    delta: number;
    reason: string;
    actorUserId: string;
    scopeType?: "ONLINE_STORE" | "BRANCH";
    branchId?: string | null;
    idempotencyKey?: string | null;
  }) => Promise<{
    item: Record<string, unknown>;
    adjustment: Record<string, unknown>;
  } | null>;
  createMovement: (params: {
    productId: string;
    scopeType: "ONLINE_STORE" | "BRANCH";
    branchId: string | null;
    delta: number;
    reason: string;
    actorRole: "ADMIN" | "EMPLOYEE" | "TERMINAL";
    actorUserId?: string | null;
    actorTerminalId?: string | null;
    idempotencyKey: string;
  }) => Promise<{
    item: Record<string, unknown>;
    adjustment: Record<string, unknown>;
  } | null>;
  getInventoryStockDetail: (params: {
    productId: string;
  }) => Promise<Record<string, unknown> | null>;
  listInventoryMovements: (params: {
    page: number;
    pageSize: number;
    productId?: string;
    branchId?: string | null;
    scopeType?: "ONLINE_STORE" | "BRANCH";
    direction?: "asc" | "desc";
    from?: string | null;
    to?: string | null;
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
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
    paymentMethod: "PAY_IN_STORE" | "BANK_TRANSFER";
    pickupBranchId: string | null;
  }) => Promise<{
    orderId: string;
    orderNumber: number;
    orderCode: string;
    status: string;
    expiresAt: string;
    paymentMethod: string;
    paymentStatus: string;
    customerId: string;
    customerEmail: string | null;
    customerEmailLocale: "ES_MX" | "EN_US" | null;
    subtotal: number;
    currency: string;
    pickupBranchName: string | null;
    pickupBranchMapUrl: string | null;
  }>;
  getOrder: (params: { userId: string; orderId: string }) => Promise<Record<string, unknown> | null>;
};

export type OrderFulfillmentRepository = {
  listAdminOrders: (params: {
    page: number;
    pageSize: number;
    actorRole?: string;
    actorBranchId?: string | null;
    query?: string;
    status?: string;
    sort?: "createdAt" | "status" | "expiresAt" | "subtotal";
    direction?: "asc" | "desc";
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  getOrderTransitionContext: (params: { orderId: string }) => Promise<{
    orderId: string;
    orderNumber: number;
    orderCode: string;
    status: string;
    paymentMethod: string;
    pickupBranchId: string | null;
  } | null>;
  getAdminOrder: (params: {
    orderId: string;
    actorRole?: string;
    actorBranchId?: string | null;
  }) => Promise<Record<string, unknown> | null>;
  listCustomerOrders: (params: {
    userId: string;
    page: number;
    pageSize: number;
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  getCustomerOrder: (params: {
    userId: string;
    orderId: string;
  }) => Promise<Record<string, unknown> | null>;
  transitionOrderStatus: (params: {
    orderId: string;
    fromStatus: string;
    toStatus: string;
    actorUserId: string | null;
    actorRole?: string;
    actorBranchId?: string | null;
    actorDisplayName?: string | null;
    reason: string | null;
    adminMessage: string | null;
    source: "admin" | "system";
  }) => Promise<{
    orderId: string;
    orderNumber: number;
    orderCode: string;
    fromStatus: string | null;
    toStatus: string;
    customerEmail: string | null;
    customerEmailLocale: "ES_MX" | "EN_US" | null;
    customerId: string | null;
  }>;
  createRefund: (params: {
    orderId: string;
    orderItemId: string | null;
    amount: number;
    refundMethod: "CASH" | "CARD" | "STORE_CREDIT" | "TRANSFER" | "OTHER";
    adminId: string | null;
    actorRole?: string;
    actorBranchId?: string | null;
    actorDisplayName?: string | null;
    adminMessage: string;
  }) => Promise<Record<string, unknown>>;
  expirePendingOrders: () => Promise<Array<{
    orderId: string;
    orderNumber: number;
    orderCode: string;
    fromStatus: string | null;
    toStatus: string;
    customerEmail: string | null;
    customerEmailLocale: "ES_MX" | "EN_US" | null;
    customerId: string | null;
  }>>;
};

export type BranchRepository = {
  listBranches: () => Promise<Array<Record<string, unknown>>>;
  createBranch: (data: {
    name: string;
    address: string;
    city: string;
    googleMapsUrl?: string | null;
    imageUrl?: string | null;
  }) => Promise<Record<string, unknown>>;
  updateBranch: (id: string, data: {
    name?: string;
    address?: string;
    city?: string;
    googleMapsUrl?: string | null;
    imageUrl?: string | null;
  }) => Promise<Record<string, unknown> | null>;
  deleteBranch: (id: string) => Promise<Record<string, unknown> | null>;
};

export type BlogRepository = {
  listAdminPosts: (params: {
    locale?: string;
    page: number;
    pageSize: number;
    query?: string;
    isPublished?: boolean;
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  getAdminPostById: (id: string) => Promise<Record<string, unknown> | null>;
  createPost: (payload: {
    slug: string;
    locale: string;
    title: string;
    excerpt: string;
    contentJson: Record<string, unknown>;
    coverImageUrl: string | null;
    authorName: string;
    readingTimeMinutes: number;
    seoTitle: string;
    seoDescription: string;
  }) => Promise<Record<string, unknown>>;
  updatePost: (id: string, payload: {
    slug?: string;
    locale?: string;
    title?: string;
    excerpt?: string;
    contentJson?: Record<string, unknown>;
    coverImageUrl?: string | null;
    authorName?: string;
    readingTimeMinutes?: number;
    seoTitle?: string;
    seoDescription?: string;
  }) => Promise<Record<string, unknown>>;
  publishPost: (id: string) => Promise<Record<string, unknown>>;
  unpublishPost: (id: string) => Promise<Record<string, unknown>>;
  deletePost: (
    id: string,
    options: { deletedByAdminName: string }
  ) => Promise<Record<string, unknown>>;
  listPublicPosts: (params: {
    locale: string;
    page: number;
    pageSize: number;
  }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  getPublicPostBySlug: (params: {
    locale: string;
    slug: string;
  }) => Promise<Record<string, unknown> | null>;
  listPublishedPostsForFeed: (locale: string) => Promise<Array<Record<string, unknown>>>;
};

export type SyncRepository = {
  recordEvents: (events: any[]) => Promise<{ accepted: string[]; duplicates: string[] }>;
  getPendingEvents: (posId: string, since: string | null) => Promise<any[]>;
  acknowledgeEvents: (posId: string, eventIds: string[]) => Promise<void>;
  createOrder: (orderId: string, items: any[], branchId: string) => Promise<{ duplicate: boolean }>;
  getCatalogSnapshot: (params: {
    branchId: string;
    page: number;
    pageSize: number;
  }) => Promise<{ items: any[]; total: number; snapshotVersion: string; appliedAt: string }>;
  getCatalogDelta: (params: {
    branchId: string;
    since: string | null;
    page: number;
    pageSize: number;
  }) => Promise<{ items: any[]; total: number; snapshotVersion: string; appliedAt: string }>;
  reconcileCatalog: (params: {
    branchId: string;
    manifest: Array<{
      entityType: string;
      cloudId: string;
      localId: string | null;
      updatedAt: string | null;
      versionHash: string | null;
    }>;
  }) => Promise<{
    missing: any[];
    stale: any[];
    unknown: any[];
    snapshotVersion: string;
  }>;
  ingestSalesEvent: (params: {
    terminalId: string;
    branchId: string;
    localEventId: string;
    eventType: string;
    payload: Record<string, unknown>;
  }) => Promise<{ duplicate: boolean }>;
  readProducts: (params: {
    page: number;
    pageSize: number;
    id: string | null;
    gameId?: string | "misc" | null;
    categoryId?: string | null;
    expansionId?: string | null;
    priceMin?: number | null;
    priceMax?: number | null;
  }) => Promise<{ items: any[]; total: number }>;
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
  updatePin: (userId: string, pin: string) => Promise<void>;
};

export type UsersRepository = {
  listUsers: (page: number, pageSize: number) => Promise<{ items: any[]; total: number }>;
  getUserById: (id: string) => Promise<Record<string, unknown> | null>;
  createUser: (data: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    branchId?: string | null;
    pin?: string | null;
    birthDate?: Date | null;
    role?: "CUSTOMER" | "ADMIN" | "EMPLOYEE";
    status?: "ACTIVE" | "DISABLED";
  }) => Promise<Record<string, unknown>>;
  updateUser: (id: string, data: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    branchId?: string | null;
    pin?: string | null;
    birthDate?: Date | null;
    role?: "CUSTOMER" | "ADMIN" | "EMPLOYEE";
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
