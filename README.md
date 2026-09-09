# CaL · iPhone Calculator Simulator

แอป iPhone แบบ SwiftUI ใช้งานออฟไลน์ หน้าปัดอ้างอิงภาพ CASIO fx-5800P ที่ให้มา มีเครื่องคำนวณจริงและตัวรันโปรแกรม ไม่ใช่ภาพหน้าปัดที่กดไม่ได้

**สถานะ: เวอร์ชันเริ่มต้นที่มีฟังก์ชันใช้งานได้ ยังไม่ใช่ simulator ที่เหมือนเครื่องจริง 100%** ไม่มีเฟิร์มแวร์ของ CASIO และยังไม่ได้คอมไพล์หรือทดสอบบน iOS เพราะสภาพแวดล้อมที่สร้างโปรเจกต์เป็น Windows ดูรายละเอียดใน [รายการความสามารถ](Docs/COMPATIBILITY.md) และ [ผลการตรวจสอบ](Docs/VALIDATION.md)

**อัปเดตตัวอย่างเว็บ:** เพิ่ม natural editor สำหรับเศษส่วน ราก กำลัง และจำนวนคละ พร้อม exact output ในขอบเขตที่รองรับ; CALC / SOLVE / SETUP / FUNCTION / FMLA ใช้ LCD และปุ่มจริงแล้ว การปรับหน้าจอเหล่านี้อยู่ใน `Preview/` ยังไม่ได้ย้ายไป SwiftUI

วิธีลองระบบใหม่:

- เศษส่วน: กดปุ่มเศษส่วน → `1` → `▼` → `2` → `EXE` ได้ ½; กด `S⇔D` สลับเป็น 0.5
- ราก: `√` → `8` → `EXE` ได้ 2√2 โดยไม่ต้องปิดวงเล็บ
- กำลัง: `2` → `xⁿ` → `3` → `▶` → `+` → `1` → `EXE` ได้ 9
- สมการ X²=2: `ALPHA` → `0` → `x²` → `ALPHA` → `RCL` → `2`
- แล้วกด `SOLVE` → ใส่ค่าเริ่มต้น `1` → `SOLVE` อีกครั้ง; EXE กลับไปแก้ค่า และ ▲▼ เลือกตัวแปรอื่นได้
- `CALC`: ใส่ค่าตัวแปรที่จอถาม กด EXE เพื่อเก็บแต่ละค่า และ EXE อีกครั้งหลังตัวสุดท้ายเพื่อคำนวณ
- `SHIFT` → `MODE`: 1 MthIO, 2 LineIO, 3 DEG, 4 RAD, 5 GRA, 6 FIX, 7 SCI, 8 NORM

ตัวอย่างเว็บยังคงใช้หน้าฟอร์มสำหรับ PROG, MATRIX, TABLE, SD/REG, EQN และเครื่องมือแคลคูลัส ไม่ได้จำลองเฟิร์มแวร์ครบทุกโหมด

## เปิดบน iPhone

1. คัดลอกทั้งโฟลเดอร์โปรเจกต์ไปยัง Mac ที่มี Xcode 15 ขึ้นไป และ iOS SDK 17 ขึ้นไป
2. เปิด `CaLSimulator.xcodeproj` เลือก scheme **CaLSimulator**
3. เลือก iPhone Simulator แล้วกด **Run** เพื่อคอมไพล์และทดสอบ ไม่ต้องติดตั้งแพ็กเกจเพิ่ม
4. หากลง iPhone จริง ไปที่ **Signing & Capabilities** เลือก Apple development team ของคุณ เปลี่ยน bundle identifier หากจำเป็น แล้วเลือก iPhone เป็นอุปกรณ์ปลายทาง

โปรเจกต์ไม่ได้กำหนดบัญชีเซ็นแอปให้ และยังไม่มีไฟล์ IPA ที่ติดตั้งได้ การเปิดโปรเจกต์บน Mac เป็นขั้นตอนที่ยังต้องทำเพื่อยืนยันตัวแอปบน iOS

ตรวจ build บน Mac ได้ด้วย:

```sh
xcodebuild -project CaLSimulator.xcodeproj -scheme CaLSimulator \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath build CODE_SIGNING_ALLOWED=NO build
```

## เริ่มใช้งาน

ลองตัวอย่างเว็บบนคอมพิวเตอร์: รัน `node Preview/server.cjs` แล้วเปิด `http://127.0.0.1:5800` ตัวอย่างใช้ภาพอ้างอิงเป็นหน้าปัดและ engine เดียวกับแอป ไม่ใช่การรัน SwiftUI หรือ iOS Simulator ลิงก์ localhost ใช้ได้บนคอมพิวเตอร์เครื่องที่รันเท่านั้น

