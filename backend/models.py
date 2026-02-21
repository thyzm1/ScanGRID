"""
Modèles SQLAlchemy pour les tiroirs Gridfinity
"""
from sqlalchemy import String, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional, Dict, Any
import uuid

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
    content: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True, default=lambda: {"title": "Nouvelle boîte"})
    color: Mapped[Optional[str]] = mapped_column(String, nullable=True, default="#3b82f6")
    is_hole: Mapped[Optional[bool]] = mapped_column(Integer, nullable=True, default=False)
    
    # Relations
    layer: Mapped["Layer"] = relationship("Layer", back_populates="bins")
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="bins", lazy="selectin")
    
    def __repr__(self):
        return f"<Bin(id={self.id}, pos=({self.x_grid},{self.y_grid}), category={self.category_id}, title={self.content.get('title') if self.content else 'N/A'})>"
