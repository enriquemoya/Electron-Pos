export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const ApiErrors = {
  unauthorized: new ApiError(401, "UNAUTHORIZED", "unauthorized"),
  serverError: new ApiError(500, "SERVER_ERROR", "server error"),
  invalidRequest: new ApiError(400, "INVALID_REQUEST", "invalid request"),
  catalogFiltersInvalid: new ApiError(400, "CATALOG_FILTERS_INVALID", "catalog filters invalid"),
  eventsRequired: new ApiError(400, "EVENTS_REQUIRED", "events required"),
  posIdRequired: new ApiError(400, "POS_ID_REQUIRED", "posId required"),
  posAckRequired: new ApiError(400, "POS_ACK_REQUIRED", "posId and eventIds required"),
  orderRequired: new ApiError(400, "ORDER_REQUIRED", "orderId and items required"),
  invalidPagination: new ApiError(400, "INVALID_PAGINATION", "invalid pagination"),
  adminPaginationInvalid: new ApiError(400, "ADMIN_PAGINATION_INVALID", "pagination invalid"),
  emailRequired: new ApiError(400, "EMAIL_REQUIRED", "email required"),
  phoneRequired: new ApiError(400, "PHONE_REQUIRED", "phone required"),
  emailOrPhoneRequired: new ApiError(400, "EMAIL_OR_PHONE_REQUIRED", "email or phone required"),
  emailInvalid: new ApiError(400, "EMAIL_INVALID", "email invalid"),
  phoneInvalid: new ApiError(400, "PHONE_INVALID", "phone invalid"),
  roleInvalid: new ApiError(400, "ROLE_INVALID", "role invalid"),
  statusInvalid: new ApiError(400, "STATUS_INVALID", "status invalid"),
  emailExists: new ApiError(400, "EMAIL_EXISTS", "email already exists"),
  phoneExists: new ApiError(400, "PHONE_EXISTS", "phone already exists"),
  userNotFound: new ApiError(404, "USER_NOT_FOUND", "user not found"),
  addressNotFound: new ApiError(404, "ADDRESS_NOT_FOUND", "address not found"),
  addressInvalid: new ApiError(400, "ADDRESS_INVALID", "address invalid"),
  inventoryNotFound: new ApiError(404, "INVENTORY_NOT_FOUND", "inventory item not found"),
  inventoryInvalid: new ApiError(400, "INVENTORY_INVALID", "inventory adjustment invalid"),
  taxonomyNotFound: new ApiError(404, "TAXONOMY_NOT_FOUND", "taxonomy not found"),
  taxonomyInvalid: new ApiError(400, "TAXONOMY_INVALID", "taxonomy invalid"),
  productNotFound: new ApiError(404, "PRODUCT_NOT_FOUND", "product not found"),
  productInvalid: new ApiError(400, "PRODUCT_INVALID", "product invalid"),
  productSlugExists: new ApiError(400, "PRODUCT_SLUG_EXISTS", "product slug exists"),
  checkoutInvalid: new ApiError(400, "CHECKOUT_INVALID", "checkout invalid"),
  checkoutDraftEmpty: new ApiError(400, "CHECKOUT_DRAFT_EMPTY", "checkout draft empty"),
  checkoutDraftInactive: new ApiError(400, "CHECKOUT_DRAFT_INACTIVE", "checkout draft inactive"),
  checkoutInventoryInsufficient: new ApiError(400, "CHECKOUT_INVENTORY_INSUFFICIENT", "checkout inventory insufficient"),
  checkoutDraftNotFound: new ApiError(404, "CHECKOUT_DRAFT_NOT_FOUND", "checkout draft not found"),
  checkoutOrderNotFound: new ApiError(404, "CHECKOUT_ORDER_NOT_FOUND", "checkout order not found"),
  orderStatusInvalid: new ApiError(400, "ORDER_STATUS_INVALID", "order status invalid"),
  orderTransitionInvalid: new ApiError(400, "ORDER_TRANSITION_INVALID", "order transition invalid"),
  orderTransitionReasonRequired: new ApiError(400, "ORDER_TRANSITION_REASON_REQUIRED", "order transition reason required"),
  paymentOverpayNotAllowed: new ApiError(400, "PAYMENT_OVERPAY_NOT_ALLOWED", "payment overpay not allowed"),
  refundInvalidAmount: new ApiError(400, "REFUND_INVALID_AMOUNT", "refund invalid amount"),
  refundNotAllowedForStatus: new ApiError(400, "REFUND_NOT_ALLOWED_FOR_STATUS", "refund not allowed for status"),
  refundItemNotFound: new ApiError(400, "REFUND_ITEM_NOT_FOUND", "refund item not found"),
  refundMessageRequired: new ApiError(400, "REFUND_MESSAGE_REQUIRED", "refund message required"),
  mediaInvalidType: new ApiError(400, "MEDIA_INVALID_TYPE", "media invalid type"),
  mediaTooLarge: new ApiError(400, "MEDIA_TOO_LARGE", "media too large"),
  mediaFolderNotAllowed: new ApiError(400, "MEDIA_FOLDER_NOT_ALLOWED", "media folder not allowed"),
  mediaProcessingFailed: new ApiError(400, "MEDIA_PROCESSING_FAILED", "media processing failed"),
  mediaUploadFailed: new ApiError(500, "MEDIA_UPLOAD_FAILED", "media upload failed"),
  mediaUnauthorized: new ApiError(401, "MEDIA_UNAUTHORIZED", "media unauthorized"),
  blogInvalidPayload: new ApiError(400, "BLOG_INVALID_PAYLOAD", "blog invalid payload"),
  blogNotFound: new ApiError(404, "BLOG_NOT_FOUND", "blog not found"),
  blogSlugConflict: new ApiError(409, "BLOG_SLUG_CONFLICT", "blog slug conflict"),
  blogUnauthorized: new ApiError(401, "BLOG_UNAUTHORIZED", "blog unauthorized"),
  blogInvalidContent: new ApiError(400, "BLOG_INVALID_CONTENT", "blog invalid content"),
  blogInvalidState: new ApiError(400, "BLOG_INVALID_STATE", "blog invalid state"),
  blogTooLarge: new ApiError(400, "BLOG_TOO_LARGE", "blog too large"),
  blogRateLimited: new ApiError(429, "BLOG_RATE_LIMITED", "blog rate limited"),
  blogMediaInvalidHost: new ApiError(400, "BLOG_MEDIA_INVALID_HOST", "blog media invalid host"),
  blogMediaNotAllowed: new ApiError(400, "BLOG_MEDIA_NOT_ALLOWED", "blog media not allowed"),
  blogInternalError: new ApiError(500, "BLOG_INTERNAL_ERROR", "blog internal error"),
  orderTransferApprovalRequired: new ApiError(
    400,
    "ORDER_TRANSFER_APPROVAL_REQUIRED",
    "transfer approval message required"
  ),
  orderForbidden: new ApiError(403, "ORDER_FORBIDDEN", "order forbidden"),
  branchNotFound: new ApiError(404, "BRANCH_NOT_FOUND", "branch not found")
};

export function asApiError(error: unknown, fallback: ApiError): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  return fallback;
}
