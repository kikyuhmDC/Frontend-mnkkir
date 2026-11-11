"use client";

/**
 * Generic CRUD table driven by an EntityConfig (see lib/entities.tsx).
 * Handles listing, search, create/edit dialogs, delete confirmation, and
 * toast feedback against the NestJS endpoints.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  InboxIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  TriangleAlertIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiFetch, apiSend } from "@/lib/api";
import {
  loadOptions,
  type EntityConfig,
  type FieldDef,
  type OptionSource,
} from "@/lib/entities";
import type { Row } from "@/lib/types";

type FormValues = Record<string, string>;
type OptionList = { label: string; value: string }[];

/** "2026-11-05T16:00:00.000Z"-ish values → "2026-11-05" for <input type="date">. */
function toDateInputValue(value: unknown): string {
  if (!value) return "";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function emptyForm(fields: FieldDef[]): FormValues {
  return Object.fromEntries(fields.map((f) => [f.name, ""]));
}

function formValuesFromRow(fields: FieldDef[], row: Row): FormValues {
  return Object.fromEntries(
    fields.map((f) => {
      // Never prefill passwords when editing an existing row.
      if (f.name === "password") return [f.name, ""];
      const value = row[f.name];
      if (f.type === "date") return [f.name, toDateInputValue(value)];
      return [f.name, value === null || value === undefined ? "" : String(value)];
    })
  );
}

export function EntityCrud({ config }: { config: EntityConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [form, setForm] = useState<FormValues>(() => emptyForm(config.fields));
  const [saving, setSaving] = useState(false);
  const [deletingRow, setDeletingRow] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  /** Dynamic <select> options keyed by OptionSource. */
  const [options, setOptions] = useState<Partial<Record<OptionSource, OptionList>>>({});

  const optionSources = useMemo(() => {
    const sources = new Set<OptionSource>();
    for (const field of config.fields) {
      if (field.optionsFrom) sources.add(field.optionsFrom);
    }
    return [...sources];
  }, [config.fields]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Row[]>(config.endpoint);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records.");
    } finally {
      setLoading(false);
    }
  }, [config.endpoint]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled(optionSources.map(loadOptions));
      if (cancelled) return;
      const next: Partial<Record<OptionSource, OptionList>> = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          next[optionSources[index]] = result.value;
        }
      });
      setOptions(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [optionSources]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [rows, search]);

  /* ------------------------------------------------------------------ */
  /* Create / edit dialog                                                */
  /* ------------------------------------------------------------------ */

  const openCreate = () => {
    setEditingRow(null);
    setForm(emptyForm(config.fields));
    setDialogOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditingRow(row);
    setForm(formValuesFromRow(config.fields, row));
    setDialogOpen(true);
  };

  const submitForm = async () => {
    // Client-side validation for required fields.
    for (const field of config.fields) {
      if (field.required && !String(form[field.name] ?? "").trim()) {
        toast.error(`${field.label} is required.`);
        return;
      }
    }

    // Build the JSON payload — skip empty optional fields entirely so the
    // backend's partial-update logic leaves them untouched.
    const payload: Record<string, unknown> = {};
    for (const field of config.fields) {
      const raw = String(form[field.name] ?? "").trim();
      const isRequired = field.required;
      if (!raw) {
        if (isRequired) continue; // already validated above
        continue;
      }
      if (field.type === "number") {
        const num = Number(raw);
        if (Number.isNaN(num)) {
          toast.error(`${field.label} must be a number.`);
          return;
        }
        payload[field.name] = num;
      } else {
        payload[field.name] = raw;
      }
    }

    // The users PUT endpoint treats a blank password as "keep current".
    if (editingRow && config.endpoint === "/users" && !payload.password) {
      delete payload.password;
    }

    setSaving(true);
    try {
      const recordId = editingRow?.[config.idField];
      await apiSend(
        recordId ? `${config.endpoint}/${recordId}` : config.endpoint,
        recordId ? "PUT" : "POST",
        payload
      );
      toast.success(
        `${config.singularName} ${recordId ? "updated" : "created"} successfully.`
      );
      setDialogOpen(false);
      await fetchRows();
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Something went wrong.";
      toast.error(`Could not save ${config.singularName.toLowerCase()}. ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const recordId = deletingRow?.[config.idField];
    if (recordId === undefined || recordId === null) return;
    setDeleting(true);
    try {
      await apiFetch(`${config.endpoint}/${recordId}`, { method: "DELETE" });
      toast.success(`${config.singularName} deleted successfully.`);
      setDeletingRow(null);
      await fetchRows();
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Something went wrong.";
      toast.error(`Could not delete ${config.singularName.toLowerCase()}. ${message}`);
    } finally {
      setDeleting(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Rendering helpers                                                   */
  /* ------------------------------------------------------------------ */

  const renderField = (field: FieldDef) => {
    const value = form[field.name] ?? "";
    const fieldId = `field-${field.name}`;

    if (field.type === "select") {
      const list = field.optionsFrom
        ? (options[field.optionsFrom] ?? [])
        : (field.options ?? []);
      const items = list.map((o) => ({
        label: o.label,
        value: o.value,
      }));
      return (
        <Select
          key={field.name}
          items={items}
          value={value || null}
          onValueChange={(selected) =>
            setForm((prev) => ({
              ...prev,
              [field.name]: selected === null ? "" : String(selected),
            }))
          }
        >
          <SelectTrigger id={fieldId} className="w-full">
            <SelectValue placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {items.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No options available yet.
              </div>
            ) : (
              items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      );
    }

    if (field.type === "textarea") {
      return (
        <Textarea
          key={field.name}
          id={fieldId}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, [field.name]: e.target.value }))
          }
        />
      );
    }

    return (
      <Input
        key={field.name}
        id={fieldId}
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        value={value}
        step={field.step}
        placeholder={field.placeholder}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, [field.name]: e.target.value }))
        }
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.singularName} records</CardTitle>
        <CardDescription>
          {loading
            ? "Loading records…"
            : `${filteredRows.length} of ${rows.length} ${
                rows.length === 1 ? "record" : "records"
              }`}
        </CardDescription>
        <CardAction>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-40 pl-8 sm:w-56"
              aria-label={`Search ${config.singularName.toLowerCase()} records`}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchRows}
            disabled={loading}
            aria-label="Refresh list"
            title="Refresh"
          >
            {loading ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <RefreshCwIcon />
            )}
          </Button>
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Add {config.singularName.toLowerCase()}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
            <TriangleAlertIcon className="size-8 text-destructive" />
            <p className="max-w-md text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchRows}>
              <RefreshCwIcon data-icon="inline-start" />
              Try again
            </Button>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center">
            <InboxIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {search
                ? `No ${config.singularName.toLowerCase()} records match “${search}”.`
                : `No ${config.singularName.toLowerCase()} records yet. Create the first one.`}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {config.columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
                <TableHead className="sticky right-0 bg-card text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row, index) => (
                <TableRow key={String(row[config.idField] ?? index)}>
                  {config.columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render
                        ? column.render(row)
                        : String(row[column.key] ?? "—")}
                    </TableCell>
                  ))}
                  <TableCell className="sticky right-0 bg-card">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(row)}
                        aria-label={`Edit ${config.singularName.toLowerCase()} ${String(
                          row[config.idField]
                        )}`}
                        title="Edit"
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeletingRow(row)}
                        aria-label={`Delete ${config.singularName.toLowerCase()} ${String(
                          row[config.idField]
                        )}`}
                        title="Delete"
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRow
                ? `Edit ${config.singularName.toLowerCase()} #${String(
                    editingRow[config.idField]
                  )}`
                : `New ${config.singularName.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              {editingRow
                ? "Update the fields below and save your changes."
                : `Fill in the details to create a new ${config.singularName.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {config.fields.map((field) => {
              const fieldId = `field-${field.name}`;
              return (
                <div key={field.name} className="grid gap-1.5">
                  <Label htmlFor={fieldId}>
                    {field.label}
                    {field.required ? (
                      <span className="ml-0.5 text-destructive">*</span>
                    ) : null}
                  </Label>
                  {renderField(field)}
                  {field.hint ? (
                    <p className="text-xs text-muted-foreground">{field.hint}</p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={submitForm} disabled={saving}>
              {saving ? (
                <>
                  <Loader2Icon data-icon="inline-start" className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  {editingRow ? "Save changes" : `Create ${config.singularName.toLowerCase()}`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deletingRow !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingRow(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {config.singularName.toLowerCase()}{" "}
              {deletingRow ? `#${String(deletingRow[config.idField])}` : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the record from the database. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                // Prevent the dialog from closing before the request finishes.
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2Icon data-icon="inline-start" className="animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
