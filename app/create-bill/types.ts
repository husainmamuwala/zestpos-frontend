export type ProductFromApi = {
  _id?: string;
  id?: string | number;
  name: string;
  originalPrice?: number;
  price?: number;
  vat?: number;
};

export type Customer = {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
};

export type Item = {
  id: number;
  name: string;
  original: number;
  lastSold?: number;
  price: number;
  qty: number;
  vat: number;
};
