"""
API FastAPI pour la gestion d'inventaire Gridfinity
Serveur ultra-léger pour Raspberry Pi
"""
import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List
import unicodedata
import difflib

from fastapi import FastAPI, Depends, HTTPException, status, APIRouter, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import select, delete, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from pydantic import BaseModel
from database import get_db, init_db
from models import Drawer, Layer, Bin, Category, Project, ProjectBin
from schemas import (
    DrawerCreate,
    DrawerResponse,
    LayerCreate,
    LayerResponse,
    BinCreate,
    BinUpdate,
    BinResponse,
    ErrorResponse,
    SuccessResponse,
    CategoryCreate,
    CategoryResponse,
)

try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    logger.warning("⚠️ Ollama non disponible - pip install ollama")

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise la base de données au démarrage"""
    logger.info("🚀 Démarrage du serveur ScanGRID...")
    await init_db()

    # ---- Migrations de colonnes (ALTER TABLE idempotent) ----
    # SQLite ne supporte pas "ADD COLUMN IF NOT EXISTS",
    # donc on capture l'erreur si la colonne existe déjà.
    from sqlalchemy import text
    from database import engine as _engine
    _migrations = [
        "ALTER TABLE project_bins ADD COLUMN url TEXT",
    ]
    async with _engine.begin() as conn:
        for stmt in _migrations:
            try:
                await conn.execute(text(stmt))
                logger.info(f"✅ Migration OK : {stmt}")
            except Exception:
                # Colonne déjà présente — on ignore silencieusement
                pass

    yield
    logger.info("🛑 Arrêt du serveur ScanGRID")


# Création de l'application FastAPI
app = FastAPI(
    title="ScanGRID API",
    description="API de gestion d'inventaire Gridfinity pour Raspberry Pi",
    version="1.0.0",
    lifespan=lifespan,
    # root_path="/api" # REMOVED: C'est peut-être la source du problème si Cloudflare n'enlève pas le préfixe
)

# CORS mis en PREMIER, avant le montage du routeur
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
    expose_headers=["*"]
)

# Création d'un routeur principal pour ajouter le préfixe /api
api_router = APIRouter()
# Les endpoints sont ajoutés à ce routeur, qui est ensuite monté
# avec le préfixe "/api" dans l'app principale. 
# Si Cloudflare conserve le préfixe lors de la requête vers le backend,
# cette structure est essentielle.


# Configuration pour servir le frontend React en production
FRONTEND_DIST = Path(__file__).parent.parent / "front" / "dist"
# On déplace les endpoints existants pour qu'ils soient montés. 
# ATTENTION: Cette modification nécessite de grouper les routes, 
# mais pour une correction rapide et sûre, on va simplement ajouter 
# une route de redirection ou monter l'app sous /api

@api_router.get("/health", tags=["Health"])
async def health_api():
    """Endpoint de santé (Mirror pour /api)"""
    return {"status": "healthy"}

if FRONTEND_DIST.exists():
    logger.info(f"📦 Serving frontend from {FRONTEND_DIST}")
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


# ============= ENDPOINTS =============

@api_router.get("/health", tags=["Health"])
async def health():
    """Endpoint de santé pour vérifier que le serveur est actif"""
    return {
        "status": "healthy",
        "service": "ScanGRID API",
        "version": "1.0.0"
    }


@api_router.post(
    "/drawers",
    response_model=DrawerResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Drawers"],
    summary="Créer ou remplacer un tiroir complet"
)
async def create_or_replace_drawer(
    drawer_data: DrawerCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Crée ou remplace un tiroir complet avec ses couches et boîtes.
    Opération transactionnelle : si une insertion échoue, tout est annulé.
    """
    try:
        logger.info(f"📥 POST /drawers - Création du tiroir '{drawer_data.name}' ({drawer_data.width_units}x{drawer_data.depth_units})")
        
        # Créer le tiroir
        drawer = Drawer(
            name=drawer_data.name,
            width_units=drawer_data.width_units,
            depth_units=drawer_data.depth_units
        )
        db.add(drawer)
        await db.flush()  # Force l'assignation de drawer.id avant de créer les layers
        
        # Créer les couches et boîtes
        for layer_data in drawer_data.layers:
            layer = Layer(
                drawer_id=drawer.id,
                z_index=layer_data.z_index
            )
            db.add(layer)
            await db.flush()  # Force l'assignation de layer.id avant de créer les bins
            
            for bin_data in layer_data.bins:
                bin_obj = Bin(
                    layer_id=layer.id,
                    x_grid=bin_data.x_grid,
                    y_grid=bin_data.y_grid,
                    width_units=bin_data.width_units,
                    depth_units=bin_data.depth_units,
                    content=bin_data.content.model_dump() if hasattr(bin_data.content, 'model_dump') else bin_data.content,
                    color=bin_data.color,
                    is_hole=bin_data.is_hole
                )
                db.add(bin_obj)
        
        # Commit transactionnel
        await db.commit()
        
        # Recharger le drawer avec toutes ses relations (eager loading)
        result = await db.execute(
            select(Drawer)
            .options(selectinload(Drawer.layers).selectinload(Layer.bins))
            .where(Drawer.id == drawer.id)
        )
        drawer = result.scalar_one()
        
        logger.info(f"✅ Tiroir créé avec succès: {drawer.id}")
        return DrawerResponse.model_validate(drawer)
        
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Erreur lors de la création du tiroir: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création du tiroir: {str(e)}"
        )


