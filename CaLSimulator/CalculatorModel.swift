import Foundation
import JavaScriptCore
import SwiftUI
import UIKit

struct SavedProgram: Codable, Identifiable {
    var id = UUID()
    var name: String
    var source: String
}

struct HistoryEntry: Codable, Identifiable {
    var id = UUID()
    var expression: String
    var result: String
}

struct PersistedState: Codable {
    var angle: String
    var variables: [String: [String: Double]]
    var history: [HistoryEntry]
    var programs: [SavedProgram]
}

enum ToolPanel: String, Identifiable {
    case programs, formula, solve, calc, statistics, regression, table, recurrence, equation, matrix, calculus, base, memory, settings, functions, help
    var id: String { rawValue }
    var title: String {
        switch self {
        case .programs: return "PROG · โปรแกรม"
        case .formula: return "FMLA · สูตรคำนวณ"
        case .solve: return "SOLVE · หาค่า X"
        case .calc: return "CALC · แทนค่าตัวแปร"
        case .statistics: return "SD · สถิติ"
        case .regression: return "REG · การถดถอยเชิงเส้น"
        case .table: return "TABLE · ตารางค่า"
        case .recurrence: return "RECUR · ลำดับ"
        case .equation: return "EQN · สมการ"
        case .matrix: return "MATRIX · เมทริกซ์"
        case .calculus: return "MATH · แคลคูลัส"
        case .base: return "BASE-N · แปลงฐานจำนวน"
        case .memory: return "MEMORY · หน่วยความจำ"
        case .settings: return "SETUP · ตั้งค่า"
        case .functions: return "FUNCTION · ฟังก์ชัน"
        case .help: return "เกี่ยวกับ Simulator"
        }
    }
}

@MainActor
final class CalculatorModel: ObservableObject {
    @Published var expression = ""
    @Published var result = "0"
    @Published var error: String?
    @Published var cursor = 0
    @Published var shift = false
    @Published var alpha = false
    @Published var alphaLock = false
    @Published var powered = true
    @Published var angle = "DEG"
    @Published var menu: String?
    @Published var panel: ToolPanel?
    @Published var mode = "COMP"
    @Published var variables: [String: [String: Double]] = [:]
    @Published var history: [HistoryEntry] = []
    @Published var programs: [SavedProgram] = []
    @Published var feedback = true
    @Published var fractionDisplay = false
    @Published var busy = false
    private var completed = false
    private var memoryAction: String?
    private var historyIndex = 0
    private var context: JSContext?
    private let storageKey = "cal.simulator.state.v1"
    private(set) var lastValue: [String: Double] = ["re": 0, "im": 0]

    init() {
        context = JSContext()
        if let url = Bundle.main.url(forResource: "engine", withExtension: "js"),
           let script = try? String(contentsOf: url, encoding: .utf8) {
            context?.evaluateScript(script)
        }
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let state = try? JSONDecoder().decode(PersistedState.self, from: data) {
            angle = state.angle; variables = state.variables
            history = state.history; programs = state.programs
        } else {
            programs = [SavedProgram(name: "FOR-LOOP", source: "25→A\n100→Dim List X\nIf A=25\nThen\n\"FOR-LOOP\"\nFor 1→N To 100\n10×N+3→List X[N]\nNext\nIfEnd\nList X[100]"),
                        SavedProgram(name: "QUADRATIC", source: "?→A\n?→B\n?→C\nB^2-4×A×C→D\n(-B+sqrt(D))/(2×A)\n(-B-sqrt(D))/(2×A)")]
        }
        lastValue = variables["Ans"] ?? ["re": 0, "im": 0]
        completed = variables["Ans"] != nil
        if let response = try? request(["action": "format", "value": lastValue]) { result = response["text"] as? String ?? "0" }
        historyIndex = history.count
    }

    func persist() {
        let state = PersistedState(angle: angle, variables: variables, history: history, programs: programs)
        if let data = try? JSONEncoder().encode(state) { UserDefaults.standard.set(data, forKey: storageKey) }
    }

    func request(_ fields: [String: Any]) throws -> [String: Any] {
        var payload = fields
        payload["variables"] = fields["variables"] ?? variables
        payload["angle"] = angle
        let data = try JSONSerialization.data(withJSONObject: payload)
        guard let context, let function = context.objectForKeyedSubscript("calculateJSON"), !function.isUndefined,
              let json = function.call(withArguments: [String(decoding: data, as: UTF8.self)])?.toString(),
              let decoded = json.data(using: .utf8),
              let response = try JSONSerialization.jsonObject(with: decoded) as? [String: Any] else {
            throw CalculationError.message("ระบบคำนวณไม่พร้อมใช้งาน")
        }
        guard response["ok"] as? Bool == true, let result = response["result"] as? [String: Any] else {
            throw CalculationError.message(response["error"] as? String ?? "Math ERROR")
        }
        return result
    }

    func insert(_ text: String) {
        if completed {
            expression = ["+", "−", "×", "÷", "^", "!", "%"].contains(text) ? "Ans" : ""
            cursor = expression.count; completed = false
        }
        error = nil; menu = nil
        let index = expression.index(expression.startIndex, offsetBy: min(cursor, expression.count))
        expression.insert(contentsOf: text, at: index); cursor += text.count
    }

    func calculate() {
        guard !expression.isEmpty else { return }
        do {
            let response = try request(["action": "evaluate", "expression": expression])
            applyEvaluation(response, source: expression)
        } catch { self.error = error.localizedDescription }
    }

