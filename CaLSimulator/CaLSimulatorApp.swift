import SwiftUI

@main
@MainActor
struct CaLSimulatorApp: App {
    @StateObject private var calculator = CalculatorModel()
    var body: some Scene {
        WindowGroup {
            CalculatorView(model: calculator)
                .preferredColorScheme(.dark)
        }
    }
}