@api_router.get(
    "/drawers/{drawer_id}",
    response_model=DrawerResponse,
    tags=["Drawers"],
    summary="Récupérer un tiroir par son ID"
)
async def get_drawer(
    drawer_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Récupère l'état complet d'un tiroir avec toutes ses couches et boîtes.
    """
    logger.info(f"📤 GET /drawers/{drawer_id}")
    
    # Requête avec chargement eager des relations
    result = await db.execute(
        select(Drawer)
        .options(selectinload(Drawer.layers).selectinload(Layer.bins))
        .where(Drawer.id == drawer_id)
    )
    drawer = result.scalar_one_or_none()
    
    if not drawer:
        logger.warning(f"⚠️ Tiroir non trouvé: {drawer_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tiroir {drawer_id} non trouvé"
        )
    
    logger.info(f"✅ Tiroir récupéré: {drawer.name}")
    return DrawerResponse.model_validate(drawer)


@api_router.get(
    "/drawers",
    response_model=List[DrawerResponse],
    tags=["Drawers"],
    summary="Lister tous les tiroirs"
)
async def list_drawers(
    db: AsyncSession = Depends(get_db)
):
    """
    Récupère la liste de tous les tiroirs avec leurs couches et boîtes.
    """
    logger.info("📋 GET /drawers - Liste de tous les tiroirs")
    
    result = await db.execute(
        select(Drawer)
        .options(selectinload(Drawer.layers).selectinload(Layer.bins))
    )
    drawers = result.scalars().all()
    
    logger.info(f"✅ {len(drawers)} tiroir(s) récupéré(s)")
    return [DrawerResponse.model_validate(d) for d in drawers]


@api_router.delete(
    "/drawers/{drawer_id}",
    response_model=SuccessResponse,
    tags=["Drawers"],
    summary="Supprimer un tiroir"
)
async def delete_drawer(
    drawer_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Supprime un tiroir et toutes ses couches/boîtes (cascade).
    """
    logger.info(f"🗑️ DELETE /drawers/{drawer_id}")
    
    result = await db.execute(
        select(Drawer).where(Drawer.id == drawer_id)
    )
    drawer = result.scalar_one_or_none()
    
    if not drawer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tiroir {drawer_id} non trouvé"
        )
    
    await db.delete(drawer)
    await db.commit()
    
    logger.info(f"✅ Tiroir supprimé: {drawer_id}")
    return SuccessResponse(message=f"Tiroir {drawer_id} supprimé avec succès")


@api_router.patch(
    "/bins/{bin_id}",
    response_model=BinResponse,
    tags=["Bins"],
    summary="Mettre à jour une boîte spécifique"
)
async def update_bin(
    bin_id: str,
    bin_update: BinUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Met à jour le texte du label ou les dimensions d'une boîte spécifique.
    """
    logger.info(f"🔄 PATCH /bins/{bin_id} - Données: {bin_update.model_dump(exclude_none=True)}")
    
    result = await db.execute(
        select(Bin).where(Bin.id == bin_id)
    )
    bin_obj = result.scalar_one_or_none()
    
    if not bin_obj:
        logger.warning(f"⚠️ Boîte non trouvée: {bin_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Boîte {bin_id} non trouvée"
        )
    
    # Mise à jour des champs fournis
    update_data = bin_update.model_dump(exclude_none=True)
    
    # Handle layer_id explicitly if present
    if "layer_id" in update_data:
        new_layer_id = update_data.pop("layer_id")
        
        # Verify new layer exists
        layer_result = await db.execute(select(Layer).where(Layer.id == new_layer_id))
        new_layer = layer_result.scalar_one_or_none()
        
        if not new_layer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Couche destination {new_layer_id} non trouvée"
            )
            
        bin_obj.layer_id = new_layer_id
        
    for field, value in update_data.items():
        setattr(bin_obj, field, value)
    
    await db.commit()
    await db.refresh(bin_obj)
    
    logger.info(f"✅ Boîte mise à jour: {bin_id}")
    return BinResponse.model_validate(bin_obj)


@api_router.get(
    "/bins/{bin_id}",
    response_model=BinResponse,
    tags=["Bins"],
    summary="Récupérer une boîte par son ID"
)
async def get_bin(
    bin_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Récupère les détails d'une boîte spécifique.
    """
    logger.info(f"📤 GET /bins/{bin_id}")
    
    result = await db.execute(
        select(Bin).where(Bin.id == bin_id)
    )
    bin_obj = result.scalar_one_or_none()
    
    if not bin_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Boîte {bin_id} non trouvée"
        )
    
    logger.info(f"✅ Boîte récupérée: {bin_id}")
    return BinResponse.model_validate(bin_obj)


