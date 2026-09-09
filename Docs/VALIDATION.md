# Validation

## อัปเดตเว็บ: Natural input และการกดปุ่ม

`node --test Tests/engine.test.cjs Tests/device.test.cjs` ผ่าน **49 ชุด** (engine 21 และ device/natural 28) ครอบคลุมลำดับปุ่มเศษส่วน การย้ายช่อง ผลลัพธ์แบบราก/π, Ans ต่อเนื่อง, จำนวนคละลบ, CALC, SOLVE หลายตัวแปร, error recovery, memory และ SETUP

ตรวจบนเบราว์เซอร์จริงผ่านปุ่มที่แสดงบนหน้า: √8 → 2√2, ½+⅓ → ⅚ และ X²=2 ผ่าน ALPHA/RCL แล้ว SOLVE; ตรวจภาพการแสดงเศษส่วน ราก และผล SOLVE บน LCD แล้ว ไม่พบ browser console error ในการตรวจดังกล่าว การตรวจนี้ยืนยันตัวอย่างเว็บ ไม่ใช่ SwiftUI/iOS

## ตรวจได้ในสภาพแวดล้อม Windows

คำสั่ง `node --test Tests/engine.test.cjs` ตรวจ parser และ numerical engine โดยไม่ใช้ dependencies ภายนอก รวม 21 ชุดทดสอบ

ผลรันในเซสชันนี้: **ผ่าน 21, ไม่ผ่าน 0** ตรวจ XML ของ Info.plist และ shared Xcode scheme รวมถึงการอ้างอิงไฟล์และ object IDs ในโปรเจกต์แล้ว การตรวจเหล่านี้ไม่ได้ทดแทน Xcode build

ครอบคลุม operator precedence, scientific notation, หน่วยมุม, complex arithmetic, factorial/combination, malformed input, domain errors, Ans/assignment, fractional display, coordinate conversion, solve residual, สถิติ, regression, เมทริกซ์, พหุนาม, สมการพร้อมกัน, calculus, table/recurrence, base conversion และการทำงานของโปรแกรม รวมกรณี infinite loop

ทดสอบ JSON bridge ใน isolated JavaScript context ที่ไม่มี Node globals และตรวจว่า error หนึ่งคำขอไม่ทำให้คำขอต่อไปล้มเหลว

## ยังไม่ได้ตรวจ

- `xcodebuild` และ SwiftUI compilation: ไม่มี Xcode/iOS SDK บน Windows
- JavaScriptCore บนอุปกรณ์จริง: Node ใช้ V8 จึงไม่ทดแทนการทดสอบนี้
- Visual QA, simulator screenshot, haptics, accessibility, app lifecycle, signing และการติดตั้ง
- การเทียบผลลัพธ์ครบทุกกรณีกับ fx-5800P จริง

## Checklist เมื่อเปิดบน Mac

1. Build ทั้ง Debug และ Release บน iPhone Simulator
2. ตรวจหน้าปัดบน iPhone SE และ iPhone ขนาดมาตรฐาน/ใหญ่ ให้ไม่มีปุ่มตกจอ
3. กด `2+3×4 EXE` ได้ `14`; AC แล้ว `SHIFT sin 0.5 ) EXE` ได้ `30`
4. STO/RCL A, M+/M−, Ans, AC และ OFF/ON ต้องให้ค่าตามที่คาด
5. เลื่อน cursor แก้ไขนิพจน์และเรียกประวัติขึ้น/ลง
6. เปิด FILE รัน FOR-LOOP ต้องได้ `1003` และ QUADRATIC ต้องรับ Inputs ได้
7. สร้าง/แก้ไข/ลบโปรแกรม สลับไฟล์ ปิด sheet และเปิดแอปใหม่ ตรวจการบันทึก
8. ใช้ทุก MODE, SOLVE, CALC, FMLA, MATRIX และ FUNCTION ตรวจ error recovery
9. สลับ RAD/DEG แล้วตรวจตรีโกณมิติและ coordinate conversion
10. ทดสอบ VoiceOver, คีย์บอร์ด, safe area, haptic และ background/foreground บน iPhone จริง

โปรเจกต์นี้ยังไม่ควรถูกระบุว่าผ่านการตรวจ iOS หรือเหมือนเครื่องจริง 100% จนกว่าจะทำขั้นตอนเหล่านี้และปิดช่องว่างใน COMPATIBILITY.md


## LCD update — 2026-09-09

`node --test Tests/*.test.cjs`: 65 tests passed, 0 failed.

Added coverage: inverse trig exact radians/principal domains, two-page MODE/SETUP and FUNCTION hierarchy, all MODE entry routes, natural TABLE input, matrix entry/determinant, polynomial and simultaneous EQN, SD row editing and VAR, program persistence and reference loop, second derivative, seven regression models and invalid domains, DISTR, signed/unsigned base conversion, engineering output, and absence of dialog markup/popup APIs.

Browser QA: real keypad clicks for SHIFT sin(0.5) = 30, SETUP second page, TABLE entry/results, FILE program execution; visual LCD inspection and console error check. Native iOS validation remains outstanding.


MATRIX / PROG / DMS: keypad tests cover memory editing/persistence, inverse and Mat Ans chaining, transpose, repeated runtime input, skipped input branches, ◢ continuation, editor cursor insertion/deletion, DMS arithmetic/toggling and rounding carry. Visual checks at 390×844 show fraction placeholders and highlighted matrix grid fitting the LCD.
