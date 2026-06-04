export type ApiMessageResponse = {
  message: string;
};

export type ApiStatusResponse = {
  status: string;
  message?: string;
};

export type ApiErrorResponse = {
  detail?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
};

export type IdParam = {
  id: string;
};
