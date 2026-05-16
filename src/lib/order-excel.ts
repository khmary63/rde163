import * as XLSX from "xlsx";

export type ExportItem = {
  sku: string;
  name: string;
  brand?: string | null;
  warehouseName: string;
  qty: number;
  unit_price: number;
  line_total: number;
};

export type ExportOrder = {
  number: string;
  created_at: string;
  status?: string | null;
  customer?: string | null;
  inn?: string | null;
  notes?: string | null;
  invoice_grouping: "single" | "per_warehouse";
  items: ExportItem[];
};

const HEADER = ["№", "Артикул", "Производитель", "Наименование", "Склад", "Кол-во", "Цена, ₽", "Сумма, ₽"];

function buildSheet(items: ExportItem[], meta: { number: string; date: string; customer?: string | null; inn?: string | null; warehouseTitle?: string }) {
  const aoa: (string | number)[][] = [];
  aoa.push([`Заявка ${meta.number}`]);
  aoa.push([`Дата: ${meta.date}`]);
  if (meta.customer) aoa.push([`Клиент: ${meta.customer}${meta.inn ? ` (ИНН ${meta.inn})` : ""}`]);
  if (meta.warehouseTitle) aoa.push([`Склад: ${meta.warehouseTitle}`]);
  aoa.push([]);
  aoa.push(HEADER);
  items.forEach((it, i) => {
    aoa.push([
      i + 1,
      it.sku,
      it.brand ?? "",
      it.name,
      it.warehouseName,
      it.qty,
      Number(it.unit_price),
      Number(it.line_total),
    ]);
  });
  const total = items.reduce((s, it) => s + Number(it.line_total), 0);
  aoa.push([]);
  aoa.push(["", "", "", "", "Итого:", items.reduce((s, it) => s + it.qty, 0), "", total]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 16 },
    { wch: 42 },
    { wch: 22 },
    { wch: 8 },
    { wch: 12 },
    { wch: 14 },
  ];
  return ws;
}

export function exportOrderToExcel(order: ExportOrder) {
  const wb = XLSX.utils.book_new();
  const date = new Date(order.created_at).toLocaleString("ru-RU");

  if (order.invoice_grouping === "per_warehouse") {
    const groups = new Map<string, ExportItem[]>();
    for (const it of order.items) {
      const arr = groups.get(it.warehouseName) ?? [];
      arr.push(it);
      groups.set(it.warehouseName, arr);
    }
    let idx = 1;
    for (const [wh, items] of groups) {
      const ws = buildSheet(items, { number: `${order.number}-${idx}`, date, customer: order.customer, inn: order.inn, warehouseTitle: wh });
      const sheetName = wh.slice(0, 28).replace(/[\\/?*[\]:]/g, "_") || `Склад ${idx}`;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      idx++;
    }
  } else {
    const ws = buildSheet(order.items, { number: order.number, date, customer: order.customer, inn: order.inn });
    XLSX.utils.book_append_sheet(wb, ws, "Заявка");
  }

  if (order.notes) {
    const ws = XLSX.utils.aoa_to_sheet([["Комментарий клиента"], [order.notes]]);
    ws["!cols"] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, ws, "Комментарий");
  }

  XLSX.writeFile(wb, `${order.number}.xlsx`);
}
