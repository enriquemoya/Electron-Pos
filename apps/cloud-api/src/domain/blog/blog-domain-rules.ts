import { ApiErrors } from "../../errors/api-error";

export type BlogState = {
  id: string;
  slug: string;
  isDeleted: boolean;
  isPublished: boolean;
};

type BlogUpdatePayload = {
  slug?: string;
};

export function assertCanUpdate(state: BlogState, payload: BlogUpdatePayload) {
  if (state.isDeleted) {
    throw ApiErrors.blogInvalidState;
  }
  if (state.isPublished && payload.slug && payload.slug !== state.slug) {
    throw ApiErrors.blogInvalidState;
  }
}

export function assertCanPublish(state: BlogState) {
  if (state.isDeleted) {
    throw ApiErrors.blogInvalidState;
  }
  if (state.isPublished) {
    throw ApiErrors.blogInvalidState;
  }
}

export function assertCanUnpublish(state: BlogState) {
  if (state.isDeleted) {
    throw ApiErrors.blogInvalidState;
  }
  if (!state.isPublished) {
    throw ApiErrors.blogInvalidState;
  }
}

export function assertCanDelete(state: BlogState) {
  if (state.isDeleted) {
    throw ApiErrors.blogInvalidState;
  }
}
