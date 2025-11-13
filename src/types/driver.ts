export type DriverProfile = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  suburb: string | null;
  city: string | null;
  vehicle: string | null;
  isActive: boolean;
  rating: number | null;
  notes: string | null;
  createdAt: Date | string;
  lastLocationLat: number | null;
  lastLocationLng: number | null;
  lastLocationAccuracy: number | null;
  lastLocationAt: Date | string | null;
};