@api_router.post(
    "/drawers/{drawer_id}/layers",
    response_model=LayerResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Drawers"],
    summary="Ajouter une couche à un tiroir"
)
async def create_layer(
    drawer_id: str,
    layer_data: LayerCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Ajoute une nouvelle couche à un tiroir.
    """
    logger.info(f"➕ POST /drawers/{drawer_id}/layers - Ajout couche (z_index={layer_data.z_index})")
    
    # Vérifier que le drawer existe
    result = await db.execute(select(Drawer).where(Drawer.id == drawer_id))
    drawer = result.scalar_one_or_none()
    
    if not drawer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tiroir {drawer_id} non trouvé"
        )

    # Créer la couche
    layer = Layer(
        drawer_id=drawer_id,
        z_index=layer_data.z_index
    )
    
    db.add(layer)
    await db.commit()
    await db.refresh(layer)
    
    logger.info(f"✅ Couche créée: {layer.id}")
    return LayerResponse.model_validate(layer)


@api_router.post(
    "/layers/{layer_id}/bins",
    response_model=BinResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Bins"],
    summary="Ajouter une boîte à une couche"
)
async def create_bin(
    layer_id: str,
    bin_data: BinCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Ajoute une nouvelle boîte dans une couche spécifique.
    """
    logger.info(f"➕ POST /layers/{layer_id}/bins - Ajout boîte à ({bin_data.x_grid}, {bin_data.y_grid})")
    
    # Vérifier que la layer existe
    result = await db.execute(select(Layer).where(Layer.id == layer_id))
    layer = result.scalar_one_or_none()
    
    if not layer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Couche {layer_id} non trouvée"
        )

    # Créer la boîte
    bin_obj = Bin(
        layer_id=layer_id,
        x_grid=bin_data.x_grid,
        y_grid=bin_data.y_grid,
        width_units=bin_data.width_units,
        depth_units=bin_data.depth_units,
        content=bin_data.content.model_dump(),
        color=bin_data.color,
        is_hole=bin_data.is_hole
    )
    
    db.add(bin_obj)
    await db.commit()
    await db.refresh(bin_obj)
    
    logger.info(f"✅ Boîte créée: {bin_obj.id}")
    return BinResponse.model_validate(bin_obj)


@api_router.delete(
    "/bins/{bin_id}",
    response_model=SuccessResponse,
    tags=["Bins"],
    summary="Supprimer une boîte"
)
async def delete_bin(
    bin_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Supprime une boîte spécifique.
    """
    logger.info(f"🗑️ DELETE /bins/{bin_id}")
    
    result = await db.execute(
        select(Bin).where(Bin.id == bin_id)
    )
    bin_obj = result.scalar_one_or_none()
    
    if not bin_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Boîte {bin_id} non trouvée"
        )
    
    await db.delete(bin_obj)
    await db.commit()
    
    logger.info(f"✅ Boîte supprimée: {bin_id}")
    return SuccessResponse(message=f"Boîte {bin_id} supprimée avec succès")


# ============= CATEGORIES =============

@api_router.get(
    "/categories",
    response_model=List[CategoryResponse],
    tags=["Categories"],
    summary="Lister toutes les catégories"
)
async def list_categories(
    db: AsyncSession = Depends(get_db)
):
    """
    Récupère la liste de toutes les catégories.
    """
    logger.info("📋 GET /categories - Liste des catégories")
    
    result = await db.execute(select(Category).order_by(Category.name))
    categories = result.scalars().all()
    
    return [CategoryResponse.model_validate(c) for c in categories]


@api_router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Categories"],
    summary="Créer une catégorie"
)
async def create_category(
    category_in: CategoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Crée une nouvelle catégorie.
    """
    logger.info(f"➕ POST /categories - Nouvelle catégorie: {category_in.name}")
    
    new_category = Category(
        name=category_in.name,
        icon=category_in.icon
    )
    
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)
    
    return CategoryResponse.model_validate(new_category)


@api_router.delete(
    "/categories/{category_id}",
    response_model=SuccessResponse,
    tags=["Categories"],
    summary="Supprimer une catégorie"
)
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Supprime une catégorie.
    """
    logger.info(f"🗑️ DELETE /categories/{category_id}")
    
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catégorie {category_id} non trouvée"
        )
    
    await db.delete(category)
    await db.commit()
    
    return SuccessResponse(message=f"Catégorie {category_id} supprimée avec succès")


# ============= AI DESCRIPTION IMPROVEMENT =============

@api_router.post(
    "/improve-description",
    tags=["AI"],
    summary="Améliorer une description avec IA locale"
)
async def improve_description(
    title: str,
    content: str = "",
    instruction: str = "Description pour un inventaire de composants électroniques"
):
    """
    Utilise Ollama (llama3.2:3b) pour générer une description ultra-concise.
    """
    if not OLLAMA_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service Ollama non disponible. Installez ollama: pip install ollama"
        )
    
    logger.info(f"🤖 AI Description - Titre: {title[:50]}...")
    
    # Construction du prompt optimisé
    prompt = f"""Tu es un assistant technique spécialisé dans l'inventaire de composants électroniques et de visserie.

Génère une description ultra-concise (maximum 50 mots) pour cet article :

Titre : {title}
{f"Détails : {content}" if content else ""}

Règles strictes :
- Réponds UNIQUEMENT avec la description, sans préambule
- Style direct et factuel, sans adjectifs marketing
- Une seule phrase claire et précise
- Base-toi sur le titre et les détails fournis
- N'invente pas de spécifications non mentionnées

