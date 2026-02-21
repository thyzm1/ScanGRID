#!/usr/bin/env python3
"""
Script pour charger les données de test dans l'API
Usage: python load_test_data.py
"""
import asyncio
import json
import httpx


async def load_test_data():
    """Charge les données de test depuis test_data.json"""
    base_url = "http://localhost:8000"
    
    print("📦 Chargement des données de test...")
    print("=" * 50)
    
    # Lire le fichier JSON
    with open("test_data.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    async with httpx.AsyncClient() as client:
        # Vérifier que le serveur est accessible
        try:
            response = await client.get(f"{base_url}/")
            if response.status_code != 200:
                print("❌ Serveur non accessible")
                return
            print(f"✅ Serveur accessible: {response.json()['service']}\n")
        except Exception as e:
            print(f"❌ Erreur de connexion: {e}")
            print("\n⚠️  Assurez-vous que le serveur est lancé:")
            print("   cd backend && ./dev.sh")
            return
        
        # Créer chaque tiroir
        created_ids = []
        for i, drawer_data in enumerate(data["drawers"], 1):
            print(f"{i}. Création du tiroir '{drawer_data['name']}'...")
            
            try:
                response = await client.post(
                    f"{base_url}/drawers",
                    json=drawer_data
                )
                
                if response.status_code == 201:
                    result = response.json()
                    drawer_id = result["drawer_id"]
                    created_ids.append(drawer_id)
                    
                    total_bins = sum(len(layer["bins"]) for layer in result["layers"])
                    print(f"   ✅ ID: {drawer_id}")
                    print(f"      Couches: {len(result['layers'])}")
                    print(f"      Boîtes: {total_bins}")
                else:
                    print(f"   ❌ Erreur {response.status_code}: {response.text}")
            
            except Exception as e:
                print(f"   ❌ Erreur: {e}")
            
            print()
        
        # Afficher le résumé
        print("=" * 50)
        print(f"✅ {len(created_ids)} tiroir(s) créé(s) avec succès!")
        print("\n📋 IDs créés:")
        for drawer_id in created_ids:
            print(f"   - {drawer_id}")
        
        # Lister tous les tiroirs
        print("\n📊 Liste complète des tiroirs:")
        response = await client.get(f"{base_url}/drawers")
        drawers = response.json()
        
        for drawer in drawers:
            total_bins = sum(len(layer["bins"]) for layer in drawer["layers"])
            print(f"\n   📦 {drawer['name']}")
            print(f"      ID: {drawer['drawer_id']}")
            print(f"      Couches: {len(drawer['layers'])}")
            print(f"      Boîtes: {total_bins}")
            
            # Détail des boîtes
            for layer in drawer["layers"]:
                print(f"      └─ Z={layer['z_index']}: {len(layer['bins'])} boîte(s)")
                for bin_obj in layer["bins"]:
                    pos = f"({bin_obj['x_grid']},{bin_obj['y_grid']})"
                    size = f"{bin_obj['width_units']}x{bin_obj['depth_units']}"
                    label = bin_obj['label_text'] or "Sans label"
                    print(f"         • {pos} {size} - {label}")
        
        print("\n" + "=" * 50)
        print("🎉 Données de test chargées avec succès!")
        print(f"\n🌐 Accédez à l'API sur: {base_url}/docs")


if __name__ == "__main__":
    try:
        asyncio.run(load_test_data())
    except KeyboardInterrupt:
        print("\n\n⚠️  Chargement interrompu")
    except FileNotFoundError:
        print("❌ Fichier test_data.json non trouvé")
        print("   Assurez-vous d'être dans le répertoire backend/")
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
