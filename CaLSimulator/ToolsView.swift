import SwiftUI
import JavaScriptCore

@MainActor
struct ToolsView: View {
    @ObservedObject var model: CalculatorModel
    let kind: ToolPanel
    @Environment(\.dismiss) private var dismiss
    @State private var expression = ""
    @State private var input = ""
    @State private var secondInput = ""
    @State private var start = "0"
    @State private var end = "10"
    @State private var step = "1"
    @State private var initial = "1"
    @State private var output = ""
    @State private var error: String?
    @State private var operation = ""
    @State private var fromBase = 10
    @State private var toBase = 2
    @State private var selectedProgram: UUID?
    @State private var programName = "NEW"
    @State private var programSource = ""
    @State private var running = false
    @State private var showReset = false
    @State private var dirtyProgram = false

    var body: some View {
        NavigationStack {
            Form {
                switch kind {
                case .programs: programContent
                case .settings: settingsContent
                case .memory: memoryContent
                case .functions: functionsContent
                case .formula: formulaContent
                case .help: helpContent
                default: calculationContent
                }
                if let error { Section { Text(error).foregroundStyle(.red).textSelection(.enabled) } }
                if !output.isEmpty { Section("ผลลัพธ์") { Text(output).font(.system(.body, design: .monospaced)).textSelection(.enabled) } }
            }
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle(kind.title).navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("เสร็จ") { if kind == .programs { saveProgram() }; model.persist(); dismiss() }
                        .disabled(running)
                }
                ToolbarItemGroup(placement: .keyboard) { Spacer(); Button("ซ่อนแป้นพิมพ์") { UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil) } }
            }
            .onAppear { configure() }
            .onDisappear { if kind == .programs { saveProgram() }; model.persist() }
            .interactiveDismissDisabled(running)
            .confirmationDialog("ล้างตัวแปรและประวัติทั้งหมด? โปรแกรมที่บันทึกจะยังอยู่", isPresented: $showReset, titleVisibility: .visible) {
                Button("ล้างหน่วยความจำ", role: .destructive) { model.variables = [:]; model.history = []; model.clear(); model.persist() }
            }
        }.tint(Color(red: 0.67, green: 0.77, blue: 0.59))
    }

    @ViewBuilder private var calculationContent: some View {
        switch kind {
        case .solve, .calc:
            Section("นิพจน์") { field("เช่น X^2−2=0", text: $expression) }
            if kind == .solve {
                Section("ค่าเริ่มต้น") { field("X", text: $start) }
            } else {
                Section("ตัวแปร") { editor($input, height: 100); Text("หนึ่งตัวแปรต่อบรรทัด เช่น A=3 และ B=5").font(.caption).foregroundStyle(.secondary) }
            }
        case .statistics, .regression:
            Section(kind == .regression ? "คู่ข้อมูล x,y" : "ข้อมูล x") {
                editor($input, height: 160)
                Text(kind == .regression ? "หนึ่งคู่ต่อบรรทัด เช่น 1,2" : "หนึ่งค่าต่อบรรทัด").font(.caption).foregroundStyle(.secondary)
            }
        case .table, .recurrence:
            Section(kind == .table ? "f(X)" : "พจน์ถัดไป: A คือพจน์ก่อนหน้า, N คือดัชนี") { field("นิพจน์", text: $expression) }
            Section("ช่วงข้อมูล · สูงสุด 200 แถว") {
                field("เริ่ม", text: $start); field("สิ้นสุด", text: $end); field("เพิ่มทีละ", text: $step)
                if kind == .recurrence { field("A ก่อนเริ่ม", text: $initial) }
            }
        case .equation:
            Section {
                Picker("ประเภท", selection: $operation) { Text("พหุนาม ดีกรี 2–3").tag("polynomial"); Text("สมการเชิงเส้นพร้อมกัน").tag("linear") }
                if operation == "polynomial" {
                    field("a,b,c หรือ a,b,c,d", text: $input)
                    Text("เรียงสัมประสิทธิ์จากกำลังสูงสุด เช่น 1,-3,2 สำหรับ X²−3X+2=0").font(.caption).foregroundStyle(.secondary)
                } else {
                    Text("A · สัมประสิทธิ์แต่ละแถว"); editor($input, height: 100)
                    Text("B · ค่าด้านขวาหนึ่งค่าต่อบรรทัด"); editor($secondInput, height: 80)
                }
            }
        case .matrix:
            Section {
                Picker("การคำนวณ", selection: $operation) {
                    Text("A + B").tag("add"); Text("A − B").tag("subtract"); Text("A × B").tag("multiply")
                    Text("det(A)").tag("determinant"); Text("A⁻¹").tag("inverse"); Text("Aᵀ").tag("transpose")
                }
                Text("A"); editor($input, height: 100)
                if ["add", "subtract", "multiply"].contains(operation) { Text("B"); editor($secondInput, height: 100) }
                Text("คั่นคอลัมน์ด้วยจุลภาค และขึ้นบรรทัดใหม่สำหรับแต่ละแถว").font(.caption).foregroundStyle(.secondary)
            }
        case .calculus:
            Section {
                Picker("การคำนวณ", selection: $operation) { Text("∫ อินทิกรัล").tag("integral"); Text("d/dX อนุพันธ์").tag("derivative"); Text("Σ ผลรวม").tag("sum") }
                field("f(X)", text: $expression)
                field(operation == "derivative" ? "X" : "ขอบเขตล่าง", text: $start)
                if operation != "derivative" { field("ขอบเขตบน", text: $end) }
                Text("คำนวณเชิงตัวเลข ใช้หน่วยมุมตาม SETUP").font(.caption).foregroundStyle(.secondary)
            }
        case .base:
            Section {
                field("จำนวนเต็ม", text: $input)
                Picker("จากฐาน", selection: $fromBase) { ForEach([2,8,10,16], id: \.self) { Text(String($0)).tag($0) } }
                Picker("เป็นฐาน", selection: $toBase) { ForEach([2,8,10,16], id: \.self) { Text(String($0)).tag($0) } }
                Text("แปลงจำนวนเต็มแบบมีเครื่องหมาย 32 บิต ยังไม่รองรับนิพจน์หรือการแสดงเลขลบแบบ two’s complement").font(.caption).foregroundStyle(.secondary)
            }
        default: EmptyView()
        }
        Section { Button("คำนวณ", action: perform).frame(maxWidth: .infinity).fontWeight(.semibold) }
    }

    private var programContent: some View {
        Group {
            Section("ไฟล์โปรแกรม") {
                ForEach(model.programs) { program in
                    Button {
                        saveProgram(); loadProgram(program)
                    } label: {
                        HStack { Image(systemName: "doc.text"); Text(program.name); Spacer(); if selectedProgram == program.id { Image(systemName: "checkmark") } }
                    }.disabled(running)
                }.onDelete { indices in
                    let ids = indices.map { model.programs[$0].id }
                    model.programs.remove(atOffsets: indices)
                    if let selectedProgram, ids.contains(selectedProgram) { self.selectedProgram = nil; programName = "NEW"; programSource = ""; dirtyProgram = false }
                    model.persist()
                }.deleteDisabled(running)
                Button("＋ โปรแกรมใหม่") { saveProgram(); selectedProgram = nil; programName = "NEW"; programSource = ""; dirtyProgram = false; output = "" }.disabled(running)
            }
            Section("แก้ไขโปรแกรม") {
                field("ชื่อ", text: $programName).onChange(of: programName) { _, _ in dirtyProgram = true }
                editor($programSource, height: 240).onChange(of: programSource) { _, _ in dirtyProgram = true }
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack { ForEach(["→", "If ", "\nThen\n", "\nElse\n", "\nIfEnd", "For ", " To ", "\nNext", "List X[", "◢"], id: \.self) { token in
                        Button(token.trimmingCharacters(in: .whitespacesAndNewlines)) { programSource += token }.buttonStyle(.bordered)
                    } }
                }
                Text("บันทึกอัตโนมัติเมื่อปิดหรือเปลี่ยนไฟล์ · ใช้ -> แทน → ได้").font(.caption).foregroundStyle(.secondary)
            }.disabled(running)
            Section("Inputs สำหรับคำสั่ง ?→ตัวแปร") { editor($input, height: 70); Text("เช่น A=1, B=-3, C=2 โดยแยกบรรทัด").font(.caption).foregroundStyle(.secondary) }
            Section {
                Button { executeProgram() } label: {
                    HStack { Spacer(); if running { ProgressView() }; Text(running ? "กำลังรัน…" : "▶ รันโปรแกรม"); Spacer() }
                }.disabled(running || programSource.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                Text("รันคำสั่งที่รองรับสูงสุด 20,000 ครั้ง · ผลลัพธ์รวมแสดงด้านล่าง").font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    private var settingsContent: some View {
        Group {
            Section("หน่วยมุม") {
                Picker("Angle", selection: $model.angle) { Text("Degrees (DEG)").tag("DEG"); Text("Radians (RAD)").tag("RAD"); Text("Gradians (GRA)").tag("GRA") }.pickerStyle(.segmented)
            }
            Section { Toggle("การสั่นเมื่อกดปุ่ม", isOn: $model.feedback) }
            Section {
                Text("จอใช้รูปแบบ Linear · ผลลัพธ์ 10 หลักนัยสำคัญ").foregroundStyle(.secondary)
                Text("SHIFT → AC/ON เพื่อปิด · AC/ON เพื่อเปิด").foregroundStyle(.secondary)
                Button("ล้างตัวแปรและประวัติ", role: .destructive) { showReset = true }
            }
            Section { NavigationLink("ความสามารถและข้อจำกัด") { ToolsView(model: model, kind: .help) } }
        }
    }

    private var memoryContent: some View {
        Group {
            Section("ตัวแปร A–Z และ Ans") {
                ForEach(model.variables.keys.sorted(), id: \.self) { name in
                    let value = model.variables[name] ?? [:]
                    HStack { Text(name).monospaced(); Spacer(); Text("\(value["re"] ?? 0, specifier: "%.10g")" + ((value["im"] ?? 0) == 0 ? "" : String(format: "%+.10gi", value["im"] ?? 0))).monospaced() }
                }
                if model.variables.isEmpty { Text("ยังไม่มีตัวแปรที่บันทึก").foregroundStyle(.secondary) }
            }
            Section("ประวัติ · แตะเพื่อนำกลับมาแก้ไข") {
                ForEach(model.history.reversed()) { entry in
                    Button { model.recall(entry); dismiss() } label: { VStack(alignment: .leading) { Text(entry.expression); Text("= " + entry.result).foregroundStyle(.secondary) }.font(.system(.body, design: .monospaced)) }
                }
            }
        }
    }

    private var functionsContent: some View {
        Group {
            Section("เครื่องมือ") {
                ForEach([ToolPanel.matrix, .calculus, .memory, .programs, .settings, .help]) { panel in
                    NavigationLink(panel.title) { ToolsView(model: model, kind: panel) }
                }
            }
            Section("แทรกฟังก์ชัน") {
                ForEach(["abs(", "nCr(", "nPr(", "sinh(", "cosh(", "tanh(", "asinh(", "acosh(", "atanh(", "Conjg(", "ReP(", "ImP(", "Arg(", "int(", "floor(", "mod(", "gcd(", "lcm(", "!", "→"], id: \.self) { value in
                    Button(value) { model.insert(value); dismiss() }.monospaced()
                }
            }
        }
    }

    private var formulaContent: some View {
        Section("เลือกสูตร แล้วกด CALC เพื่อแทนค่า") {
            ForEach(Self.formulas, id: \.0) { formula in
                Button { model.clear(); model.insert(formula.1); dismiss() } label: {
                    VStack(alignment: .leading, spacing: 5) { Text(formula.0); Text(formula.1).font(.system(.caption, design: .monospaced)).foregroundStyle(.secondary) }
                }
            }
        }
    }

    private var helpContent: some View {
        Group {
            Section("CaL · fx-5800P Simulator") {
                Text("แอปจำลองอิสระที่ออกแบบตามภาพอ้างอิง ไม่ใช่เฟิร์มแวร์หรือแอปทางการของ CASIO")
                Text("หน้าปัดกดได้จริง: SHIFT, ALPHA, A-LOCK, REPLAY, STO/RCL, M+/M−, S⇔D และ Ans")
                Text("กด MODE แล้วเลือกเลข 1–8 เพื่อเปิดเครื่องมือ · FUNCTION มีเมทริกซ์ แคลคูลัส และหน่วยความจำ")
            }
            Section("ยังไม่เหมือนเครื่องจริง 100%") {
                Text("ยังไม่มี Natural Textbook Display, LINK, คลังสูตรครบ 128 สูตร, ค่าคงที่ครบชุด, การถดถอยทุกแบบ และ BASE-N แบบคำนวณนิพจน์")
                Text("ภาษารองรับเฉพาะชุดคำสั่งที่ระบุในเอกสารโปรเจกต์ โปรแกรมจากเครื่องจริงบางโปรแกรมจะรันไม่ได้ การรับข้อมูลและแสดงผลใช้หน้าต่างของ iPhone")
                Text("ใช้เลขทศนิยม IEEE 754 และอัลกอริทึมของแอป ผลการปัดเศษ ขอบเขตการคำนวณ และข้อผิดพลาดอาจต่างจากเครื่องจริง")
            }
            Section { Link("คู่มือ fx-5800P ของ CASIO", destination: URL(string: "https://support.casio.com/pdf/004/fx-5800P_E.pdf")!) }
        }
    }

    private func configure() {
        expression = model.expression.isEmpty ? "X^2" : model.expression
        switch kind {
        case .programs: if let p = model.programs.first { loadProgram(p) }
        case .matrix: input = "1,2\n3,4"; secondInput = "1,0\n0,1"; operation = "determinant"
        case .equation: input = "1,-3,2"; secondInput = "1\n2"; operation = "polynomial"
        case .statistics: input = "1\n2\n3\n4\n5"
        case .regression: input = "1,2\n2,4\n3,6"
        case .calculus: operation = "integral"; end = "1"
        case .recurrence: expression = "2×A"; start = "1"; end = "10"
        case .base: input = "255"
        case .solve: start = "1"
        default: break
        }
    }

    private func field(_ title: String, text: Binding<String>) -> some View {
        TextField(title, text: text).font(.system(.body, design: .monospaced)).textInputAutocapitalization(.never).autocorrectionDisabled().accessibilityLabel(title)
    }
    private func editor(_ text: Binding<String>, height: CGFloat) -> some View {
        TextEditor(text: text).font(.system(.body, design: .monospaced)).frame(minHeight: height).textInputAutocapitalization(.never).autocorrectionDisabled()
    }
    private func number(_ s: String) throws -> Double {
        guard let value = Double(s.trimmingCharacters(in: .whitespacesAndNewlines)), value.isFinite else { throw CalculationError.message("ตัวเลขไม่ถูกต้อง: " + s) }; return value
    }
    private func rows(_ s: String) throws -> [[Double]] {
        try s.split(whereSeparator: \.isNewline).map { row in try row.split(separator: ",", omittingEmptySubsequences: false).map { try number(String($0)) } }
    }
    private func inputVariables() throws -> [String: Double] {
        var result: [String: Double] = [:]
        for line in input.split(whereSeparator: \.isNewline) {
            let pair = line.split(separator: "=", omittingEmptySubsequences: false).map { $0.trimmingCharacters(in: .whitespaces) }
            guard pair.count == 2, pair[0].count == 1, let letter = pair[0].first, ("A"..."Z").contains(String(letter)) else { throw CalculationError.message("ใช้รูปแบบ A=3 หนึ่งตัวแปรต่อบรรทัด") }
            result[pair[0]] = try number(pair[1])
        }
        return result
    }

    private func perform() {
        error = nil; output = ""
        do {
            var payload: [String: Any] = [:]
            switch kind {
            case .solve: payload = ["action": "solve", "expression": expression, "guess": try number(start)]
            case .calc:
                var vars = model.variables; for (key, value) in try inputVariables() { vars[key] = ["re": value, "im": 0] }
                payload = ["action": "evaluate", "expression": expression, "variables": vars]
            case .statistics, .regression:
                let data = try rows(input), columns = kind == .regression ? 2 : 1
                guard data.allSatisfy({ $0.count == columns }) else { throw CalculationError.message("จำนวนคอลัมน์ไม่ถูกต้อง") }
                payload = ["action": "statistics", "rows": data]
            case .table, .recurrence: payload = ["action": kind.rawValue, "expression": expression, "start": try number(start), "end": try number(end), "step": try number(step), "initial": try number(initial)]
            case .equation:
                if operation == "polynomial" { payload = ["action": "polynomial", "coefficients": try input.split(separator: ",", omittingEmptySubsequences: false).map { try number(String($0)) }] }
                else { let b = try rows(secondInput); guard b.allSatisfy({ $0.count == 1 }) else { throw CalculationError.message("B ต้องมีหนึ่งคอลัมน์") }; payload = ["action": "linear", "a": try rows(input), "b": b] }
            case .matrix: payload = ["action": "matrix", "operation": operation, "a": try rows(input), "b": try rows(secondInput)]
            case .calculus: payload = ["action": "calculus", "operation": operation, "expression": expression, "start": try number(start), "end": try number(end)]
            case .base: payload = ["action": "base", "expression": input, "from": fromBase, "to": toBase]
            default: return
            }
            let answer = try model.request(payload)
            if let text = answer["text"] as? String { output = text }
            else if let rows = answer["rows"] as? [[String]] { output = "X / N     f(X) / A\n" + rows.map { $0.joined(separator: "     ") }.joined(separator: "\n") }
            else if let roots = answer["roots"] as? [String] { output = roots.enumerated().map { "X\($0.offset + 1) = \($0.element)" }.joined(separator: "\n") }
            else if let x = answer["x"] as? Double {
                output = String(format: "X = %.10g\nL−R = %.4g", x, answer["residual"] as? Double ?? 0)
                model.variables["X"] = ["re": x, "im": 0]; model.persist()
            } else if let matrix = answer["result"] as? [[Double]] { output = matrix.map { $0.map { String(format: "%.10g", $0) }.joined(separator: "   ") }.joined(separator: "\n") }
            else if let value = answer["result"] as? Double { output = String(format: "%.10g", value) }
            else { output = answer.keys.sorted().map { key in
                let names = ["mean": "x̄", "populationSD": "σx", "sampleSD": "sx", "sum": "Σx", "sumSquares": "Σx²", "intercept": "a", "slope": "b", "correlation": "r"]
                let value = (answer[key] as? Double).map { String(format: "%.10g", $0) } ?? "undefined"
                return "\(names[key] ?? key) = \(value)"
            }.joined(separator: "\n") }
            if kind == .calc {
                model.applyEvaluation(answer, source: expression)
            }
        } catch { self.error = error.localizedDescription }
    }

    private func loadProgram(_ program: SavedProgram) {
        selectedProgram = program.id; programName = program.name; programSource = program.source; output = ""; error = nil; dirtyProgram = false
    }
    private func saveProgram() {
        guard !programSource.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        let name = programName.trimmingCharacters(in: .whitespacesAndNewlines)
        if let selectedProgram, let index = model.programs.firstIndex(where: { $0.id == selectedProgram }) {
            model.programs[index].name = name.isEmpty ? "UNTITLED" : name; model.programs[index].source = programSource
        } else {
            let program = SavedProgram(name: name.isEmpty ? "UNTITLED" : name, source: programSource)
            model.programs.append(program); selectedProgram = program.id
        }
        dirtyProgram = false; model.persist()
    }

    private func executeProgram() {
        saveProgram(); error = nil; output = ""
        do {
            let payload: [String: Any] = ["action": "program", "source": programSource, "inputs": try inputVariables(), "variables": model.variables, "angle": model.angle]
            let data = try JSONSerialization.data(withJSONObject: payload)
            guard let url = Bundle.main.url(forResource: "engine", withExtension: "js") else { throw CalculationError.message("Missing engine.js") }
            let script = try String(contentsOf: url, encoding: .utf8)
            let json = String(decoding: data, as: UTF8.self)
            running = true
            Task {
                let response = await Task.detached(priority: .userInitiated) { () -> String in
                    let context = JSContext()!
                    context.evaluateScript(script)
                    return context.objectForKeyedSubscript("calculateJSON")?.call(withArguments: [json])?.toString() ?? "{}"
                }.value
                do {
                    let decoded = try JSONSerialization.jsonObject(with: Data(response.utf8)) as? [String: Any] ?? [:]
                    guard decoded["ok"] as? Bool == true, let result = decoded["result"] as? [String: Any] else { throw CalculationError.message(decoded["error"] as? String ?? "Program ERROR") }
                    output = (result["output"] as? [String] ?? []).joined(separator: "\n")
                    if output.isEmpty { output = "Done" }
                    if let vars = result["variables"] as? [String: [String: Double]] { model.variables = vars; model.persist() }
                } catch { self.error = error.localizedDescription }
                running = false
            }
        } catch { self.error = error.localizedDescription }
    }

    static let formulas: [(String, String)] = [
        ("พื้นที่วงกลม · R รัศมี", "pi×R^2"), ("เส้นรอบวง · R รัศมี", "2×pi×R"),
        ("พื้นที่สามเหลี่ยม · B ฐาน, H สูง", "B×H/2"), ("พีทาโกรัส · A, B ด้านประกอบมุมฉาก", "sqrt(A^2+B^2)"),
        ("ปริมาตรทรงกลม · R รัศมี", "4×pi×R^3/3"), ("ปริมาตรทรงกระบอก · R รัศมี, H สูง", "pi×R^2×H"),
        ("ความเร็ว · D ระยะทาง, T เวลา", "D/T"), ("แรง · M มวล, A ความเร่ง", "M×A"),
        ("พลังงานจลน์ · M มวล, V ความเร็ว", "M×V^2/2"), ("กฎของโอห์ม · I กระแส, R ความต้านทาน", "I×R"),
        ("ดอกเบี้ยทบต้น · P เงินต้น, R อัตรา, N งวด", "P×(1+R/100)^N"), ("ระยะสองจุด · (A,B), (C,D)", "sqrt((C-A)^2+(D-B)^2)")
    ]
}