Description :"""

    try:
        response = ollama.generate(
            model='llama3.2:3b',
            prompt=prompt,
            options={
                'temperature': 0.2,    # Très bas pour rester factuel
                'num_predict': 60,     # Limite la longueur (économie CPU)
                'top_p': 0.9           # Diversité contrôlée
            }
        )
        
        improved_description = response['response'].strip()
        
        logger.info(f"✅ Description générée: {improved_description[:50]}...")
        
        return {
            "improved_description": improved_description,
            "model": "llama3.2:3b"
        }
        
    except Exception as e:
        logger.error(f"❌ Erreur Ollama: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération: {str(e)}"
        )


# ============= SIRI / HOME ASSISTANT LOCATE API =============

def _score_bin(
    bin_obj: Bin,
    query: str,
    drawer_name: str,
    category_name: str | None,
    match_info: dict | None = None,
) -> int:
    """
    Calcule un score de pertinence entre une boîte et la requête.
    Plus le score est élevé, plus la boîte est pertinente.
    Si match_info est fourni, il sera rempli avec :
      - matched_item : premier article de la liste items qui matche
    """
    q = query.lower().strip()
    score = 0

    title: str = ""
    description: str = ""
    items: list = []

    if bin_obj.content and isinstance(bin_obj.content, dict):
        title = str(bin_obj.content.get("title", "")).lower()
        description = str(bin_obj.content.get("description", "")).lower()
        items = bin_obj.content.get("items") or []

    # Correspondance exacte dans le titre → score très élevé
    if q == title:
        score += 100
    elif q in title:
        score += 60
    else:
        # Chaque mot de la requête trouvé dans le titre
        for word in q.split():
            if len(word) >= 3 and word in title:
                score += 20

    # Description
    if q in description:
        score += 30
    else:
        for word in q.split():
            if len(word) >= 3 and word in description:
                score += 10

    # Articles contenus dans la boîte (items)
    matched_item = None
    for item in items:
        item_lower = str(item).lower()
        if q == item_lower:
            score += 80          # correspondance exacte item
            matched_item = item
            break
        elif q in item_lower:
            score += 45
            if matched_item is None:
                matched_item = item
        else:
            for word in q.split():
                if len(word) >= 3 and word in item_lower:
                    score += 15
                    if matched_item is None:
                        matched_item = item

    if match_info is not None:
        match_info["matched_item"] = matched_item
        match_info["items"] = [str(i) for i in items]

    # Catégorie
    if category_name and q in category_name.lower():
        score += 15

    # Nom du tiroir
    if q in drawer_name.lower():
        score += 5

    return score


@api_router.get(
    "/locate",
    tags=["Siri"],
    summary="Localiser une boîte par son nom ou contenu"
)
async def locate_box(
    query: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Recherche la boîte la plus probable correspondant à la requête.
    Parcourt tous les tiroirs, couches et boîtes.
    Retourne la localisation humaine + une phrase spoken pour Siri.
    """
    logger.info(f"🔍 /locate?query={query}")

    if not query or len(query.strip()) < 2:
        raise HTTPException(status_code=400, detail="La requête est trop courte (min 2 caractères).")

    # Charger tous les tiroirs avec leurs couches et boîtes
    result = await db.execute(
        select(Drawer).options(
            selectinload(Drawer.layers).selectinload(Layer.bins).selectinload(Bin.category)
        )
    )
    drawers = result.scalars().all()

    best_score = 0
    best_match = None

    for drawer in drawers:
        for layer in sorted(drawer.layers, key=lambda l: l.z_index):
            for bin_obj in layer.bins:
                if bin_obj.is_hole:
                    continue
                cat_name = bin_obj.category.name if bin_obj.category else None
                info: dict = {}
                score = _score_bin(bin_obj, query, drawer.name, cat_name, info)
                if score > best_score:
                    best_score = score
                    best_match = {
                        "bin": bin_obj,
                        "layer": layer,
                        "drawer": drawer,
                        "category": cat_name,
                        "matched_item": info.get("matched_item"),
                        "items": info.get("items", []),
                    }

    if best_match is None or best_score == 0:
        return {
            "found": False,
            "query": query,
            "spoken": f"Je n'ai rien trouvé pour « {query} » dans l'inventaire.",
            "result": None,
        }

    b = best_match["bin"]
    d = best_match["drawer"]
    l = best_match["layer"]

    title = b.content.get("title", "Boîte inconnue") if b.content else "Boîte inconnue"
    description = b.content.get("description", "") if b.content else ""
    layer_num = l.z_index + 1  # 1-based pour l'humain
    matched_item = best_match.get("matched_item")
    all_items = best_match.get("items", [])

    location_str = f"« {d.name} », Couche {layer_num}, Position X: {b.x_grid + 1} Y: {b.y_grid + 1} !"

    if matched_item:
        spoken = (
            f"J'ai trouvé l'article « {matched_item} » dans la boîte « {title} », "
            f"tiroir {d.name}, couche {layer_num}, colonne {b.x_grid + 1}, rangée {b.y_grid + 1}."
        )
    else:
        spoken = (
            f"J'ai trouvé « {title} » dans le tiroir {d.name}, "
            f"couche {layer_num}, colonne {b.x_grid + 1}, rangée {b.y_grid + 1}."
        )
    if description:
        spoken += f" {description[:120]}"

    logger.info(f"✅ Meilleur résultat (score {best_score}): {title} → {location_str}")

    return {
        "found": True,
        "query": query,
        "score": best_score,
        "spoken": spoken,
        "result": {
            "box_id": b.id,
            "title": title,
            "description": description,
            "category": best_match["category"],
            "drawer": d.name,
            "drawer_id": d.id,
            "layer": layer_num,
            "layer_id": l.id,
            "x": b.x_grid + 1,
            "y": b.y_grid + 1,
            "width": b.width_units,
            "depth": b.depth_units,
            "color": b.color,
            "location": location_str,
            "matched_item": matched_item,
            "items": all_items,
        },
    }


# ============= BOM — GENERATOR & IMPORT =============

def normalize_string(s: str) -> str:
    if not s:
        return ""
    # Enlever accents et passer en minuscule
    s = str(s)
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('utf-8')
    return s.lower()

