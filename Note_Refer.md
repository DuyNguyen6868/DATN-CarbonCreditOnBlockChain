# Note_Refer — Quy định về tài liệu tham khảo (ĐATN, ĐHBK Hà Nội)

Tóm tắt từ slide "Tài liệu tham khảo (1)–(7)" của trường, kèm cách áp dụng trong đồ án này.
Cập nhật: 07/11/2026.

## 1. Quy định chung

- Thông tin của mỗi tài liệu được khai báo trong file `References.bib`.
- Trong bài, trích dẫn bằng `\cite{ID}`. ID là khóa của mục trong file .bib (ví dụ `harris2009cloud`).
- Không được đưa vào danh mục tài liệu tham khảo:
  - tài liệu không kiểm chứng được;
  - Wikipedia;
  - các trang web thông thường.
- Lấy BibTeX bằng Google Scholar:
  1. Vào https://scholar.google.com/.
  2. Gõ tên tài liệu vào ô tìm kiếm.
  3. Chọn "Cite", sau đó chọn "BibTeX", rồi dán vào `References.bib`.
  4. Kiểm tra lại các trường: Google Scholar hay thiếu số trang, DOI, hoặc viết hoa sai.

## 2. Năm loại tài liệu được phép và các trường bắt buộc

Chỉ dùng 5 loại sau, mỗi loại khai báo đúng các trường:

| Loại | Kiểu BibTeX | Trường bắt buộc |
|---|---|---|
| Bài báo tạp chí | `@article` | author, title, journal, volume, number, pages, year, publisher |
| Sách | `@book` | author, title, year, publisher |
| Báo cáo hội nghị khoa học | `@inproceedings` | author, title, booktitle, pages, year |
| Đồ án, luận văn thạc sĩ, luận án tiến sĩ | `@phdthesis` / `@mastersthesis` | author, title, school, year |
| Tài liệu từ Internet | `@misc` | author, title, urldate, url |

Mẫu khai báo (theo slide):

```bibtex
@article{hovy1993automated,
  title={Automated discourse generation using discourse structure relations},
  author={Hovy, Eduard H},
  journal={Artificial intelligence},
  volume={63}, number={1-2}, pages={341--385},
  year={1993}, publisher={Elsevier}
}

@book{peterson2007computer,
  title={Computer networks: a systems approach},
  author={Peterson, Larry L and Davie, Bruce S},
  year={2007}, publisher={Elsevier}
}

@inproceedings{poesio2001discourse,
  title={Discourse structure and anaphoric accessibility},
  author={Poesio, Massimo and Di Eugenio, Barbara},
  booktitle={ESSLLI workshop on information structure, discourse structure and discourse semantics, Copenhagen, Denmark},
  pages={129--143}, year={2001}
}

@phdthesis{knott1996data,
  author = {Knott, Alistair},
  title  = {A data-driven methodology for motivating a set of coherence relations},
  school = {The University of Edinburgh, {UK}},
  year   = {1996}
}

@misc{LectureA,
  author  = {{Princeton University}},
  title   = {WordNet},
  urldate = {2010-09-30},
  url     = {http://www.cogsci.princeton.edu/~wn/index.shtml}
}
```

Lưu ý:
- Tác giả là tổ chức thì bọc hai lớp ngoặc: `{{Princeton University}}`.
- `urldate` viết dạng `YYYY-MM-DD` và là ngày thực sự mở link.

## 3. Quy ước riêng của đồ án này

- Kiểu trích dẫn IEEE: tài liệu đánh số theo thứ tự xuất hiện, dạng [1], [2]–[4].
  - Style là `IEEEtran-hust.bst`, tức IEEEtran.bst có thêm trường `urldate`.
  - IEEEtran gốc bỏ qua trường `urldate`, nên bản sửa này in thành "Truy cập ngày dd/mm/yyyy. [Online]. Available: URL".
- Gộp nhiều nguồn vào một lệnh và đặt trước dấu câu: `...~\cite{a,b}.` Không viết `\cite{a} \cite{b}`.
- Câu nhắc tên tác giả viết theo IEEE: "Vaccargiu và cộng sự~\cite{...} đề xuất…". Không viết "(Vaccargiu, 2026)".
- Chỉ những tài liệu được `\cite` mới hiện trong danh mục. Không liệt kê tài liệu chỉ đọc mà không trích.
- Với tài liệu Internet (`@misc`), chỉ lấy nguồn do cơ quan hoặc tổ chức ban hành, vận hành:
  - văn bản pháp luật;
  - tiêu chuẩn;
  - báo cáo hoặc tài liệu kỹ thuật của tổ chức;
  - trang dữ liệu chính thức (HNX, Verra Registry…);
  - mã nguồn chính thức.
