/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, max-lines-per-function, complexity */
import { getHostReact, getHostUI, usePlugin, actions } from '@coongro/plugin-sdk';

const React = getHostReact();
const UI = getHostUI();
const { useState, useEffect, useCallback, useRef, useMemo } = React;

interface ProductionBatch {
  id: string;
  date: string;
  caliber: string;
  kg: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

interface FormData {
  date: string;
  caliber: string;
  kg: number;
  notes: string;
}

const EMPTY_FORM: FormData = {
  date: '',
  caliber: 'c_38_42',
  kg: 0,
  notes: '',
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('es-AR');
  } catch {
    return dateStr;
  }
};

export function BatchesView() {
  const { toast } = usePlugin();

  // --- Estado principal ---
  const [items, setItems] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Busqueda, filtros, sort, paginacion ---
  const [localSearch, setLocalSearch] = useState('');
  const [filterCaliber, setFilterCaliber] = useState<string>('');

  const [sortKey, setSortKey] = useState<string | null>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // --- Modal ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionBatch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductionBatch | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // --- Carga de datos ---
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const [result] = await Promise.all([
        actions.execute<ProductionBatch[]>('granos-produccion.production-batches.list'),
      ]);
      if (mountedRef.current) {
        setItems(Array.isArray(result) ? result : []);

        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) setError((err as Error).message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  // --- Filtrado y sort local ---
  const filtered = useMemo(() => {
    let result = [...items];
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      result = result.filter((item) =>
        String(item.notes ?? '')
          .toLowerCase()
          .includes(q)
      );
    }
    if (filterCaliber) result = result.filter((item) => String(item.caliber) === filterCaliber);

    if (sortKey && sortDir) {
      result.sort((a, b) => {
        const aRaw = (a as Record<string, unknown>)[sortKey];
        const bRaw = (b as Record<string, unknown>)[sortKey];
        const aNum = Number(aRaw);
        const bNum = Number(bRaw);
        const cmp = !isNaN(aNum) && !isNaN(bNum) ? aNum - bNum : String(aRaw ?? '').localeCompare(String(bRaw ?? ''));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [items, localSearch, filterCaliber, sortKey, sortDir]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // --- Handlers ---
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((key: string, direction: 'asc' | 'desc' | null) => {
    setSortKey(direction ? key : null);
    setSortDir(direction);
    setPage(1);
  }, []);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: ProductionBatch) => {
    setEditing(item);
    setForm({
      date: item.date ?? '',
      caliber: item.caliber ?? '',
      kg: item.kg ?? 0,
      notes: item.notes ?? '',
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    const payload = { date: form.date, caliber: form.caliber, kg: form.kg, notes: form.notes };
    setSaving(true);
    try {
      if (editing) {
        await actions.execute('granos-produccion.production-batches.update', {
          id: editing.id,
          data: { ...payload, updatedAt: new Date().toISOString() },
        });
        toast.success('Guardado', 'Lote de producción actualizado correctamente');
      } else {
        await actions.execute('granos-produccion.production-batches.create', {
          data: {
            id: crypto.randomUUID(),
            ...payload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
        toast.success('Creado', 'Lote de producción registrado correctamente');
      }
      setDialogOpen(false);
      void fetchItems();
    } catch {
      toast.error('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }, [editing, saving, form, fetchItems, toast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || saving) return;
    setSaving(true);
    try {
      await actions.execute('granos-produccion.production-batches.delete', { id: deleteTarget.id });
      toast.success('Eliminado', 'Lote de producción eliminado correctamente');
    } catch {
      toast.error('Error', 'No se pudo eliminar');
    } finally {
      setSaving(false);
    }
    setDeleteTarget(null);
    void fetchItems();
  }, [deleteTarget, saving, fetchItems, toast]);

  // --- Boton crear para el header y empty state ---
  const createButton = React.createElement(
    UI.Button,
    { onClick: openCreate },
    React.createElement(UI.DynamicIcon, { icon: 'Plus', size: 16 }),
    'Nuevo'
  );

  return React.createElement(
    'div',
    { className: 'font-inter min-h-screen bg-cg-bg-secondary p-6' },
    React.createElement(
      'div',
      { className: 'max-w-full flex flex-col gap-6' },

      // ── Header ──
      React.createElement(
        'div',
        { className: 'flex items-center justify-between' },
        React.createElement(
          'div',
          null,
          React.createElement(
            'h1',
            { className: 'text-2xl font-bold text-cg-text' },
            'Producción Tamañadora'
          ),
          React.createElement(
            'p',
            { className: 'text-sm text-cg-text-muted mt-1' },
            loading
              ? 'Cargando...'
              : `${filtered.length} registro${filtered.length === 1 ? '' : 's'}`
          )
        ),
        createButton
      ),

      // ── DataTable ──
      React.createElement(UI.DataTable, {
        data: paged,
        loading,
        error,
        onRetry: () => {
          void fetchItems();
        },
        className: 'bg-cg-bg rounded-xl border border-cg-border shadow-sm p-6',

        // Columnas
        columns: [
          {
            key: 'date',
            header: 'Fecha',
            sortable: true,
            render: (item: ProductionBatch) => formatDate(item.date),
            className: 'whitespace-nowrap',
          },
          {
            key: 'caliber',
            header: 'Calibre',
            sortable: true,
            render: (item: ProductionBatch) =>
              item.caliber
                ? React.createElement(UI.Badge, { variant: 'default', size: 'sm' }, item.caliber)
                : '—',
          },
          {
            key: 'kg',
            header: 'Kg',
            sortable: true,
            render: (item: ProductionBatch) => Number(item.kg ?? 0).toLocaleString('es-AR'),
          },
          { key: 'notes', header: 'Notas', sortable: true, className: 'max-w-[200px] truncate' },
        ],

        // Busqueda
        searchPlaceholder: 'Buscar...',
        searchValue: localSearch,
        onSearchChange: handleSearchChange,

        // Filtros (ButtonGroup sections)
        filterSections: [
          {
            key: 'caliber',
            label: 'Calibre',
            value: filterCaliber,
            onChange: (v: string) => {
              setFilterCaliber(v);
              setPage(1);
            },
            options: [
              { value: 'c_38_42', label: '38/42' },
              { value: 'c_40_50', label: '40/50' },
              { value: 'c_50_60', label: '50/60' },
              { value: 'c_80_100', label: '80/100' },
              { value: 'split', label: 'Split' },
              { value: 'industry', label: 'Industria' },
              { value: 'vaina', label: 'Vaina' },
            ],
          },
        ],

        // Sort
        sortKey,
        sortDirection: sortDir,
        onSortChange: handleSortChange,

        // Paginacion
        pagination: { page, pageSize, total: filtered.length },
        onPageChange: setPage,

        // Acciones por fila
        actions: [
          {
            label: 'Copiar',
            onClick: (item: ProductionBatch) => {
              const text = `Lote: ${formatDate(item.date)} | Calibre: ${item.caliber ?? ''} | Kg: ${Number(item.kg ?? 0).toLocaleString('es-AR')}`;
              void navigator.clipboard.writeText(text);
              toast.success('Copiado', 'Datos copiados al portapapeles');
            },
          },
          { label: 'Editar', onClick: openEdit },
          {
            label: 'Eliminar',
            onClick: (item: ProductionBatch) => setDeleteTarget(item),
            variant: 'destructive' as const,
          },
        ],

        // Empty state
        emptyState: {
          title: 'Aún no hay registros de producción',
          description: 'Registrá el primer lote de tamañadora con el botón de arriba.',
          icon: React.createElement(UI.DynamicIcon, { icon: 'Package', size: 40, className: 'text-cg-text-muted' }),
          filteredTitle: 'No se encontraron resultados con esos filtros',
        },
      }),

      // ── FormDialog crear/editar ──
      dialogOpen &&
        React.createElement(UI.FormDialog, {
          open: dialogOpen,
          onOpenChange: (open: boolean) => {
            if (!open) setDialogOpen(false);
          },
          title: editing ? 'Editar lote de producción' : 'Nuevo lote de producción',
          size: 'md',
          footer: React.createElement(
            React.Fragment,
            null,
            React.createElement(
              UI.Button,
              { variant: 'outline', onClick: () => setDialogOpen(false) },
              'Cancelar'
            ),
            React.createElement(
              UI.Button,
              {
                onClick: () => {
                  void handleSave();
                },
                disabled: saving,
              },
              saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear'
            )
          ),
          children: React.createElement(
            'div',
            { className: 'flex flex-col gap-4' },
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1' },
              React.createElement(UI.Label, null, 'Fecha *'),
              React.createElement(UI.Input, {
                type: 'date',
                value: form.date,
                onChange: (e: { target: { value: string } }) =>
                  setForm((prev: FormData) => ({ ...prev, date: e.target.value })),
              })
            ),
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1' },
              React.createElement(UI.Label, null, 'Calibre *'),
              React.createElement(
                UI.Select,
                {
                  value: form.caliber,
                  onValueChange: (v: string) =>
                    setForm((prev: FormData) => ({ ...prev, caliber: v })),
                },
                React.createElement(UI.SelectItem, { key: 'c_38_42', value: 'c_38_42' }, '38/42'),
                React.createElement(UI.SelectItem, { key: 'c_40_50', value: 'c_40_50' }, '40/50'),
                React.createElement(UI.SelectItem, { key: 'c_50_60', value: 'c_50_60' }, '50/60'),
                React.createElement(
                  UI.SelectItem,
                  { key: 'c_80_100', value: 'c_80_100' },
                  '80/100'
                ),
                React.createElement(UI.SelectItem, { key: 'split', value: 'split' }, 'Split'),
                React.createElement(
                  UI.SelectItem,
                  { key: 'industry', value: 'industry' },
                  'Industria'
                ),
                React.createElement(UI.SelectItem, { key: 'vaina', value: 'vaina' }, 'Vaina')
              )
            ),
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1' },
              React.createElement(UI.Label, null, 'Kg *'),
              React.createElement(UI.Input, {
                type: 'number',
                value: form.kg,
                onChange: (e: { target: { value: string } }) =>
                  setForm((prev: FormData) => ({ ...prev, kg: Number(e.target.value) })),
              })
            ),
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1' },
              React.createElement(UI.Label, null, 'Notas'),
              React.createElement(UI.Textarea, {
                value: form.notes,
                rows: 3,
                placeholder: 'Notas...',
                onChange: (e: { target: { value: string } }) =>
                  setForm((prev: FormData) => ({ ...prev, notes: e.target.value })),
              })
            )
          ),
        }),

      // ── Dialog confirmar eliminacion ──
      !!deleteTarget &&
        React.createElement(
          UI.Dialog,
          { open: !!deleteTarget, onOpenChange: () => setDeleteTarget(null) },
          React.createElement(
            UI.DialogContent,
            { size: 'sm' },
            React.createElement(
              UI.DialogHeader,
              null,
              React.createElement(UI.DialogTitle, null, 'Confirmar eliminacion')
            ),
            React.createElement(
              UI.DialogBody,
              null,
              React.createElement(
                'p',
                { className: 'text-cg-text' },
                'Vas a eliminar "',
                deleteTarget?.date,
                '". Esta accion no se puede deshacer.'
              )
            ),
            React.createElement(
              UI.DialogFooter,
              null,
              React.createElement(
                UI.Button,
                { variant: 'outline', onClick: () => setDeleteTarget(null) },
                'Cancelar'
              ),
              React.createElement(
                UI.Button,
                {
                  variant: 'destructive',
                  onClick: () => {
                    void handleDelete();
                  },
                  disabled: saving,
                },
                saving ? 'Eliminando...' : 'Eliminar'
              )
            )
          )
        )
    )
  );
}
