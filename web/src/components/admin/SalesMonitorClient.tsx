"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { SalesFilterBar, type SalesFilterState } from "@/components/admin/SalesFilterBar";
import { ResendDeliveryButton } from "@/components/admin/ResendDeliveryButton";
import { formatDjomyPaymentStatus } from "@/lib/payment-status-label";

export type SaleRow = {
  id: string;
  created_at: string;
  customer_email: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  amount: number;
  currency: string;
  status: string;
  is_delivered: boolean;
  delivery_error: string | null;
  productTitle?: string | null;
  product_type?: string | null;
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR");
  } catch {
    return iso;
  }
}

function canResend(email: string) {
  const e = String(email ?? "").trim();
  return Boolean(e && e !== "unknown@example.com");
}

function sortHeader(label: string, sorted: false | "asc" | "desc") {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <span className="text-[10px] font-normal text-neutral-400" aria-hidden>
        {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "⇅"}
      </span>
    </span>
  );
}

const saleColumns: ColumnDef<SaleRow>[] = [
  {
    accessorKey: "created_at",
    id: "created_at",
    header: ({ column }) => (
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg px-1 py-0.5 text-left font-bold uppercase tracking-wide text-neutral-600 hover:bg-black/5"
        onClick={column.getToggleSortingHandler()}
        aria-label="Trier par date"
      >
        {sortHeader("Date", column.getIsSorted())}
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-xs text-neutral-800">{fmtDate(row.original.created_at)}</span>
    ),
    sortingFn: (a, b, id) => {
      const ta = new Date(String(a.getValue(id))).getTime();
      const tb = new Date(String(b.getValue(id))).getTime();
      return ta - tb;
    },
    sortDescFirst: true,
  },
  {
    accessorKey: "product_type",
    id: "product_type",
    header: ({ column }) => (
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg px-1 py-0.5 text-left font-bold uppercase tracking-wide text-neutral-600 hover:bg-black/5"
        onClick={column.getToggleSortingHandler()}
        aria-label="Trier par type"
      >
        {sortHeader("Type", column.getIsSorted())}
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-neutral-800">
        {row.original.product_type === "physical"
          ? "Physique"
          : "Électronic"}
      </span>
    ),
  },
  {
    accessorKey: "customer_email",
    id: "customer_email",
    header: ({ column }) => (
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg px-1 py-0.5 text-left font-bold uppercase tracking-wide text-neutral-600 hover:bg-black/5"
        onClick={column.getToggleSortingHandler()}
        aria-label="Trier par email"
      >
        {sortHeader("Email", column.getIsSorted())}
      </button>
    ),
    cell: ({ row }) => <span className="text-xs">{row.original.customer_email}</span>,
  },
  {
    accessorKey: "customer_name",
    id: "customer_name",
    header: ({ column }) => (
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg px-1 py-0.5 text-left font-bold uppercase tracking-wide text-neutral-600 hover:bg-black/5"
        onClick={column.getToggleSortingHandler()}
        aria-label="Trier par nom"
      >
        {sortHeader("Nom", column.getIsSorted())}
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-xs text-neutral-900">
        {row.original.customer_name?.trim() || "—"}
      </span>
    ),
  },
  {
    accessorKey: "customer_phone",
    id: "customer_phone",
    header: ({ column }) => (
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg px-1 py-0.5 text-left font-bold uppercase tracking-wide text-neutral-600 hover:bg-black/5"
        onClick={column.getToggleSortingHandler()}
        aria-label="Trier par téléphone"
      >
        {sortHeader("Téléphone", column.getIsSorted())}
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-xs text-neutral-900">
        {row.original.customer_phone?.trim() || "—"}
      </span>
    ),
  },
  {
    accessorKey: "customer_address",
    id: "customer_address",
    header: () => <span className="font-bold uppercase tracking-wide text-neutral-600">Adresse</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="block max-w-[260px] truncate text-xs text-neutral-900" title={row.original.customer_address ?? ""}>
        {row.original.customer_address?.trim() || "—"}
      </span>
    ),
  },
  {
    accessorKey: "productTitle",
    id: "productTitle",
    accessorFn: (row) => row.productTitle ?? "",
    header: ({ column }) => (
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg px-1 py-0.5 text-left font-bold uppercase tracking-wide text-neutral-600 hover:bg-black/5"
        onClick={column.getToggleSortingHandler()}
        aria-label="Trier par produit"
      >
        {sortHeader("Produit", column.getIsSorted())}
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-xs font-medium text-neutral-900">
        {row.original.productTitle ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    id: "amount",
    header: ({ column }) => (
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg px-1 py-0.5 text-left font-bold uppercase tracking-wide text-neutral-600 hover:bg-black/5"
        onClick={column.getToggleSortingHandler()}
        aria-label="Trier par montant"
      >
        {sortHeader("Montant", column.getIsSorted())}
      </button>
    ),
    cell: ({ row }) => {
      const fmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
        Number(row.original.amount ?? 0)
      );
      return (
        <span className="text-xs font-semibold">
          {fmt} {row.original.currency}
        </span>
      );
    },
    sortingFn: (a, b, id) =>
      Number(a.getValue(id)) - Number(b.getValue(id)),
    sortDescFirst: true,
  },
  {
    accessorKey: "status",
    id: "status",
    header: ({ column }) => (
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg px-1 py-0.5 text-left font-bold uppercase tracking-wide text-neutral-600 hover:bg-black/5"
        onClick={column.getToggleSortingHandler()}
        aria-label="Trier par statut de paiement"
      >
        {sortHeader("Paiement (Djomy)", column.getIsSorted())}
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-xs font-bold">{formatDjomyPaymentStatus(row.original.status)}</span>
    ),
  },
  {
    accessorKey: "is_delivered",
    id: "is_delivered",
    header: ({ column }) => (
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg px-1 py-0.5 text-left font-bold uppercase tracking-wide text-neutral-600 hover:bg-black/5"
        onClick={column.getToggleSortingHandler()}
        aria-label="Trier par livraison email"
      >
        {sortHeader("Livraison", column.getIsSorted())}
      </button>
    ),
    cell: ({ row }) => (
      <div className="text-xs">
        {row.original.product_type === "physical" ? (
          <span className="font-semibold text-amber-700">À livrer</span>
        ) : row.original.is_delivered ? (
          <span className="font-semibold text-emerald-700">Envoyé</span>
        ) : (
          <span className="font-semibold text-red-700">Non</span>
        )}
        {row.original.delivery_error ? (
          <div
            className="mt-1 max-w-[240px] text-[10px] leading-snug text-red-700"
            title={row.original.delivery_error}
          >
            {row.original.delivery_error}
          </div>
        ) : null}
      </div>
    ),
    sortingFn: (a, b, id) => {
      const va = a.getValue(id) ? 1 : 0;
      const vb = b.getValue(id) ? 1 : 0;
      return va - vb;
    },
  },
  {
    id: "actions",
    header: () => <span className="font-bold uppercase tracking-wide text-neutral-600">E-mail</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <ResendDeliveryButton
        saleId={row.original.id}
        canResend={
          row.original.product_type !== "physical" &&
          canResend(row.original.customer_email)
        }
      />
    ),
  },
];

