# CLAUDE.md — Nhật ký và hướng dẫn làm việc cho ĐATN

Tệp này ghi lại những gì Claude đã làm, đang làm và sẽ làm trong repo, để mỗi phiên làm việc mới
(của sinh viên hoặc của Claude) nắm được trạng thái hiện tại. Cập nhật lần cuối: 17/11/2026.

## 1. Đề tài

- Đồ án tốt nghiệp "Xây dựng hệ thống quản lý tín chỉ các-bon trên blockchain", kỳ 2026.1,
  GVHD PGS.TS Lê Chí Ngọc, hạn nộp 18/1/2027.
- Phạm vi theo phiếu giao nhiệm vụ: smart contract (ERC-721 phát hành lô, ERC-20 pool, hủy/retire),
  CSDL off-chain theo CAD Trust V2.0, backend API, frontend Next.js.
  Ý tưởng dMRV bằng ảnh vệ tinh không nằm trong phiếu. Không sửa tệp phiếu giao nhiệm vụ (.xlsx).
- Mã nguồn: `contracts/` (Hardhat, Solidity), `backend/` (Node.js, Express, PostgreSQL),
  `frontend/` (Next.js 14).

## 2. Quy tắc bắt buộc khi viết báo cáo

- GVHD yêu cầu báo cáo do sinh viên tự viết. Claude chỉ viết nháp khi được yêu cầu, đánh dấu
  `[BẢN NHÁP]`; sinh viên đọc lại và viết lại theo văn phong của mình.
- Phần chưa làm hoặc chưa kiểm chứng để trong chú thích với dòng `% [VIẾT SAU] <lý do>`.
  Chỗ báo cáo mô tả khác mã nguồn đánh dấu `% [CẦN SỬA MÃ]`.
- Viết "các-bon" trong văn bản tiếng Việt (giữ nguyên tên riêng tiếng Anh, tiêu đề tài liệu tham khảo).
- Không in đậm giữa dòng; mục con dùng `\subsection*`; `tocdepth` = 1; chú thích hình, bảng không có
  dấu chấm cuối; mọi hình và bảng phải được nhắc trong văn bản; hình tự vẽ ghi
  `\hinhtao[Claude]{ngày}` (sửa lại thì thêm `Updated: ngày`).
- Tránh dấu hiệu văn AI theo nhận xét của GVHD: không viết câu ngắn rời rạc, dùng câu chủ động có chủ
  ngữ thật, không tự đặt từ thuần Việt cho thuật ngữ CNTT, không xưng "em/tôi"; "tác giả" chỉ dùng
  trong Kết chương.
