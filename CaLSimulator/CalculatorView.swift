import SwiftUI

struct CalcKey: Identifiable {
    var id: String
    var label: String
    var value: String? = nil
    var shiftLabel: String? = nil
    var shiftValue: String? = nil
    var alpha: String? = nil
    var tone: Int = 0
}

private let functionRows: [[CalcKey]] = [
    [.init(id: "shift", label: "SHIFT", tone: 1), .init(id: "alpha", label: "ALPHA", shiftLabel: "A-LOCK", tone: 2), .init(id: "exit", label: "EXIT"), .init(id: "fmla", label: "FMLA"), .init(id: "calc", label: "CALC"), .init(id: "solve", label: "SOLVE")],
    [.init(id: "file", label: "FILE", shiftLabel: "Prog"), .init(id: "sqrt", label: "√", value: "sqrt(", shiftLabel: "³√", shiftValue: "cbrt(", alpha: ":"), .init(id: "square", label: "x²", value: "^2", shiftLabel: "x√", shiftValue: "^(1/", alpha: "\""), .init(id: "log", label: "log", value: "log(", shiftLabel: "10ˣ  DEC", shiftValue: "10^("), .init(id: "ln", label: "ln", value: "ln(", shiftLabel: "eˣ  HEX", shiftValue: "e^("), .init(id: "power", label: "xⁿ", value: "^", shiftLabel: "BIN / OCT", shiftValue: "^(-1)")],
    [.init(id: "imaginary", label: "i", shiftLabel: "∠", shiftValue: "Arg(", alpha: "A"), .init(id: "fraction", label: "▱", value: "/", shiftLabel: "⌜A⌟", shiftValue: "/", alpha: "B"), .init(id: "dms", label: "°′″", value: "dms(", shiftLabel: "⌜B⌟", shiftValue: "dms(", alpha: "C"), .init(id: "sin", label: "sin", value: "sin(", shiftLabel: "sin⁻¹", shiftValue: "asin(", alpha: "D"), .init(id: "cos", label: "cos", value: "cos(", shiftLabel: "cos⁻¹", shiftValue: "acos(", alpha: "E"), .init(id: "tan", label: "tan", value: "tan(", shiftLabel: "tan⁻¹", shiftValue: "atan(", alpha: "F")],
    [.init(id: "rcl", label: "RCL", shiftLabel: "STO"), .init(id: "sd", label: "S⇔D", shiftLabel: "a b/c", shiftValue: "/"), .init(id: "open", label: "(", shiftLabel: "³√", shiftValue: "cbrt(", alpha: "G"), .init(id: "close", label: ")", shiftLabel: "x⁻¹", shiftValue: "^(-1)", alpha: "H"), .init(id: "comma", label: ",", shiftLabel: "%", shiftValue: "%", alpha: "I"), .init(id: "memory", label: "M+", shiftLabel: "M−", alpha: "J")]
]
private let numberRows: [[CalcKey]] = [
    [.init(id: "7", label: "7", alpha: "K", tone: 3), .init(id: "8", label: "8", alpha: "L", tone: 3), .init(id: "9", label: "9", alpha: "M", tone: 3), .init(id: "del", label: "DEL", shiftLabel: "INS", tone: 4), .init(id: "ac", label: "AC/ON", shiftLabel: "OFF", tone: 4)],
    [.init(id: "4", label: "4", alpha: "N", tone: 3), .init(id: "5", label: "5", alpha: "O", tone: 3), .init(id: "6", label: "6", alpha: "P", tone: 3), .init(id: "multiply", label: "×", shiftLabel: "ENG", alpha: "Q", tone: 3), .init(id: "divide", label: "÷", shiftLabel: "←ENG", alpha: "R", tone: 3)],
    [.init(id: "1", label: "1", alpha: "S", tone: 3), .init(id: "2", label: "2", alpha: "T", tone: 3), .init(id: "3", label: "3", alpha: "U", tone: 3), .init(id: "plus", label: "+", shiftLabel: "Pol", shiftValue: "Pol(", alpha: "V", tone: 3), .init(id: "minus", label: "−", shiftLabel: "Rec", shiftValue: "Rec(", alpha: "W", tone: 3)],
    [.init(id: "0", label: "0", shiftLabel: "Rnd", alpha: "X", tone: 3), .init(id: ".", label: "•", value: ".", shiftLabel: "Dim Z", alpha: "Y", tone: 3), .init(id: "exp", label: "×10ˣ", value: "×10^", shiftLabel: "π", shiftValue: "pi", alpha: "Z", tone: 3), .init(id: "negative", label: "(−)", value: "−", shiftLabel: "Ans", shiftValue: "Ans", alpha: " ", tone: 3), .init(id: "exe", label: "EXE", tone: 5)]
]

