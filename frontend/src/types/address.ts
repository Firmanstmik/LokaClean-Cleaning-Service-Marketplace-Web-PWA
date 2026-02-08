export interface SavedAddress {
  id: number;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  is_primary: boolean;
  notes?: string;
  floor_number?: string;
  building_name?: string;
  gate_photo_url?: string;
}

export interface AddressFormData {
  label: string;
  address: string;
  lat: number;
  lng: number;
  is_primary: boolean;
  notes?: string;
  floor_number?: string;
  building_name?: string;
  gate_photo_url?: string;
}
