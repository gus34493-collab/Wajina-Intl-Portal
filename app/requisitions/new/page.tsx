"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Priority = "IMMEDIATE" | "WEEK_1" | "WEEK_2";

interface LineItem {
  description: string;
  qty: number;
  unitCost: number;
}

interface FormState {
  department: string;
  priority: Priority;
  justification: string;
  items: LineItem[];
}

const PRIORITY_OPTS: { value: Priority; label: string; cls: string }[] = [
  { value: "IMMEDIATE", label: "Immediate", cls: "bg-brand-error/10 text-brand-error border-brand-error/30" },
  { value: "WEEK_1", label: "Week 1", cls: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "WEEK_2", label: "Week 2", cls: "bg-green-100 text-green-700 border-green-300" },
];

const BLANK_ITEM: LineItem = { description: "", qty: 1, unitCost: 0 };

export default function NewRequisitionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    department: "",
    priority: "WEEK_1",
    justification: "",
    items: [{ ...BLANK_ITEM }],
  });

  const amountTotal = useMemo(
    () =>
      form.items.reduce(
        (sum, item) => sum + (item.qty || 0) * (item.unitCost || 0),
        0
      ),
    [form.items]
  );

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setForm((prev) => {
      const items = prev.items.map((item, i) => {
        if (i !== index) return item;
        if (field === "description") return { ...item, description: value };
        const num = parseFloat(value) || 0;
        return { ...item, [field]: num };
      });
      return { ...prev, items };
    });
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...BLANK_ITEM }],
    }));
  }

  function removeItem(index: number) {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  function validate(): string | null {
    if (!form.department.trim()) return "Department is required";
    if (form.justification.trim().length < 20)
      return "Justification must be at least 20 characters";
    for (const item of form.items) {
      if (!item.description.trim()) return "All items must have a description";
      if (item.qty < 1) return "Quantity must be at least 1";
      if (item.unitCost < 0) return "Unit cost cannot be negative";
    }
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: form.department.trim(),
          priority: form.priority,
          justification: form.justification.trim(),
          items: form.items.map((item) => ({
            description: item.description.trim(),
            quantity: item.qty,
            unitCost: item.unitCost,
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message ?? "Failed to create requisition");
        return;
      }
      const created = await res.json();
      toast.success("Requisition saved as draft");
      router.push(`/requisitions/${created.id ?? created.requisition?.id}`);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-black text-brand-primary tracking-tight">
            New <span className="text-brand-secondary">Requisition</span>
          </h1>
          <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest mt-1">
            Complete the form below to initiate a procurement request
          </p>
        </div>

        {/* Main form card */}
        <div className="bg-white rounded-[1.5rem] border border-brand-primary/8 shadow-xl p-6 flex flex-col gap-8">
          {/* Department */}
          <div className="flex flex-col gap-2">
            <label className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
              Department
            </label>
            <input
              type="text"
              placeholder="e.g. Administration, Sciences, ICT"
              value={form.department}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, department: e.target.value }))
              }
              className="bg-brand-primary/[0.02] border border-brand-primary/10 rounded-2xl px-4 py-3 text-sm font-bold text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:border-brand-secondary/40 transition-colors"
            />
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <label className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
              Priority
            </label>
            <div className="flex gap-3 flex-wrap">
              {PRIORITY_OPTS.map(({ value, label, cls }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, priority: value }))
                  }
                  className={cn(
                    "px-5 py-2.5 rounded-2xl text-token-micro font-black uppercase tracking-widest border transition-all",
                    form.priority === value
                      ? cls
                      : "bg-white border-brand-primary/10 text-brand-primary/40 hover:border-brand-primary/25"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Justification */}
          <div className="flex flex-col gap-2">
            <label className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
              Justification
            </label>
            <textarea
              rows={4}
              placeholder="Describe the reason for this requisition (minimum 20 characters)"
              value={form.justification}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, justification: e.target.value }))
              }
              className="bg-brand-primary/[0.02] border border-brand-primary/10 rounded-2xl px-4 py-3 text-sm font-bold text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:border-brand-secondary/40 transition-colors resize-none"
            />
            <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">
              {form.justification.trim().length} / 2000 chars
            </p>
          </div>

          {/* Items table */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
                Line Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className="bg-brand-primary text-white font-black text-token-micro uppercase tracking-widest px-4 py-2 rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5"
              >
                <Plus size={13} />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-primary/8">
                    {["S/N", "Description", "Qty", "Unit Cost (₦)", "Total (₦)", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left pb-3 pr-4 text-token-micro font-black text-brand-primary/40 uppercase tracking-widest whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i} className="border-b border-brand-primary/5">
                      <td className="py-3 pr-4 text-brand-primary/40 font-black text-token-micro w-10">
                        {i + 1}
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(i, "description", e.target.value)
                          }
                          placeholder="Item description"
                          className="w-full min-w-[180px] bg-brand-primary/[0.02] border border-brand-primary/8 rounded-xl px-3 py-2 text-sm font-bold text-brand-primary placeholder:text-brand-primary/25 focus:outline-none focus:border-brand-secondary/40 transition-colors"
                        />
                      </td>
                      <td className="py-3 pr-4 w-20">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) =>
                            updateItem(i, "qty", e.target.value)
                          }
                          className="w-full bg-brand-primary/[0.02] border border-brand-primary/8 rounded-xl px-3 py-2 text-sm font-bold text-brand-primary focus:outline-none focus:border-brand-secondary/40 transition-colors"
                        />
                      </td>
                      <td className="py-3 pr-4 w-32">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) =>
                            updateItem(i, "unitCost", e.target.value)
                          }
                          className="w-full bg-brand-primary/[0.02] border border-brand-primary/8 rounded-xl px-3 py-2 text-sm font-bold text-brand-primary focus:outline-none focus:border-brand-secondary/40 transition-colors"
                        />
                      </td>
                      <td className="py-3 pr-4 w-32 font-black text-brand-primary tabular-nums">
                        ₦{(item.qty * item.unitCost).toLocaleString("en-NG")}
                      </td>
                      <td className="py-3 w-10">
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          disabled={form.items.length <= 1}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-brand-error/50 hover:text-brand-error hover:bg-brand-error/8 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total display */}
          <div className="flex justify-end">
            <div className="flex flex-col items-end gap-1">
              <p className="text-token-micro font-black text-brand-primary/40 uppercase tracking-widest">
                Total Amount
              </p>
              <p className="text-4xl font-display font-black text-brand-primary tracking-tight tabular-nums">
                ₦{amountTotal.toLocaleString("en-NG")}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-4 justify-end">
          <button
            type="button"
            onClick={() => router.push("/requisitions")}
            className="bg-white border border-brand-primary/8 text-brand-primary font-black text-token-micro uppercase tracking-widest px-6 py-3 rounded-2xl hover:border-brand-secondary/30 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-brand-primary text-white font-black text-token-micro uppercase tracking-widest px-8 py-3 rounded-2xl hover:opacity-90 transition-all disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save as Draft"}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
