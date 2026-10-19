# Lộ trình hoàn thành ĐATN trong 2 tháng

**Đề tài:** Xây dựng hệ thống quản lý tín chỉ carbon trên blockchain
**Sinh viên:** Nguyễn Cảnh Duy (20227174) · **GVHD:** PGS.TS Lê Chí Ngọc · **Học kỳ:** 2026.1

**Thời gian:** 20/10/2026 → 21/12/2026 (9 tuần). Hạn chính thức là 18/1/2027, phần còn lại là thời gian dự phòng.

---

## 1. Hiện trạng và việc cần chốt trước

- **Hiện trạng:** Chương 1 đã có khoảng 10 trang. Chương 2–4 còn trống và chưa có mã nguồn. Phải làm song song phần mềm và báo cáo.
- **Phạm vi Computer Vision (Sentinel-1):** file tóm tắt có hướng Computer Vision phân tích ảnh Sentinel-1 (dMRV), nhưng **phiếu giao nhiệm vụ không có hướng này**. Làm thêm thì 2 tháng không đủ. Đề xuất: bám đúng phiếu và đưa CV vào mục "Hướng phát triển". Cần hỏi GVHD ngay tuần 1.
- **Cấu trúc báo cáo:** mục 1.2–1.5 của Chương 1 hiện là lý thuyết (MRV, CAD Trust, tokenization), nên chuyển sang Chương 2. Chương 1 chỉ giữ đặt vấn đề, mục tiêu, phạm vi và đóng góp.
- **Lớp IoT trong kiến trúc 4 lớp:** phiếu không yêu cầu, chỉ cần mô phỏng dữ liệu đầu vào hoặc ghi là ngoài phạm vi.

### Công nghệ đề xuất

| Thành phần | Công nghệ |
|---|---|
| Smart contract | Solidity, Hardhat, OpenZeppelin |
| Mạng blockchain | Testnet Sepolia (hoặc Polygon Amoy) |
| Backend | Node.js/Express, PostgreSQL |
| Frontend | Next.js, ethers.js/wagmi, MetaMask |
| Quản lý mã nguồn | Git/GitHub |

Chọn Ethereum vì phiếu yêu cầu ERC-721 và ERC-20. Hyperledger chỉ cần trình bày so sánh ở Chương 2.

---

## 2. Lộ trình theo tuần