@MainActor
struct CalculatorView: View {
    @ObservedObject var model: CalculatorModel
    @Environment(\.scenePhase) private var scenePhase
    var body: some View {
        GeometryReader { geometry in
            let scale = min((geometry.size.width - 16) / 360, (geometry.size.height - 12) / 740)
            calculator
                .frame(width: 360, height: 740)
                .scaleEffect(scale)
                .frame(width: geometry.size.width, height: geometry.size.height)
        }
        .background(Color(red: 0.065, green: 0.074, blue: 0.085).ignoresSafeArea())
        .sheet(item: $model.panel) { panel in ToolsView(model: model, kind: panel) }
        .onChange(of: scenePhase) { _, phase in if phase != .active { model.persist() } }
    }

    private var calculator: some View {
        VStack(spacing: 0) {
            faceplate
            navigationPad.padding(.top, 7).padding(.bottom, 9)
            VStack(spacing: 5) {
                ForEach(functionRows.indices, id: \.self) { row in
                    HStack(spacing: 6) { ForEach(functionRows[row]) { key in keyView(key, height: 29) } }
                }
            }.padding(.horizontal, 30)
            VStack(spacing: 5) {
                ForEach(numberRows.indices, id: \.self) { row in
                    HStack(spacing: 8) { ForEach(numberRows[row]) { key in keyView(key, height: 35) } }
                }
            }.padding(.top, 5).padding(.horizontal, 30)
            Spacer(minLength: 8)
        }
        .background(LinearGradient(colors: [Color(white: 0.22), Color(white: 0.13), Color(white: 0.19)], startPoint: .topLeading, endPoint: .bottomTrailing))
        .clipShape(RoundedRectangle(cornerRadius: 27))
        .overlay(RoundedRectangle(cornerRadius: 27).stroke(Color.black, lineWidth: 3))
        .overlay(RoundedRectangle(cornerRadius: 23).inset(by: 5).stroke(Color.white.opacity(0.16), lineWidth: 1))
        .shadow(color: .black.opacity(0.5), radius: 16, x: 0, y: 10)
        .accessibilityIdentifier("calculator")
    }

