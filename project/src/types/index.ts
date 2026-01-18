export interface User {
  id: string;
  email: string;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  user_id?: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TableType {
  id: string;
  name: string;
  capacity_min: number;
  capacity_max: number;
  price_per_hour: number;
}

export interface Reservation {
  id?: string;
  user_id: string;
  table_type_id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  num_people: number;
  total_price: number;
  status: string;
  created_at?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

export interface FoodOrder {
  id?: string;
  user_id: string;
  reservation_id?: string;
  order_type: 'enligne' | 'sur_place';
  total_price: number;
  status: string;
  delivery_address?: string;
  created_at?: string;
}

export interface FoodOrderItem {
  id?: string;
  food_order_id: string;
  food_item_id: string;
  quantity: number;
  unit_price: number;
}
