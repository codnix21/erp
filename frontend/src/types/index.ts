export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyId?: string;
  roles?: string[];
}

export interface Company {
  id: string;
  name: string;
  inn?: string;
  address?: string;
  defaultCurrency: string;
  taxRate: number;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  categoryId?: string;
  unit: string;
  price: number;
  currency: string;
  taxRate: number;
  isService: boolean;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export type OrderStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  taxRate: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customer?: Customer;
  supplierId?: string;
  supplier?: Supplier;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  notes?: string;
  dueDate?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';
  totalAmount: number;
  paidAmount: number;
  currency: string;
  taxAmount: number;
  dueDate?: string;
  issuedDate?: string;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'ELECTRONIC' | 'OTHER';
  paymentDate: string;
  reference?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

