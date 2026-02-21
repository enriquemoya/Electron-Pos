import { ApiErrors } from "../errors/api-error";
import { assertAllowedMediaCdnUrl } from "./media-source";

const AVAILABILITY_VALUES = ["in_stock", "low_stock", "out_of_stock", "pending_sync", "unknown"];

const ALLOWED_GOOGLE_MAP_HOSTS = new Set(["maps.google.com", "maps.app.goo.gl", "www.google.com"]);

function validateGoogleMapsUrl(value: unknown, { required }: { required: boolean }) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    if (required) {
      throw ApiErrors.branchInvalidMapUrl;
    }
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw ApiErrors.branchInvalidMapUrl;
  }

  if (parsed.protocol !== "https:") {
    throw ApiErrors.branchInvalidMapUrl;
  }
  if (!ALLOWED_GOOGLE_MAP_HOSTS.has(parsed.hostname)) {
    throw ApiErrors.branchInvalidMapUrl;
  }
  if (parsed.hostname === "www.google.com" && !parsed.pathname.startsWith("/maps")) {
    throw ApiErrors.branchInvalidMapUrl;
  }

  return parsed.toString();
}

export type DraftItemPayload = {
  productId?: unknown;
  quantity?: unknown;
  priceSnapshot?: unknown;
  availabilitySnapshot?: unknown;
};

export function validateDraftItems(payload: unknown) {
  const items = (payload as { items?: unknown })?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiErrors.checkoutInvalid;
  }

  return items.map((item) => {
    const productId = String((item as DraftItemPayload)?.productId ?? "").trim();
    const quantity = Number((item as DraftItemPayload)?.quantity ?? 0);
    const priceSnapshotRaw = (item as DraftItemPayload)?.priceSnapshot;
    const availabilitySnapshotRaw = (item as DraftItemPayload)?.availabilitySnapshot;

    if (!productId || !Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
      throw ApiErrors.checkoutInvalid;
    }

    const priceSnapshot =
      priceSnapshotRaw === null || priceSnapshotRaw === undefined || priceSnapshotRaw === ""
        ? null
        : Number(priceSnapshotRaw);

    if (priceSnapshot !== null && (!Number.isFinite(priceSnapshot) || Number.isNaN(priceSnapshot))) {
      throw ApiErrors.checkoutInvalid;
    }

    const availabilitySnapshot =
      availabilitySnapshotRaw === null || availabilitySnapshotRaw === undefined
        ? null
        : String(availabilitySnapshotRaw).trim();

    if (availabilitySnapshot && !AVAILABILITY_VALUES.includes(availabilitySnapshot)) {
      throw ApiErrors.checkoutInvalid;
    }

    return {
      productId,
      quantity,
      priceSnapshot,
      availabilitySnapshot
    };
  });
}

export function validateRevalidateItems(payload: unknown) {
  const items = (payload as { items?: unknown })?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiErrors.checkoutInvalid;
  }

  return items.map((item) => {
    const productId = String((item as DraftItemPayload)?.productId ?? "").trim();
    const quantity = Number((item as DraftItemPayload)?.quantity ?? 0);

    if (!productId || !Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
      throw ApiErrors.checkoutInvalid;
    }

    return { productId, quantity };
  });
}

export function validateCheckoutOrder(payload: unknown) {
  const draftId = String((payload as { draftId?: unknown })?.draftId ?? "").trim();
  const paymentMethod = String((payload as { paymentMethod?: unknown })?.paymentMethod ?? "").trim();
  const pickupBranchIdRaw = (payload as { pickupBranchId?: unknown })?.pickupBranchId;
  const pickupBranchId =
    pickupBranchIdRaw === null || pickupBranchIdRaw === undefined || pickupBranchIdRaw === ""
      ? null
      : String(pickupBranchIdRaw).trim();

  const allowedMethods = new Set(["PAY_IN_STORE", "BANK_TRANSFER"]);
  if (!draftId || !allowedMethods.has(paymentMethod)) {
    throw ApiErrors.checkoutInvalid;
  }

  return {
    draftId,
    paymentMethod: paymentMethod as "PAY_IN_STORE" | "BANK_TRANSFER",
    pickupBranchId
  };
}

export function validateBranchCreate(payload: unknown) {
  const name = String((payload as { name?: unknown })?.name ?? "").trim();
  const address = String((payload as { address?: unknown })?.address ?? "").trim();
  const city = String((payload as { city?: unknown })?.city ?? "").trim();
  const googleMapsUrl = validateGoogleMapsUrl((payload as { googleMapsUrl?: unknown })?.googleMapsUrl, { required: false });
  const imageUrlRaw = (payload as { imageUrl?: unknown })?.imageUrl;
  const imageUrl = imageUrlRaw === undefined || imageUrlRaw === null || imageUrlRaw === ""
    ? null
    : String(imageUrlRaw).trim();

  if (!name || !address || !city) {
    throw ApiErrors.checkoutInvalid;
  }
  if (imageUrl) {
    assertAllowedMediaCdnUrl(imageUrl);
  }

  return { name, address, city, googleMapsUrl, imageUrl };
}

export function validateBranchUpdate(payload: unknown) {
  const nameRaw = (payload as { name?: unknown })?.name;
  const addressRaw = (payload as { address?: unknown })?.address;
  const cityRaw = (payload as { city?: unknown })?.city;
  const googleMapsUrlRaw = (payload as { googleMapsUrl?: unknown })?.googleMapsUrl;
  const imageUrlRaw = (payload as { imageUrl?: unknown })?.imageUrl;

  const data = {
    name: nameRaw === undefined ? undefined : String(nameRaw ?? "").trim(),
    address: addressRaw === undefined ? undefined : String(addressRaw ?? "").trim(),
    city: cityRaw === undefined ? undefined : String(cityRaw ?? "").trim(),
    googleMapsUrl:
      googleMapsUrlRaw === undefined
        ? undefined
        : validateGoogleMapsUrl(googleMapsUrlRaw, { required: false }),
    imageUrl:
      imageUrlRaw === undefined
        ? undefined
        : imageUrlRaw === null || imageUrlRaw === ""
          ? null
          : String(imageUrlRaw).trim()
  };

  const hasAny = Object.values(data).some((value) => value !== undefined);
  if (!hasAny) {
    throw ApiErrors.checkoutInvalid;
  }

  if (data.name !== undefined && !data.name) {
    throw ApiErrors.checkoutInvalid;
  }
  if (data.address !== undefined && !data.address) {
    throw ApiErrors.checkoutInvalid;
  }
  if (data.city !== undefined && !data.city) {
    throw ApiErrors.checkoutInvalid;
  }
  if (data.imageUrl) {
    assertAllowedMediaCdnUrl(data.imageUrl);
  }

  return data;
}