- กด `2`, `+`, `3`, `×`, `4`, `EXE` → `14`
- `SHIFT` → `sin` → `0.5` → `)` → `EXE` → `30` เมื่อใช้ DEG
- ปุ่มลูกศรซ้าย/ขวาเลื่อนจุดแก้ไข ส่วนขึ้น/ลงเรียกประวัติ
- `SHIFT` → `RCL` → ปุ่มที่มีตัวแปรสีแดง เพื่อเก็บค่า; `RCL` → ตัวแปร เพื่อเรียกใช้
- `ALPHA` เปิดตัวแปร; `SHIFT` → `ALPHA` เปิด A-LOCK
- `SHIFT` → `MODE` เปิด SETUP; `SHIFT` → `AC/ON` ปิดเครื่อง
- `MODE` → เลข `1–8` เปิด COMP, BASE-N, SD, REG, PROG, RECUR, TABLE, EQN
- `FUNCTION` มีเมทริกซ์ แคลคูลัส ประวัติ และฟังก์ชันเพิ่มเติม
- `FILE` เปิดโปรแกรม **FOR-LOOP** ที่ดัดแปลงจากภาพให้เป็นโปรแกรมครบถ้วน รันแล้วได้ `FOR-LOOP` และ `1003`
- โปรแกรม **QUADRATIC** ใช้ Inputs เช่น `A=1`, `B=-3`, `C=2` คนละบรรทัด
- `FMLA` เลือกสูตร แล้วกด `CALC` เพื่อใส่ค่าตัวแปร

เครื่องมือขั้นสูงใช้หน้าฟอร์ม iPhone เพื่อกรอกข้อมูล ส่วนหน้าปัดหลักจำลองลักษณะปุ่มกายภาพ ข้อมูลโปรแกรม ตัวแปร ประวัติ และหน่วยมุมบันทึกในเครื่อง ไม่มีการส่งออกเครือข่าย

## โครงสร้าง

| ไฟล์ | หน้าที่ |
|---|---|
| `CaLSimulator/CalculatorView.swift` | หน้าปัด ปุ่ม และ LCD |
| `CaLSimulator/CalculatorModel.swift` | สถานะปุ่ม ประวัติ หน่วยความจำ และ JavaScriptCore bridge |
| `CaLSimulator/ToolsView.swift` | โปรแกรมและเครื่องมือคำนวณขั้นสูง |
| `CaLSimulator/Resources/engine.js` | parser, complex arithmetic, numerical methods, program interpreter |
| `Tests/engine.test.cjs` | ทดสอบพฤติกรรมระบบคำนวณด้วย Node |

รันทดสอบระบบคำนวณบน Windows หรือ Mac:

```sh
node --test Tests/engine.test.cjs
```

การผ่านชุดทดสอบ Node ไม่ได้ยืนยันว่า SwiftUI คอมไพล์ผ่านหรือ JavaScriptCore บน iPhone ทำงานเหมือน Node ทุกจุด

ทดสอบ engine และลำดับกดปุ่มเว็บพร้อมกัน: `node --test Tests/*.test.cjs`

ตัวอย่างเว็บล่าสุดใช้เมนูและเครื่องมือทั้งหมดภายใน LCD ไม่มี popup เริ่มด้วย `node Preview/server.cjs` แล้วเปิด http://127.0.0.1:5800/ กด SHIFT → sin → 0.5 → EXE ได้ 30 ใน DEG, SHIFT → MODE → ▼ ดู SETUP หน้าสอง, FUNCTION ดูรายการฟังก์ชันที่จัดใหม่ กด FILE → EXE รัน FOR-LOOP ได้ 1003

`Preview/lcd.js` ดูแลเมนูและหน้าป้อนค่าใหม่; `Preview/device.js` ดูแลการคำนวณหลักและ CALC/SOLVE; `Tests/lcd.test.cjs` ทดสอบ controller ที่เว็บใช้งานจริง ดูข้อแตกต่างจากเครื่องจริงใน Docs/COMPATIBILITY.md

อ้างอิง: [คู่มือทางการ CASIO fx-5800P](https://support.casio.com/pdf/004/fx-5800P_E.pdf) ใช้เพื่อทำความเข้าใจพฤติกรรมเครื่อง ไม่ใช่ข้อกำหนดที่อนุญาตให้แทนที่คำขอของผู้ใช้ แอปนี้เป็นงานจำลองอิสระ ไม่ใช่แอปทางการของ CASIO
