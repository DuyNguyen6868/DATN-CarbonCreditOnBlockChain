class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const badRequest = (m) => new HttpError(400, m);
const unauthorized = (m = "Chưa đăng nhập") => new HttpError(401, m);
const forbidden = (m = "Không đủ quyền") => new HttpError(403, m);
const notFound = (m = "Không tìm thấy") => new HttpError(404, m);
const conflict = (m) => new HttpError(409, m);

/** Bọc handler async để lỗi được chuyển về middleware xử lý lỗi của Express. */
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict, ah };
