/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Customer {
  _id: string;
  name: string;
  address: string;
  phone: string;
  contactPersonName: string;
  email: string;
  deliveryaddress: string;
  referenceNumber: string;
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
  taxableValue(taxableValue: any): unknown;
  totalVat(totalVat: any): unknown;
  authorisedSignatoryName: any;
  customerSignatoryName: any;
  _id: string;
  customer: Customer;
  invoiceNumber: string;
  manualInvoiceNumber?: string;
  invoiceDate: string;    
  supplyDate: string;      
  items: InvoiceItem[];
  totalAmount: number;
  createdAt: string;       
  __v: number;
}
