import * as XLSX from "xlsx";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface OrderExportItem {
  product_name: string;
  product_sku?: string | null;
  product_brand?: string | null;
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
 * Build .xlsx in the exact "Слияние" layout used by ChatMax merge mailings:
 *
 *   A: Артикул в заказ    B: Производитель в заказ    C: Наименование в заказ
 *   D: Количество         E: Цена в заказ             F: Сумма
 *   G1 = SUM(F:F)         H: Количество в отказ       I: Сумма (=(D-H)*E)
 *   J1 = SUM(I:I)         K1: e-mail клиента
 */
export async function buildAndUploadOrderXlsx(
  input: OrderExportInput,
): Promise<{ url: string; path: string } | null> {
  try {
    const wb = XLSX.utils.book_new();

    // Header row — single line, exactly like the sample.
    const aoa: (string | number | { f: string } | null)[][] = [
      [
        "Артикул в заказ",
        "Производитель в заказ",
        "Наименование в заказ",
        "Количество",
        "Цена в заказ",
        "Сумма",
        { f: "SUM(F:F)" },
        "Количество в отказ",
        "Сумма",
        { f: "SUM(I:I)" },
        input.email ?? "",
      ],
    ];

    input.items.forEach((it, idx) => {
      const row = idx + 2; // Excel row number (header is row 1)
      aoa.push([
        it.product_sku ?? "",
        it.product_brand ?? "",
        it.product_name,
        it.qty,
        it.unit_price,
        it.line_total,
        null,
        null,
        { f: `(D${row}-H${row})*E${row}` },
        null,
        null,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: false });
    ws["!cols"] = [
      { wch: 22 }, // A
      { wch: 22 }, // B
      { wch: 60 }, // C
      { wch: 12 }, // D
      { wch: 14 }, // E
      { wch: 14 }, // F
      { wch: 14 }, // G
      { wch: 18 }, // H
      { wch: 14 }, // I
      { wch: 14 }, // J
      { wch: 28 }, // K
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Слияние");

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
