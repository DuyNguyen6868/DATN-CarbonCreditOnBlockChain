# Đồ án: Hệ thống quản lý tín chỉ carbon trên blockchain với mô-đun dMRV

**Bản tổng hợp làm việc** — cập nhật 13/10/2026
**Hạn hoàn thành:** khoảng giữa tháng 1/2027 (~13 tuần)

---

## MỤC LỤC

1. [Định vị đề tài](#1-định-vị-đề-tài)
2. [Khảo sát hệ thống](#2-khảo-sát-hệ-thống)
3. [Khảo sát hiện trạng — 6 bước](#3-khảo-sát-hiện-trạng--6-bước)
4. [So sánh 10 hệ thống registry](#4-so-sánh-10-hệ-thống-registry)
5. [Quy trình AS-IS tại Việt Nam](#5-quy-trình-as-is-tại-việt-nam)
6. [Năm khoảng trống](#6-năm-khoảng-trống)
7. [Hướng Computer Vision](#7-hướng-computer-vision)
8. [Khung báo cáo ĐATN](#8-khung-báo-cáo-đatn)
9. [Ma trận kiểm chứng](#9-ma-trận-kiểm-chứng)
10. [Lịch 13 tuần](#10-lịch-13-tuần)
11. [Chiến lược lấy dữ liệu](#11-chiến-lược-lấy-dữ-liệu)
12. [Sentinel-1](#12-sentinel-1)
13. [Quy ước thuật ngữ](#13-quy-ước-thuật-ngữ)
14. [Nguồn tham khảo](#14-nguồn-tham-khảo)
15. [Việc cần làm ngay](#15-việc-cần-làm-ngay)

---

## 1. Định vị đề tài

### Phát biểu bài toán (dùng cho mục 1.1)

> Đồ án xây dựng một hệ thống quản lý tín chỉ carbon trên blockchain, trong đó mô-đun dMRV ứng dụng thị giác máy tính trên chuỗi ảnh radar Sentinel-1 để **tự động xác minh việc áp dụng tưới ngập khô xen kẽ (AWD)** tại các thửa ruộng thuộc địa bàn [huyện X, tỉnh Y], thay cho hình thức kiểm tra thực địa thủ công hiện nay. Kết quả xác minh, kèm độ bất định được hiệu chuẩn, được ghi nhận bất biến trên blockchain làm căn cứ cấp và truy xuất tín chỉ.

Động từ chính là **xác minh**, không phải **đo**.

### Ba hiểu nhầm phải tránh

| Hiểu sai | Đúng |
|---|---|
| "Đo mức độ tín chỉ carbon" | Đầu ra mô hình CV là **chuỗi trạng thái ngập–khô**; quy sang tCO₂e là bước riêng dùng hệ số có sẵn (VM0042) |
| "Sau khi áp dụng AWD" | Việc **có áp dụng AWD hay không** chính là ẩn số cần xác minh. Nếu chắc chắn đã áp dụng thì không cần vệ tinh |
| "Cả ĐBSCL" | Phạm vi đồ án là **1–2 huyện**. Cả ĐBSCL là tầm nhìn ở chương Kết luận |

### Chuỗi xử lý

```
Ảnh SAR Sentinel-1  →  Chuỗi ngập–khô từng thửa  →  Lượng CH₄ giảm → tCO₂e  →  Tín chỉ on-chain
(dữ liệu đầu vào)      (ĐÓNG GÓP CV CỦA BẠN)        (hệ số VM0042 có sẵn)     (tích hợp kỹ thuật)
```

### Cảnh báo định vị quan trọng

**Việt Nam đã có registry tập trung.** Theo Thông tư 11/2026/TT-BNNMT, Hệ thống đăng ký quốc gia ghi nhận tập trung toàn bộ hạn ngạch và tín chỉ, mỗi đơn vị có mã trong nước và số sê-ri riêng, bảo đảm truy xuất nguồn gốc và tránh trùng lặp. Hệ thống này đóng vai trò như "ngân hàng trung ương" của thị trường carbon nội địa.

→ **Không được** mở bài bằng "hiện nay chưa có hệ thống minh bạch quản lý tín chỉ carbon".

Ba hướng định vị an toàn:
- **(a)** Tầng MRV phía trước registry — dữ liệu đo đạc đến hồ sơ thẩm định vẫn là Excel/PDF, không có dấu vết bất biến
- **(b)** Tín chỉ tự nguyện, tín chỉ rừng và nông nghiệp chưa vào registry quốc gia
- **(c)** Liên thông registry quốc gia ↔ Verra/Gold Standard, rủi ro tính trùng xuyên biên giới

### Ba câu hỏi nghiên cứu

1. Từ chuỗi tán xạ ngược Sentinel-1, có phát hiện được các chu kỳ rút nước ở ruộng lúa ĐBSCL với độ tin cậy đủ cho mục đích cấp tín chỉ không?
2. Mô hình chuỗi thời gian cải thiện bao nhiêu so với phương pháp đối chứng dùng ngưỡng, khi đánh giá **ngoài vùng huấn luyện**?
3. Cơ chế nào bảo đảm kết quả ghi lên blockchain đúng là do mô hình sinh ra, chứ không phải do người nhập tay?

### Ngoài phạm vi — nêu chủ động trong chương 1

- **Không** xây dựng phương pháp luận tính phát thải mới; dùng hệ số có sẵn, sai số quy đổi được kế thừa
- **Không** thay thế đơn vị thẩm định độc lập (VVB). Hệ thống là **công cụ sàng lọc rủi ro**, giúp VVB biết nên xuống kiểm tra thửa nào
- **Không** chạy thời gian thực; phụ thuộc chu kỳ lặp vệ tinh

> Lưu ý: nếu tuyên bố hệ thống thay được VVB, hội đồng sẽ hỏi về trách nhiệm pháp lý và không trả lời được.

### Quyết định về tên đề tài

Tên hiện tại nhấn vào hệ thống blockchain. Hai lựa chọn, cần chốt với GVHD ngay:

- **(a)** Giữ tên, CV là mô-đun → ngân sách 45% blockchain / 40% CV / 15% tích hợp
- **(b)** Đổi tên cho khớp trọng tâm, ví dụ *"Hệ thống quản lý tín chỉ carbon trên blockchain với mô-đun dMRV giám sát canh tác lúa giảm phát thải từ ảnh viễn thám"* → được dồn nhiều hơn cho CV

Khuyến nghị: **(b)**, nhưng cần chữ ký GVHD nên phải làm sớm.

---

## 2. Khảo sát hệ thống

Đồ án cần hai loại khảo sát, không gộp:
- **Khảo sát hiện trạng (desk research)** — đọc quy trình MRV, registry hiện có, luật. Chiếm phần lớn Chương 1–2.
- **Khảo sát người dùng (bảng hỏi + phỏng vấn)** — dữ liệu sơ cấp chứng minh bài toán có thật.

### Nguồn thang đo sẵn có

| Mục đích | Thang đo |
|---|---|
| Ý định chấp nhận công nghệ | TAM (Davis 1989), UTAUT2 (Venkatesh 2012) |
| Sẵn sàng của tổ chức | TOE framework |
| Đánh giá hệ thống sau khi build | **SUS** (10 câu, Brooke 1996), UEQ |
| Chất lượng hệ thống | DeLone & McLean IS Success Model |

Tải instrument gốc: Google Scholar (lọc bài có "Appendix: Questionnaire"), Zenodo, OSF (osf.io), Mendeley Data, Harvard Dataverse.

### Đối tượng khảo sát

| Nhóm | Mục tiêu |
|---|---|
| Cán bộ HSE/ESG tại DN phải kiểm kê KNK | 20–30 phiếu |
| Tư vấn carbon / đơn vị kiểm kê KNK | 10–15 phiếu + **2–3 phỏng vấn sâu** |
| Bên mua tín chỉ (DN chịu CBAM, ngân hàng) | 10 phiếu |
| Chủ rừng, HTX nông nghiệp | 5–10 phiếu |
| VVB, Cục Biến đổi khí hậu | 1–2 phỏng vấn |
| Kỹ sư blockchain | 3–5 phỏng vấn ngắn |

### Thời lượng bảng hỏi — trần 12 phút

| Phần | Nội dung | Thời gian |
|---|---|---|
| A | Sàng lọc + nhân khẩu | 1,5 phút |
| B | Hiện trạng quy trình | 3 phút |
| C | Điểm đau / rủi ro | 2 phút |
| D | Ưu tiên tính năng | 2 phút |
| E | Thái độ với blockchain (TAM rút gọn) | 3 phút |
| F | Rào cản + sẵn sàng thử nghiệm | 1 phút |

Phỏng vấn sâu: 30–45 phút. Đánh giá usability sau khi build: 5 task (20–25 phút) + SUS (3 phút), n = 8–12.

### Cảnh báo thống kê

Với n = 40–60 **không nên** chạy EFA/SEM (quy tắc Hair cần ~5 phiếu/biến quan sát; 25 items → ~125 phiếu). Dùng **mixed-method**: thống kê mô tả + xếp hạng ưu tiên, lấy sức nặng từ 4–6 phỏng vấn sâu.

---

## 3. Khảo sát hiện trạng — 6 bước

### Bước 1 — Khung pháp lý (3–4 ngày)

| Văn bản | Lấy gì ra |
|---|---|
| Luật BVMT 2020 | Cơ sở pháp lý gốc |
| NĐ 06/2022/NĐ-CP (sửa bởi NĐ 119/2025/NĐ-CP) | Định nghĩa, lộ trình, đối tượng kiểm kê |
| **NĐ 29/2026/NĐ-CP** (19/1/2026, 6 chương 35 điều) | Đăng ký, cấp mã, chuyển quyền sở hữu, lưu ký, giao dịch, thanh toán |
| **TT 11/2026/TT-BNNMT** | ⭐ Quan trọng nhất — cấu trúc tài khoản, mã, sê-ri |
| QĐ 232/QĐ-TTg | Đề án thị trường carbon |
| NĐ 180/2026/NĐ-CP | Tín chỉ carbon rừng |

Nguồn tải: `congbao.chinhphu.vn`, `vanban.chinhphu.vn`, `thuvienphapluat.vn`

**Đầu ra:** bảng "Yêu cầu pháp lý → Ràng buộc thiết kế". Ví dụ: *mã trong nước không được tái cấp sau khi hủy* → token phải có trạng thái `retired` vĩnh viễn.

### Bước 2 — Mô hình hóa nghiệp vụ AS-IS (4–5 ngày)

Vẽ BPMN cho 6 giai đoạn: Thiết kế dự án (PDD) → Thẩm định → Đăng ký → MRV → Xác minh → Cấp tín chỉ → Giao dịch → Thu hồi. Mỗi bước ghi 5 cột: *Ai làm · Đầu vào · Đầu ra · Công cụ hiện dùng · Điểm yếu*.

**Món quà từ TT 11/2026:** mỗi tổ chức được cấp duy nhất một tài khoản gắn mã số thuế, gồm các tiểu khoản: **đăng ký chung, số dư giao dịch, chuyển giao, vay mượn, bù trừ, nộp trả, phong tỏa** — thiết kế tương tự hệ thống lưu ký tài sản tài chính. → Bê nguyên 7 tiểu khoản này thành trạng thái/sub-account trong smart contract.

### Bước 3 — Khảo sát hệ thống hiện có (5–6 ngày)

Tự đăng ký tài khoản public trên Verra Registry, chụp màn hình quy trình tra cứu 1 tín chỉ thật → đưa vào báo cáo. Screenshot thật ăn điểm hơn mô tả suông.

### Bước 4 — Phân tích khoảng trống (2 ngày)

Mẫu: *Khoảng trống → Bằng chứng → Hệ quả → Hệ thống đề xuất xử lý thế nào*. Mỗi khoảng trống nên có ít nhất một câu hỏi trong bảng hỏi xác nhận.

### Bước 5 — Khảo sát công nghệ nền (3 ngày)

- Hyperledger Fabric (permissioned, hợp bối cảnh có cơ quan quản lý) vs Ethereum/Polygon vs Chia
- Chuẩn token: **hạn ngạch → ERC-20 (fungible); tín chỉ → ERC-1155** (batch theo dự án + vintage)
- Lưu trữ off-chain (IPFS cho PDD, chỉ hash lên chain), oracle cho IoT, quyền riêng tư

### Bước 6 — Tổng hợp thành yêu cầu (2 ngày)

Bảng truy vết: `Khoảng trống → Yêu cầu chức năng (FR) → Use case → Màn hình/Smart contract`

---

## 4. So sánh 10 hệ thống registry

### Nhóm 1 — Registry truyền thống

| Hệ thống | Chủ quản | Đặc điểm |
|---|---|---|
| **Verra VCS** | Verra (NGO, Mỹ) | CSDL tập trung. Mọi VCU có số sê-ri duy nhất; registry duy trì hồ sơ chuỗi hành trình từ cấp đến thu hồi/hủy. Trạng thái: active, retired, canceled |
| **Gold Standard** | GS Foundation (Thụy Sĩ) | Cơ chế tương tự VCS |
| **CDM** | UNFCCC | Chiếm hơn 60% dữ liệu của CAD Trust |

**Ví dụ số sê-ri VCU thật** (đưa nguyên văn vào đồ án làm minh chứng cấu trúc định danh):

```
14984-637063820-637071224-VCS-VCU-279-VER-IN-1-1081-01012022-30062022-0
```

Gồm: khối bắt đầu – khối kết thúc – chương trình (VCS) – loại đơn vị (VCU) – mã dự án – quốc gia (IN) – kỳ vintage 01/01/2022–30/06/2022. Đây là mô hình "batch + serial range" mà smart contract nên bắt chước.

### Nhóm 2 — Hạ tầng Việt Nam

| Hệ thống | Đặc điểm |
|---|---|
| **Hệ thống đăng ký quốc gia** | Bộ NN&MT quản lý. Tài khoản gắn mã số thuế, 7 tiểu khoản chức năng. Mã trong nước duy nhất, không tái cấp sau khi hủy |
| **Sàn giao dịch carbon** | HNX vận hành; VSDC lưu ký & thanh toán; VNX giám sát; ngân hàng thanh toán. Thanh toán tức thời từng giao dịch trong ngày, không có đối tác bù trừ trung tâm |

### Nhóm 3 — Blockchain/DLT

| Hệ thống | Chuỗi | Kiến trúc | Trạng thái |
|---|---|---|---|
| **CAD Trust** | Chia | Dữ liệu lưu **cục bộ** tại từng thành viên, chỉ **proof** nằm trên blockchain kèm URL truy xuất. Node quản trị công bố bảng danh sách thành viên được công nhận | Vận hành. Sáng lập bởi IETA, World Bank, Chính phủ Singapore. Đã tích hợp Verra, GCC, EcoRegistry, BioCarbon, CDM |
| **Chia Climate Tokenization Engine** | Chia | Token hóa tín chỉ, tích hợp CAD Trust | Vận hành |
| **Toucan Protocol** | Polygon | Sau khi retire trên Verra → mint BatchNFT (ERC-721) → phân mảnh thành TCO2 (ERC-20) → pool BCT | **Cầu Verra đã ngừng** |
| **KlimaDAO** | Polygon | KLIMA bảo chứng 1:1 bằng token pool carbon như BCT | Suy giảm mạnh |

### Nhóm 4 — Sàn quốc tế

**Climate Impact X (CIX)** — liên doanh Singapore Exchange, Temasek, DBS, Standard Chartered. Dùng giám sát vệ tinh, học máy và blockchain. Ngày 26/8/2026 công bố ý định sáp nhập với Carbonplace, chờ phê duyệt MAS, dự kiến tích hợp Q1/2027.

### Ma trận 8 tiêu chí

| Hệ thống | Blockchain | Mã nguồn mở | API công khai | Truy xuất vòng đời | Token hóa | Pháp lý VN | Có sàn | Dữ liệu VN |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Verra VCS | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| Gold Standard | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| CDM | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| HTĐK quốc gia VN | ✗ | ✗ | ✗ | ✓ | ✗ | ✓✓ | ✗ | ✓✓ |
| Sàn carbon VN | ✗ | ✗ | ✗ | ✓ | ✗ | ✓✓ | ✓ | ✓✓ |
| **CAD Trust** | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Chia Tokenization | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Toucan | ✓ | ✓ | ✓ | một phần | ✓ | ✗ | ✓ | ✗ |
| KlimaDAO | ✓ | ✓ | ✓ | một phần | ✓ | ✗ | ✓ | ✗ |
| CIX | một phần | ✗ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |

> **Ô trống là chỗ đồ án đứng:** không hệ thống nào vừa dùng blockchain, vừa mã nguồn mở, vừa tuân thủ pháp lý Việt Nam, vừa có dữ liệu Việt Nam.

### Hai bài học bắt buộc viết vào đồ án

1. **Đừng thiết kế "retire rồi mint".** Ngày 25/5/2022 Verra cấm tạo token dựa trên tín chỉ đã retire, với lý do hành vi retire được hiểu là đã tiêu thụ lợi ích môi trường. → Hướng đúng là **immobilization** (khóa tín chỉ ở registry gốc, mint token đại diện).
2. **Học mô hình hybrid của CAD Trust:** chỉ đưa hash/proof lên chuỗi, dữ liệu gốc off-chain tại chủ sở hữu. Giải luôn phản biện về quyền riêng tư dữ liệu phát thải doanh nghiệp.

---

## 5. Quy trình AS-IS tại Việt Nam

Có **hai luồng song song**, nhiều đồ án nhầm là một.

### Luồng A — Tạo tín chỉ từ dự án

```
1. Chọn phương pháp (Bộ quản lý công bố)
2. Lập hồ sơ dự án / PDD (Chủ dự án)
3. Thẩm định hồ sơ (Đơn vị thẩm định độc lập)   ← lần 1
4. Hội đồng đánh giá (5 ngày làm việc)
5. Công bố dự án trên Hệ thống đăng ký quốc gia
6. Đo đạc, giám sát (Chủ dự án)
7. Thẩm định kết quả giảm phát thải (Đơn vị độc lập)   ← lần 2
8. Cấp tín chỉ + mã trong nước + số sê-ri
9. Giao dịch, bù trừ trên sàn
```

Chú thích quan trọng:
- **Bước 1:** ba loại phương pháp được chấp nhận — do bộ quản lý quy định/công nhận; do UNFCCC công nhận (Điều 6.4 Thỏa thuận Paris) sau khi bộ rà soát; do tổ chức/cá nhân tự đề xuất
- **Bước 3 và 7:** cùng loại chủ thể nhưng là **hai lần thẩm định riêng biệt** — sơ đồ nào gộp làm một là sai
- **Bước 4:** trong 05 ngày làm việc, cơ quan tiếp nhận thông báo một trong ba kết quả: hợp lệ / yêu cầu bổ sung / từ chối. Hội đồng xem xét sự phù hợp về mục tiêu, phương pháp tính, khả năng đáp ứng yêu cầu MRV, khả năng mở rộng quy mô

### Luồng B — Tuân thủ hạn ngạch

```
1. Kiểm kê KNK (Cơ sở tự thực hiện)
2. Thẩm định báo cáo (Đơn vị độc lập)
3. Phân bổ hạn ngạch (Bộ NN&MT)
4. Tài khoản đăng ký (gắn mã số thuế)
5. Giao dịch trên sàn (HNX, VSDC, VNX)
6. Nộp trả hạn ngạch (bù trừ tối đa 30%)
```

Ba đặc điểm quyết định thiết kế:
- Doanh nghiệp kiểm kê KNK từ năm 2024, lập báo cáo theo **Mẫu số 06 Phụ lục II**, nộp UBND cấp tỉnh **trước 31/3** kể từ 2025. Nhiệt điện, sắt thép, xi măng có lộ trình riêng từ 2026
- Hạn ngạch xác định dựa trên dữ liệu kiểm kê, chỉ tiêu quốc gia, khả năng giảm phát thải ngành
- Bù trừ bằng tín chỉ **≤ 30%** hạn ngạch được phân bổ; vay mượn hạn ngạch năm sau **≤ 15%**. Sau 30 ngày kể từ thời hạn nộp trả, Bộ NN&MT hủy bỏ hạn ngạch không chuyển giao/nộp trả

---

## 6. Năm khoảng trống

| # | Khoảng trống | Bằng chứng trong AS-IS | Hệ thống xử lý |
|---|---|---|---|
| 1 | Tầng MRV không có dấu vết bất biến | Dữ liệu đo đạc → báo cáo là tệp rời theo biểu mẫu | Ghi hash dữ liệu đo + báo cáo lên chuỗi ngay khi tạo; gốc giữ off-chain |
| 2 | Hai lần thẩm định không liên thông bằng chứng | Bước 3 và 7 là hai hồ sơ tách rời | Chữ ký số VVB gắn vào cùng chuỗi sự kiện của dự án |
| 3 | Registry quốc gia đóng với bên thứ ba | Chưa công bố API công khai | Lớp xác minh công khai cho bên mua |
| 4 | Hai không gian định danh tách biệt | Mã trong nước song song với serial Verra/GS | Mô hình meta-registry kiểu CAD Trust để đối chiếu chéo |
| 5 | **Yêu cầu bất biến chưa có cơ chế kỹ thuật bảo đảm** | Mã trong nước không được tái cấp sau khi hủy — hiện chỉ là ràng buộc nghiệp vụ trong CSDL | **Blockchain biến ràng buộc nghiệp vụ thành ràng buộc kỹ thuật** |

> Khoảng trống **số 5** là trọng tâm bảo vệ. Nó không phủ nhận registry quốc gia, mà nói rằng hệ thống của bạn **thực thi** đúng yêu cầu pháp luật đã đặt ra.

---

## 7. Hướng Computer Vision

### Bài toán đã chọn: Phát hiện chu kỳ ngập–khô (AWD) từ ảnh SAR Sentinel-1

Các phương án đã cân nhắc:

| Bài toán | Phù hợp | Vấn đề |
|---|:-:|---|
| **A. AWD từ SAR** | ★★★★★ | Nhãn phải tự xây |
| B. Chiều cao tán / sinh khối rừng | ★★★☆☆ | SOTA đã rất chín, khó vượt |
| C. Phát hiện mất rừng | ★★☆☆☆ | Bão hòa |
| D. OCR hồ sơ MRV | ★★☆☆☆ | Dễ nhưng gần như không có giá trị nghiên cứu |
| E. Đếm cây từ UAV | ★★★☆☆ | Phải tự bay drone |

### Vì sao chọn A — bối cảnh Việt Nam

Sau hai năm triển khai, Đề án 1 triệu ha lúa chất lượng cao phát thải thấp ở ĐBSCL đạt **gần 400.000 ha** áp dụng quy trình mới (gấp đôi mục tiêu 180.000 ha). Nhưng năm 2026 **mới chỉ 58.071 ha đăng ký đo đạc MRV**, trong đó 56.845 ha thuộc dự án TRVC. Nhiều địa phương đã sản xuất lúa giảm phát thải nhưng chưa đủ điều kiện chứng minh do thiếu kinh phí đo đạc và vận hành MRV.

Một bài báo tóm gọn: **"Làm được mà không chứng minh được"**. Bộ NN&MT đang trình Thủ tướng phương án điều chỉnh kế hoạch 2026–2030 với trọng tâm xây dựng hệ thống MRV.

→ Khoảng cách **400.000 ha làm được / 58.000 ha chứng minh được** chính là bài toán.

Ba lý do kỹ thuật:
- ĐBSCL nhiều mây quanh năm → ảnh quang học thất bại, SAR xuyên mây
- Sentinel-1 miễn phí, có sẵn trên Google Earth Engine đã tiền xử lý
- Phát thải CH₄ từ ruộng lúa chiếm **hơn 11%** tổng phát thải methane khí quyển; AWD giảm methane tới **~50%**

### Cơ sở vật lý (phải giải thích được trong 30 giây)

| Trạng thái ruộng | Bề mặt | Sóng radar | Ảnh |
|---|---|---|---|
| **Ngập nước** | Phẳng như gương | Dội đi hướng khác | **TỐI** (~−20 dB) |
| **Khô** | Gồ ghề | Tán ngược về nhiều | **SÁNG** (~−8 dB) |

Theo dõi độ sáng/tối của một thửa qua thời gian → đồ thị răng cưa → mỗi lần chuyển là một lần rút nước.

### Tình trạng nghiên cứu

**Nhánh AWD/SAR — chưa chín, đây là cơ hội.** Các nghiên cứu hiện tại phần lớn vẫn dùng **ngưỡng tán xạ ngược và học máy cổ điển**:
- Phân loại ngập/không ngập bằng ngưỡng tán xạ ngược băng L, tính lịch sử canh tác bằng Sentinel-1
- Tỉ số phân cực VV/VH Sentinel-1 giai đoạn sinh trưởng đỉnh + bộ phân loại dựa trên luật và học máy
- Phân rã ba thành phần SAR băng L (ALOS-2) + cảm biến IoT: độ chính xác **85–95%**

→ **Chưa ai đưa transformer/TempCNN chuỗi thời gian vào bài toán này ở quy mô ĐBSCL.**

Phương pháp luận carbon đã chuẩn hóa: **VCS VM0042, VM0051**, và phương pháp giảm phát thải methane trong canh tác lúa của Gold Standard. Có dự án ở Đồng Tháp theo chuẩn Gold Standard đã niêm yết trên registry GS năm 2025, dự kiến thẩm định phát hành tín chỉ 2026.

**Nhánh chiều cao tán rừng — đã rất chín:**

| Năm | Mô hình | Dữ liệu | Kiến trúc | Hiệu năng |
|---|---|---|---|---|
| 2021 | Potapov et al. | GEDI + Landsat, 30 m | Random Forest | — |
| 2023 | Lang et al. (ETH, *Nature Ecol. Evol.*) | GEDI + Sentinel-2, 10 m | Ensemble CNN xác suất | RMSE ~7,9 m |
| 2024 | Pauls et al. | S1 + S2, 10 m | UNet, loss chịu lệch | MAE 2,43 m |
| 2025 | Pauls et al. | S2 chuỗi dày 2019–2022 | CNN thời gian | R²=0,68, RMSE 4,65 m |

Mã nguồn ETH mở tại `github.com/langnico/global-canopy-height-model`.

**Foundation model cho viễn thám:** đã có khoảng 58 mô hình (Prithvi-EO-2.0, Clay, Galileo, DOFA, TerraMind, AlphaEarth, TerraFM). Hai kết luận từ GEO-Bench-2: mô hình chuyên viễn thám vượt mô hình huấn luyện trên ảnh tự nhiên; **không mô hình nào thống trị mọi tác vụ**. AlphaEarth **không mã nguồn mở**. Trong benchmark lập bản đồ ngập lụt, **Prithvi dẫn đầu trên Sentinel-1** → điểm khởi đầu hợp lý.

**Thị trường dMRV đã thành hiện thực:**
- **Tháng 2/2026: Verra phê duyệt lô tín chỉ đầu tiên theo chương trình thí điểm dMRV** (phát hành tần suất cao)
- Gold Standard chạy thí điểm dMRV đến 30/10/2026
- Global Carbon Council ra mắt TRACE, nền tảng dMRV được phê duyệt đầu tiên, 5/2026

**Giao điểm CV ↔ blockchain — gần như trống.** Một review chỉ ra nghiên cứu hiện tại chủ yếu tập trung vào truy xuất và tính bất biến của blockchain, **thiếu các mô hình toàn diện tận dụng học máy cho phát hiện gian lận chủ động**. Các bài "AI + blockchain + carbon" hiện có hầu hết là framework trên giấy, không cài đặt thực, không đo lường. → **Chỉ cần thực sự cài đặt và đo là đã vượt mặt bằng.**

Phía mật mã học đã đủ chín: zkPyTorch chứng minh suy luận VGG-16 trong **2,2 giây/ảnh**; trình biên dịch ZKML nhanh hơn 5× và proof nhỏ hơn 22× so với zkCNN/vCNN; chuẩn **ERC-7992** chuẩn hóa đăng ký mô hình ML và xác minh proof suy luận ZK.

### Bốn đóng góp

| # | Đóng góp | Khả thi | Giá trị |
|---|---|:-:|:-:|
| 1 | **Bộ dữ liệu AWD có nhãn cho ĐBSCL** — hiện không có bộ công khai nào. Công bố trên Zenodo | ★★★★★ | ★★★★ |
| 2 | **Chuyển từ ngưỡng sang deep learning chuỗi thời gian** — TempCNN/LSTM/temporal transformer, so với baseline ngưỡng và RF | ★★★★ | ★★★ |
| 3 | **Định lượng bất định → đệm tín chỉ bảo thủ** — xuất phân phối, cấp tín chỉ ở cận dưới khoảng tin cậy | ★★★ | ★★★★★ |
| 4 | **Suy luận có thể kiểm chứng cho dMRV** — giải bài toán oracle | ★★ | ★★★★★ |

**Về đóng góp 3:** chuẩn carbon yêu cầu nguyên tắc bảo thủ. Đã có nhận định rằng nếu không có ước lượng bất định được hiệu chuẩn, dự đoán từ viễn thám **không thể tích hợp an toàn** vào quyết định chính sách khí hậu đòi hỏi phân tích tình huống xấu nhất. → Smart contract ghi cả giá trị lẫn độ bất định.

**Về đóng góp 4 — bài toán oracle:** blockchain đảm bảo dữ liệu không bị sửa **sau khi ghi**, nhưng không đảm bảo dữ liệu **đúng lúc ghi vào**. Chủ dự án hoàn toàn có thể bỏ qua mô hình và gõ tay một con số đẹp hơn.

Trong 3 tháng **không nên** làm zkSNARK đầy đủ. Phương án nhẹ, cài đặt được:
1. Ghi lên chuỗi: hash trọng số mô hình + hash ảnh đầu vào + hash kết quả + phiên bản code
2. Suy luận tất định (cố định seed, cố định phiên bản thư viện)
3. Cơ chế phản bác: thời gian tranh chấp, ai cũng chạy lại được và thách thức
4. So sánh chi phí/độ trễ với zkSNARK đầy đủ, dẫn chuẩn ERC-7992

---

## 8. Khung báo cáo ĐATN

### Quy định Bách khoa

- ĐATN thực hiện trong **15 tuần**
- Báo cáo tối đa ~**150 trang** (đồ án thiết kế), ~**70 trang** (đồ án nghiên cứu)
- Đồ án này là dạng lai → nhắm **80–100 trang** không kể phụ lục

Thứ tự đóng quyển:
1. Bìa trước
2. Đề tài tốt nghiệp (**phải có chữ ký GVHD**)
3. Lời cảm ơn + Tóm tắt đồ án (1 trang, **ký tên và ghi rõ họ tên**)
4. Mục lục
5. Danh mục hình vẽ
6. Danh mục bảng biểu
7. Các chương nội dung
8. Phụ lục
9. Tài liệu tham khảo
10. Bìa cuối

Yêu cầu: cấu trúc chương logic, bảng biểu/hình ảnh có tiêu đề và đánh số, **mỗi chương có mở đầu chương và kết luận chương**, trích dẫn đúng quy định.

> ⚠️ Mỗi trường/khoa có template riêng (SoICT và các trường khác có template LaTeX). **Lấy đúng file mẫu của khoa ngay tuần 1.**

### Sáu chương

| Chương | Nội dung | Số trang | Thời gian |
|:-:|---|:-:|:-:|
| 1 | Giới thiệu chung — đặt vấn đề, mục tiêu, phạm vi, **4 đóng góp đánh số**, phạm vi loại trừ | 8–10 | 3 ngày (viết tuần 12) |
| 2 | Tổng quan & cơ sở lý thuyết — pháp lý, MRV/dMRV, blockchain, SAR, AWD, **bảng so sánh ≥15 công trình** | 18–22 | 2 tuần |
| 3 | Phân tích yêu cầu & thiết kế — use case, kiến trúc 4 tầng, smart contract, **bảng truy vết** | 15–18 | 1,5 tuần |
| 4 | **Xây dựng bộ dữ liệu và mô hình CV** ⭐ | 20–25 | 4 tuần |
| 5 | Cài đặt, tích hợp, thực nghiệm | 15–18 | 2,5 tuần |
| 6 | Kết luận & hướng phát triển — **phải có mục Hạn chế trung thực** | 4–5 | — |

**Điểm phân biệt đồ án khá và giỏi:** mục 2.6 (tổng quan nghiên cứu) **không được là danh sách tóm tắt từng bài**. Phải là bảng so sánh có cột "khoảng trống", kết thúc bằng đoạn chỉ rõ bạn lấp khoảng trống nào.

---

## 9. Ma trận kiểm chứng

| # | Kiểm chứng cái gì | Làm thế nào | Tiêu chí đạt |
|---|---|---|---|
| 1 | Bài toán có thật | ≥3 nguồn độc lập + ≥2 phỏng vấn chuyên gia (biên bản ở phụ lục) | Số liệu khớp nhau |
| 2 | **Chất lượng nhãn** | Đối chiếu chéo 3 nguồn: nhật ký nông hộ, ảnh quang học ngày quang mây, ống theo dõi mực nước | **Cohen's kappa ≥ 0,7** |
| 3 | **Phân chia tập dữ liệu** | Tách theo **không gian và thời gian**, KHÔNG random split | Xem cảnh báo bên dưới |
| 4 | Hiệu năng mô hình | Precision/Recall/F1 từng lớp, IoU, ma trận nhầm lẫn; so với 2 baseline | Vượt baseline ngưỡng; tham chiếu 85–95% của phân rã L-band |
| 5 | Độ ổn định | Lặp 5 lần với seed khác nhau | Báo trung bình ± độ lệch chuẩn |
| 6 | Hiệu chuẩn bất định | Reliability diagram, ECE, độ phủ khoảng dự báo | Khoảng 90% phủ thực tế ≈ 90% (±5%) |
| 7 | Quy đổi sang phát thải | So với hệ số IPCC / số đo buồng kín | Nêu rõ sai số truyền |
| 8 | Smart contract | Unit test (Hardhat), đo gas, quét Slither/Mythril, testnet | Coverage ≥ 80%, không lỗ hổng high |
| 9 | Toàn vẹn hệ thống | **Kịch bản tấn công:** sửa dữ liệu sau khi ghi, cấp trùng serial, retire hai lần, giả mạo kết quả mô hình | Phát hiện 100% |

### ⚠️ Cảnh báo kỹ thuật quan trọng nhất

**Không bao giờ chia tập train/test ngẫu nhiên theo pixel.** Dữ liệu viễn thám có tự tương quan không gian rất mạnh — pixel cạnh nhau gần như giống hệt. Chia ngẫu nhiên cho F1 đẹp giả tạo (nhiều đồ án báo 97% rồi sụp khi bị hỏi).

**Đúng cách:**
- Chia theo **thửa và theo vùng địa lý** (train huyện A, test huyện B)
- **Cộng thêm** chia theo vụ (train vụ 2023, test vụ 2024)
- Báo cả hai con số. Nếu kết quả tụt khi test ngoài vùng → đó là sự thật, hãy báo cáo và phân tích

Nếu tỉ lệ ngập/khô lệch (ví dụ 80/20) thì **accuracy vô nghĩa** — dùng F1 theo lớp và balanced accuracy.

### Chứng cứ đưa vào phụ lục

Biên bản phỏng vấn · mã nguồn (hoặc link GitHub) · bảng dữ liệu thô mẫu · ảnh thực địa có tọa độ GPS và thời gian · địa chỉ smart contract trên testnet explorer

---

## 10. Lịch 13 tuần

| Tuần | Việc chính | Sản phẩm cuối tuần |
|:-:|---|---|
| 1 | Lấy template khoa; chốt tên đề tài với GVHD; **gửi email xin dữ liệu**; bắt đầu đường nhãn 2 | Đề cương ký duyệt |
| 2 | Chương 2 pháp lý + nghiệp vụ; pipeline GEE tải Sentinel-1; số hóa ranh giới thửa | Chuỗi ảnh thô 1 huyện |
| 3 | Tổng quan nghiên cứu; tiền xử lý SAR hoàn chỉnh; bộ nhãn v1 | Bảng so sánh ≥15 công trình |
| 4 | **Điểm quyết định về nhãn** | Bộ nhãn v1 hoặc phương án B |
| 5 | (Chuyến đi thực tế nếu có) + Chương 3 thiết kế | Use case, kiến trúc |
| 6 | Baseline ngưỡng + Random Forest | Con số baseline |
| 7–8 | Mô hình chuỗi thời gian; chia tập đúng cách | Bảng kết quả so sánh |
| 9 | Định lượng bất định + hiệu chuẩn | Reliability diagram |
| 10 | Smart contract + test | Contract trên testnet |
| 11 | Tích hợp end-to-end + web tra cứu | Demo chạy được |
| 12 | Viết Chương 1, 5, 6 | Bản nháp đầy đủ |
| 13 | Sửa theo GVHD, slide, tập bảo vệ | Nộp quyển |

### Ba mốc cắt scope bắt buộc

- Hết **tuần 4** không có nhãn → chuyển phương án B ngay, đừng chờ
- Hết **tuần 9** mô hình chưa xong → bỏ fine-tune Prithvi, giữ TempCNN
- Hết **tuần 11** chưa tích hợp xong → cắt web app, giữ smart contract + script, mô tả web app là hướng phát triển

---

## 11. Chiến lược lấy dữ liệu

### Ràng buộc lịch thời vụ — quyết định thiết kế nghiên cứu

Ở ĐBSCL: **Đông Xuân** xuống giống tháng 11–12, thu hoạch tháng 3–4. **Thu Đông** gieo sạ tháng 7–8, thu hoạch tháng 11–12.

Đối chiếu với thời gian làm đồ án (10/2026 – 1/2027):
- Thu Đông 2026: giai đoạn rút nước **đã qua**
- Đông Xuân 2026–2027: phải tới tháng 3–4 mới xong — **sau hạn nộp**

→ **Đồ án bắt buộc là nghiên cứu hồi cố (retrospective)** trên kho ảnh Sentinel-1 lưu trữ, với nhãn từ các vụ đã qua. Đây không phải điểm yếu — nghiên cứu chuỗi thời gian vệ tinh vốn làm theo cách này.

### Hai loại dữ liệu — đừng gộp

| | **Đầu vào** (hệ thống dùng để xác minh) | **Kiểm chứng** (chứng minh mô hình đúng) |
|---|---|---|
| Là gì | Ảnh Sentinel-1, ranh giới thửa | Nhãn ngập/khô từng thửa theo ngày |
| Lấy ở đâu | Google Earth Engine, miễn phí | Phải xin hoặc tự suy ra |
| Độ khó | **Đã giải quyết xong** | **Đây mới là vấn đề** |

### Nhãn trông như thế nào

| plot_id | ngày | trạng thái | nguồn | độ tin cậy |
|---|---|---|---|---|
| ST-001 | 2024-01-12 | ngập | nhật ký HTX | cao |
| ST-001 | 2024-01-18 | khô | nhật ký HTX | cao |
| ST-002 | 2024-01-18 | ngập | NDWI Sentinel-2 | trung bình |

**Quy mô cần:** ~50–100 thửa × 2–3 vụ × ~20 lần quan trắc/vụ ≈ **2.000–6.000 dòng nhãn**. Đủ cho một đồ án.

### Bốn đường lấy nhãn

**Đường 1 — Xin từ đối tác** (chất lượng cao nhất, phụ thuộc người khác)

Nhật ký quản lý nước HTX, số đo ống theo dõi mực nước.

| Đơn vị | Vì sao | Xin gì |
|---|---|---|
| **Viện Môi trường Nông nghiệp** | Đảm nhận quy trình đo đếm giảm phát thải của Đề án 1 triệu ha | Số liệu buồng kín, hệ số phát thải |
| **Dự án TRVC** | Chiếm 56.845/58.071 ha đăng ký MRV 2026 | Ranh giới thửa, nhật ký quản lý nước |
| **IRRI Việt Nam** | Thúc đẩy AWD ở VN nhiều năm | Dữ liệu thí nghiệm AWD cũ |
| **Sở NN&MT / Chi cục Trồng trọt & BVTV** | Nắm danh sách HTX | Danh sách HTX, diện tích |
| **Dự án Gold Standard Đồng Tháp** | Đã niêm yết trên registry GS 2025 | Tài liệu PDD công khai |

Xác suất có phản hồi dùng được trong 4 tuần (có thư giới thiệu GVHD): ước **30–40%**. Nhờ GVHD gửi kèm thư giới thiệu — email sinh viên gửi thẳng tỉ lệ phản hồi rất thấp.

**Đường 2 — Suy nhãn từ ảnh quang học** ⭐ (làm ngay, không chờ đường 1)

Lấy Sentinel-2 ngày quang mây → tính NDWI/MNDWI → suy thửa nào ngập → ghép với Sentinel-1 chụp trong ±1–2 ngày.

Logic dễ bảo vệ: *ảnh quang học nhìn được nước nhưng bị mây chặn; dùng ngày quang mây hiếm hoi để "dạy" mô hình SAR, rồi SAR làm việc được cả ngày có mây.*

Hai hạn chế **phải nêu thẳng**:
- ĐBSCL nhiều mây, số ngày dùng được có thể chỉ 10–30% → **thiên lệch lấy mẫu** (ngày quang mây thường rơi vào mùa khô)
- Đây là **nhãn yếu**, không phải quan sát trực tiếp

**Đường 3 — Lịch vận hành công trình thủy lợi** (ít người nghĩ tới)

Công ty khai thác công trình thủy lợi **có sổ ghi lịch đóng/mở cống** theo ngày cho từng vùng tưới. Hồ sơ hành chính, dễ xin hơn nhật ký nông hộ nhiều.

Tương tự: vùng đê bao khép kín (chủ động tiêu nước) vs vùng ngoài đê (ngập theo lũ) là **đối chứng tự nhiên**.

**Đường 4 — Nhãn từ nước ngoài**

Nghiên cứu AWD ở Nhật (ALOS-2), Thái Lan, Philippines có dữ liệu công khai hơn. Huấn luyện ở đó, đánh giá khả năng chuyển vùng sang ĐBSCL. Chỉ là phần bổ sung.

### Ranh giới thửa — tự làm được

Mở Google Earth / Sentinel-2 độ phân giải cao, số hóa tay 50–100 thửa bằng **QGIS**. Mất 1–2 ngày. Nếu xin được bản đồ hiện trạng sử dụng đất cấp xã thì nhanh hơn, nhưng không bắt buộc.

### Chuyến đi thực tế — cần hay không

**Không bắt buộc để xây mô hình. Nhưng rất có giá trị để bảo vệ.**

Vì ràng buộc lịch thời vụ, bạn **không thể** thu dữ liệu huấn luyện trực tiếp trong thời gian làm đồ án. Nhãn phải đến từ hồ sơ các vụ đã qua.

Một chuyến 3–4 ngày vẫn đáng vì bốn thứ:
1. **Kiểm chứng ranh giới thửa** bằng GPS — sai lệch ranh giới làm hỏng toàn bộ zonal statistics
2. **Phỏng vấn nông hộ về thực hành thật so với hồ sơ ghi** — phát hiện có giá trị khoa học, và chính là lý do tồn tại của dMRV
3. **Ảnh thực địa có tọa độ GPS** cho phụ lục
4. **Quan hệ với HTX** để xin tiếp dữ liệu vụ sau

> Thứ tự ưu tiên: **xin được đối tác dữ liệu > đi thực địa.** Nếu phải chọn một, chọn cái đầu.

### Danh mục dữ liệu cần thu thập

**Nhóm A — Bắt buộc**

| Dữ liệu | Định dạng | Nguồn |
|---|---|---|
| Ranh giới thửa/vùng canh tác | Shapefile/GeoJSON, WGS84 | Đối tác / tự số hóa |
| Lịch thời vụ: ngày gieo sạ, ngày thu hoạch | Bảng | HTX, Chi cục |
| **Nhật ký quản lý nước: ngày rút, ngày bơm lại** | Bảng theo ngày | HTX, hồ sơ dự án |
| Phân loại thửa: AWD / đối chứng | Nhãn nhị phân | Hồ sơ dự án |
| Ảnh Sentinel-1 GRD các vụ tương ứng | GeoTIFF | GEE, miễn phí |

**Nhóm B — Rất nên có**

| Dữ liệu | Dùng để |
|---|---|
| Số đo ống theo dõi mực nước | Nhãn chính xác nhất, chuẩn IRRI |
| Số đo buồng kín (CH₄, N₂O) | Kiểm chứng bước quy đổi phát thải |
| Ảnh Sentinel-2 ngày quang mây | Nguồn nhãn độc lập để tính kappa |
| Loại đất, giống lúa, lượng phân bón | Biến kiểm soát khi phân tích sai số |
| **Dữ liệu mưa** (trạm hoặc CHIRPS/GPM) | **Phân biệt ngập do mưa với ngập do tưới — rất dễ bị hỏi** |

**Nhóm C — Thu khi đi thực địa**

- Tọa độ GPS các điểm góc thửa mẫu (10–20 thửa)
- Ảnh chụp có EXIF tọa độ + thời gian
- Biên bản phỏng vấn 5–10 nông hộ: thực tế rút nước mấy lần, có ghi nhật ký không, ai kiểm tra
- Phỏng vấn 1–2 cán bộ HTX/khuyến nông về quy trình ghi chép hiện tại

### Phương án B (chuẩn bị sẵn từ tuần 1)

1. **Nhãn yếu từ ảnh quang học** — hợp lệ về phương pháp, phải nói rõ là nhãn yếu
2. **Thu hẹp bài toán** — thay vì phát hiện AWD, làm **phát hiện trạng thái ngập/khô** của ruộng lúa. Bài toán con, nhãn dễ hơn, vẫn là tiền đề
3. **Dùng dữ liệu nước ngoài** + domain adaptation sang ĐBSCL

---

## 12. Sentinel-1

Chương trình vệ tinh radar của **ESA**, thuộc hệ thống Copernicus. Chụp ảnh radar toàn cầu, liên tục, **miễn phí**.

### Thông số

| | |
|---|---|
| Loại | Radar khẩu độ tổng hợp (SAR), băng C, bước sóng ~5,6 cm |
| Độ phân giải | 10 m/pixel (GRD, chế độ IW) |
| Phân cực | VV và VH |
| Chu kỳ lặp danh định | **6 ngày** cho cả chòm vệ tinh |
| Mức xử lý nên dùng | **GRD** — đã nắn về mặt đất |
| Lấy ở đâu | Google Earth Engine (`COPERNICUS/S1_GRD`) hoặc Copernicus Data Space |

### ⚠️ Lịch sử chòm vệ tinh — ảnh hưởng trực tiếp đến dữ liệu

| Giai đoạn | Vệ tinh hoạt động | Hệ quả |
|---|---|---|
| 2014–2021 | 1A + 1B | Quan trắc dày nhất |
| 2022–2024 | **Chỉ 1A** | Sentinel-1B hỏng hệ thống nguồn điện 2021 → **mật độ giảm một nửa** |
| 12/2024 | 1C phóng | Bắt đầu khôi phục |
| 11/2025 | 1D phóng | — |
| 4–6/2026 | 1A + 1C + 1D | Giai đoạn chuyển tiếp |
| **Từ 29/6/2026** | **1C + 1D** | Sentinel-1A ngừng hoạt động 29/6/2026. Chòm hiện tại bay cách nhau 180° |

Cấu hình quỹ đạo 1C/1D **hơi khác** cấu hình 1A/1B cũ, làm **lệch 1 ngày** trong chu kỳ lặp 6 ngày.

**Hệ quả:** nếu lấy dữ liệu nhiều vụ khác nhau (ví dụ Đông Xuân 2021 và 2024), **số lần quan trắc mỗi vụ không bằng nhau**. Vụ 2023 có thể chỉ có một nửa số ảnh so với vụ 2020.

Hai việc phải làm:
1. **Kiểm tra số ảnh thực tế có được cho vùng nghiên cứu theo từng vụ**, trước khi chốt chọn vụ. Vài dòng code trên GEE
2. Nếu dùng nhiều vụ, xử lý chuỗi độ dài khác nhau (nội suy về lưới thời gian đều, hoặc kiến trúc chấp nhận chuỗi dài ngắn khác nhau) và **viết rõ trong báo cáo**

### Hạn chế lớn nhất với bài toán AWD

Chu kỳ lặp 6 ngày, trong khi một đợt rút nước AWD thường kéo dài 5–7 ngày → **mỗi đợt may ra chỉ quan sát được 1 lần, và có thể bỏ sót đợt ngắn**.

Giới hạn vật lý, không khắc phục bằng thuật toán. Nêu thẳng trong chương Hạn chế, kèm phân tích định lượng: với chu kỳ lặp 6 ngày, xác suất bỏ sót một đợt rút nước kéo dài *d* ngày là bao nhiêu.

---

## 13. Quy ước thuật ngữ

### Nguyên tắc

| Nhóm | Cách làm |
|---|---|
| Đã chuẩn hóa trong tài liệu tiếng Việt | Dùng tiếng Việt, mở ngoặc tiếng Anh lần đầu |
| Chưa thống nhất, nhiều bản dịch mâu thuẫn | **Giữ nguyên tiếng Anh**, giải thích bằng tiếng Việt |
| Tên riêng, tên chuẩn, viết tắt quốc tế | Giữ nguyên |

Lần đầu viết *tiếng Việt (tiếng Anh)*, các lần sau dùng **một dạng duy nhất**.

### Đã chuẩn hóa — dùng tiếng Việt

| Tiếng Anh | Tiếng Việt |
|---|---|
| Remote sensing | viễn thám |
| SAR | radar khẩu độ tổng hợp |
| Backscatter | tán xạ ngược |
| Polarization | phân cực (H = ngang, V = dọc) |
| Speckle | **nhiễu đốm** (speckle filtering = lọc đốm) |
| Radiometric calibration | hiệu chỉnh bức xạ |
| Thermal noise removal | loại bỏ nhiễu nhiệt |
| Image interpretation | giải đoán ảnh |
| Land cover | lớp phủ bề mặt |
| Overall accuracy | độ chính xác toàn cục |
| Kappa coefficient | hệ số kappa |
| Spatial autocorrelation | tự tương quan không gian |
| Revisit time | chu kỳ lặp |
| Hash | hàm băm |
| Smart contract | hợp đồng thông minh |
| Overfitting / Underfitting | quá khớp / thiếu khớp |
| Generalization | tính tổng quát hóa |
| Train/validation/test set | tập huấn luyện / tập thẩm định / tập kiểm tra |
| Fine-tune | tinh chỉnh |
| Label / weak label | nhãn / nhãn yếu |
| Calibration (mô hình) | hiệu chuẩn |
| Prediction interval | khoảng dự báo |

### Ground truth — không có một từ duy nhất

| Ngữ cảnh | Dùng từ nào |
|---|---|
| Dữ liệu thu tại ruộng | **dữ liệu thực địa** / số liệu thực địa |
| Điểm đi đo để kiểm tra | **điểm kiểm tra thực địa** |
| Vùng mẫu dùng huấn luyện | **dữ liệu mẫu thực địa** |
| Nguồn đối chiếu không từ thực địa | **dữ liệu đối chiếu** / dữ liệu tham chiếu |
| Ngữ cảnh học máy thuần | **nhãn thực** hoặc giữ *ground truth* |

Không dùng "sự thật mặt đất" hay "chân lý mặt đất".

### ⚠️ Precision / Recall — chỗ nguy hiểm nhất

Tài liệu tiếng Việt dịch rất loạn, và **"độ chính xác" bị dùng cho CẢ accuracy lẫn precision**. Ngoài ra "recall → độ bao phủ" lại đụng với *coverage* của khoảng dự báo.

**Khuyến nghị: trong phần thực nghiệm, giữ nguyên tiếng Anh.**

> ✅ "Mô hình đạt precision 0,85 và recall 0,71 trên lớp *khô*."
> ❌ "Mô hình đạt độ chính xác 0,85 và độ bao phủ 0,71."

Nếu bắt buộc Việt hóa: accuracy → **độ chính xác**; precision → **độ chuẩn xác (precision)**; recall → **độ phủ (recall)**. Tuyệt đối không để precision = "độ chính xác".

### ⚠️ Baseline — một từ, hai nghĩa đối lập

| Ngữ cảnh | Tiếng Việt | Nghĩa |
|---|---|---|
| Nghiệp vụ carbon | **đường cơ sở** | Mức phát thải nếu không có dự án |
| Học máy | **phương pháp đối chứng** / mô hình cơ sở | Phương pháp đơn giản để so sánh |

"Baseline ngưỡng tán xạ ngược" là **phương pháp đối chứng**, không phải "đường cơ sở".

### Giữ nguyên tiếng Anh

MRV, dMRV, SAR, GEDI, GRD, IPFS, gas, mint, burn, retire, vintage, oracle, zkSNARK, zkML, ZKP, BPMN, swimlane, VVB, PDD, tCO₂e, AWD, ERC-20/721/1155, Sentinel-1, F1, IoU, TempCNN, LSTM, Transformer, domain adaptation

Hai ngoại lệ nên dịch: **additionality → tính bổ sung**; **double counting → tính trùng** (TT 11/2026 dùng cụm "tránh trùng lặp")

---

## 14. Nguồn tham khảo

### Văn bản pháp luật Việt Nam

1. Nghị định 06/2022/NĐ-CP (07/01/2022), sửa đổi bởi Nghị định 119/2025/NĐ-CP (09/6/2025)
2. Nghị định 29/2026/NĐ-CP (19/01/2026) về sàn giao dịch các-bon trong nước
3. Thông tư 11/2026/TT-BNNMT — `congbao.chinhphu.vn/van-ban/thong-tu-so-11-2026-tt-bnnmt-469021.htm`
4. Nghị định 180/2026/NĐ-CP về dịch vụ hấp thụ và lưu giữ carbon của rừng
5. Quyết định 232/QĐ-TTg; Quyết định 13/2024/QĐ-TTg; Quyết định 1490/QĐ-TTg (Đề án 1 triệu ha lúa, 27/11/2023)

### Tài liệu kỹ thuật quốc tế

6. Verra, *VCS Registration and Issuance Process v4.4* (04/10/2023)
7. Climate Action Data Trust — `climateactiondata.org/frequently-asked-questions/`; mã nguồn `github.com/Chia-Network/cadt`
8. Toucan Protocol — `docs.toucan.earth/resources/archives/verra-bridge-deprecated`
9. Verra cấm token hóa tín chỉ đã retire, 25/5/2022
10. Climate Impact X — `climateimpactx.com/about/`
11. Phương pháp luận: VCS VM0042, VM0051; Gold Standard *Methane Emission Reduction by Adjusted Water Management Practice in Rice Cultivation*

### Nghiên cứu CV / viễn thám

12. Lang et al. (2023), *A high-resolution canopy height model of the Earth*, Nature Ecology & Evolution — mã nguồn `github.com/langnico/global-canopy-height-model`
13. Pauls et al. (2024, 2025) — canopy height, loss chịu lệch, CNN thời gian
14. Prithvi-EO-2.0, Clay, Galileo, TerraMind, AlphaEarth — foundation models cho viễn thám
15. Các nghiên cứu AWD/SAR: phân rã ba thành phần ALOS-2 + IoT; ngưỡng tán xạ ngược băng L; tỉ số VV/VH Sentinel-1
16. zkPyTorch, ZKML compiler, chuẩn ERC-7992

---

## 15. Việc cần làm ngay

### Tuần này

- [ ] **Lấy template ĐATN chính thức của khoa** (LaTeX hoặc Word)
- [ ] **Chốt tên đề tài với GVHD** — quyết định giữa phương án (a) và (b)
- [ ] **Gửi email xin dữ liệu** tới Viện Môi trường Nông nghiệp, dự án TRVC, IRRI Việt Nam, Chi cục Trồng trọt & BVTV — **nhờ GVHD ký thư giới thiệu**
- [ ] **Chọn huyện nghiên cứu** (1–2 huyện, ưu tiên nơi có mô hình thuộc Đề án 1 triệu ha hoặc dự án TRVC)
- [ ] Đăng ký tài khoản Google Earth Engine
- [ ] Đăng ký tài khoản public trên Verra Registry, chụp màn hình quy trình tra cứu

### Không chờ ai

- [ ] Bắt đầu **đường nhãn 2** (NDWI từ Sentinel-2) ngay, song song với việc chờ email
- [ ] Số hóa ranh giới 50–100 thửa bằng QGIS
- [ ] Kiểm tra **số ảnh Sentinel-1 thực tế có được** cho vùng nghiên cứu, theo từng vụ

### Nguyên tắc xuyên suốt

> **Đừng để tiến độ phụ thuộc vào việc ai đó trả lời email.**
> Đường nhãn 2 đảm bảo luôn có đồ án để nộp. Đường 1 về kịp thì đồ án hay hơn — nhưng đó là phần thưởng, không phải điều kiện.
