import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    username: v.optional(v.string()),
    full_name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("technician"))),
    is_active: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("username", ["username"]),

  customers: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
  }).index("by_phone", ["phone"]),

  repair_orders: defineTable({
    ticket_number: v.string(), // RO-YYYY-NNNNN
    barcode_value: v.string(), // UUID
    customer_id: v.id("customers"),
    status: v.union(
      v.literal("intake"),
      v.literal("diagnosing"),
      v.literal("in_repair"),
      v.literal("waiting_parts"),
      v.literal("completed"),
      v.literal("picked_up"),
      v.literal("cancelled")
    ),
    created_by_user_id: v.id("users"),
    last_updated_by_user_id: v.id("users"),
    estimated_completion_at: v.optional(v.number()), // timestamp
    urgency: v.optional(v.union(v.literal("Normal"), v.literal("Rush"))),
  })
    .index("by_ticket_number", ["ticket_number"])
    .index("by_barcode_value", ["barcode_value"])
    .index("by_status", ["status"])
    .index("by_customer_id", ["customer_id"]),

  devices: defineTable({
    repair_order_id: v.id("repair_orders"),
    device_type: v.string(),
    brand: v.string(),
    model: v.string(),
    serial_number: v.optional(v.string()),
    condition_notes: v.optional(v.string()),
    reported_issue: v.string(),
    accessories_left: v.array(v.string()),
  }).index("by_repair_order_id", ["repair_order_id"]),

  repair_details: defineTable({
    repair_order_id: v.id("repair_orders"),
    diagnosis: v.optional(v.string()),
    work_performed: v.optional(v.string()),
    parts_used: v.array(
      v.object({
        name: v.string(),
        qty: v.number(),
        unit_cost: v.number(), // cents
      })
    ),
    labor_hours: v.optional(v.number()),
    parts_cost: v.number(), // cents
    labor_cost: v.number(), // cents
    total_cost: v.number(), // cents
    warranty_days: v.optional(v.number()),
    technician_notes: v.optional(v.string()),
    completed_at: v.optional(v.number()), // timestamp
    completed_by_user_id: v.optional(v.id("users")),
    deposit_amount: v.number(), // cents
    deposit_method: v.optional(v.string()),
  }).index("by_repair_order_id", ["repair_order_id"]),

  audit_log: defineTable({
    user_id: v.id("users"),
    action: v.string(),
    table_name: v.string(),
    record_id: v.string(),
    changes: v.optional(v.string()), // JSON string
  }),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});
