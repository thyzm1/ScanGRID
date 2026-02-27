import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MatchResult {
    original_line: string;
    matched_id: string | null;
    matched_title: string | null;
    drawer: string | null;
    layer: number | null;
    similarity_reason: string;
    status: 'exact' | 'proche' | 'absent';
    confidence: number;
}

// ─── Print styles ─────────────────────────────────────────────────────────────

const PRINT_STYLE_ID = 'bom-import-print-style';

function injectPrintStyles() {
    if (document.getElementById(PRINT_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = PRINT_STYLE_ID;
    style.textContent = `
    @media print {
      body > * { display: none !important; }
      #bom-import-print-area { display: block !important; }
      #bom-import-print-area {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #111827;
        padding: 24px;
        max-width: 960px;
        margin: 0 auto;
      }
      #bom-import-print-area h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
      #bom-import-print-area .meta { font-size: 11px; color: #6b7280; margin-bottom: 20px; }
      #bom-import-print-area table { width: 100%; border-collapse: collapse; font-size: 11px; }
      #bom-import-print-area th {
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
        padding: 7px 10px;
        text-align: left;
        font-weight: 600;
      }
      #bom-import-print-area td { border: 1px solid #e5e7eb; padding: 6px 10px; vertical-align: top; }
      #bom-import-print-area tr:nth-child(even) td { background: #f9fafb; }
      #bom-import-print-area .badge { font-weight: 600; }
      #bom-import-print-area .exact { color: #059669; }
      #bom-import-print-area .proche { color: #d97706; }
      #bom-import-print-area .absent { color: #dc2626; }
      #bom-import-print-area .footer {
        margin-top: 20px;
        font-size: 10px;
        color: #9ca3af;
        border-top: 1px solid #e5e7eb;
        padding-top: 8px;
      }
    }
  `;
    document.head.appendChild(style);
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    exact: {
        label: 'Exact',
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        icon: '✓',
    },
    proche: {
        label: 'Proche',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        icon: '~',
    },
    absent: {
        label: 'Absent',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        icon: '✗',
    },
} as const;

// ─── Example BOM text ─────────────────────────────────────────────────────────

const EXAMPLE_TEXT = `Résistance 10k 0603 5%
Condensateur 100nF 0402
LED rouge 3mm
Vis M3x8 tête cylindrique
Arduino Nano
Bouton poussoir momentané`;

// ─── Component ───────────────────────────────────────────────────────────────

export default function BOMImport() {
    const [inputText, setInputText] = useState('');
    const [results, setResults] = useState<MatchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analyzed, setAnalyzed] = useState(false);

    // Inject print styles once
    useState(() => { injectPrintStyles(); });

    const handleAnalyze = async () => {
        if (!inputText.trim()) return;

        const lines = inputText
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

        if (lines.length === 0) return;

        setLoading(true);
        setError(null);
        setAnalyzed(false);

        try {
            const data = await apiClient.matchBOM(lines);
            setResults(data.results);
            setAnalyzed(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur lors de l\'analyse');
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        window.print();
    };

    const stats = {
        exact: results.filter((r) => r.status === 'exact').length,
        proche: results.filter((r) => r.status === 'proche').length,
        absent: results.filter((r) => r.status === 'absent').length,
    };

    return (
        <div className="h-full overflow-y-auto bg-[var(--color-bg-secondary)] p-4 sm:p-6">
            {/* Hidden Print Area */}
            <div id="bom-import-print-area" style={{ display: 'none' }}>
                <h1>Rapport d'analyse BOM — ScanGRID</h1>
                <div className="meta">
                    Généré le {new Date().toLocaleDateString('fr-FR')} à{' '}
                    {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {' '}• {results.length} ligne(s) analysée(s) — {stats.exact} exact(s), {stats.proche} proche(s), {stats.absent} absent(s)
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Ligne originale</th>
                            <th>Composant trouvé</th>
                            <th>Localisation</th>
                            <th>Raison</th>
                            <th>Statut</th>
                            <th>Confiance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((r, i) => (
                            <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{r.original_line}</td>
                                <td>{r.matched_title || '—'}</td>
                                <td>{r.drawer ? `${r.drawer} — Couche ${r.layer}` : '—'}</td>
                                <td>{r.similarity_reason}</td>
                                <td>
                                    <span className={`badge ${r.status}`}>
                                        {STATUS_CONFIG[r.status].label}
                                    </span>
                                </td>
                                <td>{Math.round(r.confidence * 100)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="footer">
                    Document généré par ScanGRID — Gestionnaire d'inventaire Gridfinity
                </div>
            </div>

            <div className="max-w-6xl mx-auto space-y-4">
                {/* Header */}
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold">Import BOM</h2>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                Collez votre nomenclature (texte extrait d'un PDF) et trouvez les correspondances dans votre inventaire.
                            </p>
                        </div>
                        {analyzed && results.length > 0 && (
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Exporter rapport PDF
                            </button>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="mt-4 space-y-3">
                        <div className="relative">
                            <textarea
                                value={inputText}
                                onChange={(e) => {
                                    setInputText(e.target.value);
                                    if (analyzed) setAnalyzed(false);
                                }}
                                placeholder={`Une référence par ligne, par exemple :\n${EXAMPLE_TEXT}`}
                                rows={8}
                                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm resize-y focus:outline-none focus:border-blue-500 transition-colors font-mono leading-relaxed"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={handleAnalyze}
                                disabled={!inputText.trim() || loading}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Analyse en cours...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                        Analyser la BOM
                                    </>
                                )}
                            </button>

                            {inputText && (
                                <button
                                    onClick={() => { setInputText(''); setResults([]); setAnalyzed(false); }}
                                    className="px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                                >
                                    Effacer
                                </button>
                            )}

                            {!inputText && (
                                <button
                                    onClick={() => setInputText(EXAMPLE_TEXT)}
                                    className="px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                                >
                                    Charger un exemple
                                </button>
                            )}
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        )}
                    </div>
                </div>

                {/* Results */}
                <AnimatePresence>
                    {analyzed && results.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {/* Stats Bar */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-2xl border border-emerald-300/50 bg-emerald-50/60 dark:bg-emerald-900/10 p-4 text-center">
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.exact}</div>
                                    <div className="text-xs text-emerald-700 dark:text-emerald-500 font-medium mt-0.5">Exact</div>
                                </div>
                                <div className="rounded-2xl border border-amber-300/50 bg-amber-50/60 dark:bg-amber-900/10 p-4 text-center">
                                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.proche}</div>
                                    <div className="text-xs text-amber-700 dark:text-amber-500 font-medium mt-0.5">Proche</div>
                                </div>
                                <div className="rounded-2xl border border-red-300/50 bg-red-50/60 dark:bg-red-900/10 p-4 text-center">
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</div>
                                    <div className="text-xs text-red-700 dark:text-red-500 font-medium mt-0.5">Absent</div>
                                </div>
                            </div>

                            {/* Results Table */}
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-[var(--color-border)]">
                                    <h3 className="font-semibold text-sm">
                                        Résultats d'analyse —{' '}
                                        <span className="text-[var(--color-text-secondary)] font-normal">
                                            {results.length} ligne(s) traitée(s)
                                        </span>
                                    </h3>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-[var(--color-border)]">
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                                                    Ligne originale
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide hidden sm:table-cell">
                                                    Correspondance trouvée
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide hidden md:table-cell">
                                                    Raison
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                                                    Statut
                                                </th>
                                                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide hidden sm:table-cell">
                                                    Confiance
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map((result, i) => {
                                                const cfg = STATUS_CONFIG[result.status];
                                                return (
                                                    <tr
                                                        key={i}
                                                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-secondary)] transition-colors"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                                                                {result.original_line}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 hidden sm:table-cell">
                                                            {result.matched_title ? (
                                                                <div>
                                                                    <div className="font-medium text-sm">{result.matched_title}</div>
                                                                    {result.drawer && (
                                                                        <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                                                            {result.drawer} — Couche {result.layer}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-[var(--color-text-secondary)]">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 hidden md:table-cell">
                                                            <span className="text-xs text-[var(--color-text-secondary)]">
                                                                {result.similarity_reason}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${cfg.className}`}
                                                            >
                                                                <span>{cfg.icon}</span>
                                                                {cfg.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="w-16 h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all ${result.status === 'exact'
                                                                                ? 'bg-emerald-500'
                                                                                : result.status === 'proche'
                                                                                    ? 'bg-amber-500'
                                                                                    : 'bg-red-500'
                                                                            }`}
                                                                        style={{ width: `${Math.round(result.confidence * 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-[var(--color-text-secondary)] w-9 text-right">
                                                                    {Math.round(result.confidence * 100)}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {analyzed && results.length === 0 && (
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm p-8 text-center text-[var(--color-text-secondary)] text-sm">
                        Aucun résultat. Vérifiez que votre inventaire contient des composants.
                    </div>
                )}
            </div>
        </div>
    );
}
