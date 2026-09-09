# ขอบเขตความเข้ากันได้

## อัปเดต LCD — 9 กันยายน 2026

- ตัวอย่างเว็บไม่มี dialog หรือ popup แล้ว: TABLE, RECUR, EQN, SD/REG, MATRIX, BASE-N, PROG, ประวัติ และวิธีใช้แสดงใน LCD ใช้ EXE ยืนยันค่า, ลูกศรย้ายช่อง/หน้า และ EXIT ย้อนกลับ
- SHIFT sin/cos/tan แสดง sin⁻¹/cos⁻¹/tan⁻¹ รองรับ DEG/RAD/GRA, principal values และ exact π สำหรับมุมพิเศษ; ค่านอกโดเมนแสดง Math ERROR โดยยังแก้ไขได้
- MODE มีสองหน้า; SETUP มีสองหน้าพร้อม ab/c, d/c, ENG, COMPLX, STAT Freq และ Signed/Unsigned
- FUNCTION หน้า COMP เรียง MATH, COMPLX, PROG, CONST, ANGLE, CLR, STAT, MATRIX; มีหน้า hyperbolic, inverse hyperbolic และ engineering symbols
- สถิติเลือก Line, Quad, Log, eExp, abExp, Power, Inv; เลือกค่า VAR มาใช้ในนิพจน์ และแสดงผลรวม/การถดถอยได้
- เมทริกซ์ A–F มีหน้ากำหนดขนาดและป้อนค่าทีละเซลล์; EQN รองรับระบบเชิงเส้น 2–5 ตัวแปรและพหุนามดีกรี 2–3
- MODE → 5 ใช้ NEW/RUN/EDIT/DELETE โปรแกรม; FILE เปิดรายการรันโดยตรง โปรแกรมที่บันทึกเดิมย้ายเข้าสู่รายการโดยอัตโนมัติ

ข้อแตกต่างที่ยังมี: BASE-N ยังเป็นการแปลงฐาน ไม่ใช่ expression editor พร้อม bitwise แบบเครื่องจริง; LINK ยังไม่จำลอง; โปรแกรมรองรับภาษาเพียง subset และไม่ได้จำลองหน่วยความจำ/เวลาของ firmware; หน้าย่อยและขั้นตอนกรอกบางส่วนใช้รูปแบบที่ปรับให้ทำงานบนเว็บ จึงยังไม่ใช่การจำลองทุกหน้าจอ 100% เมทริกซ์มีรายการปฏิบัติการเพิ่มจากเมนูต้นฉบับ และ FMLA ยังเป็นชุดสูตร 12 สูตร

CONST เรียง 40 ชื่อตามคู่มือ แต่ค่าตัวเลขใช้ CODATA 2018 / SI พร้อมปัดตาม precision ที่ระบุในโค้ด จึงแตกต่างจากข้อมูล CODATA 2000 ของเครื่องต้นฉบับ แหล่งข้อมูล: https://physics.nist.gov/cuu/Constants/ArchiveASCII/allascii_2018.txt

การปรับ LCD นี้อยู่ใน Preview เท่านั้น; native SwiftUI ยังใช้หน้าฟอร์มเดิม ต้องปรับและทดสอบบน Mac/iPhone แยกต่างหาก

## อัปเดตเฉพาะตัวอย่างเว็บ

ตัวอย่างใน `Preview/` เพิ่ม natural editor เศษส่วน/จำนวนคละ/ราก/รากอันดับ n/กำลัง/วงเล็บ และแก้ไขช่องด้วยลูกศรได้แล้ว รวมถึงผลลัพธ์ exact สำหรับ rational arithmetic, quadratic radicals, π แบบพหุคูณบางกรณี และตรีโกณมิติมุมพิเศษ มี S⇔D, Ans ที่เก็บรูปแบบ exact, CALC/SOLVE ที่รับค่าบน LCD และ SOLVE เลือกตัวแปร A–Z ได้