def _bom_score_bin(bin_obj: Bin, tokens: list[str]) -> tuple[int, str]:
    """
    Calcule un score de pertinence entre une boîte et une liste de tokens normaux.
    """
    score = 0
    reasons: list[str] = []

    title = ""
    description = ""
    items: list = []

    if bin_obj.content and isinstance(bin_obj.content, dict):
        title = normalize_string(bin_obj.content.get("title", ""))
        description = normalize_string(bin_obj.content.get("description", ""))
        items = bin_obj.content.get("items") or []

    items_str = " ".join(normalize_string(i) for i in items)
    
    # Textes sans espaces pour le matching "colle" (ex: 10 k => 10k)
    title_ns = title.replace(" ", "")
    desc_ns = description.replace(" ", "")
    items_ns = items_str.replace(" ", "")

    full_text_ns = f"{title_ns} {desc_ns} {items_ns}"

    for tok in tokens:
        tok_ns = tok.replace(" ", "")
        if len(tok_ns) < 2:
            continue
            
        # 1. Correspondance exacte ou inclusion sans espace
        if tok_ns in title_ns:
            if tok_ns == title_ns:
                score += 100
                reasons.append(f"titre exact '{tok}'")
            else:
                score += 40
                reasons.append(f"titre contient '{tok}'")
            continue
        elif tok_ns in desc_ns:
            score += 20
            reasons.append(f"desc. contient '{tok}'")
            continue
        elif tok_ns in items_ns:
            score += 30
            reasons.append(f"item contient '{tok}'")
            continue

        # 2. Fuzzy Matching fallback si non trouvé directement
        # On teste les mots individuels du titre, desc, items
        all_words = title.split() + description.split() + items_str.split()
        best_ratio = 0
        best_word = ""
        for w in all_words:
            if len(w) < 3:
                continue
            ratio = difflib.SequenceMatcher(None, tok_ns, w).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_word = w
        
        # Si la longueur du mot est >= 4 on tolère une erreur (ratio > 0.75 env)
        if best_ratio > 0.78:
            score += 15
            reasons.append(f"similaire à '{best_word}'")
        elif tok_ns in full_text_ns:
            score += 10

    return score, ", ".join(reasons) if reasons else "correspondance partielle"


@api_router.get(
    "/bom/search",
    tags=["BOM"],
    summary="Rechercher des composants pour le BOM Generator"
)
async def bom_search(
    q: str = "",
    db: AsyncSession = Depends(get_db)
):
    """
    Recherche plein-texte dans tous les bins de l'inventaire.
    Retourne les résultats triés par score de pertinence.
    """
    logger.info(f"🔍 GET /bom/search?q={q}")

    if not q or len(q.strip()) < 1:
        # Retourner tous les composants si pas de recherche
        result = await db.execute(
            select(Drawer).options(
                selectinload(Drawer.layers).selectinload(Layer.bins).selectinload(Bin.category)
            )
        )
        drawers = result.scalars().all()
        tokens = []
    else:
        result = await db.execute(
            select(Drawer).options(
                selectinload(Drawer.layers).selectinload(Layer.bins).selectinload(Bin.category)
            )
        )
        drawers = result.scalars().all()
        tokens = [t.lower() for t in q.strip().split()]

    results = []
    for drawer in drawers:
        for layer in sorted(drawer.layers, key=lambda l: l.z_index):
            for bin_obj in layer.bins:
                if bin_obj.is_hole:
                    continue

                title = ""
                description = ""
                bin_items: list = []

                if bin_obj.content and isinstance(bin_obj.content, dict):
                    title = bin_obj.content.get("title", "")
                    description = bin_obj.content.get("description", "")
                    bin_items = bin_obj.content.get("items") or []

                if tokens:
                    score, reason = _bom_score_bin(bin_obj, tokens)
                    if score == 0:
                        continue
                else:
                    score = 1
                    reason = ""

                cat_name = bin_obj.category.name if bin_obj.category else None

                results.append({
                    "bin_id": bin_obj.id,
                    "title": title,
                    "description": description,
                    "ref": bin_items[0] if bin_items else title,
                    "category": cat_name,
                    "drawer": drawer.name,
                    "drawer_id": drawer.id,
                    "layer": layer.z_index + 1,
                    "x": bin_obj.x_grid + 1,
                    "y": bin_obj.y_grid + 1,
                    "color": bin_obj.color,
                    "items": [str(i) for i in bin_items],
                    "score": score,
                    "reason": reason,
                })

    results.sort(key=lambda r: r["score"], reverse=True)
    logger.info(f"✅ BOM search '{q}' → {len(results)} résultat(s)")
    return results[:50]  # Max 50 résultats


class BOMMatchRequest(BaseModel):
    """Corps de la requête POST /bom/match"""
    lines: list[str]


