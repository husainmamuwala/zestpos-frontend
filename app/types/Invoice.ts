export interface Customer {
  _id: string;
  name: string;
  address: string;
  phone: string;
  contactPersonName: string;
  email: string;
  deliveryaddress: string;
  __v: number;
}

export interface InvoiceItem {
  _id: string;
  itemName: string;
  price: number;
  qty: number;
  vat: number;
  finalAmount: number;
}

export interface Invoice {
  _id: string;
  customer: Customer;
  invoiceNumber: string;
  invoiceDate: string;    
  supplyDate: string;      
  items: InvoiceItem[];
  totalAmount: number;
  createdAt: string;       
  __v: number;
}