SETUP, FUNCTION และ FMLA เปลี่ยนเป็นเมนูบน LCD; SETUP รองรับ MthIO/LineIO, DEG/RAD/GRA, FIX/SCI/NORM ส่วน LineIO ใช้ข้อความเชิงเส้นของ editor เดียวกัน ไม่ใช่การจำลอง LineIO แบบ byte-for-byte

การจัดรูปแบบใหม่ไม่ใช่ symbolic algebra ครบระบบ กรณีที่พิสูจน์รูปแบบ exact ไม่ได้จะคืนทศนิยม ไม่เดารากหรือ π จากค่าประมาณ ส่วน SwiftUI ยังใช้หน้าจอเดิมตามข้อจำกัดด้านล่าง และยังไม่ได้ทดสอบบน iOS

## ใช้งานได้ในโค้ดเวอร์ชันนี้

| หมวด | ความสามารถ |
|---|---|
| หน้าปัด | โครงปุ่มอ้างอิงภาพ ผิวสีเข้ม แผงสีเงิน LCD สีเขียว SHIFT / ALPHA / A-LOCK และ haptics |
| COMP | + − × ÷, วงเล็บ, ยกกำลัง, เปอร์เซ็นต์, factorial, ราก, log, ln, exp, π, e |
| ฟังก์ชัน | ตรีโกณมิติและ inverse, hyperbolic, DEG/RAD/GRA, nCr/nPr, gcd/lcm, Rnd |
| เชิงซ้อน | a+bi, arithmetic, principal sqrt/log, Conjg, ReP, ImP, Arg, Abs |
| พิกัด | Pol(x,y), Rec(r,θ); เก็บผลสองค่าใน X และ Y |
| หน่วยความจำ | A–Z, Ans, M+/M−, STO/RCL, ประวัติ 100 รายการ |
| SOLVE | Newton method สำหรับสมการหนึ่งตัวแปร X พร้อมค่าเริ่มต้นและ residual |
| EQN | พหุนามดีกรี 2–3 และสมการเชิงเส้นพร้อมกันผ่านเมทริกซ์ |
| SD / REG | ค่าเฉลี่ย ผลรวม SD แบบประชากร/ตัวอย่าง และการถดถอยเชิงเส้น |
| Matrix | บวก ลบ คูณ transpose determinant inverse สูงสุด 10×10 |
| Calculus | อนุพันธ์เชิงตัวเลข อินทิกรัล adaptive Simpson และผลรวมจำกัด |
| TABLE / RECUR | ตารางสูงสุด 200 แถว; RECUR ใช้ A เป็นพจน์ก่อนหน้า, N เป็นดัชนี |
| BASE-N | แปลงค่าจำนวนเต็ม signed 32-bit ระหว่างฐาน 2/8/10/16 |
| FMLA | สูตรใช้งานทั่วไป 12 สูตร |
| PROG | แก้ไข บันทึก และรัน subset ด้านล่างพร้อมผลลัพธ์และข้อผิดพลาด |

## ภาษาที่รองรับ

- นิพจน์และ `expression→A` รวมถึง `->` แทนลูกศร
- `If condition`, `Then`, `Else`, `IfEnd`; ใช้บรรทัดแยกสำหรับคำสั่งทั่วไปหลัง Then
- `Then "ข้อความ"` บนบรรทัดเดียวได้
- `For start→A To end Step step`, `Next` และลูปซ้อน
- `While condition`, `WhileEnd`, `Do`, `LpWhile condition`, `Break`
- `Lbl name`, `Goto name`, `Stop`
- `?→A` รับค่าจาก Inputs ที่กำหนดก่อนรัน ค่าจะถูกใช้ซ้ำหากถามตัวแปรเดิม
- `n→Dim List X`, `value→List X[index]`, `List X[index]` โดยเริ่ม index ที่ 1
- string output, นิพจน์ output และเครื่องหมาย `◢` ท้ายบรรทัด
- คั่นคำสั่งด้วยขึ้นบรรทัดใหม่หรือ `:` และ comment ที่ขึ้นต้นด้วย `'`
- ตัวเปรียบเทียบ `=`, `!=`, `<`, `>`, `<=`, `>=`

