export type Business = {
  id: string; owner_id: string; name: string; owner_name: string; sector: string; city: string;
  currency: string; timezone: string;
  phone?: string; address?: string; tax_id?: string; receipt_footer?: string; logo_path?: string | null;
  target_margin?: number; min_margin?: number; cash_opening_balance?: number | null; cash_opening_date?: string | null;
};
export type Product = {
  id: string; business_id: string; name: string; category: string; sku: string; currency: string;
  purchase_price: number; transport_cost: number; packaging_cost: number; delivery_cost: number;
  transaction_fee: number; other_cost: number; unit_cost: number; sale_price: number;
  stock_quantity: number; low_stock_threshold: number; archived: boolean;
};
export type Sale = {
  id: string; business_id: string; product_id: string | null; item_name: string; quantity: number;
  unit_price: number; total: number; currency: string; sale_date: string; customer_name: string;
  payment_method: string; amount_paid: number; status: "paid" | "partial" | "pending"; note: string;
  receipt_number?: number; receipt_token?: string; customer_id?: string | null;
};
export type Payment = { id: string; sale_id: string; amount: number; currency: string; paid_on: string; method: string };
export type ExpenseCategory = { id: string; business_id: string | null; code: string | null; name: string };
export type Expense = {
  id: string; business_id: string; name: string; category_id: string; amount: number; currency: string;
  expense_date: string; payment_method: string; receipt_path: string | null; note: string;
  expense_categories?: { code: string | null; name: string } | null;
};
export type Entitlements = {
  plan: "free" | "standard" | "premium" | "business";
  role?: Role;
  features: string[];
  limits: Record<string, number | undefined>;
  ai_enabled?: boolean;
  usage: { sales_month: number; expenses_month: number; products: number };
};
export const PAYMENT_METHODS = ["cash", "mobile_money", "card", "bank_transfer", "check", "other"] as const;
export type Role = "owner" | "manager" | "staff";
