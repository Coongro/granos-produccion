/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, max-lines-per-function, complexity */
import { getHostReact, getHostUI, usePlugin, actions } from '@coongro/plugin-sdk';

const React = getHostReact();
const UI = getHostUI();
const { useState, useEffect, useCallback, useRef, useMemo } = React;

interface SupplyMovement {
  id: string;
  date: string;
  supplyType: string;
  movementType: string;
  quantity: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

interface FormData {
  date: string;
  supplyType: string;
  movementType: string;
  quantity: number;
  notes: string;
}

const EMPTY_FORM: FormData = {
  date: '',
  supplyType: 'tarimas',
  movementType: 'entry',
  quantity: 0,
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

export function SuppliesView() {
  const { toast } = usePlugin();

  // --- Estado principal ---
  const [items, setItems] = useState<SupplyMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Busqueda, filtros, sort, paginacion ---
  const [localSearch, setLocalSearch] = useState('');
  const [filterSupplytype, setFilterSupplytype] = useState<string>('');
  const [filterMovementtype, setFilterMovementtype] = useState<string>('');

  const [sortKey, setSortKey] = useState<string | null>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // --- Modal ---
  const [dialogOpen, setDialogOpen] = useState(false);
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
        actions.execute<SupplyMovement[]>('granos-produccion.supply-movements.list'),
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
    if (filterSupplytype)
      result = result.filter((item) => String(item.supplyType) === filterSupplytype);
    if (filterMovementtype)
      result = result.filter((item) => String(item.movementType) === filterMovementtype);

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
  }, [items, localSearch, filterSupplytype, filterMovementtype, sortKey, sortDir]);

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
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    const payload = {
      date: form.date,
      supplyType: form.supplyType,
      movementType: form.movementType,
      quantity: form.quantity,
      notes: form.notes,
    };
    setSaving(true);
    try {
      await actions.execute('granos-produccion.supply-movements.create', {
        data: {
          id: crypto.randomUUID(),
          ...payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      toast.success('Creado', 'Movimiento registrado correctamente');
      setDialogOpen(false);
      void fetchItems();
    } catch {
      toast.error('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }, [saving, form, fetchItems, toast]);

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
          React.createElement('h1', { className: 'text-2xl font-bold text-cg-text' }, 'Insumos'),
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
            render: (item: SupplyMovement) => formatDate(item.date),
            className: 'whitespace-nowrap',
          },
          {
            key: 'supplyType',
            header: 'Insumo',
            sortable: true,
            render: (item: SupplyMovement) =>
              item.supplyType
                ? React.createElement(UI.Badge, { variant: 'default', size: 'sm' }, item.supplyType)
                : '—',
          },
          {
            key: 'movementType',
            header: 'Tipo',
            sortable: true,
            render: (item: SupplyMovement) =>
              item.movementType
                ? React.createElement(
                    UI.Badge,
                    { variant: 'default', size: 'sm' },
                    item.movementType
                  )
                : '—',
          },
          {
            key: 'quantity',
            header: 'Cantidad',
            sortable: true,
            render: (item: SupplyMovement) => String(item.quantity ?? 0),
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
            key: 'supplyType',
            label: 'Insumo',
            value: filterSupplytype,
            onChange: (v: string) => {
              setFilterSupplytype(v);
              setPage(1);
            },
            options: [
              { value: 'tarimas', label: 'Tarimas' },
              { value: 'big_bags', label: 'Big Bags' },
              { value: 'bolsas_crudo', label: 'Bolsas Crudo' },
              { value: 'bolsas_tostado', label: 'Bolsas Tostado' },
              { value: 'bolsas_vaina', label: 'Bolsas Vaina' },
            ],
          },
          {
            key: 'movementType',
            label: 'Tipo de Movimiento',
            value: filterMovementtype,
            onChange: (v: string) => {
              setFilterMovementtype(v);
              setPage(1);
            },
            options: [
              { value: 'entry', label: 'Ingreso' },
              { value: 'exit', label: 'Egreso' },
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
            onClick: (item: SupplyMovement) => {
              const text = `Movimiento: ${formatDate(item.date)} | Insumo: ${item.supplyType ?? ''} | Tipo: ${item.movementType ?? ''} | Cantidad: ${item.quantity ?? 0}`;
              void navigator.clipboard.writeText(text);
              toast.success('Copiado', 'Datos copiados al portapapeles');
            },
          },
        ],

        // Empty state
        emptyState: {
          title: 'Aún no hay movimientos de insumos',
          description: 'Registrá el primer ingreso o egreso con el botón de arriba.',
          icon: React.createElement(UI.DynamicIcon, { icon: 'Boxes', size: 40, className: 'text-cg-text-muted' }),
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
          title: 'Nuevo movimiento',
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
              saving ? 'Guardando...' : 'Crear'
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
              React.createElement(UI.Label, null, 'Insumo *'),
              React.createElement(
                UI.Select,
                {
                  value: form.supplyType,
                  onValueChange: (v: string) =>
                    setForm((prev: FormData) => ({ ...prev, supplyType: v })),
                },
                React.createElement(UI.SelectItem, { key: 'tarimas', value: 'tarimas' }, 'Tarimas'),
                React.createElement(
                  UI.SelectItem,
                  { key: 'big_bags', value: 'big_bags' },
                  'Big Bags'
                ),
                React.createElement(
                  UI.SelectItem,
                  { key: 'bolsas_crudo', value: 'bolsas_crudo' },
                  'Bolsas Crudo'
                ),
                React.createElement(
                  UI.SelectItem,
                  { key: 'bolsas_tostado', value: 'bolsas_tostado' },
                  'Bolsas Tostado'
                ),
                React.createElement(
                  UI.SelectItem,
                  { key: 'bolsas_vaina', value: 'bolsas_vaina' },
                  'Bolsas Vaina'
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1' },
              React.createElement(UI.Label, null, 'Tipo de Movimiento *'),
              React.createElement(
                UI.Select,
                {
                  value: form.movementType,
                  onValueChange: (v: string) =>
                    setForm((prev: FormData) => ({ ...prev, movementType: v })),
                },
                React.createElement(UI.SelectItem, { key: 'entry', value: 'entry' }, 'Ingreso'),
                React.createElement(UI.SelectItem, { key: 'exit', value: 'exit' }, 'Egreso')
              )
            ),
            React.createElement(
              'div',
              { className: 'flex flex-col gap-1' },
              React.createElement(UI.Label, null, 'Cantidad *'),
              React.createElement(UI.Input, {
                type: 'number',
                value: form.quantity,
                onChange: (e: { target: { value: string } }) =>
                  setForm((prev: FormData) => ({ ...prev, quantity: Number(e.target.value) })),
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

    )
  );
}
