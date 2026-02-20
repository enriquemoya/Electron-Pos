export type Category = {
  id: string;
  cloudId: string;
  name: string;
  active: boolean;
  enabledPOS: boolean;
  enabledOnlineStore: boolean;
  isDeletedCloud: boolean;
  createdAt: string;
  updatedAt: string;
  cloudUpdatedAt: string | null;
};
