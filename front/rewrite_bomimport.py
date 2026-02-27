import os

# 1. Update useStore.ts
store_path = "/Users/mathisdupont/ScanGRID/front/src/store/useStore.ts"
with open(store_path, 'r', encoding='utf-8') as f:
    store_content = f.read()

# Add AIComponent type
if "export interface AIComponent" not in store_content:
    store_content = store_content.replace(
        "export type ViewMode =",
        "export interface AIComponent {\n  designation: string;\n  qty: number;\n  reference: string;\n  package: string;\n}\n\nexport type ViewMode ="
    )

# Add to AppState
if "aiImportStatus:" not in store_content:
    store_content = store_content.replace(
        "  // Sidebar",
        "  // AI Import Background State\n  aiImportStatus: 'idle' | 'running' | 'success' | 'error';\n  setAiImportStatus: (status: 'idle' | 'running' | 'success' | 'error') => void;\n  aiImportResult: { components: AIComponent[], model: string } | null;\n  setAiImportResult: (result: { components: AIComponent[], model: string } | null) => void;\n  aiImportError: string | null;\n  setAiImportError: (error: string | null) => void;\n  aiImportText: string;\n  setAiImportText: (text: string) => void;\n  resetAiImport: () => void;\n\n  // Sidebar"
    )

# Add to create
if "aiImportStatus: 'idle'" not in store_content:
    store_content = store_content.replace(
        "  // Sidebar\n  sidebarOpen",
        "  // AI Import Background State\n  aiImportStatus: 'idle',\n  setAiImportStatus: (status) => set({ aiImportStatus: status }),\n  aiImportResult: null,\n  setAiImportResult: (result) => set({ aiImportResult: result }),\n  aiImportError: null,\n  setAiImportError: (error) => set({ aiImportError: error }),\n  aiImportText: '',\n  setAiImportText: (text) => set({ aiImportText: text }),\n  resetAiImport: () => set({ aiImportStatus: 'idle', aiImportResult: null, aiImportError: null, aiImportText: '' }),\n\n  // Sidebar\n  sidebarOpen"
    )

with open(store_path, 'w', encoding='utf-8') as f:
    f.write(store_content)


# 2. Update BOMImport.tsx
bom_path = "/Users/mathisdupont/ScanGRID/front/src/components/BOMImport.tsx"
with open(bom_path, 'r', encoding='utf-8') as f:
    bom_content = f.read()

# Replace local states
bom_content = bom_content.replace(
"""    const [aiLoading, setAiLoading] = useState(false);
    const [aiComponents, setAiComponents] = useState<AIComponent[]>([]);
    const [aiModel, setAiModel] = useState('');
    const [aiAnalyzed, setAiAnalyzed] = useState(false);""",
"""    const { 
        aiImportStatus, 
        setAiImportStatus, 
        aiImportResult, 
        setAiImportResult, 
        aiImportError, 
        setAiImportError, 
        aiImportText, 
        setAiImportText,
        resetAiImport
    } = useStore();"""
)

# Add useStore import
bom_content = bom_content.replace(
    "import { apiClient } from '../services/api';",
    "import { apiClient } from '../services/api';\nimport { useStore } from '../store/useStore';"
)

# Replace handleAIAnalyze
old_handleAIAnalyze = """    const handleAIAnalyze = async () => {
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
                setInputText(lines.join('\\n'));
                setAnalyzed(false);
                setResults([]);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur IA');
        } finally {
            setAiLoading(false);
        }
    };"""

new_handleAIAnalyze = """    const handleAIAnalyze = async () => {
        if (!inputText.trim()) return;
        setAiImportStatus('running');
        setAiImportError(null);
        setAiImportText(inputText);
        try {
            const data = await apiClient.analyzeBOMWithAI(inputText);
            setAiImportResult({ components: data.components, model: data.model });
            setAiImportStatus('success');
            // Auto-populate textarea with AI-cleaned designations for easy further matching
            if (data.components.length > 0) {
                const lines = data.components.map(
                    (c) => c.reference ? `${c.reference} ${c.designation}` : c.designation
                );
                setInputText(lines.join('\\n'));
                setAnalyzed(false);
                setResults([]);
            }
        } catch (e) {
            setAiImportError(e instanceof Error ? e.message : 'Erreur IA');
            setAiImportStatus('error');
        }
    };"""

bom_content = bom_content.replace(old_handleAIAnalyze, new_handleAIAnalyze)

# Update UI logic

# disabled={!inputText.trim() || aiLoading} -> disabled={!inputText.trim() || aiImportStatus === 'running'}
bom_content = bom_content.replace(
    "disabled={!inputText.trim() || aiLoading}",
    "disabled={!inputText.trim() || aiImportStatus === 'running'}"
)

# aiLoading -> aiImportStatus === 'running'
bom_content = bom_content.replace(
    "{aiLoading ?",
    "{aiImportStatus === 'running' ?"
)

bom_content = bom_content.replace(
    "aiLoading && (",
    "aiImportStatus === 'running' && ("
)

# Effacer button logic
bom_content = bom_content.replace(
    "() => { setInputText(''); setResults([]); setAnalyzed(false); setAiComponents([]); setAiAnalyzed(false); }",
    "() => { setInputText(''); setResults([]); setAnalyzed(false); resetAiImport(); }"
)

# aiAnalyzed && aiComponents.length > 0
bom_content = bom_content.replace(
    "aiAnalyzed && aiComponents.length > 0",
    "aiImportStatus === 'success' && aiImportResult && aiImportResult.components.length > 0"
)

bom_content = bom_content.replace(
    "{aiComponents.length} composant{aiComponents.length !== 1 ? 's' : ''}",
    "{aiImportResult?.components.length} composant{aiImportResult?.components.length !== 1 ? 's' : ''}"
)

bom_content = bom_content.replace(
    "{aiModel}",
    "{aiImportResult?.model}"
)

bom_content = bom_content.replace(
    "aiComponents.map",
    "aiImportResult?.components.map"
)

bom_content = bom_content.replace(
    "{error && <p className=\"text-sm text-red-600 dark:text-red-400\">{error}</p>}",
    "{error && <p className=\"text-sm text-red-600 dark:text-red-400\">{error}</p>}\n{aiImportError && <p className=\"text-sm text-red-600 dark:text-red-400\">Erreur IA : {aiImportError}</p>}"
)

with open(bom_path, 'w', encoding='utf-8') as f:
    f.write(bom_content)
