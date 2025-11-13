export type DriverListRow = {
  id: string;
  name: string;
  phone: string;
  suburb: string | null;
  city: string | null;
  vehicle: string | null;
  isActive: boolean;
};

export type DriverListResponse = {
  items: DriverListRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type SupplierListRow = {
  id: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  isActive: boolean;
};

export type SupplierListResponse = {
  items: SupplierListRow[];
  total: number;
  page: number;
  pageSize: number;
};