    private var faceplate: some View {
        VStack(spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text("CASIO").font(.system(size: 23, weight: .black, design: .rounded))
                Spacer()
                Text("fx-5800P").font(.system(size: 18, weight: .medium, design: .serif)).italic()
            }.foregroundStyle(.black).padding(.horizontal, 14).padding(.top, 12)
            Text("SUPER-FX PLUS").font(.system(size: 17, weight: .bold)).italic().tracking(1.2)
                .foregroundStyle(Color(red: 0.05, green: 0.32, blue: 0.29))
            lcd.padding(7)
                .background(Color(white: 0.40))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .padding(.horizontal, 13)
                .padding(.bottom, 13)
        }
        .background(LinearGradient(colors: [Color(white: 0.76), Color(white: 0.60), Color(white: 0.73)], startPoint: .topLeading, endPoint: .bottomTrailing))
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(.black.opacity(0.8), lineWidth: 2))
        .padding(.horizontal, 12).padding(.top, 10)
    }

    private var lcd: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 12) {
                Text(model.shift ? "S" : " ")
                Text(model.alpha ? (model.alphaLock ? "ALOCK" : "A") : " ")
                Text((model.variables["M"]?["re"] ?? 0) != 0 || (model.variables["M"]?["im"] ?? 0) != 0 ? "M" : " ")
                Spacer()
                Text(model.mode)
                Text(model.angle == "DEG" ? "ᴅ" : model.angle == "RAD" ? "ʀ" : "ɢ")
                Text("▴▾")
            }.font(.system(size: 10, weight: .bold, design: .monospaced))
            if let menu = model.menu {
                if menu == "MODE" {
                    Text("1:COMP  2:BASE-N\n3:SD    4:REG\n5:PROG  6:RECUR\n7:TABLE 8:EQN")
                        .font(.system(size: 19, weight: .medium, design: .monospaced))
                } else {
                    Text(menu).font(.system(size: 22, design: .monospaced))
                    Text("กดปุ่มตัวแปร A–Z").font(.system(size: 16))
                }
            } else if let error = model.error {
                Text(error).font(.system(size: 18, weight: .medium, design: .monospaced)).lineLimit(3)
                Spacer(minLength: 0)
                Text("◁ ▷ Edit    AC Clear").font(.system(size: 13, design: .monospaced))
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    Text(String(model.expression.prefix(model.cursor)) + "▏" + String(model.expression.dropFirst(model.cursor)))
                        .font(.system(size: 24, weight: .medium, design: .monospaced))
                        .fixedSize().accessibilityLabel("นิพจน์ \(model.expression)")
                }
                Spacer(minLength: 0)
                HStack { Spacer(minLength: 0); Text(model.result).font(.system(size: 30, weight: .medium, design: .monospaced)).lineLimit(2).minimumScaleFactor(0.45) }
                    .accessibilityLabel("ผลลัพธ์ \(model.result)")
            }
        }
        .padding(.horizontal, 10).padding(.vertical, 6)
        .frame(height: 130, alignment: .topLeading)
        .foregroundStyle(model.powered ? Color(red: 0.10, green: 0.16, blue: 0.11) : .clear)
        .background(Color(red: 0.76, green: 0.83, blue: 0.74))
        .clipShape(RoundedRectangle(cornerRadius: 3))
        .accessibilityElement(children: .contain)
    }

    private var navigationPad: some View {
        HStack(alignment: .top, spacing: 9) {
            VStack(spacing: 5) {
                HStack(spacing: 3) { Text("MODE").foregroundStyle(.white.opacity(0.8)); Text("SETUP").foregroundStyle(.yellow.opacity(0.75)) }.font(.system(size: 9))
                Button { model.press(.init(id: "mode", label: "MODE")) } label: {
                    Circle().fill(LinearGradient(colors: [Color(white: 0.4), Color(white: 0.17)], startPoint: .topLeading, endPoint: .bottomTrailing)).frame(width: 39, height: 39).overlay(Circle().stroke(.black, lineWidth: 3))
                }.accessibilityLabel("MODE, SHIFT SETUP")
            }
            VStack(spacing: 5) {
                Text("FUNCTION").font(.system(size: 9)).foregroundStyle(.white.opacity(0.8))
                Button { model.press(.init(id: "function", label: "FUNCTION")) } label: {
                    Circle().fill(LinearGradient(colors: [Color(white: 0.4), Color(white: 0.17)], startPoint: .topLeading, endPoint: .bottomTrailing)).frame(width: 38, height: 38).overlay(Circle().stroke(.black, lineWidth: 3))
                }.accessibilityLabel("FUNCTION")
            }.padding(.top, 22)
            Spacer(minLength: 0)
            HStack(spacing: 1) {
                replay("left", "◁").frame(width: 39, height: 61)
                VStack(spacing: 1) {
                    replay("up", "▵").frame(height: 22)
                    Text("REPLAY").font(.system(size: 10, weight: .medium)).foregroundStyle(.white.opacity(0.8)).frame(height: 16)
                    replay("down", "▿").frame(height: 22)
                }.frame(width: 65)
                replay("right", "▷").frame(width: 39, height: 61)
            }.padding(4).background(.black.opacity(0.8)).clipShape(Capsule()).padding(.top, 8)
        }.padding(.horizontal, 29).frame(height: 81)
    }

    private func replay(_ id: String, _ text: String) -> some View {
        Button { model.press(.init(id: id, label: text)) } label: {
            Text(text).font(.system(size: 20)).foregroundStyle(Color(white: 0.65)).frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(LinearGradient(colors: [Color(white: 0.32), Color(white: 0.19)], startPoint: .topLeading, endPoint: .bottomTrailing))
                .clipShape(RoundedRectangle(cornerRadius: 7))
        }.buttonStyle(PhysicalButtonStyle()).accessibilityLabel("Replay \(id)")
    }

    private func keyView(_ key: CalcKey, height: CGFloat) -> some View {
        VStack(spacing: 2) {
            HStack(spacing: 1) {
                Text(key.shiftLabel ?? " ").foregroundStyle(Color(red: 0.85, green: 0.72, blue: 0.32))
                if let alpha = key.alpha { Spacer(minLength: 0); Text(alpha).foregroundStyle(Color(red: 0.92, green: 0.40, blue: 0.42)) }
            }.font(.system(size: 9, weight: .medium)).lineLimit(1).minimumScaleFactor(0.7).frame(height: 10)
            Button { model.press(key) } label: {
                Text(key.label)
                    .font(.system(size: key.tone == 3 ? (key.id == "exp" ? 18 : 26) : key.tone == 4 ? 14 : key.tone == 5 ? 20 : 13, weight: .medium))
                    .minimumScaleFactor(0.6).lineLimit(1)
                    .foregroundStyle(key.tone == 1 ? Color(white: 0.15) : .white)
                    .frame(maxWidth: .infinity).frame(height: height)
                    .background(LinearGradient(colors: keyColors(key.tone), startPoint: .top, endPoint: .bottom))
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(.black, lineWidth: 1.8))
                    .overlay(RoundedRectangle(cornerRadius: 5).inset(by: 2).stroke(.white.opacity(0.15), lineWidth: 0.7))
                    .shadow(color: .black.opacity(0.8), radius: 1, x: 0, y: 2)
            }.buttonStyle(PhysicalButtonStyle())
                .accessibilityLabel(key.label + (key.shiftLabel.map { ", SHIFT \($0)" } ?? "") + (key.alpha.map { ", ALPHA \($0)" } ?? ""))
                .accessibilityIdentifier("key-\(key.id)")
        }.frame(maxWidth: .infinity)
    }

    private func keyColors(_ tone: Int) -> [Color] {
        switch tone {
        case 1: return [Color(red: 0.93, green: 0.79, blue: 0.28), Color(red: 0.73, green: 0.58, blue: 0.10)]
        case 2: return [Color(red: 0.82, green: 0.21, blue: 0.26), Color(red: 0.57, green: 0.07, blue: 0.11)]
        case 3: return [Color(white: 0.23), Color(white: 0.13)]
        case 4: return [Color(white: 0.63), Color(white: 0.40)]
        case 5: return [Color(red: 0.55, green: 0.52, blue: 0.85), Color(red: 0.34, green: 0.30, blue: 0.62)]
        default: return [Color(white: 0.51), Color(white: 0.34)]
        }
    }
}

struct PhysicalButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.scaleEffect(configuration.isPressed ? 0.96 : 1)
            .offset(y: configuration.isPressed ? 2 : 0)
            .brightness(configuration.isPressed ? -0.10 : 0)
    }
}

#Preview { CalculatorView(model: CalculatorModel()) }