| Tuần | Thời gian | Phần mềm | Báo cáo (tự viết) |
|:-:|---|---|---|
| **1** | 20–26/10 | Chốt phạm vi với GVHD. Xác định các tác nhân: cơ quan quản lý/VVB, chủ dự án, doanh nghiệp mua, admin. Lập danh sách use case. Khởi tạo repo (monorepo: `contracts/`, `backend/`, `frontend/`) | Sắp xếp lại Chương 1. Lập dàn ý chi tiết Chương 2 |
| **2** | 27/10–2/11 | Thiết kế: kiến trúc on-chain/off-chain, ERD theo CAD Trust V2.0 (Organizations, Projects, Units/CreditBlocks, Issuances, Retirements, Transactions), sơ đồ trạng thái vòng đời tín chỉ, sơ đồ tuần tự Mint/Trade/Retire, interface các contract | **Chương 2:** blockchain, EVM, smart contract, chuẩn ERC-721/ERC-20, CAD Trust, 3 dạng tính toán kép, so sánh Ethereum và Hyperledger |
| **3** | 3–9/11 | **Smart contract:** NFT ERC-721 phát hành tín chỉ (chỉ vai trò VERIFIER được mint, chặn trùng serial/projectId+vintage), Pool ERC-20 (gửi NFT → nhận token, đổi ngược lại), Retirement (burn và ghi chứng nhận người thụ hưởng). Viết unit test | Hoàn thiện Chương 2 |
| **4** | 10–16/11 | Đạt test coverage ≥ 80%, quét Slither, đo gas, deploy và verify trên Sepolia. Test các kịch bản tấn công: mint trùng, retire 2 lần, chuyển token đã retire. 🔴 **Mốc 1:** báo cáo GVHD bằng contract chạy trên testnet | **Chương 3 (phần phân tích – thiết kế):** use case, ERD, các sơ đồ tuần tự |
| **5** | 17–23/11 | **Backend:** REST API, đăng nhập bằng ví (SIWE), CRUD dự án, quy trình yêu cầu phát hành (nộp → VVB duyệt → mint), service lắng nghe event on-chain để đồng bộ vào DB, API dashboard hạn ngạch | Viết mục thiết kế CSDL và API (bảng endpoint) |
| **6** | 24–30/11 | **Frontend:** kết nối MetaMask, trang dự án, trang ví, màn hình duyệt/mint cho VVB, gửi/rút pool, retire và xem chứng nhận, dashboard | Ghi chú và chụp màn hình ngay khi làm xong từng màn |
| **7** | 1–7/12 | Ghép nối end-to-end, lập bảng test case chức năng, sửa lỗi. Deploy (Vercel + Render/Railway + Sepolia). 🔴 **Mốc 2:** demo cho GVHD | **Chương 3 (phần cài đặt):** cấu trúc mã, các thuật toán và hàm chính |
| **8** | 8–14/12 | Đóng băng tính năng, chỉ sửa lỗi | **Chương 4:** kết quả kiểm thử, bảng chi phí gas, các kịch bản chống tính toán kép, ảnh giao diện. Kết luận, hạn chế và hướng phát triển. Phụ lục B (hướng dẫn sử dụng) |
| **9** | 15–21/12 | Dọn code, viết README, gắn link contract trên Etherscan | Hoàn chỉnh bản nháp: tóm tắt, danh mục hình/bảng, chuẩn hóa trích dẫn. **Gửi GVHD** |
| Dự phòng | 22/12–18/1 | Sửa theo góp ý | Chỉnh báo cáo, làm slide, tập bảo vệ, in và nộp quyển |

---

## 3. Mốc cắt phạm vi nếu bị trễ

- **Hết tuần 4** mà contract chưa lên testnet: bỏ Pool ERC-20, giữ Mint, Transfer và Retire (phần lõi chống tính toán kép).
- **Hết tuần 6** mà frontend chưa xong: bỏ dashboard, giữ 3 luồng Phát hành, Giao dịch và Thu hồi.
- **Hết tuần 7** mà chưa tích hợp xong: demo bằng contract, script và API. Phần còn lại ghi vào hướng phát triển.

---

## 4. Nguyên tắc viết báo cáo

- **Viết ngay sau khi code xong từng phần**, khoảng 8–12 trang mỗi tuần. Không dồn vào cuối.
- Mỗi chương cần có đoạn mở đầu và đoạn kết luận. Hình và bảng phải được đánh số và có tiêu đề.
- Mỗi yêu cầu ở Chương 3 nên truy vết được tới một test case ở Chương 4.
- Đóng quyển theo đúng thứ tự trong mẫu ĐATN của khoa (`QD DA TT/Mẫu ĐATN_2019_version 1_1.docx`).

---

## 5. Checklist theo dõi

- [ ] Tuần 1: Chốt phạm vi với GVHD, có danh sách use case
- [ ] Tuần 2: Có ERD và sơ đồ kiến trúc
- [ ] Tuần 3: Contract Mint/Pool/Retire có unit test
- [ ] Tuần 4: Contract trên Sepolia, coverage ≥ 80% (🔴 Mốc 1)
- [ ] Tuần 5: Backend API và đồng bộ event chạy được
- [ ] Tuần 6: Frontend đủ các màn chính
- [ ] Tuần 7: Demo end-to-end (🔴 Mốc 2)
- [ ] Tuần 8: Xong Chương 4 và kết luận
- [ ] Tuần 9: Gửi bản nháp đầy đủ cho GVHD
- [ ] 18/1/2027: Nộp quyển
