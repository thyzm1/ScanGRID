"""
API FastAPI pour la gestion d'inventaire Gridfinity
Serveur ultra-léger pour Raspberry Pi
"""
import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db, init_db
from models import Drawer, Layer, Bin
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
)

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
    yield
    logger.info("🛑 Arrêt du serveur ScanGRID")


# Création de l'application FastAPI
app = FastAPI(
    title="ScanGRID API",
    description="API de gestion d'inventaire Gridfinity pour Raspberry Pi",
    version="1.0.0",
    lifespan=lifespan,
    # Pas de root_path, on gère le préfixe manuellement via APIRouter si besoin, 
    # ou on laisse le proxy gérer.
)

# Création d'un routeur principal pour ajouter le préfixe /api
api_router = FastAPI(
    title="ScanGRID API Sub-App",
    lifespan=lifespan,
)

# CORS pour permettre les requêtes depuis l'app iOS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration pour servir le frontend React en production
FRONTEND_DIST = Path(__file__).parent.parent / "front" / "dist"
# On déplace les endpoints existants pour qu'ils soient montés. 
# ATTENTION: Cette modification nécessite de grouper les routes, 
# mais pour une correction rapide et sûre, on va simplement ajouter 
# une route de redirection ou monter l'app sous /api

@app.get("/api/health", tags=["Health"])
async def health_api():
    """Endpoint de santé (Mirror pour /api)"""
    return {"status": "healthy"}

if FRONTEND_DIST.exists():
    logger.info(f"📦 Serving frontend from {FRONTEND_DIST}")
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


# ============= ENDPOINTS =============

@app.get("/health", tags=["Health"])
async def health():
    """Endpoint de santé pour vérifier que le serveur est actif"""
    return {
        "status": "healthy",
        "service": "ScanGRID API",
        "version": "1.0.0"
    }


@app.post(
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


@app.get(
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


@app.get(
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


@app.delete(
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


@app.patch(
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
    for field, value in update_data.items():
        setattr(bin_obj, field, value)
    
    await db.commit()
    await db.refresh(bin_obj)
    
    logger.info(f"✅ Boîte mise à jour: {bin_id}")
    return BinResponse.model_validate(bin_obj)


@app.get(
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


@app.post(
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


@app.post(
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


@app.delete(
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
