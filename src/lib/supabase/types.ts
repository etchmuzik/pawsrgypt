export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          phone: string | null;
          city: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["branches"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "manager" | "cashier" | "warehouse" | "accountant" | "hr";
          branch_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          name_en: string;
          name_ar: string;
          parent_id: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name_en: string;
          name_ar: string;
          description_en: string | null;
          description_ar: string | null;
          category_id: string | null;
          brand: string | null;
          unit_type: string;
          barcode: string | null;
          images: string[];
          tags: string[];
          is_active: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string | null;
          color: string | null;
          weight: number | null;
          price: number;
          cost_price: number;
          barcode: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_variants"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
      };
      warehouses: {
        Row: {
          id: string;
          name: string;
          branch_id: string;
          manager_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["warehouses"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["warehouses"]["Insert"]>;
      };
      stock: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          warehouse_id: string;
          quantity: number;
          min_quantity: number;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["stock"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["stock"]["Insert"]>;
      };
      stock_movements: {
        Row: {
          id: string;
          type: "in" | "out" | "transfer" | "adjustment" | "assembly";
          product_id: string;
          variant_id: string | null;
          quantity: number;
          from_warehouse_id: string | null;
          to_warehouse_id: string | null;
          reference_type: string | null;
          reference_id: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["stock_movements"]["Row"], "id" | "created_at">;
        Update: never;
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          tax_id: string | null;
          balance: number;
          notes: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["suppliers"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Insert"]>;
      };
      purchase_orders: {
        Row: {
          id: string;
          supplier_id: string;
          branch_id: string;
          status: "draft" | "ordered" | "received" | "cancelled";
          subtotal: number;
          tax_amount: number;
          /**
           * GENERATED ALWAYS column in the live DB (mirrors tax_amount).
           * Read-only — never include in an insert/update. Write tax_amount instead.
           */
          tax: number | null;
          discount: number;
          total: number;
          notes: string | null;
          ordered_at: string | null;
          received_at: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["purchase_orders"]["Row"], "id" | "created_at" | "tax">;
        Update: Partial<Database["public"]["Tables"]["purchase_orders"]["Insert"]>;
      };
      purchase_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          unit_cost: number;
          total: number;
        };
        Insert: Omit<Database["public"]["Tables"]["purchase_items"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["purchase_items"]["Insert"]>;
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          credit_limit: number;
          balance: number;
          notes: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          type: "sale" | "quote" | "return";
          customer_id: string | null;
          branch_id: string;
          sales_rep_id: string | null;
          status: "draft" | "confirmed" | "paid" | "partial" | "cancelled";
          subtotal: number;
          tax_amount: number;
          /**
           * GENERATED ALWAYS column in the live DB (mirrors tax_amount).
           * Read-only — never include in an insert/update. Write tax_amount instead.
           */
          tax: number | null;
          discount: number;
          total: number;
          paid: number;
          due_date: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["invoices"]["Row"], "id" | "invoice_number" | "created_at" | "updated_at" | "tax">;
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price: number;
          discount: number;
          total: number;
        };
        Insert: Omit<Database["public"]["Tables"]["invoice_items"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          amount: number;
          method: "cash" | "card" | "transfer" | "check";
          reference: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at">;
        Update: never;
      };
      employees: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          phone: string | null;
          email: string | null;
          department: string | null;
          position: string | null;
          hire_date: string;
          salary_base: number;
          branch_id: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["employees"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["employees"]["Insert"]>;
      };
      grooming_bookings: {
        Row: {
          id: string;
          customer_name: string;
          phone: string;
          pet_name: string;
          pet_type: string;
          service: string;
          preferred_date: string;
          notes: string | null;
          status: "pending" | "confirmed" | "completed" | "cancelled";
          branch_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["grooming_bookings"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["grooming_bookings"]["Insert"]>;
      };
      website_orders: {
        Row: {
          id: string;
          order_number: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string | null;
          shipping_address: Json;
          items: Json;
          subtotal: number;
          shipping: number;
          total: number;
          status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["website_orders"]["Row"], "id" | "order_number" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["website_orders"]["Insert"]>;
      };
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title_en: string;
          title_ar: string | null;
          excerpt_en: string | null;
          excerpt_ar: string | null;
          content_en: string;
          content_ar: string | null;
          featured_image: string | null;
          author: string;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["blog_posts"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["blog_posts"]["Insert"]>;
      };
      system_settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          branch_id: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["system_settings"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["system_settings"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience type aliases
export type Branch = Database["public"]["Tables"]["branches"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type Warehouse = Database["public"]["Tables"]["warehouses"]["Row"];
export type Stock = Database["public"]["Tables"]["stock"]["Row"];
export type StockMovement = Database["public"]["Tables"]["stock_movements"]["Row"];
export type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
export type PurchaseOrder = Database["public"]["Tables"]["purchase_orders"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Employee = Database["public"]["Tables"]["employees"]["Row"];
export type GroomingBooking = Database["public"]["Tables"]["grooming_bookings"]["Row"];
export type WebsiteOrder = Database["public"]["Tables"]["website_orders"]["Row"];
export type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
export type SystemSettings = Database["public"]["Tables"]["system_settings"]["Row"];