- Tài liệu tham khảo: ghi đủ tên tác giả (kể cả khi lặp lại) và địa chỉ truy cập.
- Viết tệp LaTeX bằng công cụ Write/Edit, không dùng heredoc của bash (heredoc làm mất dấu `\`).

## 3. Cấu trúc báo cáo hiện tại (từ 17/11/2026)

| Chương | Tệp | Hình vẽ | Trạng thái |
|---|---|---|---|
| 1. Giới thiệu và khảo sát bài toán | `Chap1.tex` | `figures_chap1.tex` | Đã có đủ nội dung (bản nháp 4/11 và 7/11/2026), đang `\input` |
| 2. Phân tích hệ thống (`chap:phantich`) | `Chap2.tex` | `figures_chap2.tex` | Bản nháp 17/11/2026, đang `\input` |
| 3. Thiết kế hệ thống (`chap:thietke`) | `Chap3.tex` | `figures_chap3.tex` | Bản nháp 17/11/2026, đang `\input` |
| 4. Công nghệ, xây dựng và kiểm thử (`chap:congnghe`, `chap:xaydung`) | `Chap4.tex` | `figures_chap4.tex`, `figures_chap5.tex` | Chỉ có khung, `% \input` |
| 5. Giải pháp và đóng góp (`chap:giaiphap`) | `Chap5.tex` | — | Chỉ có khung, `% \input` |
| 6. Kết luận và hướng phát triển (`chap:ketluan`) | `Chap6.tex` | — | Chỉ có khung, `% \input` |

Mỗi tệp `figures_chapN.tex` chỉ được `\input` đúng một lần (trong chương tương ứng) để không định nghĩa
trùng macro. Nội dung từng chương:

- Chương 2: tổng quan chức năng (bảng tác nhân `tab:tacnhan`, use case tổng quát `fig:usecase` +
  `tab:usecase` UC01–UC11, hai use case phân rã `fig:uc-phathanh`, `fig:uc-giaodich`, biểu đồ hoạt
  động `fig:quytrinh`), đặc tả UC06, UC01, UC02, UC09, UC11 (`tab:dt-uc*`), yêu cầu phi chức năng
  (chuyển nguyên văn từ Chương 1).
- Chương 3: thiết kế kiến trúc (4 lớp `fig:kientruc`, biểu đồ gói `fig:goi`, thiết kế chi tiết gói),
  thiết kế chi tiết (danh sách màn hình `tab:manhinh`, biểu đồ lớp hợp đồng `fig:lophopdong`, trạng
  thái lô `fig:trangthai`, tuần tự `fig:tuantu-mint`, `fig:tuantu-retire`, bảng API `tab:api`, phân
  tách on/off-chain `fig:onoffchain` + `tab:onoffchain`, ERD `fig:erd`).
- Chương 4: phần A là khung "Công nghệ sử dụng" cũ, phần B là các mục Xây dựng ứng dụng, Kiểm thử,
  Triển khai của Chương 3 cũ.

## 4. Biên dịch

- MiKTeX, `latexmk -pdf main.tex`. Nên biên dịch trong một bản sao (thư mục tạm) rồi chép `main.pdf`
  về thư mục gốc repo.
- Bản dựng 17/11/2026: 63 trang, 0 lỗi, không còn tham chiếu/trích dẫn chưa định nghĩa. Chương 2 ở
  trang 25–36, Chương 3 ở trang 37–51 (số trang Ả Rập).
- `pdftotext` không đọc được phông tiếng Việt của bản PDF; muốn kiểm tra hình thì kết xuất ảnh bằng
  `pdftoppm -r 85 -png`.

## 5. Nhật ký thay đổi

- 20/10–21/10/2026: xây dựng mã nguồn (contracts, backend, frontend), bản trình bày tiến độ.
- 4/11/2026: viết nháp Chương 1 và phần khảo sát (sau đó gộp vào `Chap1.tex`); áp dụng hai lượt góp ý
  phản biện; khảo sát quan sát dùng ảnh chụp màn hình của sinh viên (`image/`).
- 7/11/2026: tái cấu trúc theo mẫu SoICT (`Do_An_Latex_SoiCT/`). Bản trước: `backup/2026-11-07_truoc-mau-soict/`.
  Quyết định của sinh viên: cơ quan quản lý phát hành (mint, ISSUER_ROLE), VVB chỉ thẩm định, phê duyệt.
- 9–10/11/2026: slide bảo vệ 16 trang và tài liệu giải thích từng slide (artifact trên claude.ai).
- 17/11/2026: đổi Chương 2 thành "Phân tích hệ thống" và Chương 3 thành "Thiết kế hệ thống".
  Bản trước: `backup/2026-11-17_truoc-phantich-thietke/` (Chap1–5, main, figures_chap1–5,
  hust-datn.sty, References.bib). Chi tiết:
  - Chuyển phần tổng quan chức năng, đặc tả (đang để chú thích) và yêu cầu phi chức năng từ Chương 1
    sang Chương 2; Chương 1 kết thúc bằng câu dẫn sang Chương 2.
  - Vẽ mới: use case tổng quát có mã UC01–UC11 và tác nhân Người xem công khai, hai biểu đồ use case
    phân rã, biểu đồ hoạt động có chia làn, biểu đồ gói. Sửa hình on/off-chain theo mã thật (kho tệp
    là thư mục của backend, tên sự kiện CreditMinted/Transfer/CreditRetired).
  - Viết nháp đặc tả 5 use case, mục thiết kế gói, giao diện, API, CSDL dựa trên mã nguồn thật (tên
    lỗi revert, route, bảng CSDL).
  - Chương Công nghệ cũ và các mục Xây dựng/Kiểm thử/Triển khai gom vào `Chap4.tex` mới; Giải pháp
    thành `Chap5.tex`, Kết luận thành `Chap6.tex`.
  - `main.tex`: bật `\input{Chap2}`, `\input{Chap3}`; thêm viết tắt ERD, JWT, PCC, RPC, UML, CSDL,
    IPFS; thêm thuật ngữ Redeem, Reorg, Revert.
  - Kiểm tra bằng ảnh kết xuất và sửa chồng lấn ở hình 2.1, 2.2, 2.4 và 3.2.

## 6. Việc còn mở

### Trong báo cáo (`[VIẾT SAU]`)
- Sinh viên đọc và viết lại các phần `[BẢN NHÁP]` của Chương 2, 3.
- Chương 3: mockup cho 2–3 chức năng quan trọng (thẩm định và phát hành, ví tín chỉ, tra cứu) theo mẫu
  SoICT; ảnh chụp màn hình thật.
- Khi `\input` Chương 4, 5: đổi các chỗ viết chữ thành `\ref` (Chap1.tex dòng ~84, ~89; Chap3.tex
  "Chương Giải pháp và đóng góp", "Chương tiếp theo"); bật lại CBAM, dApp, DeFi, PoS, PoW trong
  danh mục viết tắt.
- Viết nội dung Chương 4 (công nghệ ≤ 10 trang: yêu cầu phục vụ, phương án thay thế, lý do chọn;
  kết quả cài đặt, kiểm thử, triển khai), Chương 5, Chương 6, lời cảm ơn, tóm tắt, phụ lục; chèn
  bản scan nhận xét GVHD và phiếu báo cáo tiến độ.
- Phỏng vấn chuyên gia cho phần khảo sát (sinh viên tự làm).

### Lệch giữa thiết kế và mã nguồn (`[CẦN SỬA MÃ]`)
- Thiết kế: cơ quan quản lý phát hành với ISSUER_ROLE, trường `issuer`, nút phát hành ở trang quản trị.
- Mã hiện tại: `mintBatch` dưới `VERIFIER_ROLE`, trường `CreditBatch.verifier`, nút mint ở `/verifier`,
  trang `/admin` cấp `VERIFIER_ROLE`; bảng kiểm thử trong `figures_chap5.tex` (TC-01/02, API-07,
  E2E-02) mô tả luồng cũ.
- Khi sửa mã: thêm ISSUER_ROLE vào contract, cập nhật test Hardhat, backend, frontend, bảng kiểm thử,
  rồi cập nhật slide bảo vệ 9, 12, 13, 15.

### Kế hoạch tiếp theo (đề xuất)
1. Sinh viên duyệt Chương 2, 3 (nội dung và hình).
2. Sửa mã theo ISSUER_ROLE và chạy lại toàn bộ kiểm thử.
3. Triển khai hợp đồng lên Sepolia, ghi địa chỉ và giao dịch mẫu vào Chương 4.
4. Viết nháp Chương 4, rồi Chương 5, 6 khi sinh viên yêu cầu.
