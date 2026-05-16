import * as XLSX from "xlsx";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface OrderExportItem {
  product_name: string;
  product_sku?: string | null;
  warehouse_name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

export interface OrderExportInput {
  number: string;
  customer: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  total: number;
  invoice_grouping: "single" | "per_warehouse";
  items: OrderExportItem[];
}

/**
 * Build .xlsx for an order, upload to `order-docs` bucket and return a signed URL.
 * Returns null on any failure (caller should keep going — email link is best-effort).
 */
export async function buildAndUploadOrderXlsx(
  input: OrderExportInput,
): Promise<{ url: string; path: string } | null> {
  try {
    const wb = XLSX.utils.book_new();

    // Header sheet
    const header: (string | number)[][] = [
      ["Заявка №", input.number],
      ["Клиент", input.customer],
      ["Телефон", input.phone ?? ""],
      ["Email", input.email ?? ""],
      ["Группировка счёта", input.invoice_grouping === "single" ? "Один счёт" : "По складам"],
      ["Комментарий", input.notes ?? ""],
      ["Итого, ₽", input.total],
      [],
    ];

    // Group items by warehouse if requested
    const groups = new Map<string, OrderExportItem[]>();
    if (input.invoice_grouping === "per_warehouse") {
      for (const it of input.items) {
        const arr = groups.get(it.warehouse_name) ?? [];
        arr.push(it);
        groups.set(it.warehouse_name, arr);
      }
    } else {
      groups.set("Все позиции", input.items);
    }

    const rows: (string | number)[][] = [...header];
    for (const [groupName, items] of groups) {
      rows.push([`Склад / счёт: ${groupName}`]);
      rows.push(["Артикул", "Наименование", "Склад", "Кол-во", "Цена, ₽", "Сумма, ₽"]);
      let subtotal = 0;
      for (const it of items) {
        rows.push([
          it.product_sku ?? "",
          it.product_name,
          it.warehouse_name,
          it.qty,
          it.unit_price,
          it.line_total,
        ]);
        subtotal += it.line_total;
      }
      rows.push(["", "", "", "", "Итого по группе", subtotal]);
      rows.push([]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 16 },
      { wch: 40 },
      { wch: 22 },
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Заявка");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const safeNumber = input.number.replace(/[^A-Za-z0-9_-]/g, "_");
    const path = `orders/${safeNumber}-${Date.now()}.xlsx`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("order-docs")
      .upload(path, buf, {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: true,
      });
    if (upErr) {
      console.error("[orders-export] upload failed", upErr);
      return null;
    }

    // 30-day signed URL
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("order-docs")
      .createSignedUrl(path, 60 * 60 * 24 * 30);
    if (signErr || !signed?.signedUrl) {
      console.error("[orders-export] sign failed", signErr);
      return null;
    }
    return { url: signed.signedUrl, path };
  } catch (e) {
    console.error("[orders-export] unexpected", e);
    return null;
  }
}
