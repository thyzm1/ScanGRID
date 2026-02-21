# 📱 Configuration SwiftUI - Connexion au Backend ScanGRID

## 🔌 Informations de connexion

### URL de base de l'API

```swift
// Configuration pour l'environnement de production (Raspberry Pi)
let baseURL = "http://<RASPBERRY_PI_IP>:8000"

// Exemple avec IP fixe
let baseURL = "http://192.168.1.100:8000"
```

### Découverte automatique de l'IP Raspberry Pi

Pour éviter de hardcoder l'IP, vous pouvez :

1. **Utiliser mDNS/Bonjour** :
   ```swift
   let baseURL = "http://raspberrypi.local:8000"
   ```

2. **Configurer une IP fixe sur le Raspberry Pi** :
   - Éditer `/etc/dhcpcd.conf`
   - Ajouter :
     ```
     interface wlan0
     static ip_address=192.168.1.100/24
     static routers=192.168.1.1
     static domain_name_servers=192.168.1.1
     ```

## 📦 Modèles Swift (Codable)

```swift
import Foundation

// MARK: - Bin
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

// MARK: - Layer
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

// MARK: - Drawer
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

// MARK: - Requests
struct CreateDrawerRequest: Codable {
    let name: String
    let layers: [CreateLayerRequest]
}

struct CreateLayerRequest: Codable {
    let zIndex: Int
    let bins: [CreateBinRequest]
    
    enum CodingKeys: String, CodingKey {
        case zIndex = "z_index"
        case bins
    }
}

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

## 🌐 Service API

```swift
import Foundation

enum APIError: Error {
    case invalidURL
    case networkError(Error)
    case decodingError(Error)
    case serverError(Int, String)
}

class ScanGridAPIService {
    static let shared = ScanGridAPIService()
    
    // À configurer avec l'IP de votre Raspberry Pi
    private let baseURL = "http://192.168.1.100:8000"
    
    private let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        return decoder
    }()
    
    private let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        return encoder
    }()
    
    // MARK: - Health Check
    func checkHealth() async throws -> Bool {
        let url = URL(string: "\(baseURL)/")!
        let (_, response) = try await URLSession.shared.data(from: url)
        return (response as? HTTPURLResponse)?.statusCode == 200
    }
    
    // MARK: - Drawers
    
    /// Créer un nouveau tiroir complet
    func createDrawer(_ request: CreateDrawerRequest) async throws -> Drawer {
        guard let url = URL(string: "\(baseURL)/drawers") else {
            throw APIError.invalidURL
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = try encoder.encode(request)
        
        let (data, response) = try await URLSession.shared.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError(NSError(domain: "", code: -1))
        }
        
        if httpResponse.statusCode != 201 {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIError.serverError(httpResponse.statusCode, errorMessage)
        }
        
        return try decoder.decode(Drawer.self, from: data)
    }
    
    /// Récupérer un tiroir par ID
    func getDrawer(id: String) async throws -> Drawer {
        guard let url = URL(string: "\(baseURL)/drawers/\(id)") else {
            throw APIError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError(NSError(domain: "", code: -1))
        }
        
        if httpResponse.statusCode != 200 {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIError.serverError(httpResponse.statusCode, errorMessage)
        }
        
        return try decoder.decode(Drawer.self, from: data)
    }
    
    /// Lister tous les tiroirs
    func listDrawers() async throws -> [Drawer] {
        guard let url = URL(string: "\(baseURL)/drawers") else {
            throw APIError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        return try decoder.decode([Drawer].self, from: data)
    }
    
    /// Supprimer un tiroir
    func deleteDrawer(id: String) async throws {
        guard let url = URL(string: "\(baseURL)/drawers/\(id)") else {
            throw APIError.invalidURL
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "DELETE"
        
        let (_, response) = try await URLSession.shared.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError(NSError(domain: "", code: -1))
        }
    }
    
    // MARK: - Bins
    
    /// Mettre à jour une boîte
    func updateBin(id: String, update: UpdateBinRequest) async throws -> Bin {
        guard let url = URL(string: "\(baseURL)/bins/\(id)") else {
            throw APIError.invalidURL
        }
        
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "PATCH"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = try encoder.encode(update)
        
        let (data, response) = try await URLSession.shared.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.networkError(NSError(domain: "", code: -1))
        }
        
        return try decoder.decode(Bin.self, from: data)
    }
    
    /// Récupérer une boîte par ID
    func getBin(id: String) async throws -> Bin {
        guard let url = URL(string: "\(baseURL)/bins/\(id)") else {
            throw APIError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        return try decoder.decode(Bin.self, from: data)
    }
}
```

## 🎯 Exemple d'utilisation dans SwiftUI

```swift
import SwiftUI

