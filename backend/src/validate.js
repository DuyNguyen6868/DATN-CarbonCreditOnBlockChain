const { ethers } = require("ethers");
const { badRequest } = require("./errors");

function requireFields(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === "");
  if (missing.length) throw badRequest(`Thiếu trường: ${missing.join(", ")}`);
}

function toAddress(value, field = "address") {
  if (!ethers.isAddress(value)) throw badRequest(`${field} không phải địa chỉ ví hợp lệ`);
  return value.toLowerCase();
}

function toPositiveInt(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw badRequest(`${field} phải là số nguyên dương`);
  return n;
}

function toYear(value, field = "vintage_year") {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 2000 || n > 2100) throw badRequest(`${field} không hợp lệ`);
  return n;
}

function toHash(value, field) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(String(value))) throw badRequest(`${field} phải là mã băm 32 byte (0x...)`);
  return value.toLowerCase();
}

module.exports = { requireFields, toAddress, toPositiveInt, toYear, toHash };
