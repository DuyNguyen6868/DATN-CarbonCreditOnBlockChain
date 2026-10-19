# Giải thích thuật ngữ

Tài liệu tra cứu cá nhân cho đồ án *Xây dựng hệ thống quản lý tín chỉ carbon trên blockchain*. Mỗi thuật ngữ có: tên đầy đủ, nghĩa dễ hiểu, **cách khuyên dùng trong báo cáo** và **căn cứ** (văn bản hoặc bài báo tiếng Việt đã dùng bản dịch đó).

## Cách đọc cột "Khuyên dùng"

| Ký hiệu | Ý nghĩa |
|---|---|
| **TV** | Dùng **tiếng Việt**. Đã có văn bản pháp luật hoặc bài báo tiếng Việt dùng bản dịch này. Lần đầu xuất hiện thì ghi kèm tiếng Anh trong ngoặc, ví dụ "hợp đồng thông minh (smart contract)". |
| **TA** | Giữ **tiếng Anh**. Lý do có thể là: chưa tìm thấy bản dịch trong tài liệu tiếng Việt; các tài liệu dịch mâu thuẫn nhau; hoặc đó là tên riêng, tên chuẩn, viết tắt quốc tế. Lần đầu có thể giải thích nghĩa bằng tiếng Việt. |

Nguyên tắc chung: lần đầu viết đầy đủ, **các lần sau chỉ dùng một cách gọi duy nhất**.

## Nguồn đối chiếu