export function SalesMonitorClient({ sales }: { sales: SaleRow[] }) {
  const [filter, setFilter] = useState<SalesFilterState>({
    q: "",
    onlyNotDelivered: false,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  const filtered = useMemo(() => {
    const q = filter.q.trim().toLowerCase();
    return sales.filter((s) => {
      if (filter.onlyNotDelivered && s.is_delivered) return false;
      if (!q) return true;
      const hay = [
        s.customer_email,
        s.status,
        s.currency,
        s.productTitle ?? "",
        s.id,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [filter.onlyNotDelivered, filter.q, sales]);

  const table = useReactTable({
    data: filtered,
    columns: saleColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const fmtAmount = useMemo(() => {
    return (amount: number) =>
      new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
        Number(amount ?? 0)
      );
  }, []);

  const sortedRows = table.getRowModel().rows;

  return (
    <div className="mt-3">
      <SalesFilterBar value={filter} onChange={setFilter} />

      {/* Mobile: cards (même ordre que le tableau trié) */}
      <div className="mt-4 grid gap-3 lg:hidden">
        {sortedRows.map((row) => {
          const s = row.original;
          return (
            <div
              key={s.id}
              className="animate-ui-enter rounded-2xl border border-black/15 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-extrabold text-black">
                    {s.customer_email}
                  </div>
                  {s.productTitle ? (
                    <div className="mt-1 text-sm font-semibold text-neutral-900">
                      {s.productTitle}
                    </div>
                  ) : null}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-800">
                    <span>{fmtDate(s.created_at)}</span>
                    <span>•</span>
                    <span className="font-extrabold text-black">
                      {fmtAmount(Number(s.amount ?? 0))} {s.currency}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-extrabold text-black">
                    {formatDjomyPaymentStatus(s.status)}
                  </div>
                  <div
                    className={
                      s.is_delivered ? "font-bold text-emerald-700" : "font-bold text-red-700"
                    }
                  >
                    {s.is_delivered ? "Livré" : "Non livré"}
                  </div>
                </div>
              </div>

              {s.delivery_error ? (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50/80 px-2 py-1.5 text-[11px] text-red-900">
                  {s.delivery_error}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="break-all font-mono text-[11px] text-neutral-600">{s.id}</div>
                <ResendDeliveryButton saleId={s.id} canResend={canResend(s.customer_email)} />
              </div>
            </div>
          );
        })}

        {sortedRows.length === 0 ? (
          <div className="rounded-2xl border border-black/15 bg-white p-4 text-sm text-neutral-800">
            Aucune commande.
          </div>
        ) : null}
      </div>

      {/* Desktop: TanStack Table */}
      <div className="mt-4 hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="text-left">
                {hg.headers.map((header) => (
                  <th key={header.id} className="py-2 pr-2 align-bottom">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.id} className="border-t border-black/5">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-3 pr-2 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {sortedRows.length === 0 ? (
          <div className="py-3 text-sm text-neutral-700">Aucune commande.</div>
        ) : null}
      </div>
    </div>
  );
}
