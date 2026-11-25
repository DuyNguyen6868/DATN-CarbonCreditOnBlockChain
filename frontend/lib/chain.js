import { BrowserProvider, Contract } from "ethers";
import contracts from "./contracts.json";

export const deployment = contracts.deployment;
export const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER || "";

export const txUrl = (hash) => (EXPLORER ? `${EXPLORER}/tx/${hash}` : null);
export const addressUrl = (a) => (EXPLORER ? `${EXPLORER}/address/${a}` : null);

export function hasWallet() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

export async function getSigner() {
  if (!hasWallet()) throw new Error("Chưa cài MetaMask");
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const net = await provider.getNetwork();
  if (deployment && Number(net.chainId) !== deployment.chainId)
    throw new Error(`MetaMask đang ở mạng ${net.chainId}, cần chuyển sang mạng ${deployment.chainId}`);
  return provider.getSigner();
}

/** Trả về {nft, pool} gắn với ví đang kết nối để ký giao dịch. */
export async function getContracts() {
  if (!deployment) throw new Error("Chưa có địa chỉ hợp đồng: chạy deploy rồi `npm run export` trong contracts/");
  const signer = await getSigner();
  return {
    signer,
    nft: new Contract(deployment.CarbonCreditNFT, contracts.abi.CarbonCreditNFT, signer),
    pool: new Contract(deployment.CarbonPool, contracts.abi.CarbonPool, signer),
  };
}

/** Lấy thông điệp lỗi dễ đọc từ lỗi ethers (bao gồm tên custom error của hợp đồng). */
export function chainError(e) {
  if (e?.code === "ACTION_REJECTED") return "Bạn đã từ chối giao dịch trong MetaMask";
  const name = e?.revert?.name;
  if (name) return `Hợp đồng từ chối: ${name}(${(e.revert.args || []).join(", ")})`;
  return e?.shortMessage || e?.message || String(e);
}

export const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

/** Gửi giao dịch, chờ xác nhận, trả về {hash, text}; lỗi được đổi sang thông điệp dễ đọc. */
export async function sendTx(build, text = "Giao dịch đã được xác nhận") {
  try {
    const tx = await build(await getContracts());
    await tx.wait();
    return { hash: tx.hash, text };
  } catch (e) {
    throw new Error(chainError(e));
  }
}
