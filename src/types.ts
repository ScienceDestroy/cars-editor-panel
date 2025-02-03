export interface Vehicle {
  model: string;
  name: string;
  brand: string;
  price: number;
  categoryLabel: string;
  shop: string | string[];
}

export interface VehicleFile {
  vehicles: Vehicle[];
}