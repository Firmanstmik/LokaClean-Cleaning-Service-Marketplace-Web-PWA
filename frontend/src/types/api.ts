/**
 * TypeScript types matching the backend ERD models and API responses.
 *
 * These are intentionally simple and mirror the Prisma models/REST outputs.
 */

export type Role = "USER" | "ADMIN";

export type OrderStatus = "PENDING" | "PROCESSING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type PaymentMethod = "QRIS" | "DANA" | "TRANSFER" | "CASH";
export type PaymentStatus = "PENDING" | "PAID";

export type User = {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  profile_photo: string | null;
  default_latitude: number | null;
  default_longitude: number | null;
  role: "USER";
  created_at: string;
  updated_at: string;
};

export type Admin = {
  id: number;
  full_name: string;
  email: string;
  role: "ADMIN";
  created_at: string;
};

export type PaketCleaning = {
  id: number;
  name: string;
  name_en?: string | null;
  description: string;
  description_en?: string | null;
  price: number;
  estimated_duration: number;
  image?: string | null; // Optional image path for package
  category: "SERVICE" | "PRODUCT";
  stock: number;
  created_at: string;
  updated_at: string;
  averageRating?: number | null; // Average rating (1-5), null if no ratings yet
  totalReviews?: number; // Total number of reviews
};

export type Pembayaran = {
  id: number;
  pesanan_id: number;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  created_at: string;
};

export type Rating = {
  id: number;
  pesanan_id: number;
  rating_value: number;
  review: string | null;
  created_at: string;
};

export type Tip = {
  id: number;
  pesanan_id: number;
  amount: number;
  created_at: string;
};

export type Notification = {
  id: number;
  user_id: number;
  pesanan_id: number | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  pesanan?: {
    id: number;
    status: string;
    paket: {
      name: string;
    };
    rating?: {
      id: number;
      rating_value: number;
      review: string | null;
    } | null;
  } | null;
};

export type Pesanan = {
  id: number;
  order_number: number; // Sequential order number (1, 2, 3, ...) - stays consistent even if orders are deleted
  user_id: number;
  admin_id: number | null;
  paket_id: number;
  status: OrderStatus;
  room_photo_before: string;
  room_photo_after: string | null;
  location_latitude: number;
  location_longitude: number;
  address: string;
  scheduled_date: string;
  created_at: string;
  updated_at: string;

  user: User;
  admin: Admin | null;
  paket: PaketCleaning;
  pembayaran: Omit<Pembayaran, "pesanan_id">;
  rating: Rating | null;
  tip: Tip | null;
};