@api_router.post(
    "/bom/match",
    tags=["BOM"],
    summary="Matcher des lignes de BOM importées contre le catalogue"
)
async def bom_match(
    body: BOMMatchRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Pour chaque ligne de texte fournie, trouve le bin le plus proche.
    Algorithme : tokenisation → score par token sur titre/items/description.
    Score de confiance normalisé sur 1.0.
    Seuil minimum : 0.60 pour ne pas retourner un faux positif.
    """
    logger.info(f"🔍 POST /bom/match — {len(body.lines)} ligne(s)")

    # Charger tout l'inventaire une seule fois
    result = await db.execute(
        select(Drawer).options(
            selectinload(Drawer.layers).selectinload(Layer.bins).selectinload(Bin.category)
        )
    )
    drawers = result.scalars().all()

    # Pré-indexer les bins pour éviter de les parcourir N fois
    all_bins = []
    for drawer in drawers:
        for layer in sorted(drawer.layers, key=lambda l: l.z_index):
            for bin_obj in layer.bins:
                if bin_obj.is_hole:
                    continue
                title = ""
                bin_items: list = []
                description = ""
                if bin_obj.content and isinstance(bin_obj.content, dict):
                    title = bin_obj.content.get("title", "")
                    description = bin_obj.content.get("description", "")
                    bin_items = bin_obj.content.get("items") or []
                cat_name = bin_obj.category.name if bin_obj.category else None
                all_bins.append({
                    "bin_obj": bin_obj,
                    "title": title,
                    "description": description,
                    "items": [str(i) for i in bin_items],
                    "category": cat_name,
                    "drawer": drawer.name,
                    "layer": layer.z_index + 1,
                    "x": bin_obj.x_grid + 1,
                    "y": bin_obj.y_grid + 1,
                    "color": bin_obj.color,
                })

    # Score max théorique pour normalisation (100 * nb tokens)
    CONFIDENCE_THRESHOLD = 0.60

    match_results = []

    for line in body.lines:
        if not line or not line.strip():
            continue

        tokens = [t.lower() for t in line.strip().split() if len(t) >= 2]
        if not tokens:
            continue

        best_score = 0
        best_bin_data = None
        best_reason = ""

        for bin_data in all_bins:
            bin_obj = bin_data["bin_obj"]
            score, reason = _bom_score_bin(bin_obj, tokens)
            if score > best_score:
                best_score = score
                best_bin_data = bin_data
                best_reason = reason

        # Normalisation : score max approximé à 100 * nombre de tokens
        max_possible = max(100 * len(tokens), 1)
        confidence = min(best_score / max_possible, 1.0)

        if best_bin_data is None or confidence < CONFIDENCE_THRESHOLD:
            match_results.append({
                "original_line": line,
                "matched_id": None,
                "matched_title": None,
                "drawer": None,
                "layer": None,
                "similarity_reason": "Aucune correspondance suffisante trouvée (confiance < 60%)",
                "status": "absent",
                "confidence": round(confidence, 2),
            })
        else:
            is_exact = confidence >= 0.9
            match_results.append({
                "original_line": line,
                "matched_id": best_bin_data["bin_obj"].id,
                "matched_title": best_bin_data["title"],
                "drawer": best_bin_data["drawer"],
                "layer": best_bin_data["layer"],
                "similarity_reason": best_reason,
                "status": "exact" if is_exact else "proche",
                "confidence": round(confidence, 2),
            })

    logger.info(f"✅ BOM match terminé — {len(match_results)} résultat(s)")
    return {"results": match_results}


# ============= BOM PDF EXTRACT =============

class BOMExtractResult(BaseModel):
    lines: list[str]
    raw_text: str
    page_count: int

@api_router.post("/bom/extract-pdf", response_model=BOMExtractResult)
async def bom_extract_pdf(file: UploadFile = File(...)):
    """
    Extrait le texte d'un fichier PDF uploadé (multipart/form-data).
    Retourne les lignes tokenisées prêtes à être envoyées à /bom/match.
    Utilise pypdf — aucune dépendance lourde, pas de serveur externe.
    """
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        # Accept octet-stream too in case browser sends it that way
        if not (file.filename or "").lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Le fichier doit être un PDF.")

    try:
        import pypdf
        import io

        raw_bytes = await file.read()
        if not raw_bytes:
            raise HTTPException(status_code=400, detail="Le fichier PDF est vide.")

        reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
        page_count = len(reader.pages)

        full_text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text_parts.append(text.strip())

        raw_text = "\n".join(full_text_parts)

        # Tokenise: split by newlines, remove blank lines & very short tokens
        lines = [
            ln.strip()
            for ln in raw_text.splitlines()
            if ln.strip() and len(ln.strip()) >= 3
        ]

        return BOMExtractResult(lines=lines, raw_text=raw_text, page_count=page_count)

    except pypdf.errors.PdfReadError as e:
        raise HTTPException(status_code=422, detail=f"PDF illisible : {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur extraction PDF : {e}")


# ============= AI BOM PARSE (Ollama) =============

class AIParseRequest(BaseModel):
    text: str
    max_chars: int = 12000   # guard: llama3.2:3b context ~128k tokens

class AIComponentEntry(BaseModel):
    designation: str
    qty: int = 1
    reference: str = ""
    package: str = ""

class AIParseResult(BaseModel):
    components: list[AIComponentEntry]
    raw_response: str
    model: str

_OLLAMA_URL = "http://localhost:11434/api/generate"
_OLLAMA_MODEL = "llama3.2:3b"

_BOM_SYSTEM_PROMPT = """Tu es un parseur de nomenclature électronique (BOM). 
RÈGLES STRICTES :
- Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après.
- Chaque élément du tableau doit avoir exactement ces 4 champs : "designation", "qty", "reference", "package".
- "designation" : nom du composant sans la quantité (ex: "Résistance 10kΩ 0603").
- "qty" : quantité entière (1 si non précisée).
- "reference" : référence schématique si présente (R1, C2, U3…), sinon "".  
- "package" : boîtier si présent (0402, SOT-23, DIP-8…), sinon "".
- IGNORE les lignes qui ne sont pas des composants : en-têtes de colonnes, titres, pieds de page, numéros de page, noms de sociétés, URLs, dates.
- ÉLIMINE les doublons (garde 1 ligne unique par composant, additionne les quantités).
- NE JAMAIS inclure de commentaires ou de texte libre dans la réponse.
FORMAT OBLIGATOIRE :
[{"designation":"...","qty":1,"reference":"","package":""},...]"""

@api_router.post("/bom/ai-parse", response_model=AIParseResult)
async def bom_ai_parse(req: AIParseRequest):
    """
    Envoie le texte extrait d'un PDF à Ollama (llama3.2:3b) pour un filtrage
    sémantique : suppression des lignes non-composants, dédoublonnage, 
    structuration en JSON propre.
    """
    import httpx
    import json as _json

    text_to_parse = req.text[:req.max_chars]

    payload = {
        "model": _OLLAMA_MODEL,
        "prompt": f"{_BOM_SYSTEM_PROMPT}\n\nTexte à analyser :\n{text_to_parse}",
        "stream": False,
        "options": {
            "temperature": 0.05,   # quasi-déterministe
            "num_predict": 2048,
            "stop": ["\n\n\n"],    # évite les divagations
        }
    }

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            resp = await client.post(_OLLAMA_URL, json=payload)
            resp.raise_for_status()
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Ollama introuvable sur localhost:11434. Vérifiez que le service tourne (ollama serve)."
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama n'a pas répondu dans les 300s.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Ollama : {e}")

    data = resp.json()
    raw_response: str = data.get("response", "").strip()

    # ─── Parsing du JSON retourné par Ollama ──────────────────────────────────
    # Le LLM peut mettre des ```json ... ``` autour — on les enlève
    cleaned = raw_response
    for fence in ("```json", "```JSON", "```"):
        cleaned = cleaned.replace(fence, "")
    cleaned = cleaned.strip().strip("`").strip()

    # Détecte si la réponse est un tableau [...] ou un objet unique {...}
    # Certains modèles retournent un seul objet quand il n'y a qu'un composant.
    arr_start = cleaned.find("[")
    obj_start = cleaned.find("{")

    raw_list = None

    # Cas 1 : tableau JSON classique [...]
    if arr_start != -1 and (obj_start == -1 or arr_start < obj_start):
        end = cleaned.rfind("]")
        if end != -1 and end > arr_start:
            try:
                raw_list = _json.loads(cleaned[arr_start:end + 1])
            except _json.JSONDecodeError:
                pass

    # Cas 2 : objet unique {...} — on l'emballe dans une liste
    if raw_list is None and obj_start != -1:
        end = cleaned.rfind("}")
        if end != -1 and end > obj_start:
            try:
                obj = _json.loads(cleaned[obj_start:end + 1])
                raw_list = [obj] if isinstance(obj, dict) else None
            except _json.JSONDecodeError:
                pass

    if raw_list is None:
        raise HTTPException(
            status_code=422,
            detail=f"Le modèle n'a pas retourné un JSON valide. Réponse brute : {raw_response[:400]}"
        )

    # ─── Normalisation & dédoublonnage ────────────────────────────────────────
    seen: dict[str, AIComponentEntry] = {}
    for item in raw_list:
        if not isinstance(item, dict):
            continue
        designation = str(item.get("designation", "")).strip()
        if not designation or len(designation) < 2:
            continue
        qty = max(1, int(item.get("qty", 1)))
        ref = str(item.get("reference", "")).strip()
        pkg = str(item.get("package", "")).strip()
        key = designation.lower()
        if key in seen:
            seen[key].qty += qty    # additionne les quantités si doublon
        else:
            seen[key] = AIComponentEntry(designation=designation, qty=qty, reference=ref, package=pkg)

    components = list(seen.values())
    logger.info(f"✅ AI BOM parse : {len(raw_list)} lignes → {len(components)} composants uniques")

    return AIParseResult(components=components, raw_response=raw_response, model=_OLLAMA_MODEL)




class ProjectCreate(BaseModel):
    name: str
    description: str | None = None

class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

class ProjectBinAdd(BaseModel):
    bin_id: str
    qty: int = 1
    note: str | None = None
    url: str | None = None


# ============= PROJECTS — CRUD =============

@api_router.get("/projects")
async def list_projects(db: AsyncSession = Depends(get_db)):
    """Liste tous les projets (sans les bins pour légèreté)."""
    result = await db.execute(select(Project).order_by(Project.created_at.desc()))
    projects = result.scalars().all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "created_at": p.created_at,
            "bin_count": len(p.project_bins),
        }
        for p in projects
    ]


@api_router.post("/projects", status_code=201)
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    """Crée un nouveau projet."""
    project = Project(name=data.name, description=data.description)
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return {"id": project.id, "name": project.name, "description": project.description,
            "created_at": project.created_at, "bin_count": 0}


@api_router.patch("/projects/{project_id}")
async def update_project(project_id: str, data: ProjectUpdate, db: AsyncSession = Depends(get_db)):
    """Modifie le nom ou la description d'un projet."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable.")
    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    await db.commit()
    await db.refresh(project)
    return {"id": project.id, "name": project.name, "description": project.description,
            "created_at": project.created_at}


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, db: AsyncSession = Depends(get_db)):
    """Supprime un projet et ses associations (cascade)."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable.")
    await db.delete(project)
    await db.commit()
    return {"message": "Projet supprimé."}


# ============= PROJECTS — Bin management =============

@api_router.get("/projects/{project_id}/bins")
async def get_project_bins(project_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retourne les composants du projet avec leur localisation actuelle résolue
    depuis l'inventaire (tiroir, couche, position XY).
    """
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable.")

    # Récupérer tous les bins de l'inventaire en une seule requête
    all_bins_result = await db.execute(
        select(Bin).options(selectinload(Bin.layer).selectinload(Layer.drawer))
    )
    bins_by_id = {b.id: b for b in all_bins_result.scalars().all()}

    enriched = []
    for pb in project.project_bins:
        bin_obj = bins_by_id.get(pb.bin_id)
        entry = {
            "pb_id": pb.id,
            "bin_id": pb.bin_id,
            "qty": pb.qty,
            "note": pb.note,
            "url": pb.url,
            "found": bin_obj is not None,
        }
        if bin_obj and bin_obj.content:
            layer = bin_obj.layer
            drawer = layer.drawer if layer else None
            entry.update({
                "title": bin_obj.content.get("title", "—"),
                "description": bin_obj.content.get("description", ""),
                "color": bin_obj.color,
                "x": bin_obj.x_grid,
                "y": bin_obj.y_grid,
                "layer": layer.z_index if layer else None,
                "drawer": drawer.name if drawer else "—",
                "drawer_id": drawer.id if drawer else None,
            })
        else:
            entry.update({
                "title": f"[Bin supprimé: {pb.bin_id[:8]}...]",
                "description": "",
                "color": None,
                "x": None,
                "y": None,
                "layer": None,
                "drawer": "—",
                "drawer_id": None,
            })
        enriched.append(entry)

    return enriched


