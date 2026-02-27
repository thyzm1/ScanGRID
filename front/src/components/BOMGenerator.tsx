import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BOMResult {
  bin_id: string;
  title: string;
  description: string;
  ref: string;
  category: string | null;
  drawer: string;
  drawer_id: string;
  layer: number;
  x: number;
  y: number;
  color: string | null;
  items: string[];
  score: number;
}

interface CartItem {
  bin_id: string;
  title: string;
  ref: string;
  drawer: string;
  layer: number;
  qty: number;
  unit_price: number;
  url: string;
  color: string | null;
}

// ─── Debounce ─────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState<T>(value);
  useEffect(() => {
    const h = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return dv;
}

// ─── Print styles ─────────────────────────────────────────────────────────────

function injectPrintStyles() {
  const id = 'bom-gen-print-style';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    @media print {
      #root { display: none !important; }
      #bom-print-area {
        display: block !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #111827; padding: 24px; max-width: 900px; margin: 0 auto; position: static;
      }
      #bom-print-area h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
      #bom-print-area .meta { font-size: 11px; color: #6b7280; margin-bottom: 20px; }
      #bom-print-area table { width: 100%; border-collapse: collapse; font-size: 12px; }
      #bom-print-area th { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; font-weight: 600; }
      #bom-print-area td { border: 1px solid #e5e7eb; padding: 7px 10px; vertical-align: top; }
      #bom-print-area tr:nth-child(even) td { background: #f9fafb; }
      #bom-print-area .total { margin-top: 16px; text-align: right; font-size: 14px; font-weight: 700; }
      #bom-print-area .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    }
    @media screen { #bom-print-area { display: none !important; } }
  `;
  document.head.appendChild(style);
}

// ─── Add-to-cart Modal ────────────────────────────────────────────────────────

function AddModal({
  item,
  existing,
  onConfirm,
  onClose,
}: {
  item: BOMResult;
  existing?: CartItem;
  onConfirm: (qty: number, unit_price: number, url: string) => void;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(existing?.qty ?? 1);
  const [price, setPrice] = useState(existing?.unit_price ?? 0);
  const [url, setUrl] = useState(existing?.url ?? '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl p-5"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          {item.color && (
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          )}
          <div className="min-w-0">
            <div className="font-semibold text-sm leading-tight truncate">{item.title}</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {item.drawer} — Couche {item.layer} ({item.x}, {item.y})
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Quantity */}
          <div>
            <label className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1 block">
              Quantité
            </label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              autoFocus
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm text-center focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Price */}
          <div>
            <label className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1 block">
              Prix unitaire (€)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={price || ''}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm text-center focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Datasheet URL */}
          <div>
            <label className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1 block">
              Lien Datasheet / PDF
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Total preview */}
          {price > 0 && (
            <div className="text-xs text-right text-[var(--color-text-secondary)] pt-1">
              Total estimé :{' '}
              <span className="font-bold text-[var(--color-text)]">{(qty * price).toFixed(2)} €</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => { onConfirm(qty, price, url); onClose(); }}
            className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            {existing ? 'Mettre à jour' : '+ Ajouter'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BOMGenerator() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BOMResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modal, setModal] = useState<BOMResult | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => { injectPrintStyles(); }, []);

  useEffect(() => {
    setLoading(true);
    apiClient.searchBOM(debouncedQuery)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handleConfirm = useCallback((item: BOMResult, qty: number, unit_price: number, url: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.bin_id === item.bin_id);
      if (existing) {
        return prev.map((c) => c.bin_id === item.bin_id ? { ...c, qty, unit_price, url } : c);
      }
      return [...prev, {
        bin_id: item.bin_id, title: item.title,
        ref: item.ref || item.title, drawer: item.drawer,
        layer: item.layer, qty, unit_price, url, color: item.color,
      }];
    });
  }, []);

  const updateCartItem = useCallback((bin_id: string, field: 'qty' | 'unit_price', value: number) => {
    setCart((prev) => prev.map((c) => c.bin_id === bin_id ? { ...c, [field]: value } : c));
  }, []);

  const removeFromCart = useCallback((bin_id: string) => {
    setCart((prev) => prev.filter((c) => c.bin_id !== bin_id));
  }, []);

  const totalPrice = cart.reduce((s, c) => s + c.qty * c.unit_price, 0);
  const cartEntry = (bin_id: string) => cart.find((c) => c.bin_id === bin_id);

  return (
    <div className="h-full overflow-y-auto bg-[var(--color-bg-secondary)] p-4 sm:p-6">
      {/* Print portal */}
      {createPortal(
        <div id="bom-print-area">
          <h1>Nomenclature BOM — ScanGRID</h1>
          <div className="meta">
            Généré le {new Date().toLocaleDateString('fr-FR')} à{' '}
            {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {' '}• {cart.length} référence(s)
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Référence</th><th>Désignation</th>
                <th>Localisation</th><th>Qté</th><th>Prix unit. (€)</th><th>Total (€)</th><th>Lien</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, i) => (
                <tr key={item.bin_id}>
                  <td>{i + 1}</td>
                  <td>{item.ref}</td>
                  <td>{item.title}</td>
                  <td>{item.drawer} — Couche {item.layer}</td>
                  <td>{item.qty}</td>
                  <td>{item.unit_price > 0 ? item.unit_price.toFixed(2) : '—'}</td>
                  <td>{item.unit_price > 0 ? (item.qty * item.unit_price).toFixed(2) : '—'}</td>
                  <td>{item.url || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPrice > 0 && <div className="total">Total : {totalPrice.toFixed(2)} €</div>}
          <div className="footer">Document généré par ScanGRID — Gestionnaire d'inventaire Gridfinity</div>
        </div>,
        document.body
      )}

      {/* Add modal */}
      {modal && (
        <AddModal
          item={modal}
          existing={cartEntry(modal.bin_id)}
          onConfirm={(qty, price, url) => handleConfirm(modal, qty, price, url)}
          onClose={() => setModal(null)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">BOM Generator</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Cliquez sur une ligne pour ajouter un composant au panier.
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exporter PDF
              </button>
            )}
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un composant…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Results */}
          <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)]">
              <h3 className="font-semibold text-sm">
                Résultats{' '}
                <span className="text-[var(--color-text-secondary)] font-normal">
                  ({results.length} composant{results.length !== 1 ? 's' : ''})
                </span>
              </h3>
            </div>

            {results.length === 0 && !loading ? (
              <div className="p-8 text-center text-[var(--color-text-secondary)] text-sm">
                {query ? 'Aucun composant trouvé.' : 'Entrez un terme de recherche.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Composant</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide hidden sm:table-cell">Localisation</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide hidden md:table-cell">Catégorie</th>
                      <th className="px-4 py-3 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {results.map((item) => {
                        const inCart = cartEntry(item.bin_id);
                        return (
                          <motion.tr
                            key={item.bin_id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setModal(item)}
                            className="border-b border-[var(--color-border)] last:border-0 hover:bg-blue-500/5 transition-colors cursor-pointer group"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                {item.color && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />}
                                <div>
                                  <div className="font-medium leading-snug">{item.title}</div>
                                  {item.description && (
                                    <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">{item.description}</div>
                                  )}
                                  {item.items.length > 0 && (
                                    <div className="text-xs text-blue-500 mt-0.5 line-clamp-1">
                                      {item.items.slice(0, 3).join(' · ')}{item.items.length > 3 && ` +${item.items.length - 3}`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)] hidden sm:table-cell">
                              <div>{item.drawer}</div>
                              <div>Couche {item.layer} — ({item.x}, {item.y})</div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              {item.category ? (
                                <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">{item.category}</span>
                              ) : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {inCart ? (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                  ✓ ×{inCart.qty}
                                </span>
                              ) : (
                                <span className="text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                  + Ajouter
                                </span>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Panier
                {cart.length > 0 && (
                  <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold px-1.5">
                    {cart.length}
                  </span>
                )}
              </h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-[var(--color-text-secondary)] hover:text-red-500 transition-colors">Vider</button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[var(--color-text-secondary)] text-sm gap-3">
                <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>Cliquez sur un composant pour l'ajouter</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]">
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.div
                        key={item.bin_id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-3"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {item.color && <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.color }} />}
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{item.title}</div>
                              <div className="text-xs text-[var(--color-text-secondary)] truncate">{item.drawer}</div>
                            </div>
                          </div>
                          <button onClick={() => removeFromCart(item.bin_id)} className="text-[var(--color-text-secondary)] hover:text-red-500 transition-colors shrink-0 p-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-[var(--color-text-secondary)] uppercase font-semibold tracking-wide mb-1 block">Qté</label>
                            <input type="number" min={1} value={item.qty}
                              onChange={(e) => updateCartItem(item.bin_id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-2 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm text-center focus:outline-none focus:border-blue-500 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--color-text-secondary)] uppercase font-semibold tracking-wide mb-1 block">Prix (€)</label>
                            <input type="number" min={0} step={0.01} value={item.unit_price || ''}
                              onChange={(e) => updateCartItem(item.bin_id, 'unit_price', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="w-full px-2 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm text-center focus:outline-none focus:border-blue-500 transition-colors"
                            />
                          </div>
                        </div>

                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer"
                            className="mt-1.5 flex items-center gap-1 text-xs text-blue-500 hover:underline truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span className="truncate">{item.url}</span>
                          </a>
                        )}

                        {item.unit_price > 0 && (
                          <div className="text-xs text-right text-[var(--color-text-secondary)] mt-1.5">
                            Total : <span className="font-semibold text-[var(--color-text)]">{(item.qty * item.unit_price).toFixed(2)} €</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="p-4 border-t border-[var(--color-border)] space-y-3">
                  {totalPrice > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-secondary)]">Total estimé</span>
                      <span className="font-bold text-lg">{totalPrice.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="text-xs text-[var(--color-text-secondary)] text-center">
                    {cart.reduce((a, c) => a + c.qty, 0)} pièce(s) • {cart.length} référence(s)
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-all text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimer / PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
