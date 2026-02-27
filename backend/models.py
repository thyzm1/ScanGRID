"""
Modèles SQLAlchemy pour les tiroirs Gridfinity
"""
from sqlalchemy import String, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional, Dict, Any
import uuid
import datetime

from database import Base


class Drawer(Base):
    __tablename__ = "drawers"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    width_units: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    depth_units: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    
    # Relations
    layers: Mapped[List["Layer"]] = relationship(
        "Layer",
        back_populates="drawer",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    
    def __repr__(self):
        return f"<Drawer(id={self.id}, name={self.name}, size={self.width_units}x{self.depth_units})>"


class Layer(Base):
    __tablename__ = "layers"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    drawer_id: Mapped[str] = mapped_column(String, ForeignKey("drawers.id", ondelete="CASCADE"), nullable=False)
    z_index: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Relations
    drawer: Mapped["Drawer"] = relationship("Drawer", back_populates="layers")
    bins: Mapped[List["Bin"]] = relationship(
        "Bin",
        back_populates="layer",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    
    def __repr__(self):
        return f"<Layer(id={self.id}, z_index={self.z_index})>"


class Category(Base):
    __tablename__ = "categories"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    icon: Mapped[Optional[str]] = mapped_column(String, nullable=True, default="ri-folder-line")
    
    # Relations
    bins: Mapped[List["Bin"]] = relationship("Bin", back_populates="category")

    def __repr__(self):
        return f"<Category(id={self.id}, name={self.name})>"


class Bin(Base):
    __tablename__ = "bins"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    layer_id: Mapped[str] = mapped_column(String, ForeignKey("layers.id", ondelete="CASCADE"), nullable=False)
    category_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True) # New FK
    x_grid: Mapped[int] = mapped_column(Integer, nullable=False)
    y_grid: Mapped[int] = mapped_column(Integer, nullable=False)
    width_units: Mapped[int] = mapped_column(Integer, nullable=False)
    depth_units: Mapped[int] = mapped_column(Integer, nullable=False)
    height_units: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    content: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True, default=lambda: {"title": "Nouvelle boîte"})
    color: Mapped[Optional[str]] = mapped_column(String, nullable=True, default="#3b82f6")
    is_hole: Mapped[Optional[bool]] = mapped_column(Integer, nullable=True, default=False)
    
    # Relations
    layer: Mapped["Layer"] = relationship("Layer", back_populates="bins")
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="bins", lazy="selectin")
    
    def __repr__(self):
        return f"<Bin(id={self.id}, pos=({self.x_grid},{self.y_grid}), category={self.category_id}, title={self.content.get('title') if self.content else 'N/A'})>"


# ============= PROJECTS =============

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[str] = mapped_column(String, nullable=False, default=lambda: datetime.datetime.utcnow().isoformat())

    # Relation
    project_bins: Mapped[List["ProjectBin"]] = relationship(
        "ProjectBin",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self):
        return f"<Project(id={self.id}, name={self.name})>"


class ProjectBin(Base):
    """
    Association entre un projet et un bin de l'inventaire.
    bin_id est une référence "soft" (string) — pas de FK dure —
    pour éviter la cascade si un bin est supprimé.
    """
    __tablename__ = "project_bins"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    bin_id: Mapped[str] = mapped_column(String, nullable=False)   # soft ref
    qty: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    note: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # lien datasheet / PDF

    # Relation
    project: Mapped["Project"] = relationship("Project", back_populates="project_bins")

    def __repr__(self):
        return f"<ProjectBin(id={self.id}, project={self.project_id}, bin={self.bin_id}, qty={self.qty})>"

