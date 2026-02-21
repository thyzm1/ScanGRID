"""
Script de test rapide pour vérifier que l'API fonctionne correctement
Usage: python quick_test.py
"""
import asyncio
import httpx
import json


async def test_api():
    """Test rapide de l'API"""
    base_url = "http://localhost:8000"
    
    print("🧪 Test de l'API ScanGRID")
    print("=" * 50)
    
    async with httpx.AsyncClient() as client:
        # 1. Health Check
        print("\n1️⃣ Test du health check...")
        try:
            response = await client.get(f"{base_url}/")
            assert response.status_code == 200
            print(f"   ✅ Serveur actif: {response.json()}")
        except Exception as e:
            print(f"   ❌ Erreur: {e}")
            return
        
        # 2. Créer un tiroir
        print("\n2️⃣ Création d'un tiroir test...")
        drawer_data = {
            "name": "Tiroir Test Quick",
            "layers": [
                {
                    "z_index": 0,
                    "bins": [
                        {
                            "x_grid": 0,
                            "y_grid": 0,
                            "width_units": 2,
                            "depth_units": 1,
                            "label_text": "Résistances 10kΩ"
                        },
                        {
                            "x_grid": 2,
                            "y_grid": 0,
                            "width_units": 1,
                            "depth_units": 1,
                            "label_text": "LEDs Rouges"
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
                            "label_text": "Condensateurs"
                        }
                    ]
                }
            ]
        }
        
        response = await client.post(f"{base_url}/drawers", json=drawer_data)
        assert response.status_code == 201
        created_drawer = response.json()
        drawer_id = created_drawer["drawer_id"]
        print(f"   ✅ Tiroir créé: {drawer_id}")
        print(f"      Nom: {created_drawer['name']}")
        print(f"      Layers: {len(created_drawer['layers'])}")
        print(f"      Bins totales: {sum(len(l['bins']) for l in created_drawer['layers'])}")
        
        # 3. Récupérer le tiroir
        print(f"\n3️⃣ Récupération du tiroir {drawer_id[:8]}...")
        response = await client.get(f"{base_url}/drawers/{drawer_id}")
        assert response.status_code == 200
        retrieved_drawer = response.json()
        print(f"   ✅ Tiroir récupéré: {retrieved_drawer['name']}")
        
        # 4. Lister tous les tiroirs
        print("\n4️⃣ Liste de tous les tiroirs...")
        response = await client.get(f"{base_url}/drawers")
        assert response.status_code == 200
        drawers = response.json()
        print(f"   ✅ {len(drawers)} tiroir(s) trouvé(s)")
        
        # 5. Mettre à jour une boîte
        bin_id = created_drawer["layers"][0]["bins"][0]["bin_id"]
        print(f"\n5️⃣ Mise à jour de la boîte {bin_id[:8]}...")
        update_data = {"label_text": "Résistances 10kΩ ±5%"}
        response = await client.patch(f"{base_url}/bins/{bin_id}", json=update_data)
        assert response.status_code == 200
        updated_bin = response.json()
        print(f"   ✅ Label mis à jour: '{updated_bin['label_text']}'")
        
        # 6. Récupérer une boîte
        print(f"\n6️⃣ Récupération de la boîte {bin_id[:8]}...")
        response = await client.get(f"{base_url}/bins/{bin_id}")
        assert response.status_code == 200
        bin_data = response.json()
        print(f"   ✅ Boîte récupérée:")
        print(f"      Position: ({bin_data['x_grid']}, {bin_data['y_grid']})")
        print(f"      Dimensions: {bin_data['width_units']}x{bin_data['depth_units']}")
        print(f"      Label: {bin_data['label_text']}")
        
        # 7. Supprimer le tiroir
        print(f"\n7️⃣ Suppression du tiroir {drawer_id[:8]}...")
        response = await client.delete(f"{base_url}/drawers/{drawer_id}")
        assert response.status_code == 200
        print(f"   ✅ Tiroir supprimé")
        
        # 8. Vérifier la suppression
        print(f"\n8️⃣ Vérification de la suppression...")
        response = await client.get(f"{base_url}/drawers/{drawer_id}")
        assert response.status_code == 404
        print(f"   ✅ Tiroir bien supprimé (404)")
        
        # 9. Vérifier que la boîte est aussi supprimée (cascade)
        print(f"\n9️⃣ Vérification de la suppression en cascade...")
        response = await client.get(f"{base_url}/bins/{bin_id}")
        assert response.status_code == 404
        print(f"   ✅ Boîte aussi supprimée (cascade)")
    
    print("\n" + "=" * 50)
    print("✅ Tous les tests sont passés avec succès!")
    print("🎉 L'API fonctionne correctement!")


if __name__ == "__main__":
    print("\n⚠️  Assurez-vous que le serveur est lancé sur http://localhost:8000")
    print("   Lancez-le avec: cd backend && ./dev.sh\n")
    
    try:
        asyncio.run(test_api())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrompu par l'utilisateur")
    except Exception as e:
        print(f"\n\n❌ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()