| Mã | Nguồn | Loại |
|---|---|---|
| **[L1]** | [Nghị định 06/2022/NĐ-CP](https://vnce.vn/Uploads/files/Van-ban-hop-nhat-40-VBHN-BNNMT-2026.pdf) về giảm nhẹ phát thải khí nhà kính, bản hợp nhất 40/VBHN-BNNMT (2026), gồm cả sửa đổi theo Nghị định 119/2025 | Văn bản pháp luật |
| **[L2]** | [Thông tư 11/2026/TT-BNNMT](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/02/11-bnnmt.pdf) quy định quản lý, vận hành Hệ thống đăng ký quốc gia về hạn ngạch phát thải khí nhà kính và tín chỉ các-bon | Văn bản pháp luật |
| **[L3]** | [TCVN ISO 14064-3:2011](https://www.atld.vn/law/1551/content) (tương đương ISO 14064-3:2006) | Tiêu chuẩn quốc gia |
| **[P1]** | Nguyễn Đức Tuấn, Nguyễn Đình Thi (2022), [*Hợp đồng thông minh trong công nghệ chuỗi khối và ứng dụng trong đào tạo*](https://jshou.edu.vn/houjs/article/download/77/60/560), Tạp chí Khoa học Đại học Mở Hà Nội | Bài báo khoa học |
| **[P2]** | Phan Huy Hoàng, Đỗ Thị Hiệp (2024), [*Giao dịch chứng chỉ năng lượng tái tạo và tín chỉ carbon bằng blockchain: phát triển thị trường tự nguyện tại Việt Nam*](https://tapchicongthuong.vn/giao-dich-chung-chi-nang-luong-tai-tao-va-tin-chi-carbon-bang-blockchain--phat-trien-thi-truong-tu-nguyen-tai-viet-nam-132720.htm), Tạp chí Công Thương số 25 | Bài báo khoa học |
| **[P3]** | [*Cơ chế ITMO trong Thỏa thuận Paris: cơ hội và thách thức triển khai tại Việt Nam*](https://vjol.info.vn/TCKHBDKH/article/view/136167), Tạp chí Khoa học Biến đổi khí hậu (chỉ đọc được trích đoạn, chưa đọc toàn văn) | Bài báo khoa học |
| **[P4]** | [CIFOR-ICRAF Working Paper 44](https://cifor-icraf.org/publications/pdf_files/WPapers/CIFOR-ICRAF-WP-44.pdf) (2025), bản tiếng Việt | Báo cáo nghiên cứu |
| **[D1]** | [ethereum.org bản tiếng Việt](https://ethereum.org/vi/developers/docs/intro-to-ethereum/) | Tài liệu kỹ thuật (bản dịch cộng đồng, không phải bài báo) |
| **[G1]** | Giáo trình UML / phân tích thiết kế hướng đối tượng tiếng Việt ([thư viện số ĐH Hải Dương](https://thuvienso.hdu.edu.vn/tag/nhap-mon-uml.html), [thư viện số DHV](https://thuvienso.dhv.edu.vn/tag/phan-tich-thiet-ke-he-thong-huong-doi-tuong-voi-uml.html)) | Giáo trình |
| **[G2]** | Tài liệu kiểm thử phần mềm tiếng Việt ([Guru99 tiếng Việt](https://www.guru99.com/vi/code-coverage.html), Viblo) | Tài liệu phổ thông, độ tin cậy thấp hơn giáo trình |
| **—** | Không tìm thấy bản dịch trong nguồn đã kiểm tra, hoặc là tên riêng / viết tắt quốc tế | |

> **Quy ước:** báo cáo thống nhất viết **carbon** (như bài báo [P2]). Văn bản pháp luật [L1][L2] viết *các-bon*, nên chỉ giữ nguyên cách viết đó khi trích dẫn đúng tên văn bản.

**Mục lục**
1. [Thị trường carbon và pháp lý](#1-thị-trường-carbon-và-pháp-lý)
2. [Đo lường, tiêu chuẩn và hệ thống đăng ký](#2-đo-lường-tiêu-chuẩn-và-hệ-thống-đăng-ký)
3. [Blockchain cơ bản](#3-blockchain-cơ-bản)
4. [Smart contract và token](#4-smart-contract-và-token)
5. [Phát triển ứng dụng Web3](#5-phát-triển-ứng-dụng-web3)
6. [Kiểm thử và bảo mật](#6-kiểm-thử-và-bảo-mật)
7. [Phân tích – thiết kế phần mềm](#7-phân-tích--thiết-kế-phần-mềm)
8. [Những chỗ đã sửa so với bản trước](#8-những-chỗ-đã-sửa-so-với-bản-trước)
9. [Các cặp từ dễ nhầm](#9-các-cặp-từ-dễ-nhầm)
10. [Ghép lại: vòng đời một tín chỉ trong hệ thống](#10-ghép-lại-vòng-đời-một-tín-chỉ-trong-hệ-thống)

---

## 1. Thị trường carbon và pháp lý

| Thuật ngữ | Tên đầy đủ | Giải thích | Khuyên dùng | Căn cứ |
|---|---|---|---|---|
| **Khí nhà kính** | Greenhouse Gas (GHG) | CO₂, CH₄ (mê-tan), N₂O… Các khí giữ nhiệt làm Trái Đất nóng lên. | **TV:** khí nhà kính | [L1] |
| **tCO₂e** | tấn CO₂ tương đương | Đơn vị quy đổi mọi khí nhà kính về CO₂ theo hệ số làm nóng lên toàn cầu. Ví dụ 1 tấn CH₄ tương đương khoảng 28 tấn CO₂. **1 tín chỉ = 1 tCO₂e.** | **TV:** tấn CO₂ tương đương (tCO₂e) | [L1] |
| **Tín chỉ carbon** | Carbon credit | "Giấy chứng nhận" rằng một chương trình, dự án đã giảm hoặc hấp thụ được 1 tCO₂e. Có thể giao dịch và dùng để bù trừ phát thải. | **TV:** tín chỉ carbon | [L1][L2] |
| **Hạn ngạch phát thải khí nhà kính** | Emission allowance | Lượng khí thải tối đa Nhà nước cho phép một cơ sở xả. Khác tín chỉ ở chỗ hạn ngạch do Nhà nước **phân bổ**, còn tín chỉ được **tạo ra** từ dự án giảm phát thải. | **TV:** hạn ngạch phát thải khí nhà kính | [L1][L2] |
| **Cap-and-trade** | Cơ chế hạn ngạch – giao dịch | Nhà nước đặt trần tổng phát thải và phân bổ hạn ngạch. Cơ sở xả ít hơn được bán phần dư, cơ sở xả nhiều hơn phải mua thêm. | **TA:** cap-and-trade. Văn bản pháp luật mô tả cơ chế này bằng cụm "phân bổ hạn ngạch" nhưng không có tên gọi riêng. | — |
| **Thị trường tuân thủ** | Compliance market | Thị trường **bắt buộc** theo luật. | **TA:** compliance market. Chưa tìm thấy văn bản dùng thống nhất một từ tiếng Việt. | — |
| **Thị trường carbon tự nguyện** | Voluntary carbon market (VCM) | Doanh nghiệp **tự nguyện** mua tín chỉ (thường do Verra, Gold Standard cấp). | **TV:** thị trường (carbon) tự nguyện | [P2] |
| **Sàn giao dịch carbon** | Carbon exchange | Nơi mua bán hạn ngạch và tín chỉ. Việt Nam có Nghị định 29/2026/NĐ-CP về sàn giao dịch carbon trong nước. | **TV:** sàn giao dịch carbon | [L1][L2] |
| **Bù trừ** | Offset | Dùng tín chỉ để "trừ" vào lượng phát thải của mình. | **TV:** bù trừ | [L1][L2] |
| **Net Zero** | Phát thải ròng bằng 0 | Lượng phát thải bằng lượng được giảm hoặc bù trừ. | **TA:** Net Zero (không có trong các nguồn đã kiểm tra) | — |
| **Double counting** | Tính toán kép / tính hai lần / tính kép | Một lượng giảm phát thải bị tính **nhiều hơn một lần**. Đây là **vấn đề cốt lõi** đồ án phải giải quyết. | **TA:** double counting. Các nguồn dịch **mâu thuẫn**: [L1] viết "tính hai lần" và "tránh trùng lặp", [P3] viết "tính kép", phiếu giao nhiệm vụ viết "tính toán kép". Lần đầu nên viết "tính toán kép (double counting)" cho khớp phiếu, các lần sau dùng *double counting*. | [L1][P3] |
| ↳ **Double issuance** | Phát hành kép | Một lượng giảm phát thải được cấp tín chỉ hai lần, ví dụ đăng ký ở cả hai tổ chức. | **TA** | — |
| ↳ **Double selling / double use** | Bán kép / sử dụng kép | Một tín chỉ được bán hoặc dùng để bù trừ hai lần. | **TA** | — |
| ↳ **Double claiming** | Tuyên bố kép | Hai bên cùng nhận một lượng giảm phát thải là của mình, ví dụ doanh nghiệp mua và quốc gia chủ nhà. | **TA** | — |
| **Thỏa thuận Paris** | Paris Agreement (2015) | Hiệp định khí hậu toàn cầu. **Điều 6** quy định cách các nước hợp tác trao đổi kết quả giảm phát thải. | **TV:** Thỏa thuận Paris | [L1] |
| **NDC** | Nationally Determined Contribution | Cam kết giảm phát thải của từng quốc gia. | **TV:** Đóng góp do quốc gia tự quyết định (NDC) | [L1] |
| **Cơ chế Điều 6.2** | Article 6.2 | Cơ chế **song phương**: các quốc gia trao đổi trực tiếp tín chỉ, kết quả giảm nhẹ với nhau. | **TV:** Cơ chế Điều 6.2 Thỏa thuận Paris | [L1] |
| **Cơ chế Điều 6.4** | Article 6.4 / PACM | Cơ chế **tập trung** do Liên Hợp Quốc giám sát, thay thế CDM. | **TV:** Cơ chế Điều 6.4 Thỏa thuận Paris. Viết tắt PACM giữ tiếng Anh. | [L1] |
| **Kết quả giảm nhẹ phát thải khí nhà kính** | Mitigation outcome | Lượng phát thải đã giảm hoặc hấp thụ được, có thể trao đổi quốc tế. | **TV:** kết quả giảm nhẹ phát thải khí nhà kính | [L1] |
| **ITMO** | Internationally Transferred Mitigation Outcome | Kết quả giảm nhẹ được chuyển giao quốc tế theo Điều 6.2. | **TA:** ITMO. [L1] không dùng chữ ITMO mà dùng cụm "chuyển giao quốc tế … kết quả giảm nhẹ phát thải khí nhà kính". | [L1][P3] |
| **Điều chỉnh tương ứng** | Corresponding Adjustment (CA) | Khi nước A bán ITMO cho nước B, nước A phải **cộng ngược** lượng đó vào sổ phát thải của mình, để hai nước không cùng tính một lượng giảm (chống double claiming). | **TV:** điều chỉnh tương ứng (CA) | [P3] |
| **A6.4ER** | Article 6.4 Emission Reduction | Đơn vị tín chỉ của Cơ chế Điều 6.4. | **TA** | — |
| **CDM** | Clean Development Mechanism | Cơ chế cũ theo Nghị định thư Kyoto, nay được Điều 6.4 thay thế. | **TV:** Cơ chế phát triển sạch (CDM) | [L1] |
| **Letter of Authorization (LoA)** | Văn bản chấp thuận | Văn bản chính phủ nước chủ nhà cho phép tín chỉ được chuyển ra quốc tế. | **TA:** LoA. [L1] mô tả bằng cụm "chấp thuận chuyển giao quốc tế". Không dùng "thư ủy quyền" (không có trong văn bản). | [L1] |
| **Nghị định 06/2022/NĐ-CP** | — | Văn bản pháp lý chính của Việt Nam về giảm nhẹ phát thải khí nhà kính và thị trường carbon. Đã sửa đổi bởi Nghị định 119/2025 và 83/2026. | Ghi đúng số hiệu. **Nên trích bản hợp nhất mới nhất.** | [L1] |
| **CBAM** | Carbon Border Adjustment Mechanism | "Thuế carbon" của EU đánh vào hàng nhập khẩu (thép, xi măng, phân bón…). | **TA:** CBAM | — |

---

## 2. Đo lường, tiêu chuẩn và hệ thống đăng ký

| Thuật ngữ | Tên đầy đủ | Giải thích | Khuyên dùng | Căn cứ |
|---|---|---|---|---|
| **VVB** | Validation and Verification Body | **Bên thứ ba độc lập** kiểm tra dự án có thật sự giảm phát thải như đã khai không. Giống "kiểm toán viên" của ngành carbon. **Trong đồ án**, VVB là tác nhân duyệt hồ sơ và kích hoạt việc mint tín chỉ. | **TA:** VVB. [L1] gọi là "đơn vị thẩm định", [P4] gọi là "bên thẩm định độc lập". | [L1][P4] |
| **Validation** | Thẩm định | Kiểm tra **trước** khi dự án chạy: thiết kế và phương pháp tính có hợp lệ không. | **TA:** validation. [L3] dùng "thẩm định", nhưng [L1] cũng dùng "thẩm định" cho cả bước kiểm tra kết quả. Giữ tiếng Anh để không nhầm với verification. | [L1][L3] |
| **Verification** | Thẩm tra / kiểm định / thẩm định | Kiểm tra **sau** khi dự án chạy: lượng giảm thực tế có đúng không. Có bước này mới được cấp tín chỉ. | **TA:** verification. Các nguồn dịch **mâu thuẫn**: [L3] viết "kiểm định", [L1] viết "thẩm định", tài liệu khác viết "thẩm tra". | [L1][L3] |
| **MRV** | Measurement, Reporting, Verification | Quy trình 3 bước để chứng minh một lượng giảm phát thải là có thật. | **TV:** đo đạc, báo cáo, thẩm định (MRV). Viết đúng như [L1], **không** viết "đo lường, báo cáo, thẩm tra". | [L1] |
| **dMRV** | Digital MRV | MRV dùng công nghệ số (IoT, ảnh vệ tinh, blockchain). | **TA:** dMRV | — |
| **PDD** | Project Design Document | Hồ sơ mô tả dự án: địa điểm, công nghệ, cách tính lượng giảm. **Trong đồ án**, file PDD được lưu off-chain. | **TV:** tài liệu thiết kế dự án (PDD) | [L1] |
| **Phương pháp luận** | Methodology | Bộ công thức tính lượng giảm phát thải cho từng loại dự án. | **TV:** phương pháp luận | [L1] |
| **Kiểm kê khí nhà kính** | GHG inventory | Việc thống kê, tính toán lượng khí nhà kính một cơ sở phát thải trong năm. | **TV:** kiểm kê khí nhà kính | [L1] |
| **Hệ số phát thải** | Emission factor | Lượng khí thải trên một đơn vị hoạt động (ví dụ kg CO₂ / kWh điện). | **TV:** hệ số phát thải | [L1] |
| **Baseline** | Đường phát thải cơ sở | Lượng phát thải **nếu không có dự án**. Lượng giảm = baseline − phát thải thực tế. | **TV:** đường phát thải cơ sở. Không viết "đường cơ sở" (không có trong [L1]). Ở cấp quốc gia, [L1] còn dùng "kịch bản phát triển thông thường" (BAU). | [L1] |
| **Additionality** | Tính bổ sung | Dự án chỉ được cấp tín chỉ nếu **không có tiền tín chỉ thì dự án đã không xảy ra**. | **TA:** additionality. Chưa tìm thấy trong văn bản pháp luật hay bài báo đã kiểm tra. | — |
| **Permanence** | Tính lâu dài | Lượng carbon đã loại bỏ phải được giữ lâu dài (rừng trồng không bị chặt, cháy). | **TA:** permanence | — |
| **Leakage** | Rò rỉ phát thải | Dự án ở chỗ này làm phát thải tăng ở chỗ khác. | **TA:** leakage. Trong [L1] "rò rỉ" chỉ dùng cho rò rỉ khí từ thiết bị, khác nghĩa. | — |
| **Vintage** | Năm giảm phát thải | **Năm** xảy ra việc giảm phát thải. | **TA:** vintage | — |
| **Số sê-ri** | Serial number | Chuỗi ký tự định danh **duy nhất** cho từng đơn vị tín chỉ hoặc hạn ngạch, giúp truy vết và chống trùng. | **TV:** số sê-ri | [L2] |
| **Mã trong nước** | Domestic code | Chuỗi ký tự định danh hạn ngạch hoặc tín chỉ trên lãnh thổ Việt Nam. | **TV:** mã trong nước | [L2] |
| **Credit block** | Khối tín chỉ | Một dải số sê-ri liên tục, ví dụ 1001–2000. Khi bán một phần, khối được **tách** thành hai khối mới. | **TA:** credit block. Tránh dịch "khối" vì dễ nhầm với *khối* (block) của blockchain. | — |
| **Hệ thống đăng ký** | Registry | Hệ thống ghi nhận tín chỉ: ai đang sở hữu, đã hủy chưa. | **TV:** hệ thống đăng ký. Hệ thống của Việt Nam gọi là "Hệ thống đăng ký quốc gia". | [L1][L2] |
| **Nộp trả** | Surrender | Cơ sở nộp lại hạn ngạch (hoặc tín chỉ) tương ứng với lượng đã phát thải để hoàn thành nghĩa vụ. | **TV:** nộp trả | [L1][L2] |
| **ISO 14064** | — | Bộ tiêu chuẩn về khí nhà kính. Phần 1: kiểm kê cấp tổ chức. Phần 2: cấp dự án. Phần 3: validation và verification. | **TV:** ghi theo số hiệu TCVN ISO 14064 | [L3] |
| **Verra (VCS), VCU** | Verified Carbon Standard / Verified Carbon Unit | Tổ chức cấp tín chỉ tự nguyện lớn nhất thế giới và đơn vị tín chỉ của tổ chức này. | **TA** (tên riêng) | — |
| **Gold Standard** | — | Tổ chức cấp tín chỉ tự nguyện lớn thứ hai, chú trọng cả lợi ích xã hội. | **TA** (tên riêng) | — |
| **CAD Trust** | Climate Action Data Trust | Nền tảng dữ liệu **liên thông** giữa các hệ thống đăng ký để phát hiện tín chỉ bị đăng ký trùng. **Trong đồ án**, CSDL off-chain thiết kế theo mô hình dữ liệu CAD Trust V2.0. | **TA** (tên riêng) | — |
| **AEF** | Agreed Electronic Format | Định dạng báo cáo điện tử chuẩn của UNFCCC theo Điều 6.2. | **TA** | — |
| **UNFCCC** | United Nations Framework Convention on Climate Change | Tổ chức quản lý các thỏa thuận khí hậu quốc tế. | **TV:** Công ước khung của Liên hợp quốc về biến đổi khí hậu (UNFCCC) | [L1] |

---

## 3. Blockchain cơ bản

| Thuật ngữ | Tên đầy đủ | Giải thích | Khuyên dùng | Căn cứ |
|---|---|---|---|---|
| **Blockchain** | Chuỗi khối | Một cuốn sổ cái được **nhiều máy tính cùng giữ bản sao**. Dữ liệu ghi theo từng khối, mỗi khối chứa mã băm của khối trước nên **không sửa lén được**. | **TA:** blockchain, cho khớp tên đề tài. Lần đầu ghi "công nghệ chuỗi khối (blockchain)" như [P1][P2]. | [P1][P2][D1] |
| **Khối** | Block | Một "trang" của sổ cái, chứa nhiều giao dịch. | **TV:** khối | [P1][D1] |
| **Sổ cái phân tán** | Distributed ledger | Sổ ghi toàn bộ giao dịch, được nhiều nút cùng lưu giữ. | **TV:** sổ cái phân tán | [P2] |
| **Hàm băm / mã băm** | Hash function / hash | Hàm biến dữ liệu bất kỳ thành chuỗi có độ dài cố định, như "vân tay" của dữ liệu. Sửa 1 ký tự thì mã băm đổi hoàn toàn. | **TV:** hàm băm (thuật toán), mã băm (kết quả) | [P1] |
| **Nút** | Node | Một máy tính tham gia mạng và giữ bản sao sổ cái. | **TV:** nút | [P1][D1] |
| **Cơ chế đồng thuận** | Consensus mechanism | Cách các nút thống nhất khối nào hợp lệ. | **TV:** cơ chế đồng thuận | [P1][P2][D1] |
| **Bằng chứng cổ phần** | Proof of Stake (PoS) | Cơ chế đồng thuận Ethereum đang dùng: người khóa coin được quyền xác nhận khối. | **TV:** bằng chứng cổ phần (PoS) | [P1][D1] |
| **Bằng chứng công việc** | Proof of Work (PoW) | Cơ chế đồng thuận dựa trên giải bài toán tính toán (Bitcoin). | **TV:** bằng chứng công việc (PoW) | [P1] |
| **Trình xác thực** | Validator | Nút đặt cọc ETH để được quyền đề xuất và xác nhận khối. | **TV:** trình xác thực | [D1] |
| **Giao dịch** | Transaction (tx) | Một lệnh gửi lên blockchain: chuyển token, gọi hàm smart contract… | **TV:** giao dịch | [P1][D1] |
| **Phi tập trung** | Decentralized | Không có một bên trung gian nắm quyền kiểm soát duy nhất. | **TV:** phi tập trung | [P2][D1] |
| **Immutability** | Tính bất biến | Dữ liệu đã ghi lên blockchain thì không sửa hay xóa được. | **TA:** immutability. Từ "bất biến" phổ biến nhưng chưa tìm thấy trong bài báo đã kiểm tra. | — |
| **On-chain** | Trên chuỗi | Dữ liệu và logic **nằm trên blockchain**: minh bạch, không sửa được nhưng **tốn phí và chậm**. **Trong đồ án:** quyền sở hữu tín chỉ, giao dịch, việc retire, mã băm của hồ sơ. | **TA:** on-chain. Các nguồn dịch **không thống nhất** ([P2] viết "trên blockchain", [D1] viết "trên chuỗi"). | [P2][D1] |
| **Off-chain** | Ngoài chuỗi | Dữ liệu **nằm ngoài blockchain** (CSDL như PostgreSQL): nhanh, rẻ, sửa được. **Trong đồ án:** chi tiết dự án, file PDD, tài khoản người dùng, lịch sử để tra cứu nhanh. | **TA:** off-chain (lý do như on-chain) | [P2][D1] |
| **Hybrid architecture** | Kiến trúc lai | Kết hợp on-chain và off-chain: dữ liệu lớn để off-chain, còn mã băm của nó đưa lên on-chain để chứng minh không bị sửa. | **TV:** kiến trúc lai (hybrid). Đây là cách diễn đạt mô tả, không phải thuật ngữ cần dịch chuẩn. | — |
| **Public / permissionless blockchain** | Blockchain công khai | Ai cũng tham gia được, ví dụ Ethereum, Bitcoin. | **TA:** public blockchain | — |
| **Permissioned blockchain** | Blockchain cấp phép | Chỉ thành viên được duyệt mới tham gia, ví dụ **Hyperledger Fabric**. | **TA:** permissioned blockchain | — |
| **Ethereum, Hyperledger Fabric** | — | Ethereum: blockchain công khai có smart contract, **đồ án dùng nền tảng này**. Hyperledger Fabric: blockchain cấp phép, dùng để so sánh ở Chương 2. | **TA** (tên riêng) | — |
| **EVM** | Ethereum Virtual Machine | "Máy tính" chạy smart contract trên Ethereum. | **TV:** máy ảo Ethereum (EVM) | [D1] |
| **Layer 1 / Layer 2** | Lớp 1 / Lớp 2 | Layer 1 là chuỗi chính. Layer 2 là chuỗi chạy "bên trên" để nhanh và rẻ hơn. | **TA** | — |
| **Gas** | Phí gas | Phí trả cho mạng để thực hiện giao dịch, tính theo độ phức tạp của lệnh. | **TA:** gas, phí gas | — |
| **ETH** | Ether | Đồng tiền gốc của Ethereum, dùng để trả gas. | **TA** | [D1] |
| **Mainnet / Testnet** | Mạng chính / mạng thử nghiệm | Mainnet: tiền thật. Testnet: coin miễn phí, không có giá trị. **Đồ án deploy lên testnet Sepolia.** | **TA** | — |
| **Sepolia, Faucet** | — | Sepolia: testnet chính của Ethereum. Faucet: trang phát ETH testnet miễn phí. | **TA** | — |
| **Block explorer** | Trình duyệt khối | Website tra cứu giao dịch, ví, contract, ví dụ **Etherscan**. | **TA** | — |
| **Oracle** | — | Cầu nối đưa dữ liệu thế giới thực lên blockchain. | **TA** | — |
| **IPFS** | InterPlanetary File System | Hệ thống lưu file phi tập trung, định danh file bằng mã băm nội dung. | **TA** | — |
| **DeFi** | Decentralized Finance | Dịch vụ tài chính chạy bằng smart contract. | **TA** | — |
| **Tokenization** | Token hóa | Biến một tài sản thật (tín chỉ carbon) thành **token** trên blockchain. | **TA:** tokenization (hoặc "token hóa" sau khi đã giải thích) | — |
| **Toucan Protocol, BCT** | Base Carbon Tonne | Dự án thực tế đã token hóa tín chỉ Verra, tạo pool BCT. Đồ án tham khảo mô hình này. | **TA** (tên riêng) | — |

---

## 4. Smart contract và token

| Thuật ngữ | Tên đầy đủ | Giải thích | Khuyên dùng | Căn cứ |
|---|---|---|---|---|
| **Hợp đồng thông minh** | Smart contract | **Chương trình chạy trên blockchain**, tự thực thi khi điều kiện thỏa mãn. Đã deploy thì không sửa được code. | **TV:** hợp đồng thông minh | [P1][P2][D1] |
| **Solidity** | — | Ngôn ngữ lập trình smart contract trên Ethereum. | **TA** | — |
| **Triển khai** | Deploy | Đưa smart contract lên blockchain. Sau khi triển khai, contract có một **địa chỉ** riêng. | **TV:** triển khai (deploy) | [P1] |
| **Verify contract** | Xác minh mã nguồn | Công khai mã nguồn contract trên Etherscan để ai cũng kiểm tra được. | **TA** | — |
| **ABI** | Application Binary Interface | "Bản mô tả" các hàm của contract để frontend/backend gọi được. | **TA** | — |
| **Token** | — | Một đơn vị tài sản số do smart contract quản lý. | **TA:** token. [P2] dịch "mã thông báo" nhưng [D1] và phần lớn tài liệu giữ "token". Không dùng "mã thông báo". | [P2][D1] |
| **Fungible token** | Token thay thế được | Các token giống hệt nhau, đổi 1 lấy 1 được (như tiền). Chuẩn **ERC-20**. | **TA** | — |
| **NFT** | Non-Fungible Token | Mỗi token là **duy nhất**, có ID và metadata riêng. Chuẩn **ERC-721**. | **TA:** NFT. Lần đầu có thể ghi "token không thể thay thế (NFT)" như [D1]. | [D1] |
| **ERC-20, ERC-721, ERC-1155** | Ethereum Request for Comments | Các chuẩn token. **Trong đồ án**: ERC-721 cho mỗi lô tín chỉ khi phát hành, ERC-20 cho token của pool. ERC-1155 nêu như phương án thay thế. | **TA** (tên chuẩn) | [D1] |
| **Metadata** | Siêu dữ liệu | Thông tin mô tả token (tên dự án, vintage, số tCO₂e…), lấy qua hàm `tokenURI`. | **TA** | — |
| **Mint** | Đúc | **Tạo mới** token. **Trong đồ án**: VVB duyệt hồ sơ, sau đó contract mint NFT tín chỉ cho chủ dự án. | **TA:** mint. Không dùng "phát hành" cho thao tác này vì "phát hành / cấp tín chỉ" là nghiệp vụ pháp lý (issuance). | [P2] |
| **Burn** | Đốt | **Hủy vĩnh viễn** token, thường bằng cách chuyển tới **burn address**, địa chỉ không ai có khóa. | **TA** | — |
| **Retire** | Hủy tín chỉ để bù trừ | Người mua "dùng" tín chỉ để bù trừ phát thải. Tín chỉ bị burn hoặc khóa kèm **chứng nhận** người thụ hưởng, sau đó **không bán lại được**, nhờ vậy chống double selling. | **TV:** hủy tín chỉ, khi nói về nghiệp vụ (theo [L2]: "hủy tự nguyện", tiểu khoản "Bù trừ"). **TA:** `retire`, khi nói về hàm trong contract. ⚠️ **Không dịch là "thu hồi"**, vì [L2] dùng "thu hồi" cho việc cơ quan nhà nước tước tín chỉ. | [L2] |
| **Pool** | Bể thanh khoản | Contract gom nhiều NFT tín chỉ cùng tiêu chí và phát lại token ERC-20 tương ứng. | **TA** | — |
| **Transfer** | Chuyển | Chuyển token sang ví khác. | **TV:** chuyển (token) | — |
| **Approve / Allowance** | Cấp quyền | Cho phép contract khác chuyển token **thay mặt** mình. | **TA** | — |
| **Event / Log** | Sự kiện | Thông báo contract phát ra khi có việc xảy ra (`Minted`, `Retired`…). Backend "nghe" event để đồng bộ vào CSDL. | **TV:** sự kiện (event) | [D1] |
| **msg.sender, modifier, require/revert** | — | Các cú pháp Solidity: ai đang gọi hàm; đoạn kiểm tra gắn trước hàm; lệnh dừng giao dịch khi điều kiện sai. | **TA** (từ khóa ngôn ngữ) | — |
| **Access control** | Phân quyền | Chỉ địa chỉ có vai trò nhất định mới được gọi hàm, ví dụ chỉ `VERIFIER_ROLE` được mint. | **TV:** phân quyền. Đây là từ CNTT phổ thông, không cần nguồn chuyên ngành. | — |
| **OpenZeppelin** | — | Thư viện smart contract chuẩn, đã được kiểm toán. | **TA** (tên riêng) | — |

---

## 5. Phát triển ứng dụng Web3

| Thuật ngữ | Tên đầy đủ | Giải thích | Khuyên dùng | Căn cứ |
|---|---|---|---|---|
| **Web2 / Web3** | — | Web2: ứng dụng thường, dữ liệu do công ty giữ. Web3: dùng blockchain, người dùng tự giữ tài sản bằng ví. | **TA** | — |
| **Ứng dụng phi tập trung** | Decentralized Application (dApp) | Ứng dụng có logic chính chạy bằng smart contract. **Hệ thống của đồ án là một dApp.** | **TV:** ứng dụng phi tập trung (dApp) | [D1] |
| **Ví / địa chỉ ví** | Wallet / address | Ví giữ khóa và ký giao dịch. Địa chỉ ví dạng `0xAbc…`, như số tài khoản ngân hàng. | **TV:** ví, địa chỉ ví | [P2][D1] |
| **Private key** | Khóa bí mật / khóa riêng | Chìa khóa chứng minh quyền sở hữu ví. **Không để trong code hay đẩy lên GitHub.** | **TA:** private key. Tài liệu dịch không thống nhất ("khóa bí mật", "khóa riêng", "khóa riêng tư"). | — |
| **Seed phrase** | Cụm từ khôi phục | 12 hoặc 24 từ để khôi phục ví. | **TA** | — |
| **Ký** | Sign | Dùng private key xác nhận giao dịch hoặc thông điệp là do mình gửi. | **TV:** ký (từ thông dụng) | — |
| **MetaMask, ethers.js, web3.js, wagmi, viem** | — | MetaMask: ví trên trình duyệt. Các thư viện còn lại: kết nối và gọi contract từ JavaScript/React. | **TA** (tên riêng) | — |
| **RPC / Provider** | — | "Cổng" để ứng dụng kết nối tới blockchain (Alchemy, Infura). | **TA** | — |
| **SIWE** | Sign-In with Ethereum | Đăng nhập bằng cách ký một thông điệp bằng ví, không cần mật khẩu. | **TA** | — |
| **Indexer / Event listener** | Bộ lắng nghe sự kiện | Service ở backend đọc event từ contract và ghi vào CSDL. | **TA** | — |
| **Frontend / Backend** | Giao diện / phía máy chủ | Frontend: phần người dùng nhìn thấy (Next.js). Backend: xử lý logic, CSDL, API (Node.js/Express). | **TA** | — |
| **REST API, endpoint** | — | Cách thiết kế API qua HTTP (GET, POST…). Endpoint là một địa chỉ API cụ thể, ví dụ `POST /api/issuances`. | **TA** | — |
| **Cơ sở dữ liệu** | Database | Nơi lưu dữ liệu có cấu trúc (PostgreSQL). | **TV:** cơ sở dữ liệu (CSDL) | — |
| **ORM, monorepo, microservices, `.env`** | — | ORM: thao tác CSDL bằng code (Prisma). Monorepo: một repo chứa nhiều phần. Microservices: chia hệ thống thành dịch vụ nhỏ. `.env`: file chứa khóa bí mật, phải nằm trong `.gitignore`. | **TA** | — |

---

## 6. Kiểm thử và bảo mật

| Thuật ngữ | Tên đầy đủ | Giải thích | Khuyên dùng | Căn cứ |
|---|---|---|---|---|
| **Hardhat** | — | Bộ công cụ phát triển smart contract: biên dịch, chạy blockchain giả lập, viết test, deploy. | **TA** | — |
| **Kiểm thử đơn vị** | Unit test | Test từng hàm riêng lẻ, ví dụ "mint trùng số sê-ri phải bị từ chối". | **TV:** kiểm thử đơn vị | [G2] |
| **Kiểm thử tích hợp** | Integration test | Test nhiều phần ghép với nhau (frontend → backend → contract). | **TV:** kiểm thử tích hợp | [G2] |
| **E2E test** | End-to-end test | Test trọn một luồng nghiệp vụ như người dùng thật. | **TA** | — |
| **Độ bao phủ mã** | Code coverage | Phần trăm dòng code được test chạy qua. Mục tiêu ≥ 80%. | **TV:** độ bao phủ mã (coverage) | [G2] |
| **Test case** | Ca kiểm thử | Một kịch bản test: đầu vào, các bước, kết quả mong đợi, kết quả thực tế. | **TA:** test case. "Ca kiểm thử" phổ biến nhưng chưa tìm được nguồn đủ tin cậy. | — |
| **Slither, Mythril** | — | Công cụ quét lỗ hổng bảo mật smart contract. | **TA** (tên riêng) | — |
| **Audit** | Kiểm toán bảo mật | Chuyên gia rà soát code contract trước khi lên mainnet. | **TA** | — |
| **Reentrancy** | Tấn công gọi lại | Lỗ hổng kinh điển: contract độc gọi ngược lại hàm của mình trước khi trạng thái kịp cập nhật. | **TA** | — |
| **Gas optimization** | Tối ưu gas | Viết code tốn ít phí gas nhất. Nên có bảng đo gas trong Chương 4. | **TA** | — |

---

## 7. Phân tích – thiết kế phần mềm

| Thuật ngữ | Tên đầy đủ | Giải thích | Khuyên dùng | Căn cứ |
|---|---|---|---|---|
| **Tác nhân** | Actor | Người hoặc hệ thống tương tác với phần mềm. **Trong đồ án**: cơ quan quản lý, VVB, chủ dự án, doanh nghiệp mua, admin. | **TV:** tác nhân | [G1] |
| **Ca sử dụng** | Use case | Một chức năng tác nhân thực hiện, ví dụ "VVB duyệt yêu cầu cấp tín chỉ". | **TV:** ca sử dụng (use case) | [G1] |
| **Biểu đồ ca sử dụng** | Use case diagram | Biểu đồ UML thể hiện tác nhân và ca sử dụng. | **TV:** biểu đồ ca sử dụng | [G1] |
| **Biểu đồ tuần tự** | Sequence diagram | Thứ tự các bên gọi nhau theo thời gian. | **TV:** biểu đồ tuần tự | [G1] |
| **Biểu đồ trạng thái** | State diagram | Các trạng thái của một đối tượng. Ví dụ tín chỉ: *Chờ duyệt → Đã cấp → Đang giao dịch → Đã hủy (retired)*. | **TV:** biểu đồ trạng thái | [G1] |
| **Biểu đồ hoạt động** | Activity diagram | Luồng các bước xử lý của một quy trình. | **TV:** biểu đồ hoạt động | [G1] |
| **ERD** | Entity Relationship Diagram | Sơ đồ các bảng CSDL và quan hệ giữa chúng. | **TA:** ERD. Lần đầu có thể giải thích "mô hình thực thể – liên kết". | — |
| **BPMN, swimlane** | Business Process Model and Notation | Ký pháp chuẩn vẽ quy trình nghiệp vụ. Swimlane chia sơ đồ thành các "làn", mỗi làn là một tác nhân. | **TA** | — |
| **AS-IS / TO-BE** | — | AS-IS: quy trình hiện tại. TO-BE: quy trình sau khi có hệ thống. | **TA** | — |
| **Yêu cầu chức năng / phi chức năng** | Functional / non-functional requirement | Chức năng: hệ thống **làm được gì**. Phi chức năng: **làm tốt đến đâu** (bảo mật, hiệu năng, chi phí gas). | **TV** (từ chuyên ngành phổ thông) | — |
| **Traceability matrix** | Ma trận truy vết | Bảng nối mỗi yêu cầu với thiết kế và test case tương ứng. | **TA** | — |
| **Kiến trúc hệ thống** | System architecture | Sơ đồ tổng thể các thành phần và cách chúng kết nối. | **TV** (từ chuyên ngành phổ thông) | — |

> Trong tài liệu UML tiếng Việt [G1], các sơ đồ UML được gọi là **"biểu đồ"** (biểu đồ ca sử dụng, biểu đồ tuần tự…). Nên dùng "biểu đồ" thống nhất cho UML và chỉ dùng "sơ đồ" cho hình vẽ không theo chuẩn UML, ví dụ sơ đồ kiến trúc.

---

## 8. Những chỗ đã sửa so với bản trước

| Bản trước | Đã sửa thành | Lý do |
|---|---|---|
| Retire = "thu hồi" | **hủy tín chỉ** (nghiệp vụ) / `retire` (hàm contract) | [L2] dùng "thu hồi" cho việc **cơ quan có thẩm quyền tước** tín chỉ, còn người dùng tự hủy để bù trừ là "hủy tự nguyện". |
| MRV = "đo lường, báo cáo, thẩm tra" | **đo đạc, báo cáo, thẩm định (MRV)** | Viết đúng theo [L1]. |
| Baseline = "đường cơ sở" | **đường phát thải cơ sở** | [L1] dùng cụm này. |
| VVB = "tổ chức thẩm định và thẩm tra" | Giữ **VVB** | [L1] gọi là "đơn vị thẩm định", [P4] gọi là "bên thẩm định", không thống nhất. |
| Validation / Verification = "thẩm định / thẩm tra" | Giữ **tiếng Anh** | Ba nguồn dịch ba kiểu ([L1], [L3] và tài liệu khác). |
| Double counting = "tính toán kép" | Giữ **double counting**, lần đầu ghi kèm "tính toán kép" | [L1], [P3] và phiếu giao nhiệm vụ dùng ba cách khác nhau. |
| Registry = "sổ đăng ký" | **hệ thống đăng ký** | [L1][L2] dùng "Hệ thống đăng ký quốc gia". |
| "Thư ủy quyền" (LoA) | Giữ **LoA** | Không có trong [L1]. Văn bản chỉ dùng "chấp thuận chuyển giao quốc tế". |
| "Khối tín chỉ" | Giữ **credit block** | Dễ nhầm với "khối" của blockchain. |
| Token / mint = "mã thông báo" / "đúc" | Giữ **token**, **mint** | "Mã thông báo" chỉ có ở [P2] và nghe gượng. "Đúc" chưa phổ biến trong bài báo học thuật. |
| On-chain / off-chain = "trên chuỗi / ngoài chuỗi" | Giữ **tiếng Anh** | Các nguồn dịch không thống nhất. |
| "Sơ đồ use case / tuần tự / trạng thái" | **biểu đồ** ca sử dụng / tuần tự / trạng thái | Theo giáo trình UML [G1]. |
| — | Thêm: nộp trả, mã trong nước, sàn giao dịch carbon, kiểm kê khí nhà kính, hệ số phát thải, trình xác thực | Có trong [L1][L2][D1] và sẽ cần khi viết Chương 1–2. |

---

## 9. Các cặp từ dễ nhầm

| Cặp từ | Phân biệt |
|---|---|
| **Validation ↔ Verification** | Validation kiểm tra thiết kế **trước** khi dự án chạy. Verification kiểm tra kết quả thực tế **sau** khi dự án chạy. |
| **Tín chỉ ↔ Hạn ngạch** | Tín chỉ được **tạo ra** từ dự án giảm phát thải. Hạn ngạch được Nhà nước **phân bổ** làm giới hạn được xả. |
| **Hủy (retire) ↔ Thu hồi ↔ Nộp trả** | Hủy: chủ sở hữu tự dùng tín chỉ để bù trừ. Thu hồi: cơ quan nhà nước tước tín chỉ theo quyết định. Nộp trả: cơ sở nộp hạn ngạch để hoàn thành nghĩa vụ. |
| **Transfer ↔ Retire ↔ Burn** | Transfer: đổi chủ, tín chỉ vẫn còn. Retire: dùng tín chỉ để bù trừ, có chứng nhận. Burn: kỹ thuật hủy token, thường được dùng để thực hiện retire. |
| **Mint ↔ Cấp tín chỉ** | Cấp tín chỉ (issuance) là quyết định nghiệp vụ, pháp lý. Mint là thao tác kỹ thuật tạo token trên blockchain sau khi tín chỉ được cấp. |
| **On-chain ↔ Off-chain** | On-chain: minh bạch, bất biến nhưng tốn phí. Off-chain: nhanh, rẻ, sửa được. Hệ thống đưa **phần cần tin cậy** lên chuỗi, còn **phần cần nhanh hoặc dữ liệu lớn** để ngoài chuỗi. |
| **ERC-721 ↔ ERC-20** | ERC-721: mỗi token duy nhất (định danh từng lô tín chỉ). ERC-20: các token giống nhau (dễ mua bán số lượng lẻ). |
| **Khối (block) ↔ Credit block** | Khối là "trang" của blockchain. Credit block là dải số sê-ri tín chỉ. Hai khái niệm khác hẳn nhau. |
| **Baseline (carbon) ↔ Baseline (thực nghiệm)** | Trong nghiệp vụ carbon là **đường phát thải cơ sở**. Trong thực nghiệm là **phương án đối chứng** để so sánh. |
| **Public ↔ Permissioned blockchain** | Ethereum ai cũng tham gia được. Hyperledger Fabric chỉ thành viên được duyệt mới tham gia. |

---

## 10. Ghép lại: vòng đời một tín chỉ trong hệ thống

1. **Chủ dự án** (ví dụ trang trại điện mặt trời) đăng ký dự án và tải lên **tài liệu thiết kế dự án (PDD)**. Dữ liệu lưu **off-chain** trong PostgreSQL, **mã băm** của PDD có thể ghi **on-chain**.
2. Sau một năm vận hành, chủ dự án gửi **yêu cầu cấp tín chỉ** cho lượng giảm phát thải, ví dụ 500 tCO₂e, **vintage** 2026.
3. **VVB** thực hiện **verification** hồ sơ. Nếu hợp lệ, VVB ký giao dịch bằng **MetaMask** để gọi hàm **mint**.
4. **Hợp đồng thông minh** kiểm tra **phân quyền** (`VERIFIER_ROLE`) và kiểm tra **số sê-ri** chưa từng tồn tại (chống **double issuance**), rồi mint **NFT ERC-721** cho chủ dự án.
5. Chủ dự án gửi NFT vào **pool**, nhận lại 500 token **ERC-20** và bán bớt cho các doanh nghiệp.
6. **Doanh nghiệp mua** 200 token. Quyền sở hữu nằm on-chain, ai cũng kiểm tra được, nên không thể **double selling**.
7. Doanh nghiệp **hủy** 200 token để **bù trừ** phát thải năm 2026 (hàm `retire`). Token bị **burn**, contract phát **sự kiện** `Retired` kèm tên người thụ hưởng, chống **double claiming**.
8. **Event listener** ở backend nhận sự kiện và cập nhật **cơ sở dữ liệu**. Dashboard hiển thị lượng phát thải và **hạn ngạch phát thải khí nhà kính** còn lại của doanh nghiệp.
9. Bất kỳ ai cũng tra được toàn bộ lịch sử trên **Etherscan** bằng địa chỉ contract, nhờ đó hệ thống **minh bạch**.

---

> **Mức độ kiểm chứng:** các thuật ngữ đánh dấu [L1], [L2], [P1], [P2] đã được đối chiếu trực tiếp với toàn văn. [P3] mới chỉ đọc được trích đoạn. [D1] là bản dịch cộng đồng, [G2] là tài liệu phổ thông, nên chỉ dùng làm tham khảo phụ. Trước khi nộp, bạn nên tự mở lại [L1] và [L2] để kiểm tra các thuật ngữ pháp lý mình trích dẫn trong báo cáo.
