"""
Tests unitaires pour l'API ScanGRID
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import Base, get_db
from models import Drawer, Layer, Bin

# Base de données en mémoire pour les tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Moteur de test
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False,
)

test_session_maker = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def override_get_db():
    """Override de la dépendance DB pour les tests"""
    async with test_session_maker() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def async_client():
    """Fixture pour le client HTTP de test"""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient):
    """Test du endpoint de santé"""
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ScanGRID" in data["service"]


@pytest.mark.asyncio
async def test_create_drawer_full(async_client: AsyncClient):
    """Test de création d'un tiroir complet avec couches et boîtes"""
    drawer_data = {
        "name": "Tiroir Test Composants",
        "layers": [
            {
                "z_index": 0,
                "bins": [
                    {
                        "x_grid": 0,
                        "y_grid": 0,
                        "width_units": 2,
                        "depth_units": 1,
                        "label_text": "Résistances 10k"
                    },
                    {
                        "x_grid": 2,
                        "y_grid": 0,
                        "width_units": 1,
                        "depth_units": 1,
                        "label_text": "Condensateurs"
                    }
                ]
            },
            {
                "z_index": 1,
                "bins": [
                    {
                        "x_grid": 0,
                        "y_grid": 0,
                        "width_units": 3,
                        "depth_units": 2,
                        "label_text": "LEDs"
                    }
                ]
            }
        ]
    }
    
    response = await async_client.post("/drawers", json=drawer_data)
    assert response.status_code == 201
    
    data = response.json()
    assert data["name"] == "Tiroir Test Composants"
    assert "drawer_id" in data
    assert len(data["layers"]) == 2
    assert len(data["layers"][0]["bins"]) == 2
    assert len(data["layers"][1]["bins"]) == 1
    assert data["layers"][0]["bins"][0]["label_text"] == "Résistances 10k"


@pytest.mark.asyncio
async def test_create_drawer_minimal(async_client: AsyncClient):
    """Test de création d'un tiroir minimal (sans boîtes)"""
    drawer_data = {
        "name": "Tiroir Vide",
        "layers": []
    }
    
    response = await async_client.post("/drawers", json=drawer_data)
    assert response.status_code == 201
    
    data = response.json()
    assert data["name"] == "Tiroir Vide"
    assert data["layers"] == []


