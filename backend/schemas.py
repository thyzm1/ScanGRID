"""
Schémas Pydantic pour validation des requêtes et réponses
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any


# ============= SCHEMAS POUR CONTENT =============

class BinContentSchema(BaseModel):
    """Schéma pour le contenu structuré d'une boîte"""
    title: str = Field(..., description="Titre de la boîte")
    description: Optional[str] = Field(None, description="Description courte")
    items: Optional[List[str]] = Field(None, description="Liste des articles contenus")
    photos: Optional[List[str]] = Field(None, description="URLs des photos")
    icon: Optional[str] = Field(None, description="Icône RemixIcon ou Emoji")


# ============= SCHEMAS POUR CATEGORIE =============

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, description="Nom de la catégorie")
    icon: Optional[str] = Field("ri-folder-line", description="Icône RemixIcon")

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


# ============= SCHEMAS POUR BIN =============

class BinBase(BaseModel):
    x_grid: int = Field(..., ge=-1, description="Coordonnée X dans la grille Gridfinity (-1 si en attente)")
    y_grid: int = Field(..., ge=-1, description="Coordonnée Y dans la grille (-1 si en attente)")
    width_units: int = Field(..., ge=1, description="Largeur en unités Gridfinity")
    depth_units: int = Field(..., ge=1, description="Profondeur en unités Gridfinity")
    height_units: int = Field(1, ge=1, description="Hauteur en unités Gridfinity (nombre de couches occupées)")
    content: BinContentSchema = Field(..., description="Contenu structuré de la boîte")
    color: Optional[str] = Field("#3b82f6", description="Couleur de la boîte (hex)")
    is_hole: Optional[bool] = Field(False, description="Si c'est un trou")
    category_id: Optional[str] = Field(None, description="ID de la catégorie")


class BinCreate(BinBase):
    """Schéma pour créer une boîte (sans ID)"""
    pass


class BinUpdate(BaseModel):
    """Schéma pour mettre à jour une boîte (tous les champs optionnels)"""
    x_grid: Optional[int] = Field(None, ge=-1) # -1 allowed for "unplaced"
    y_grid: Optional[int] = Field(None, ge=-1) # -1 allowed for "unplaced"
    width_units: Optional[int] = Field(None, ge=1)
    depth_units: Optional[int] = Field(None, ge=1)
    height_units: Optional[int] = Field(None, ge=1)
    content: Optional[Dict[str, Any]] = None
    color: Optional[str] = None
    is_hole: Optional[bool] = None
    category_id: Optional[str] = None
    layer_id: Optional[str] = Field(None, description="Déplacer vers une autre couche")
    
    model_config = ConfigDict(extra="forbid")


class BinResponse(BinBase):
    """Schéma de réponse pour une boîte"""
    id: str = Field(..., alias="bin_id")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# ============= SCHEMAS POUR LAYER =============

class LayerBase(BaseModel):
    z_index: int = Field(..., ge=0, description="Index de hauteur (0=fond)")


class LayerCreate(LayerBase):
    """Schéma pour créer une couche"""
    bins: List[BinCreate] = Field(default_factory=list)


class LayerResponse(LayerBase):
    """Schéma de réponse pour une couche"""
    id: str = Field(..., alias="layer_id")
    bins: List[BinResponse] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# ============= SCHEMAS POUR DRAWER =============

class DrawerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    width_units: int = Field(..., ge=1, le=50, description="Largeur du tiroir en unités Gridfinity")
    depth_units: int = Field(..., ge=1, le=50, description="Profondeur du tiroir en unités Gridfinity")


class DrawerCreate(DrawerBase):
    """Schéma pour créer/remplacer un tiroir complet"""
    layers: List[LayerCreate] = Field(default_factory=list)


class DrawerResponse(DrawerBase):
    """Schéma de réponse pour un tiroir"""
    id: str = Field(..., alias="drawer_id")
    layers: List[LayerResponse] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# ============= SCHEMAS UTILITAIRES =============

class ErrorResponse(BaseModel):
    """Schéma de réponse d'erreur"""
    detail: str


class SuccessResponse(BaseModel):
    """Schéma de réponse de succès"""
    message: str