เพดานป้องกันแอปค้าง: 4,000 คำสั่งในโปรแกรม, 20,000 ขั้นการประมวลผล, 2,000 บรรทัด output, 1,000 รายการต่อ list และ 4,096 ตัวอักษรต่อนิพจน์ คำสั่งที่ไม่รองรับจะแสดงข้อผิดพลาด ไม่ข้ามแบบเงียบๆ

## ความต่างที่ยังสำคัญ

1. **ไม่ใช่ firmware emulator** ไม่มีการจำลอง CPU, ROM, RAM หรือเวลาในการทำงานของเครื่องจริง
2. หน้าปัดเป็น SwiftUI ที่สร้างใหม่ จึงยังไม่ตรงระดับพิกเซลกับภาพ ปุ่มฟังก์ชันย่อยบางตัวใช้วิธีป้อนแบบ Linear และยังไม่ได้ตรวจด้วย iPhone จริง
3. ยังไม่มี Natural Textbook Display, exact radical/π results, mixed-fraction editing, FIX/SCI setup ครบชุด หรือจอ LCD แบบ dot-matrix จริง
4. `S⇔D` เป็น continued-fraction approximation จำกัดตัวส่วน 1,000,000 ไม่ใช่ symbolic rational engine
5. ตัวเลขใช้ IEEE 754 double; การปัดเศษ ลำดับการคำนวณบางกรณี domain และ convergence อาจต่างจาก CASIO โดยเฉพาะปัญหา ill-conditioned
6. BASE-N ยังไม่มี arithmetic, bitwise logic, two’s complement และแป้น HEX ตามเครื่องจริง
7. ไม่มี LINK หรือการส่งโปรแกรมระหว่างเครื่อง, คลัง 128 สูตรครบชุด, ค่าคงที่ 40 รายการ, regression รูปแบบอื่น หรือ frequency table
8. โปรแกรมไม่ได้รองรับทุก dialect/command; ไม่มี subprogram `Prog`, interactive pause/input ทีละขั้น, `Locate`, string variables, matrix variables ในภาษาหรือการจำลองความจุ 28,500 bytes
9. โปรแกรมจะเก็บตัวแปรเมื่อจบสำเร็จเท่านั้น; list เป็นข้อมูลชั่วคราวต่อการรัน ปิดโปรแกรมแล้วไม่เก็บ list
10. เครื่องมือขั้นสูงใช้ sheet และคีย์บอร์ด iPhone ไม่ได้จำลองลำดับเมนูและ key sequence ของเครื่องจริงทั้งหมด ปุ่มป้อนโปรแกรมใช้ตัวแก้ไขใน FILE
11. ออกแบบสำหรับ portrait บน iPhone; ยังไม่ได้ยืนยันขนาดปุ่ม, VoiceOver, Dynamic Type และ safe area ด้วยอุปกรณ์จริง

## สิ่งที่ต้องทำเพื่อยืนยันระดับ 100%

ต้องมีชุดข้อมูลทดสอบจากเครื่องจริงหรือ reference implementation ที่ตรวจสอบได้ แยกทดสอบทุกโหมด ทุก key sequence การปัดเศษ ข้อผิดพลาด หน่วยความจำ โปรแกรมและการแสดงผล รวมถึงเติมฟังก์ชันที่ยังขาด แล้วเทียบผลบน iOS จริง ไม่สามารถยืนยันจากภาพนิ่งเพียงภาพเดียวหรือจากการผ่าน unit tests ของโปรเจกต์นี้ได้
