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

// ─── Print styles ─────────────────────────────────────────────────────────────

function injectProjectPrintStyles() {
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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
        try {
            await onSave(name.trim(), description.trim());
        } finally {
            setLoading(false);
        }
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
                        <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1 block">
                            Nom du projet *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                            placeholder="ex: Régulateur 5V, Projet LED..."
                            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1 block">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Description optionnelle..."
                            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm hover:bg-[var(--color-bg-secondary)] transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : initial ? 'Sauvegarder' : 'Créer'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectManager() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [projectBins, setProjectBins] = useState<ProjectBinEntry[]>([]);
    const [loadingBins, setLoadingBins] = useState(false);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Search state (for adding components)
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [addQty, setAddQty] = useState(1);

    injectProjectPrintStyles();

    // ─── Load projects ───────────────────────────────────────────────────────

    const loadProjects = useCallback(async () => {
        try {
            const data = await apiClient.listProjects();
            setProjects(data);
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => { loadProjects(); }, [loadProjects]);

    // ─── Load project bins when selected ─────────────────────────────────────

    const loadProjectBins = useCallback(async (projectId: string) => {
        setLoadingBins(true);
        try {
            const data = await apiClient.getProjectBins(projectId);
            setProjectBins(data);
        } catch {
            setProjectBins([]);
        } finally {
            setLoadingBins(false);
        }
    }, []);

    const selectProject = (p: Project) => {
        setSelectedProject(p);
        loadProjectBins(p.id);
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    const handleCreate = async (name: string, description: string) => {
        const p = await apiClient.createProject({ name, description: description || undefined });
        setProjects((prev) => [p, ...prev]);
        setShowProjectForm(false);
        selectProject(p);
    };

    const handleUpdate = async (name: string, description: string) => {
        if (!editingProject) return;
        const updated = await apiClient.updateProject(editingProject.id, { name, description });
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
        setSelectedProject((prev) => prev ? { ...prev, ...updated } : prev);
        setEditingProject(null);
    };

    const handleDelete = async (id: string) => {
        await apiClient.deleteProject(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (selectedProject?.id === id) {
            setSelectedProject(null);
            setProjectBins([]);
        }
        setDeleteConfirm(null);
    };

    // ─── BOM Search ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults([]); return; }
        setSearchLoading(true);
        const t = setTimeout(async () => {
            try {
                const data = await apiClient.searchBOM(searchQuery);
                setSearchResults(data);
            } catch {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const handleAddBin = async (binId: string) => {
        if (!selectedProject) return;
        try {
            await apiClient.addProjectBin(selectedProject.id, { bin_id: binId, qty: addQty });
            await loadProjectBins(selectedProject.id);
            // refresh bin_count
            setProjects((prev) =>
                prev.map((p) =>
                    p.id === selectedProject.id ? { ...p, bin_count: p.bin_count + 1 } : p
                )
            );
        } catch { /* ignore */ }
    };

    const handleRemoveBin = async (pbId: string) => {
        if (!selectedProject) return;
        try {
            await apiClient.removeProjectBin(selectedProject.id, pbId);
            setProjectBins((prev) => prev.filter((pb) => pb.pb_id !== pbId));
            setProjects((prev) =>
                prev.map((p) =>
                    p.id === selectedProject.id ? { ...p, bin_count: Math.max(0, p.bin_count - 1) } : p
                )
            );
        } catch { /* ignore */ }
    };

    const handleExportCSV = async () => {
        if (!selectedProject) return;
        await apiClient.downloadProjectCSV(selectedProject.id, selectedProject.name);
    };

    const isInProject = (binId: string) => projectBins.some((pb) => pb.bin_id === binId);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="h-full overflow-hidden flex bg-[var(--color-bg-secondary)]">

            {/* Print portal */}
            {createPortal(
                <div id="project-print-area">
                    <h1>BOM Projet — {selectedProject?.name ?? ''}</h1>
                    <div className="meta">
                        Généré le {new Date().toLocaleDateString('fr-FR')} • {projectBins.length} composant(s)
                        {selectedProject?.description && ` — ${selectedProject.description}`}
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th><th>Référence</th><th>Désignation</th>
                                <th>Tiroir</th><th>Couche</th><th>Position</th><th>Qté</th><th>Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projectBins.map((pb, i) => (
                                <tr key={pb.pb_id}>
                                    <td>{i + 1}</td>
                                    <td>{pb.bin_id.slice(0, 8)}</td>
                                    <td>{pb.title}</td>
                                    <td>{pb.drawer}</td>
                                    <td>{pb.layer ?? '—'}</td>
                                    <td>{pb.x !== null ? `(${pb.x}, ${pb.y})` : '—'}</td>
                                    <td>{pb.qty}</td>
                                    <td>{pb.note ?? ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="footer">Document généré par ScanGRID — Gestionnaire d'inventaire Gridfinity</div>
                </div>,
                document.body
            )}

            {/* Modals */}
            {(showProjectForm || editingProject) && (
                <ProjectFormModal
                    initial={editingProject ? { name: editingProject.name, description: editingProject.description ?? '' } : undefined}
                    onSave={editingProject ? handleUpdate : handleCreate}
                    onClose={() => { setShowProjectForm(false); setEditingProject(null); }}
                />
            )}

            {/* ── Sidebar: project list ── */}
            <div className="w-72 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col">
                <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                    <h2 className="font-bold text-sm">Projets</h2>
                    <button
                        onClick={() => setShowProjectForm(true)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nouveau
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {projects.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[var(--color-text-secondary)]">
                            Aucun projet. Créez-en un !
                        </div>
                    ) : (
                        projects.map((p) => (
                            <div key={p.id} className="group relative">
                                <button
                                    onClick={() => selectProject(p)}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${selectedProject?.id === p.id
                                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                            : 'hover:bg-[var(--color-bg-secondary)]'
                                        }`}
                                >
                                    <div className="font-medium text-sm truncate pr-10">{p.name}</div>
                                    <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                        {p.bin_count} composant{p.bin_count !== 1 ? 's' : ''}
                                    </div>
                                </button>

                                {/* Edit/Delete actions */}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingProject(p); }}
                                        className="p-1 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    {deleteConfirm === p.id ? (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                                className="text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white"
                                            >Confirmer</button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                                                className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)]"
                                            >✕</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p.id); }}
                                            className="p-1 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ── Main panel ── */}
            {selectedProject ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Project header */}
                    <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-between gap-4 shrink-0">
                        <div className="min-w-0">
                            <h3 className="font-bold text-lg truncate">{selectedProject.name}</h3>
                            {selectedProject.description && (
                                <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 truncate">{selectedProject.description}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors ${showSearch ? 'bg-blue-500/10 border-blue-400 text-blue-600 dark:text-blue-400' : 'border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]'
                                    }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Ajouter
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                </svg>
                                CSV
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                PDF
                            </button>
                        </div>
                    </div>

                    {/* Search panel */}
                    <AnimatePresence>
                        {showSearch && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-[var(--color-bg)] border-b border-[var(--color-border)] shrink-0"
                            >
                                <div className="p-4 space-y-3">
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Rechercher un composant..."
                                                autoFocus
                                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                            {searchLoading && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs text-[var(--color-text-secondary)]">Qté</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={addQty}
                                                onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-16 px-2 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm text-center focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="max-h-44 overflow-y-auto rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                                        {searchResults.length === 0 && !searchLoading && searchQuery && (
                                            <div className="p-3 text-xs text-center text-[var(--color-text-secondary)]">Aucun résultat</div>
                                        )}
                                        {searchResults.map((r) => (
                                            <div key={r.bin_id} className="flex items-center justify-between px-3 py-2.5 hover:bg-[var(--color-bg-secondary)] transition-colors">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    {r.color && <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />}
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium truncate">{r.title}</div>
                                                        <div className="text-xs text-[var(--color-text-secondary)]">{r.drawer} — Couche {r.layer}</div>
                                                    </div>
                                                </div>
                                                {isInProject(r.bin_id) ? (
                                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium shrink-0">✓ Ajouté</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddBin(r.bin_id)}
                                                        className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors shrink-0"
                                                    >
                                                        + Ajouter
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Components table */}
                    <div className="flex-1 overflow-y-auto">
                        {loadingBins ? (
                            <div className="flex items-center justify-center h-32 text-sm text-[var(--color-text-secondary)]">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                                Chargement...
                            </div>
                        ) : projectBins.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-center text-[var(--color-text-secondary)] text-sm gap-3 p-6">
                                <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                                </svg>
                                <p>Aucun composant dans ce projet.<br />Cliquez sur <strong>Ajouter</strong> pour en associer.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-[var(--color-bg)] border-b border-[var(--color-border)] z-10">
                                    <tr>
                                        {['Composant', 'Localisation', 'Qté', ''].map((h) => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode="popLayout">
                                        {projectBins.map((pb) => (
                                            <motion.tr
                                                key={pb.pb_id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className={`border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-secondary)] transition-colors ${!pb.found ? 'opacity-50' : ''}`}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        {pb.color && <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pb.color }} />}
                                                        <div>
                                                            <div className="font-medium">{pb.title}</div>
                                                            {pb.description && (
                                                                <div className="text-xs text-[var(--color-text-secondary)] line-clamp-1 mt-0.5">{pb.description}</div>
                                                            )}
                                                            {pb.note && (
                                                                <div className="text-xs text-blue-500 mt-0.5">📝 {pb.note}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                                                    {pb.found ? (
                                                        <>
                                                            <div className="font-medium text-[var(--color-text)]">{pb.drawer}</div>
                                                            <div>Couche {pb.layer} — ({pb.x}, {pb.y})</div>
                                                        </>
                                                    ) : (
                                                        <span className="text-amber-600 dark:text-amber-400">⚠ Bin introuvable</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-mono text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] px-2 py-0.5 rounded-lg">
                                                        ×{pb.qty}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => handleRemoveBin(pb.pb_id)}
                                                        className="text-[var(--color-text-secondary)] hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Footer summary */}
                    {projectBins.length > 0 && (
                        <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-bg)] text-xs text-[var(--color-text-secondary)] flex items-center justify-between shrink-0">
                            <span>{projectBins.length} référence(s) • {projectBins.reduce((s, pb) => s + pb.qty, 0)} pièce(s)</span>
                            <span>{projectBins.filter(pb => !pb.found).length > 0 && `⚠ ${projectBins.filter(pb => !pb.found).length} bin(s) introuvable(s)`}</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-[var(--color-text-secondary)] p-8">
                    <svg className="w-14 h-14 opacity-15 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <p className="text-sm">Sélectionnez un projet dans la liste ou créez-en un nouveau.</p>
                </div>
            )}
        </div>
    );
}