    func applyEvaluation(_ response: [String: Any], source: String) {
        expression = source; cursor = source.count
        result = response["text"] as? String ?? "0"
        lastValue = response["value"] as? [String: Double] ?? ["re": 0, "im": 0]
        if let updated = response["variables"] as? [String: [String: Double]] { variables = updated }
        variables["Ans"] = lastValue
        if let variable = response["store"] as? String { variables[variable] = lastValue }
        history.append(HistoryEntry(expression: expression, result: result))
        history = Array(history.suffix(100)); historyIndex = history.count
        error = nil; completed = true; fractionDisplay = false; persist()
    }

    func recall(_ entry: HistoryEntry) {
        expression = entry.expression; result = entry.result; cursor = expression.count
        completed = false; error = nil; menu = nil
    }

    func clear() {
        expression = ""; result = "0"; cursor = 0; error = nil
        shift = false; alpha = false; alphaLock = false; menu = nil
        memoryAction = nil; completed = false; fractionDisplay = false
        lastValue = ["re": 0, "im": 0]
    }

    func press(_ key: CalcKey) {
        if feedback { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
        if !powered { if key.id == "ac" { powered = true; clear() }; return }
        if key.id == "shift" { shift.toggle(); alpha = false; return }
        if key.id == "alpha" {
            if shift { alphaLock.toggle(); alpha = alphaLock; shift = false }
            else { alpha.toggle(); alphaLock = false }
            return
        }
        if let memoryAction, let name = key.alpha, name.count == 1, name.first?.isLetter == true {
            if memoryAction == "STO" {
                if !completed && !expression.isEmpty { calculate() }
                guard error == nil else { return }
                variables[name] = lastValue; result = "\(result) → \(name)"; persist()
            } else { insert(name) }
            self.memoryAction = nil; menu = nil; alpha = false; return
        }
        if let menu, key.id.count == 1, let digit = Int(key.id) {
            if menu == "MODE" {
                self.menu = nil
                switch digit {
                case 1: mode = "COMP"
                case 2: panel = .base
                case 3: panel = .statistics
                case 4: panel = .regression
                case 5: panel = .programs
                case 6: panel = .recurrence
                case 7: panel = .table
                case 8: panel = .equation
                default: self.menu = "MODE"
                }
                return
            }
        }
        if alpha, let value = key.alpha { insert(value); if !alphaLock { alpha = false }; return }
        if shift {
            shift = false
            switch key.id {
            case "mode": panel = .settings
            case "ac": powered = false; persist()
            case "rcl": memoryAction = "STO"; menu = "STO → variable"
            case "memory": updateMemory(subtract: true)
            case "file": panel = .programs
            case "del": completed = false
            case "sd": fractionDisplay = false; result = (try? request(["action": "fraction", "value": lastValue])["text"] as? String) ?? result
            case "multiply", "divide": engineering(direction: key.id == "multiply" ? 1 : -1)
            case "0": insert("Rnd(")
            case ".": panel = .matrix
            default: if let value = key.shiftValue { insert(value) }
            }
            return
        }
        switch key.id {
        case "ac": clear()
        case "del":
            completed = false; error = nil
            if cursor > 0 { let index = expression.index(expression.startIndex, offsetBy: cursor - 1); expression.remove(at: index); cursor -= 1 }
        case "exe": calculate()
        case "mode": menu = menu == "MODE" ? nil : "MODE"
        case "function": panel = .functions
        case "exit": menu = nil; memoryAction = nil; error = nil; shift = false; alpha = false
        case "fmla": panel = .formula
        case "calc": panel = .calc
        case "solve": panel = .solve
        case "file": panel = .programs
        case "rcl": memoryAction = "RCL"; menu = "RCL → variable"
        case "memory": updateMemory(subtract: false)
        case "sd":
            do {
                fractionDisplay.toggle()
                result = fractionDisplay ? (try request(["action": "fraction", "value": lastValue])["text"] as? String ?? result) : (try request(["action": "format", "value": lastValue])["text"] as? String ?? result)
            } catch { self.error = error.localizedDescription }
        case "left": cursor = max(0, cursor - 1); completed = false; error = nil
        case "right": cursor = min(expression.count, cursor + 1); completed = false; error = nil
        case "up", "down":
            guard !history.isEmpty else { return }
            historyIndex = max(0, min(history.count - 1, historyIndex + (key.id == "up" ? -1 : 1)))
            recall(history[historyIndex])
        default: insert(key.value ?? key.label)
        }
    }

    private func updateMemory(subtract: Bool) {
        if !completed && !expression.isEmpty { calculate() }
        guard error == nil else { return }
        let memory = variables["M"] ?? ["re": 0, "im": 0], sign = subtract ? -1.0 : 1.0
        variables["M"] = ["re": (memory["re"] ?? 0) + sign * (lastValue["re"] ?? 0), "im": (memory["im"] ?? 0) + sign * (lastValue["im"] ?? 0)]
        persist()
    }

    private func engineering(direction: Int) {
        guard lastValue["im"] == 0, let value = lastValue["re"], value != 0 else { return }
        let exponent = Int(floor(log10(abs(value)) / 3)) * 3 + (direction < 0 ? 3 : 0)
        result = String(format: "%.8g×10^%d", value / pow(10, Double(exponent)), exponent)
    }
}

enum CalculationError: LocalizedError {
    case message(String)
    var errorDescription: String? { if case .message(let message) = self { return message }; return nil }
}
