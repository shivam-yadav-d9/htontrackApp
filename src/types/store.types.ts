export type StoreStatus = 'active' | 'inactive';

export type Store = {
  id: string;
  store_code: string;
  store_name: string;

  city?: string;
  state?: string;
  region?: string;
  address?: string;
  phone?: string;

  manager_id?: string;
  manager_name?: string;
  manager_email?: string;

  team_size?: number;
  status?: StoreStatus;

  created_at?: string;
  updated_at?: string;
};
