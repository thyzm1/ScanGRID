# 🎯 RÉSUMÉ POUR L'AGENT IA SWIFTUI

## URL DE BASE
```swift
"http://<IP_RASPBERRY_PI>:8000"
// Exemple: "http://192.168.1.100:8000"
```

## MODÈLES SWIFT (Copier-coller)

```swift
// Bin.swift
struct Bin: Codable, Identifiable {
    var id: String { binId }
    let binId: String
    let xGrid: Int
    let yGrid: Int
    let widthUnits: Int
    let depthUnits: Int
    let labelText: String?
    
    enum CodingKeys: String, CodingKey {
        case binId = "bin_id"
        case xGrid = "x_grid"
        case yGrid = "y_grid"
        case widthUnits = "width_units"
        case depthUnits = "depth_units"
        case labelText = "label_text"
    }
}

// Layer.swift
struct Layer: Codable, Identifiable {
    var id: String { layerId }
    let layerId: String
    let zIndex: Int
    let bins: [Bin]
    
    enum CodingKeys: String, CodingKey {
        case layerId = "layer_id"
        case zIndex = "z_index"
        case bins
    }
}

// Drawer.swift
struct Drawer: Codable, Identifiable {
    var id: String { drawerId }
    let drawerId: String
    let name: String
    let layers: [Layer]
    
    enum CodingKeys: String, CodingKey {
        case drawerId = "drawer_id"
        case name
        case layers
    }
}

// Requests
struct CreateBinRequest: Codable {
    let xGrid: Int
    let yGrid: Int
    let widthUnits: Int
    let depthUnits: Int
    let labelText: String?
    
    enum CodingKeys: String, CodingKey {
        case xGrid = "x_grid"
        case yGrid = "y_grid"
        case widthUnits = "width_units"
        case depthUnits = "depth_units"
        case labelText = "label_text"
    }
}

struct CreateLayerRequest: Codable {
    let zIndex: Int
    let bins: [CreateBinRequest]
    
    enum CodingKeys: String, CodingKey {
        case zIndex = "z_index"
        case bins
    }
}

struct CreateDrawerRequest: Codable {
    let name: String
    let layers: [CreateLayerRequest]
}

struct UpdateBinRequest: Codable {
    let xGrid: Int?
    let yGrid: Int?
    let widthUnits: Int?
    let depthUnits: Int?
    let labelText: String?
    
    enum CodingKeys: String, CodingKey {
        case xGrid = "x_grid"
        case yGrid = "y_grid"
        case widthUnits = "width_units"
        case depthUnits = "depth_units"
        case labelText = "label_text"
    }
}
```

## APPELS API (Exemples fonctionnels)

```swift
// 1. Créer un tiroir
let request = CreateDrawerRequest(
    name: "Mon Tiroir",
    layers: [
        CreateLayerRequest(
            zIndex: 0,
            bins: [
                CreateBinRequest(
                    xGrid: 0,
                    yGrid: 0,
                    widthUnits: 2,
                    depthUnits: 1,
                    labelText: "Résistances"
                )
            ]
        )
    ]
)

var urlRequest = URLRequest(url: URL(string: "\(baseURL)/drawers")!)
urlRequest.httpMethod = "POST"
urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
urlRequest.httpBody = try JSONEncoder().encode(request)

let (data, _) = try await URLSession.shared.data(for: urlRequest)
let drawer = try JSONDecoder().decode(Drawer.self, from: data)
// drawer.drawerId contient l'UUID généré

// 2. Lister les tiroirs
let (data, _) = try await URLSession.shared.data(
    from: URL(string: "\(baseURL)/drawers")!
)
let drawers = try JSONDecoder().decode([Drawer].self, from: data)

// 3. Récupérer un tiroir
let (data, _) = try await URLSession.shared.data(
    from: URL(string: "\(baseURL)/drawers/\(drawerId)")!
)
let drawer = try JSONDecoder().decode(Drawer.self, from: data)

// 4. Mettre à jour une boîte
let update = UpdateBinRequest(
    xGrid: nil,
    yGrid: nil,
    widthUnits: nil,
    depthUnits: nil,
    labelText: "Nouveau Label"
)

var urlRequest = URLRequest(url: URL(string: "\(baseURL)/bins/\(binId)")!)
urlRequest.httpMethod = "PATCH"
urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
urlRequest.httpBody = try JSONEncoder().encode(update)

let (data, _) = try await URLSession.shared.data(for: urlRequest)
let bin = try JSONDecoder().decode(Bin.self, from: data)

// 5. Supprimer un tiroir
var urlRequest = URLRequest(url: URL(string: "\(baseURL)/drawers/\(drawerId)")!)
urlRequest.httpMethod = "DELETE"
let (_, _) = try await URLSession.shared.data(for: urlRequest)
```

## INFO.PLIST (OBLIGATOIRE pour HTTP)

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

## CODES HTTP

- 200 : OK (GET, PATCH, DELETE)
- 201 : Created (POST tiroir)
- 404 : Not Found
- 422 : Validation Error

## RÈGLES IMPORTANTES

1. ⚠️ Ne JAMAIS générer d'UUID côté client (le serveur le fait)
2. ⚠️ Utiliser `snake_case` pour JSON, `camelCase` pour Swift + CodingKeys
3. ⚠️ POST /drawers est transactionnel (tout ou rien)
4. ⚠️ DELETE cascade (drawer → layers → bins)
5. ⚠️ Validation: x_grid/y_grid >= 0, width/depth >= 1

## TEST RAPIDE

```swift
// Dans une View ou ViewModel
Task {
    do {
        let url = URL(string: "http://192.168.1.100:8000/")!
        let (data, _) = try await URLSession.shared.data(from: url)
        let response = try JSONDecoder().decode([String: String].self, from: data)
        print("✅ Serveur: \(response["status"] ?? "error")")
    } catch {
        print("❌ Erreur: \(error)")
    }
}
```

## POUR TROUVER L'IP RASPBERRY PI

```bash
# Sur le Raspberry Pi
hostname -I
# Exemple de sortie: 192.168.1.100
```

## DOCUMENTATION COMPLÈTE

- Backend: `backend/README.md`
- Intégration: `SWIFTUI_INTEGRATION.md`
- Brief complet: `AI_AGENT_BRIEF.md`

---

**C'est tout ce dont tu as besoin pour commencer ! 🚀**
