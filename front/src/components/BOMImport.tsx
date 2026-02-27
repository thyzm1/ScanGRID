import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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

interface AIComponent {
    designation: string;
    qty: number;
    reference: string;
    package: string;
}

// ─── Print styles ─────────────────────────────────────────────────────────────

const PRINT_STYLE_ID = 'bom-import-print-style';

function injectPrintStyles() {
    if (document.getElementById(PRINT_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = PRINT_STYLE_ID;
    style.textContent = `
    @media print {
      /* Hide the React app root — portal is mounted in body directly */
      #root { display: none !important; }
      #bom-import-print-area {
        display: block !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #111827;
        padding: 24px;
        max-width: 960px;
        margin: 0 auto;
        position: static;
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
    @media screen {
      #bom-import-print-area { display: none !important; }
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
    const [pdfLoading, setPdfLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiComponents, setAiComponents] = useState<AIComponent[]>([]);
    const [aiModel, setAiModel] = useState('');
    const [aiAnalyzed, setAiAnalyzed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analyzed, setAnalyzed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Inject print styles once
    injectPrintStyles();

    // ─── PDF file upload ───────────────────────────────────────────────────────

    const handlePdfUpload = async (file: File) => {
        if (!file || file.type !== 'application/pdf') {
            setError('Veuillez sélectionner un fichier PDF valide.');
            return;
        }
        setPdfLoading(true);
        setError(null);
        try {
            const extracted = await apiClient.extractPDFText(file);
            const lines = extracted.lines.filter((l: string) => l.trim().length > 0);
            setInputText(lines.join('\n'));
            setAnalyzed(false);
            setResults([]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur lors de l\'extraction du PDF');
        } finally {
            setPdfLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handlePdfUpload(file);
        // reset input so same file can be re-selected
        e.target.value = '';
    };

    // ─── BOM analysis ─────────────────────────────────────────────────────────

    const handleAnalyze = async () => {
        if (!inputText.trim()) return;
        const lines = inputText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
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

    const handleAIAnalyze = async () => {
        if (!inputText.trim()) return;
        setAiLoading(true);
        setError(null);
        setAiAnalyzed(false);
        try {
            const data = await apiClient.analyzeBOMWithAI(inputText);
            setAiComponents(data.components);
            setAiModel(data.model);
            setAiAnalyzed(true);
            // Auto-populate textarea with AI-cleaned designations for easy further matching
            if (data.components.length > 0) {
                const lines = data.components.map(
                    (c) => c.reference ? `${c.reference} ${c.designation}` : c.designation
                );
                setInputText(lines.join('\n'));
                setAnalyzed(false);
                setResults([]);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur IA');
        } finally {
            setAiLoading(false);
        }
    };

    const handleExportPDF = () => window.print();

    const stats = {
        exact: results.filter((r) => r.status === 'exact').length,
        proche: results.filter((r) => r.status === 'proche').length,
        absent: results.filter((r) => r.status === 'absent').length,
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="h-full overflow-y-auto bg-[var(--color-bg-secondary)] p-4 sm:p-6">
            {/* Print Area — portal mounted directly in <body> to avoid blank PDF */}
            {createPortal(
                <div id="bom-import-print-area">
                    <h1>Rapport d'analyse BOM — ScanGRID</h1>
                    <div className="meta">
                        Généré le {new Date().toLocaleDateString('fr-FR')} à{' '}
                        {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {' '}• {results.length} ligne(s) — {stats.exact} exact(s), {stats.proche} proche(s), {stats.absent} absent(s)
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
                                    <td><span className={`badge ${r.status}`}>{STATUS_CONFIG[r.status].label}</span></td>
                                    <td>{Math.round(r.confidence * 100)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="footer">
                        Document généré par ScanGRID — Gestionnaire d'inventaire Gridfinity
                    </div>
                </div>,
                document.body
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
            />

            <div className="max-w-6xl mx-auto space-y-4">
                {/* Header */}
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold">Import BOM</h2>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                Importez un PDF ou collez votre nomenclature pour trouver les correspondances dans votre inventaire.
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

                    {/* PDF Upload + Textarea */}
                    <div className="mt-4 space-y-3">

                        {/* Import PDF button */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-[var(--color-border)] rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-500/5 transition-all group"
                        >
                            {pdfLoading ? (
                                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    Extraction du texte PDF en cours...
                                </div>
                            ) : (
                                <>
                                    <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-medium text-blue-600 dark:text-blue-400">Importer un fichier PDF</span>
                                        <span className="text-[var(--color-text-secondary)]"> — le texte sera extrait automatiquement</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                            <div className="flex-1 h-px bg-[var(--color-border)]" />
                            ou saisir manuellement
                            <div className="flex-1 h-px bg-[var(--color-border)]" />
                        </div>

                        <textarea
                            value={inputText}
                            onChange={(e) => {
                                setInputText(e.target.value);
                                if (analyzed) setAnalyzed(false);
                            }}
                            placeholder={`Une référence par ligne, par exemple :\n${EXAMPLE_TEXT}`}
                            rows={7}
                            className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm resize-y focus:outline-none focus:border-blue-500 transition-colors font-mono leading-relaxed"
                        />

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={handleAnalyze}
                                disabled={!inputText.trim() || loading}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Analyse en cours...</>
                                ) : (
                                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>Analyser la BOM</>
                                )}
                            </button>

                            {/* AI parse button */}
                            <button
                                onClick={handleAIAnalyze}
                                disabled={!inputText.trim() || aiLoading}
                                title="Filtrage intelligent par IA locale (Ollama llama3.2:3b)"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {aiLoading ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />IA en cours (~30s)...</>
                                ) : (
                                    <>🤖 Filtrer avec IA</>
                                )}
                            </button>

                            {inputText ? (
                                <button
                                    onClick={() => { setInputText(''); setResults([]); setAnalyzed(false); setAiComponents([]); setAiAnalyzed(false); }}
                                    className="px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                                >
                                    Effacer
                                </button>
                            ) : (
                                <button
                                    onClick={() => setInputText(EXAMPLE_TEXT)}
                                    className="px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                                >
                                    Charger un exemple
                                </button>
                            )}
                        </div>

                        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                        {/* AI Loading progress bar */}
                        {aiLoading && (
                            <div className="mt-1 space-y-2">
                                <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                                    <span className="flex items-center gap-1.5">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                        Ollama (llama3.2:3b) analyse votre BOM…
                                    </span>
                                    <span className="text-violet-500 font-medium">~15–60s</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                                        style={{
                                            animation: 'ai-progress 2s ease-in-out infinite',
                                        }}
                                    />
                                </div>
                                <style>{`
                                    @keyframes ai-progress {
                                        0%   { width: 5%;  margin-left: 0%; }
                                        50%  { width: 60%; margin-left: 20%; }
                                        100% { width: 5%;  margin-left: 95%; }
                                    }
                                `}</style>
                            </div>
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
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                {(['exact', 'proche', 'absent'] as const).map((s) => {
                                    const colors = {
                                        exact: 'border-emerald-300/50 bg-emerald-50/60 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 text-emerald-700 dark:text-emerald-500',
                                        proche: 'border-amber-300/50 bg-amber-50/60 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 text-amber-700 dark:text-amber-500',
                                        absent: 'border-red-300/50 bg-red-50/60 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-red-700 dark:text-red-500',
                                    }[s];
                                    return (
                                        <div key={s} className={`rounded-2xl border p-4 text-center ${colors}`}>
                                            <div className="text-2xl font-bold">{stats[s]}</div>
                                            <div className="text-xs font-medium mt-0.5 capitalize">{STATUS_CONFIG[s].label}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Table */}
                            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-[var(--color-border)]">
                                    <h3 className="font-semibold text-sm">
                                        Résultats —{' '}
                                        <span className="text-[var(--color-text-secondary)] font-normal">{results.length} ligne(s)</span>
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-[var(--color-border)]">
                                                {['Ligne originale', 'Correspondance', 'Raison', 'Statut', 'Confiance'].map((h, i) => (
                                                    <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide ${i >= 1 && i <= 2 ? 'hidden sm:table-cell' : i === 4 ? 'hidden sm:table-cell text-right' : ''}`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map((result, i) => {
                                                const cfg = STATUS_CONFIG[result.status];
                                                return (
                                                    <tr key={i} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-secondary)] transition-colors">
                                                        <td className="px-4 py-3">
                                                            <span className="font-mono text-xs text-[var(--color-text-secondary)]">{result.original_line}</span>
                                                        </td>
                                                        <td className="px-4 py-3 hidden sm:table-cell">
                                                            {result.matched_title ? (
                                                                <div>
                                                                    <div className="font-medium text-sm">{result.matched_title}</div>
                                                                    {result.drawer && (
                                                                        <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{result.drawer} — Couche {result.layer}</div>
                                                                    )}
                                                                </div>
                                                            ) : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                                                        </td>
                                                        <td className="px-4 py-3 hidden sm:table-cell">
                                                            <span className="text-xs text-[var(--color-text-secondary)]">{result.similarity_reason}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
                                                                {cfg.icon} {cfg.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 hidden sm:table-cell">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="w-16 h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${result.status === 'exact' ? 'bg-emerald-500' : result.status === 'proche' ? 'bg-amber-500' : 'bg-red-500'}`}
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

                {/* AI Results */}
                <AnimatePresence>
                    {aiAnalyzed && aiComponents.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-2xl border border-violet-300/50 dark:border-violet-700/50 bg-[var(--color-bg)] shadow-sm overflow-hidden"
                        >
                            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    🤖 Résultat IA
                                    <span className="text-[var(--color-text-secondary)] font-normal text-xs">({aiModel})</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-medium">
                                        {aiComponents.length} composant{aiComponents.length !== 1 ? 's' : ''}
                                    </span>
                                </h3>
                                <span className="text-xs text-[var(--color-text-secondary)]">
                                    Le texte a été nettoyé et réinjecté dans la zone de saisie
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[var(--color-border)]">
                                            {['#', 'Désignation', 'Réf. schéma', 'Boîtier', 'Qté'].map((h) => (
                                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aiComponents.map((c, i) => (
                                            <tr key={i} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-secondary)] transition-colors">
                                                <td className="px-4 py-2.5 text-xs text-[var(--color-text-secondary)]">{i + 1}</td>
                                                <td className="px-4 py-2.5 font-medium">{c.designation}</td>
                                                <td className="px-4 py-2.5 font-mono text-xs text-blue-500">{c.reference || '—'}</td>
                                                <td className="px-4 py-2.5 text-xs">
                                                    {c.package ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">{c.package}</span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="font-mono text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] px-2 py-0.5 rounded-lg">×{c.qty}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