@MainActor
class DrawerViewModel: ObservableObject {
    @Published var drawers: [Drawer] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let apiService = ScanGridAPIService.shared
    
    func loadDrawers() async {
        isLoading = true
        errorMessage = nil
        
        do {
            drawers = try await apiService.listDrawers()
        } catch {
            errorMessage = "Erreur de chargement: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func createDrawer(name: String, layers: [CreateLayerRequest]) async {
        let request = CreateDrawerRequest(name: name, layers: layers)
        
        do {
            let newDrawer = try await apiService.createDrawer(request)
            drawers.append(newDrawer)
        } catch {
            errorMessage = "Erreur de création: \(error.localizedDescription)"
        }
    }
    
    func updateBinLabel(binId: String, newLabel: String) async {
        let update = UpdateBinRequest(
            xGrid: nil,
            yGrid: nil,
            widthUnits: nil,
            depthUnits: nil,
            labelText: newLabel
        )
        
        do {
            _ = try await apiService.updateBin(id: binId, update: update)
            // Recharger les données
            await loadDrawers()
        } catch {
            errorMessage = "Erreur de mise à jour: \(error.localizedDescription)"
        }
    }
}

struct DrawerListView: View {
    @StateObject private var viewModel = DrawerViewModel()
    
    var body: some View {
        NavigationView {
            Group {
                if viewModel.isLoading {
                    ProgressView("Chargement...")
                } else if let error = viewModel.errorMessage {
                    VStack {
                        Text("❌ Erreur")
                            .font(.headline)
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                        Button("Réessayer") {
                            Task {
                                await viewModel.loadDrawers()
                            }
                        }
                    }
                } else {
                    List(viewModel.drawers) { drawer in
                        NavigationLink(destination: DrawerDetailView(drawer: drawer)) {
                            VStack(alignment: .leading) {
                                Text(drawer.name)
                                    .font(.headline)
                                Text("\(drawer.layers.count) couche(s)")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Tiroirs")
            .task {
                await viewModel.loadDrawers()
            }
        }
    }
}
```

## 🔍 Tester la connexion

### 1. Trouver l'IP du Raspberry Pi

Sur le Raspberry Pi :
```bash
hostname -I
```

### 2. Tester depuis Safari iOS

Ouvrir Safari sur l'iPhone et aller à :
```
http://<RASPBERRY_PI_IP>:8000/docs
```

Vous devriez voir la documentation Swagger UI.

### 3. Tester depuis Xcode

```swift
Task {
    do {
        let isHealthy = try await ScanGridAPIService.shared.checkHealth()
        print("✅ Serveur accessible: \(isHealthy)")
    } catch {
        print("❌ Erreur de connexion: \(error)")
    }
}
```

## ⚙️ Configuration App Transport Security (iOS)

Si vous utilisez HTTP (non HTTPS), ajoutez dans `Info.plist` :

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <!-- OU pour plus de sécurité, autoriser uniquement votre IP -->
    <key>NSExceptionDomains</key>
    <dict>
        <key>192.168.1.100</key>
        <dict>
            <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>
```

## 📡 Informations réseau requises pour l'agent IA

**Pour configurer l'application SwiftUI, fournissez ces informations à l'agent IA :**

1. **URL de base de l'API** : `http://<IP_RASPBERRY_PI>:8000`
2. **Port** : `8000`
3. **Protocole** : `HTTP` (HTTPS si vous configurez un certificat)
4. **Format de données** : `JSON`
5. **Naming convention** : `snake_case` côté API, conversion en `camelCase` avec `CodingKeys`
6. **Structure des réponses** : Voir les modèles Swift ci-dessus
7. **Headers requis** : `Content-Type: application/json` pour POST/PATCH

## 🚨 Points d'attention

- Le serveur doit être accessible sur le même réseau Wi-Fi que l'iPhone
- Configurer une IP fixe pour le Raspberry Pi est recommandé
- Les UUIDs sont générés côté serveur (ne pas les inclure dans les requêtes de création)
- Les opérations POST sont transactionnelles : tout ou rien
- Les suppressions sont en cascade (supprimer un tiroir supprime ses layers et bins)

## 📖 Documentation complète de l'API

Une fois le serveur lancé, accéder à :
- **Swagger UI** : `http://<RASPBERRY_PI_IP>:8000/docs`
- **ReDoc** : `http://<RASPBERRY_PI_IP>:8000/redoc`