- Không dùng làm nguồn:
  - báo chí (Dân trí, Đại biểu Nhân dân, Nông nghiệp và Môi trường, Báo Chính phủ…);
  - blog, bài bình luận, tin thị trường;
  - Wikipedia;
  - preprint chưa bình duyệt khi đã có bài đăng chính thức.
  - Nếu một số liệu chỉ có trên báo, tìm văn bản hoặc dữ liệu gốc mà báo dẫn lại. Không tìm được thì bỏ số liệu đó.
- Văn bản pháp luật khai báo theo mẫu sau:

  ```bibtex
  @misc{vietnam2026thongtu11,
    author       = {{Bộ Nông nghiệp và Môi trường}},
    title        = {{Thông tư số 11/2026/TT-BNNMT ngày 13/02/2026 quy định ...}},
    howpublished = {Cổng Thông tin điện tử Chính phủ},
    year         = {2026},
    note         = {Hiệu lực từ ngày 30/3/2026},
    urldate      = {2026-11-04},
    url          = {https://datafiles.chinhphu.vn/...}
  }
  ```

  Ưu tiên link trên `datafiles.chinhphu.vn`, `vanban.chinhphu.vn` hoặc `congbao.chinhphu.vn`.
- Trong file .bib, không viết ký tự `@` trong dòng chú thích `%`, vì BibTeX đọc nó thành một mục tài liệu và báo lỗi.

## 4. Kết quả rà soát ngày 07/11/2026

Danh mục Chương 1 còn 35 tài liệu. Trước lần rà soát này có 39 mục, và 41 mục trước khi bỏ các nguồn báo.

| Việc | Tài liệu |
|---|---|
| Bỏ (báo chí) | Dân trí, Đại biểu Nhân dân, Nông nghiệp và Môi trường, Báo Điện tử Chính phủ |
| Bỏ (bình luận, tin thị trường) | Columbia, Argus, Fastmarkets, S&P (2 bài), VietnamFinance (2 bài), CAD Trust deep-dive |
| Bỏ (không đạt quy định) | Thông cáo CDOP đăng trên trang của S&P; preprint arXiv của Tsai (đã gỡ khỏi Chương 1; còn trong .bib cho Chương 2 nhưng cần thay); QĐ 263/QĐ-TTg (không được trích) |
| Gộp | 3 mục cùng trang `registry.verra.org` gộp thành `verraregistry` |
| Đổi loại | 3 mục `@techreport` (LSEG, SOVCM, CAD Trust Data Model) đổi sang `@misc` có `urldate`, vì techreport không thuộc 5 loại được phép |
| Thay link | NĐ 06/2022 và QĐ 232/QĐ-TTg chuyển sang `vanban.chinhphu.vn` (link cũ của QĐ 232 là trang Bộ Công Thương) |
| Bổ sung trường | Thêm `publisher` cho `@article`. Mọi `@misc` dùng `urldate` thay cho note "Truy cập ngày…" |

Cơ cấu sau rà soát:
- 3 bài báo tạp chí có bình duyệt (Science, Sustainability, One Earth);
- 1 báo cáo hội nghị IEEE;
- còn lại là văn kiện quốc tế, tiêu chuẩn ISO, văn bản pháp luật Việt Nam, tài liệu kỹ thuật và trang dữ liệu chính thức của các hệ thống được khảo sát.

## 5. Việc còn phải làm trước khi nộp

- [ ] Mở lại và sửa `urldate` thành ngày thực sự truy cập cho các mục trước đây chưa ghi ngày:
  - `unfccc2022cma3`;
  - ba mục ISO 14064;
  - `lseg2024yir`;
  - `cadtrust2025datamodel`.
- [ ] `vaccargiu2026blockchain`: khi kỷ yếu SANER-C 2026 lên IEEE Xplore, thêm `pages` và `doi`, bỏ note arXiv.
- [ ] Trước khi bật lại Chương 2:
  - thêm `urldate` cho mọi `@misc` của Chương 2;
  - thay `tsai2024blockchain` (preprint) bằng bài đã bình duyệt, hoặc bỏ đoạn đó;
  - cân nhắc lại `benet2014ipfs` (preprint).
- [ ] Bổ sung bài báo khoa học nếu được: hiện Chương 1 chỉ có 3 bài tạp chí và 1 bài hội thảo. Tìm trên Google Scholar hoặc IEEE Xplore theo từ khóa "blockchain carbon credit registry", "double counting carbon market", "MRV blockchain".
- [ ] Kiểm tra cuối:
  - biên dịch đủ chuỗi `pdflatex → bibtex → pdflatex → pdflatex`;
  - BibTeX không báo lỗi;
  - không còn dấu `[?]` trong PDF;
  - mọi mục trong danh mục đều được trích dẫn trong bài.