@api_router.post("/projects/{project_id}/bins", status_code=201)
async def add_project_bin(project_id: str, data: ProjectBinAdd, db: AsyncSession = Depends(get_db)):
    """Ajoute un composant au projet (liaison soft par bin_id string)."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable.")

    # Empêcher les doublons
    existing = next((pb for pb in project.project_bins if pb.bin_id == data.bin_id), None)
    if existing:
        existing.qty += data.qty
        if data.url:
            existing.url = data.url
        await db.commit()
        return {"pb_id": existing.id, "bin_id": existing.bin_id, "qty": existing.qty,
                "note": existing.note, "url": existing.url}

    pb = ProjectBin(project_id=project_id, bin_id=data.bin_id, qty=data.qty,
                    note=data.note, url=data.url)
    db.add(pb)
    await db.commit()
    await db.refresh(pb)
    return {"pb_id": pb.id, "bin_id": pb.bin_id, "qty": pb.qty, "note": pb.note, "url": pb.url}


@api_router.delete("/projects/{project_id}/bins/{pb_id}")
async def remove_project_bin(project_id: str, pb_id: str, db: AsyncSession = Depends(get_db)):
    """Retire un composant du projet."""
    result = await db.execute(
        select(ProjectBin).where(ProjectBin.id == pb_id, ProjectBin.project_id == project_id)
    )
    pb = result.scalar_one_or_none()
    if not pb:
        raise HTTPException(status_code=404, detail="Association introuvable.")
    await db.delete(pb)
    await db.commit()
    return {"message": "Composant retiré du projet."}


# ============= PROJECTS — CSV export =============

@api_router.get("/projects/{project_id}/bom.csv")
async def export_project_csv(project_id: str, db: AsyncSession = Depends(get_db)):
    """
    Exporte la BOM du projet au format CSV (StreamingResponse).
    Le fichier est généré à la volée, sans écriture sur disque.
    """
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable.")

    all_bins_result = await db.execute(
        select(Bin).options(selectinload(Bin.layer).selectinload(Layer.drawer))
    )
    bins_by_id = {b.id: b for b in all_bins_result.scalars().all()}

    import csv, io as _io
    output = _io.StringIO()
    writer = csv.writer(output, delimiter=";")

    # Entête
    writer.writerow(["#", "Bin ID", "Référence", "Désignation", "Tiroir", "Couche", "X", "Y", "Qté", "Note"])

    for i, pb in enumerate(project.project_bins, 1):
        bin_obj = bins_by_id.get(pb.bin_id)
        if bin_obj and bin_obj.content:
            layer = bin_obj.layer
            drawer = layer.drawer if layer else None
            writer.writerow([
                i,
                pb.bin_id,
                bin_obj.content.get("title", ""),
                bin_obj.content.get("description", ""),
                drawer.name if drawer else "—",
                layer.z_index if layer else "—",
                bin_obj.x_grid,
                bin_obj.y_grid,
                pb.qty,
                pb.note or "",
            ])
        else:
            writer.writerow([i, pb.bin_id, "[Supprimé]", "", "—", "—", "—", "—", pb.qty, pb.note or ""])

    csv_content = output.getvalue()
    output.close()

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename=BOM_{project_id[:8]}.csv"},
    )


# Monter le routeur API sous le préfixe /api
app.include_router(api_router, prefix="/api")


# ============= FRONTEND SPA CATCH-ALL =============

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """
    Sert le frontend React (SPA).
    Toutes les routes non-API sont redirigées vers index.html.
    """
    if FRONTEND_DIST.exists():
        # Tenter de servir un fichier statique si existe
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # Sinon, servir index.html (pour le routing React)
        index_path = FRONTEND_DIST / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Frontend not built. Run 'cd front && npm run build'"
    )
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Désactivé en production
        log_level="info"
    )
