import { useMemo, useState, type ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  /** Valeur brute (tri + recherche + filtre). */
  value?: (row: T) => string | number;
  /** Rendu personnalisé (défaut : valeur brute). */
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  /** Active un filtre déroulant sur les valeurs distinctes de la colonne. */
  filterable?: boolean;
  className?: string;
  width?: number | string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowClass?: (row: T) => string | undefined;
  searchPlaceholder?: string;
  empty?: ReactNode;
  /** Actions à droite de la barre d'outils (boutons…). */
  toolbar?: ReactNode;
  pageSize?: number;
}

const rawValue = <T,>(col: Column<T>, row: T): string | number =>
  col.value ? col.value(row) : '';

/**
 * Tableau générique AdminLTE : recherche plein texte, filtres par colonne,
 * tri cliquable sur les en-têtes, pagination légère.
 */
export default function DataTable<T>({
  columns, rows, rowKey, onRowClick, rowClass, searchPlaceholder = 'Rechercher…',
  empty, toolbar, pageSize = 25,
}: Props<T>) {
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);

  const filterCols = columns.filter((c) => c.filterable);
  const optionsFor = (col: Column<T>) =>
    [...new Set(rows.map((r) => String(rawValue(col, r))).filter((v) => v !== ''))].sort((a, b) => a.localeCompare(b, 'fr'));

  const filtered = useMemo(() => {
    let out = rows;
    const needle = q.trim().toLowerCase();
    if (needle) {
      out = out.filter((r) =>
        columns.some((c) => String(rawValue(c, r)).toLowerCase().includes(needle)));
    }
    for (const [key, val] of Object.entries(filters)) {
      if (!val) continue;
      const col = columns.find((c) => c.key === key);
      if (col) out = out.filter((r) => String(rawValue(col, r)) === val);
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        out = [...out].sort((a, b) => {
          const va = rawValue(col, a), vb = rawValue(col, b);
          if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sort.dir;
          return String(va).localeCompare(String(vb), 'fr') * sort.dir;
        });
      }
    }
    return out;
  }, [rows, q, filters, sort, columns]);

  const pages = Math.ceil(filtered.length / pageSize) || 1;
  const clampedPage = Math.min(page, pages - 1);
  const shown = filtered.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize);

  const toggleSort = (col: Column<T>) => {
    if (col.sortable === false) return;
    setPage(0);
    setSort((s) => (s?.key === col.key ? (s.dir === 1 ? { key: col.key, dir: -1 } : null) : { key: col.key, dir: 1 }));
  };

  return (
    <>
      <div className="d-flex flex-wrap gap-2 align-items-center p-2 border-bottom">
        <div className="input-group input-group-sm" style={{ maxWidth: 280 }}>
          <span className="input-group-text"><i className="bi bi-search" /></span>
          <input className="form-control" placeholder={searchPlaceholder}
            value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
        {filterCols.map((col) => (
          <select key={col.key} className="form-select form-select-sm" style={{ maxWidth: 190 }}
            value={filters[col.key] ?? ''}
            onChange={(e) => { setFilters((f) => ({ ...f, [col.key]: e.target.value })); setPage(0); }}>
            <option value="">{col.header} : tous</option>
            {optionsFor(col).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        {(q || Object.values(filters).some(Boolean) || sort) && (
          <button className="btn btn-sm btn-outline-secondary"
            onClick={() => { setQ(''); setFilters({}); setSort(null); setPage(0); }}>
            <i className="bi bi-x-circle me-1" />Réinitialiser
          </button>
        )}
        <span className="text-muted small ms-1">{filtered.length} résultat(s)</span>
        <div className="ms-auto d-flex gap-2">{toolbar}</div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className}
                  style={{ width: col.width, cursor: col.sortable === false ? undefined : 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => toggleSort(col)}>
                  {col.header}
                  {sort?.key === col.key && <i className={`bi ms-1 ${sort.dir === 1 ? 'bi-caret-up-fill' : 'bi-caret-down-fill'}`} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={columns.length} className="text-center text-muted py-4">{empty ?? 'Aucun résultat.'}</td></tr>
            )}
            {shown.map((row) => (
              <tr key={rowKey(row)} className={rowClass?.(row)}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {columns.map((col) => (
                  <td key={col.key} className={col.className}>
                    {col.render ? col.render(row) : rawValue(col, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="d-flex justify-content-between align-items-center p-2 border-top">
          <span className="text-muted small">Page {clampedPage + 1} / {pages}</span>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-secondary" disabled={clampedPage === 0} onClick={() => setPage(clampedPage - 1)}>
              <i className="bi bi-chevron-left" />
            </button>
            <button className="btn btn-outline-secondary" disabled={clampedPage >= pages - 1} onClick={() => setPage(clampedPage + 1)}>
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
