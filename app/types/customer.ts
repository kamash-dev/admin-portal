export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  _count: {
    orders: number;
  };
}

export interface CustomersResponse {
  success: boolean;
  totalCustomers: number;
  data: Customer[];
}