@pytest.mark.asyncio
async def test_get_drawer(async_client: AsyncClient):
    """Test de récupération d'un tiroir par ID"""
    # Créer un tiroir d'abord
    drawer_data = {
        "name": "Tiroir à Récupérer",
        "layers": [
            {
                "z_index": 0,
                "bins": [
                    {
                        "x_grid": 1,
                        "y_grid": 1,
                        "width_units": 1,
                        "depth_units": 1,
                        "label_text": "Test"
                    }
                ]
            }
        ]
    }
    
    create_response = await async_client.post("/drawers", json=drawer_data)
    drawer_id = create_response.json()["drawer_id"]
    
    # Récupérer le tiroir
    response = await async_client.get(f"/drawers/{drawer_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["drawer_id"] == drawer_id
    assert data["name"] == "Tiroir à Récupérer"
    assert len(data["layers"]) == 1


@pytest.mark.asyncio
async def test_get_drawer_not_found(async_client: AsyncClient):
    """Test de récupération d'un tiroir inexistant"""
    response = await async_client.get("/drawers/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_drawers(async_client: AsyncClient):
    """Test de listing de tous les tiroirs"""
    # Créer plusieurs tiroirs
    for i in range(3):
        await async_client.post("/drawers", json={"name": f"Tiroir {i}", "layers": []})
    
    # Lister tous les tiroirs
    response = await async_client.get("/drawers")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 3
    assert all("drawer_id" in d for d in data)


@pytest.mark.asyncio
async def test_delete_drawer(async_client: AsyncClient):
    """Test de suppression d'un tiroir"""
    # Créer un tiroir
    create_response = await async_client.post(
        "/drawers",
        json={"name": "Tiroir à Supprimer", "layers": []}
    )
    drawer_id = create_response.json()["drawer_id"]
    
    # Supprimer le tiroir
    delete_response = await async_client.delete(f"/drawers/{drawer_id}")
    assert delete_response.status_code == 200
    
    # Vérifier qu'il n'existe plus
    get_response = await async_client.get(f"/drawers/{drawer_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_update_bin(async_client: AsyncClient):
    """Test de mise à jour d'une boîte"""
    # Créer un tiroir avec une boîte
    drawer_data = {
        "name": "Tiroir Update Test",
        "layers": [
            {
                "z_index": 0,
                "bins": [
                    {
                        "x_grid": 0,
                        "y_grid": 0,
                        "width_units": 1,
                        "depth_units": 1,
                        "label_text": "Label Original"
                    }
                ]
            }
        ]
    }
    
    create_response = await async_client.post("/drawers", json=drawer_data)
    bin_id = create_response.json()["layers"][0]["bins"][0]["bin_id"]
    
    # Mettre à jour le label
    update_data = {"label_text": "Label Modifié"}
    update_response = await async_client.patch(f"/bins/{bin_id}", json=update_data)
    assert update_response.status_code == 200
    
    data = update_response.json()
    assert data["label_text"] == "Label Modifié"
    assert data["bin_id"] == bin_id


@pytest.mark.asyncio
async def test_update_bin_dimensions(async_client: AsyncClient):
    """Test de mise à jour des dimensions d'une boîte"""
    # Créer un tiroir avec une boîte
    drawer_data = {
        "name": "Tiroir Dimensions Test",
        "layers": [
            {
                "z_index": 0,
                "bins": [
                    {
                        "x_grid": 0,
                        "y_grid": 0,
                        "width_units": 1,
                        "depth_units": 1
                    }
                ]
            }
        ]
    }
    
    create_response = await async_client.post("/drawers", json=drawer_data)
    bin_id = create_response.json()["layers"][0]["bins"][0]["bin_id"]
    
    # Mettre à jour les dimensions
    update_data = {"width_units": 3, "depth_units": 2}
    update_response = await async_client.patch(f"/bins/{bin_id}", json=update_data)
    assert update_response.status_code == 200
    
    data = update_response.json()
    assert data["width_units"] == 3
    assert data["depth_units"] == 2


@pytest.mark.asyncio
async def test_update_bin_not_found(async_client: AsyncClient):
    """Test de mise à jour d'une boîte inexistante"""
    update_data = {"label_text": "Nouveau Label"}
    response = await async_client.patch("/bins/nonexistent-id", json=update_data)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_bin(async_client: AsyncClient):
    """Test de récupération d'une boîte par ID"""
    # Créer un tiroir avec une boîte
    drawer_data = {
        "name": "Tiroir Get Bin Test",
        "layers": [
            {
                "z_index": 0,
                "bins": [
                    {
                        "x_grid": 5,
                        "y_grid": 3,
                        "width_units": 2,
                        "depth_units": 1,
                        "label_text": "Test Bin"
                    }
                ]
            }
        ]
    }
    
    create_response = await async_client.post("/drawers", json=drawer_data)
    bin_id = create_response.json()["layers"][0]["bins"][0]["bin_id"]
    
    # Récupérer la boîte
    response = await async_client.get(f"/bins/{bin_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["bin_id"] == bin_id
    assert data["x_grid"] == 5
    assert data["y_grid"] == 3
    assert data["label_text"] == "Test Bin"


@pytest.mark.asyncio
async def test_validation_errors(async_client: AsyncClient):
    """Test des erreurs de validation Pydantic"""
    # Nom vide
    response = await async_client.post("/drawers", json={"name": "", "layers": []})
    assert response.status_code == 422
    
    # Dimensions négatives
    drawer_data = {
        "name": "Test",
        "layers": [
            {
                "z_index": 0,
                "bins": [
                    {
                        "x_grid": -1,  # Invalide
                        "y_grid": 0,
                        "width_units": 1,
                        "depth_units": 1
                    }
                ]
            }
        ]
    }
    response = await async_client.post("/drawers", json=drawer_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_cascade_delete(async_client: AsyncClient):
    """Test que la suppression d'un tiroir supprime bien les couches et boîtes"""
    # Créer un tiroir complet
    drawer_data = {
        "name": "Tiroir Cascade Test",
        "layers": [
            {
                "z_index": 0,
                "bins": [
                    {"x_grid": 0, "y_grid": 0, "width_units": 1, "depth_units": 1}
                ]
            }
        ]
    }
    
    create_response = await async_client.post("/drawers", json=drawer_data)
    drawer_id = create_response.json()["drawer_id"]
    bin_id = create_response.json()["layers"][0]["bins"][0]["bin_id"]
    
    # Supprimer le tiroir
    await async_client.delete(f"/drawers/{drawer_id}")
    
    # Vérifier que la boîte n'existe plus
    bin_response = await async_client.get(f"/bins/{bin_id}")
    assert bin_response.status_code == 404
