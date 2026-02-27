import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Project {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    bin_count: number;
}

interface ProjectBinEntry {
    pb_id: string;
    bin_id: string;
    qty: number;
    note: string | null;
    url: string | null;
    found: boolean;
    title: string;
    description: string;
    color: string | null;
    x: number | null;
    y: number | null;
    layer: number | null;
    drawer: string;
    drawer_id: string | null;
}

interface SearchResult {
    bin_id: string;
    title: string;
    description: string;
    drawer: string;
    layer: number;
    x: number;
    y: number;
    color: string | null;
    items: string[];
    score: number;
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
    const id = 'project-print-style';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
    @media print {
      #root { display: none !important; }
      #project-print-area {
        display: block !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #111827; padding: 24px; max-width: 960px; margin: 0 auto;
      }
      #project-print-area h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
      #project-print-area .meta { font-size: 11px; color: #6b7280; margin-bottom: 20px; }
      #project-print-area table { width: 100%; border-collapse: collapse; font-size: 11px; }
      #project-print-area th { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 7px 10px; text-align: left; font-weight: 600; }
      #project-print-area td { border: 1px solid #e5e7eb; padding: 6px 10px; vertical-align: top; }
      #project-print-area tr:nth-child(even) td { background: #f9fafb; }
      #project-print-area .footer { margin-top: 20px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    }
    @media screen { #project-print-area { display: none !important; } }
  `;
    document.head.appendChild(style);
}

// ─── AddToProjectModal ─────────────────────────────────────────────────────────

function AddModal({
    item,
    existing,
    onConfirm,
    onClose,
}: {
    item: SearchResult;
    existing?: ProjectBinEntry;
    onConfirm: (qty: number, note: string, url: string) => void;
    onClose: () => void;
}) {
    const [qty, setQty] = useState(existing?.qty ?? 1);
    const [note, setNote] = useState(existing?.note ?? '');
    const [url, setUrl] = useState(existing?.url ?? '');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl p-5"
            >
                <div className="flex items-center gap-3 mb-5">
                    {item.color && <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />}
                    <div className="min-w-0">
                        <div className="font-semibold text-sm leading-tight truncate">{item.title}</div>
                        <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                            {item.drawer} — Couche {item.layer} ({item.x}, {item.y})
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1 block">Quantité</label>
                        <input type="number" min={1} value={qty}
                            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                            autoFocus
                            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm text-center focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1 block">Note</label>
                        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                            placeholder="Note optionnelle..."
                            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1 block">Lien Datasheet / PDF</label>
                        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-5">
                    <button onClick={onClose}
                        className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm hover:bg-[var(--color-bg-secondary)] transition-colors">
                        Annuler
                    </button>
                    <button onClick={() => { onConfirm(qty, note, url); onClose(); }}
                        className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-medium hover:from-teal-600 hover:to-emerald-700 transition-all">
                        {existing ? 'Mettre à jour' : '+ Ajouter au projet'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── ProjectFormModal ──────────────────────────────────────────────────────────

function ProjectFormModal({
    initial,
    onSave,
    onClose,
}: {
    initial?: { name: string; description: string };
    onSave: (name: string, description: string) => Promise<void>;
    onClose: () => void;
}) {
    const [name, setName] = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        try { await onSave(name.trim(), description.trim()); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl p-6"
            >
                <h3 className="text-lg font-bold mb-5">{initial ? 'Modifier le projet' : 'Nouveau projet'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1 block">Nom *</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus
                            placeholder="ex: Régulateur 5V, Projet LED..."
                            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1 block">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm hover:bg-[var(--color-bg-secondary)] transition-colors">
                            Annuler
                        </button>
                        <button type="submit" disabled={loading || !name.trim()}
                            className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50">
                            {loading ? '...' : initial ? 'Sauvegarder' : 'Créer'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectManager() {
    // Project state
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [projectBins, setProjectBins] = useState<ProjectBinEntry[]>([]);
    const [loadingBins, setLoadingBins] = useState(false);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Modal state
    const [modal, setModal] = useState<SearchResult | null>(null);
    // editBin: auto-open AddModal to edit after adding, or manually via pencil icon
    const [editBin, setEditBin] = useState<{ item: SearchResult; existing: ProjectBinEntry } | null>(null);

    const debouncedQuery = useDebounce(searchQuery, 300);

    useEffect(() => { injectPrintStyles(); }, []);


    // ─── Load projects ───────────────────────────────────────────────────────

    const loadProjects = useCallback(async () => {
        try {
            const data = await apiClient.listProjects();
            setProjects(data);
            if (data.length > 0 && !selectedProject) {
                // Auto-select first project
                setSelectedProject(data[0]);
            }
        } catch { /* ignore */ }
    }, [selectedProject]);

    useEffect(() => { loadProjects(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Load bins on project change ──────────────────────────────────────────

    const loadProjectBins = useCallback(async (projectId: string) => {
        setLoadingBins(true);
        try {
            const data = await apiClient.getProjectBins(projectId);
            setProjectBins(data);
        } catch { setProjectBins([]); }
        finally { setLoadingBins(false); }
    }, []);

    useEffect(() => {
        if (selectedProject) loadProjectBins(selectedProject.id);
    }, [selectedProject, loadProjectBins]);

    // ─── BOM Search ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (!debouncedQuery.trim()) { setSearchResults([]); return; }
        setSearchLoading(true);
        apiClient.searchBOM(debouncedQuery)
            .then(setSearchResults)
            .catch(() => setSearchResults([]))
            .finally(() => setSearchLoading(false));
    }, [debouncedQuery]);

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    const handleCreate = async (name: string, description: string) => {
        const p = await apiClient.createProject({ name, description: description || undefined });
        setProjects((prev) => [p, ...prev]);
        setSelectedProject(p);
        setProjectBins([]);
        setShowProjectForm(false);
    };

    const handleUpdate = async (name: string, description: string) => {
        if (!editingProject) return;
        const updated = await apiClient.updateProject(editingProject.id, { name, description });
        setProjects((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p));
        setSelectedProject((prev) => prev ? { ...prev, ...updated } : prev);
        setEditingProject(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce projet ?')) return;
        await apiClient.deleteProject(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (selectedProject?.id === id) {
            const remaining = projects.filter((p) => p.id !== id);
            setSelectedProject(remaining[0] ?? null);
            setProjectBins([]);
        }
    };

    // ─── Add / Remove bins ────────────────────────────────────────────────────

    const handleConfirmAdd = async (item: SearchResult, qty: number, note: string, url: string) => {
        if (!selectedProject) return;
        try {
            await apiClient.addProjectBin(selectedProject.id, {
                bin_id: item.bin_id, qty, note: note || undefined, url: url || undefined,
            });
            await loadProjectBins(selectedProject.id);
            setProjects((prev) => prev.map((p) =>
                p.id === selectedProject.id ? { ...p, bin_count: p.bin_count + 1 } : p
            ));
            // Auto-open edit modal immediately after adding so user can fill url/qty
            const updatedBins = await apiClient.getProjectBins(selectedProject.id);
            setProjectBins(updatedBins);
            const justAdded = updatedBins.find((pb) => pb.bin_id === item.bin_id);
            if (justAdded) setEditBin({ item, existing: justAdded });
        } catch { /* ignore */ }
    };

    const handleRemoveBin = async (pbId: string) => {
        if (!selectedProject) return;
        try {
            await apiClient.removeProjectBin(selectedProject.id, pbId);
            setProjectBins((prev) => prev.filter((pb) => pb.pb_id !== pbId));
            setProjects((prev) => prev.map((p) =>
                p.id === selectedProject.id ? { ...p, bin_count: Math.max(0, p.bin_count - 1) } : p
            ));
        } catch { /* ignore */ }
    };

    const handleUpdateBin = async (pb: ProjectBinEntry, qty: number, note: string, url: string) => {
        if (!selectedProject) return;
        try {
            await apiClient.addProjectBin(selectedProject.id, {
                bin_id: pb.bin_id, qty, note: note || undefined, url: url || undefined,
            });
            await loadProjectBins(selectedProject.id);
        } catch { /* ignore */ }
    };

    const isInProject = (binId: string) => projectBins.some((pb) => pb.bin_id === binId);
    const getExisting = (binId: string) => projectBins.find((pb) => pb.bin_id === binId);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="h-full overflow-y-auto bg-[var(--color-bg-secondary)] p-4 sm:p-6">
            {/* Print portal */}
            {createPortal(
                <div id="project-print-area">
                    <h1>BOM Projet — {selectedProject?.name ?? ''}</h1>
                    <div className="meta">
                        Généré le {new Date().toLocaleDateString('fr-FR')} • {projectBins.length} composant(s)
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th><th>Composant</th><th>Tiroir</th><th>Couche</th>
                                <th>Position</th><th>Qté</th><th>Note</th><th>Lien</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projectBins.map((pb, i) => (
                                <tr key={pb.pb_id}>
                                    <td>{i + 1}</td><td>{pb.title}</td><td>{pb.drawer}</td>
                                    <td>{pb.layer ?? '—'}</td>
                                    <td>{pb.x !== null ? `(${pb.x}, ${pb.y})` : '—'}</td>
                                    <td>{pb.qty}</td><td>{pb.note ?? ''}</td><td>{pb.url ?? ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="footer">Document généré par ScanGRID</div>
                </div>,
                document.body
            )}

            {/* Modals */}
            {modal && selectedProject && (
                <AddModal
                    item={modal}
                    existing={getExisting(modal.bin_id) as ProjectBinEntry | undefined}
                    onConfirm={(qty, note, url) => handleConfirmAdd(modal, qty, note, url)}
                    onClose={() => setModal(null)}
                />
            )}
            {/* Auto-edit modal: appears right after adding, to let user fill url/qty */}
            {editBin && selectedProject && (
                <AddModal
                    item={editBin.item}
                    existing={editBin.existing}
                    onConfirm={(qty, note, url) => handleUpdateBin(editBin.existing, qty, note, url)}
                    onClose={() => setEditBin(null)}
                />
            )}
            {(showProjectForm || editingProject) && (
                <ProjectFormModal
                    initial={editingProject ? { name: editingProject.name, description: editingProject.description ?? '' } : undefined}
                    onSave={editingProject ? handleUpdate : handleCreate}
                    onClose={() => { setShowProjectForm(false); setEditingProject(null); }}
                />
            )}

            <div className="max-w-7xl mx-auto space-y-4">
                {/* Header */}
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold">Gestion de Projets</h2>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                Cliquez sur un composant pour l'associer au projet sélectionné.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {selectedProject && (
                                <>
                                    <button onClick={() => apiClient.downloadProjectCSV(selectedProject.id, selectedProject.name)}
                                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                        </svg>
                                        Export CSV
                                    </button>
                                    <button onClick={() => window.print()}
                                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        PDF
                                    </button>
                                </>
                            )}
                            <button onClick={() => setShowProjectForm(true)}
                                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Nouveau projet
                            </button>
                        </div>
                    </div>

                    {/* Project selector row */}
                    {projects.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 items-center">
                            <span className="text-xs text-[var(--color-text-secondary)] font-medium shrink-0">Projet :</span>
                            {projects.map((p) => (
                                <div key={p.id} className="relative group flex items-center gap-1">
                                    <button
                                        onClick={() => setSelectedProject(p)}
                                        className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl border transition-all ${selectedProject?.id === p.id
                                            ? 'bg-teal-500/10 border-teal-400 text-teal-600 dark:text-teal-400 font-medium'
                                            : 'border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]'
                                            }`}
                                    >
                                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                        {p.name}
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedProject?.id === p.id
                                            ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400'
                                            : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                                            }`}>
                                            {p.bin_count}
                                        </span>
                                    </button>
                                    {/* Quick edit/delete on hover */}
                                    <div className="hidden group-hover:flex items-center gap-0.5 ml-0.5">
                                        <button onClick={() => setEditingProject(p)}
                                            className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => handleDelete(p.id)}
                                            className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Search bar */}
                    <div className="mt-4 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher un composant à associer au projet..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm focus:outline-none focus:border-teal-500 transition-colors"
                        />
                        {searchLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-4">
                    {/* Search results */}
                    <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-[var(--color-border)]">
                            <h3 className="font-semibold text-sm">
                                Inventaire{' '}
                                {searchResults.length > 0 && (
                                    <span className="text-[var(--color-text-secondary)] font-normal">({searchResults.length} résultat{searchResults.length !== 1 ? 's' : ''})</span>
                                )}
                            </h3>
                        </div>

                        {searchResults.length === 0 ? (
                            <div className="p-8 text-center text-[var(--color-text-secondary)] text-sm">
                                {searchQuery ? 'Aucun composant trouvé.' : 'Entrez un terme pour rechercher des composants.'}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[var(--color-border)]">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Composant</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide hidden sm:table-cell">Localisation</th>
                                            <th className="px-4 py-3 w-24" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence mode="popLayout">
                                            {searchResults.map((item) => {
                                                const inProject = isInProject(item.bin_id);
                                                return (
                                                    <motion.tr
                                                        key={item.bin_id}
                                                        layout
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        onClick={() => selectedProject && setModal(item)}
                                                        className={`border-b border-[var(--color-border)] last:border-0 transition-colors group ${selectedProject
                                                            ? 'hover:bg-teal-500/5 cursor-pointer'
                                                            : 'opacity-50'
                                                            }`}
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
                                                                        <div className="text-xs text-teal-500 mt-0.5 line-clamp-1">
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
                                                        <td className="px-4 py-3 text-right">
                                                            {inProject ? (
                                                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                                    ✓ Ajouté
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-teal-600 dark:text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
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

                    {/* Project components list */}
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-[var(--color-border)]">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                {selectedProject ? selectedProject.name : 'Aucun projet'}
                                {projectBins.length > 0 && (
                                    <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-teal-500 text-white text-[10px] font-bold px-1.5">
                                        {projectBins.length}
                                    </span>
                                )}
                            </h3>
                            {selectedProject?.description && (
                                <p className="text-xs text-[var(--color-text-secondary)] mt-1 truncate">{selectedProject.description}</p>
                            )}
                        </div>

                        {!selectedProject ? (
                            <div className="flex-1 flex items-center justify-center p-6 text-center text-[var(--color-text-secondary)] text-sm">
                                Créez ou sélectionnez un projet ci-dessus.
                            </div>
                        ) : loadingBins ? (
                            <div className="flex-1 flex items-center justify-center p-6">
                                <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : projectBins.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[var(--color-text-secondary)] text-sm gap-3">
                                <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                                </svg>
                                <p>Aucun composant. Recherchez et cliquez pour en ajouter.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]">
                                    <AnimatePresence>
                                        {projectBins.map((pb) => (
                                            <motion.div
                                                key={pb.pb_id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className={`p-3 ${!pb.found ? 'opacity-50' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {pb.color && <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: pb.color }} />}
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium truncate">{pb.title}</div>
                                                            <div className="text-xs text-[var(--color-text-secondary)] truncate">
                                                                {pb.found ? `${pb.drawer} — Couche ${pb.layer}` : '⚠ Bin introuvable'}
                                                            </div>
                                                            {pb.note && <div className="text-xs text-teal-500 mt-0.5 truncate">📝 {pb.note}</div>}
                                                            {pb.url && (
                                                                <a href={pb.url} target="_blank" rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="flex items-center gap-1 text-xs text-blue-500 hover:underline mt-0.5 truncate">
                                                                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                    </svg>
                                                                    <span className="truncate">Datasheet</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <span className="font-mono text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] px-1.5 py-0.5 rounded-lg">
                                                            ×{pb.qty}
                                                        </span>
                                                        {/* Edit button */}
                                                        <button
                                                            onClick={() => {
                                                                // Build a SearchResult-like object to reuse AddModal
                                                                const fakeResult: SearchResult = {
                                                                    bin_id: pb.bin_id,
                                                                    title: pb.title,
                                                                    description: pb.description,
                                                                    drawer: pb.drawer,
                                                                    layer: pb.layer ?? 0,
                                                                    x: pb.x ?? 0,
                                                                    y: pb.y ?? 0,
                                                                    color: pb.color,
                                                                    items: [],
                                                                    score: 1,
                                                                };
                                                                setEditBin({ item: fakeResult, existing: pb });
                                                            }}
                                                            className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                            title="Modifier (quantité, note, lien)"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => handleRemoveBin(pb.pb_id)}
                                                            className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                <div className="p-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                                    {projectBins.length} référence(s) • {projectBins.reduce((s, pb) => s + pb.qty, 0)} pièce(s)
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
