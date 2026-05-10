import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function ResponsiveTable({ columns, data, renderActions, selectable, selectedIds, onToggleSelect, bulkActions, pageSize = 15 }) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  // Reset page when data changes
  useEffect(() => { setPage(1); }, [data.length]);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, sorted.length);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const allSelected = selectable && paged.length > 0 && paged.every(r => selectedIds?.includes(r.id));

  return (
    <div>
      {/* Bulk action bar */}
      {selectable && selectedIds?.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border-b border-blue-100 text-sm animate-fade-in">
          <span className="font-medium text-blue-700">{selectedIds.length} dipilih</span>
          <div className="flex gap-2">{bulkActions}</div>
          <button
            onClick={() => onToggleSelect([])}
            className="ml-auto text-xs text-blue-500 hover:text-blue-700 transition-colors"
          >
            Batal pilih
          </button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              {selectable && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => {
                      const pageIds = paged.map(r => r.id);
                      if (allSelected) onToggleSelect(selectedIds.filter(id => !pageIds.includes(id)));
                      else onToggleSelect([...new Set([...selectedIds, ...pageIds])]);
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium text-xs uppercase tracking-wider ${col.sortable !== false ? 'cursor-pointer select-none hover:text-gray-700 transition-colors' : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-blue-500">
                        {sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {renderActions && <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.map(row => (
              <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds?.includes(row.id) || false}
                      onChange={() => {
                        onToggleSelect(selectedIds.includes(row.id) ? selectedIds.filter(id => id !== row.id) : [...selectedIds, row.id]);
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                    {col.render ? col.render(row) : (row[col.key] ?? '-')}
                  </td>
                ))}
                {renderActions && <td className="px-4 py-3">{renderActions(row)}</td>}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0)} className="text-center py-12 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span className="text-sm">Tidak ada data</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden divide-y divide-gray-100">
        {paged.map(row => (
          <div key={row.id} className="p-4 bg-white hover:bg-gray-50/50 transition-colors">
            {selectable && (
              <div className="mb-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds?.includes(row.id) || false}
                    onChange={() => {
                      onToggleSelect(selectedIds.includes(row.id) ? selectedIds.filter(id => id !== row.id) : [...selectedIds, row.id]);
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-xs text-gray-400">Pilih</span>
                </label>
              </div>
            )}
            <div className="space-y-2">
              {columns.map(col => (
                <div key={col.key} className="flex justify-between items-start text-sm gap-4">
                  <span className="text-gray-500 shrink-0">{col.label}</span>
                  <span className={`font-medium text-right ${col.className || ''}`}>
                    {col.render ? col.render(row) : (row[col.key] ?? '-')}
                  </span>
                </div>
              ))}
            </div>
            {renderActions && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                {renderActions(row)}
              </div>
            )}
          </div>
        ))}
        {paged.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <span className="text-sm">Tidak ada data</span>
          </div>
        )}
      </div>

      {/* Pagination */}
      {sorted.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
          <span className="text-gray-500">
            <span className="hidden sm:inline">Menampilkan </span>
            {start}-{end} dari {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors hidden sm:block"
              title="Halaman pertama"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 py-1 text-gray-600 font-medium">{safePage}/{totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors hidden sm:block"
              title="Halaman terakhir"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
