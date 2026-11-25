"use client";
import Link from "next/link";
import { useState } from "react";
import { isAddress } from "ethers";
import { api } from "@/lib/api";
import { sendTx, getContracts, deployment } from "@/lib/chain";
import { useWallet } from "@/components/WalletProvider";
import { useLoad, Status, ActionButton, fmt, date } from "@/components/ui";

const SYNC_DELAY = 6000; // chờ bộ đồng bộ sự kiện của backend

/** Form nhỏ: số lượng + người thụ hưởng + lý do, dùng cho hủy trực tiếp và hủy từ pool. */
function RetireForm({ max, onRetire }) {
  const [amount, setAmount] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [reason, setReason] = useState("");
  return (
    <div className="row">
      <input type="number" min="1" max={max} placeholder={`Số lượng (≤ ${fmt(max)})`} value={amount} onChange={(e) => setAmount(e.target.value)} />
      <input placeholder="Người thụ hưởng" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} />
      <input placeholder="Lý do (VD: bù trừ phát thải 2026)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <ActionButton label="Hủy tín chỉ" run={() => onRetire(amount, beneficiary, reason)} />
    </div>
  );
}

export default function WalletPage() {
  const { user } = useWallet();
  const me = user?.wallet_address;
  const [tick, setTick] = useState(0);
  const reloadLater = () => setTimeout(() => setTick((x) => x + 1), SYNC_DELAY);

  const lots = useLoad(() => (me ? api(`/units?owner=${me}&status=Held&in_pool=false`) : Promise.resolve([])), [me, tick]);
  const pooled = useLoad(() => api("/units?status=Held&in_pool=true"), [tick]);
  const certs = useLoad(() => (me ? api(`/retirements?retiree=${me}`) : Promise.resolve([])), [me, tick]);
  const balance = useLoad(async () => {
    if (!me || !deployment) return null;
    const { pool } = await getContracts();
    return pool.balanceOf(me);
  }, [me, tick]);

  const [to, setTo] = useState("");
  const [amt, setAmt] = useState("");

  if (!user) return <p>Kết nối ví để xem tín chỉ của bạn.</p>;

  const done = (out) => {
    reloadLater();
    return out;
  };

  return (
    <>
      <h1>Ví tín chỉ</h1>
      <div className="grid">
        <div className="stat"><b>{balance.data === null ? "—" : fmt(balance.data)}</b><span>token PCC (1 PCC = 1 tCO₂e)</span></div>
        <div className="stat"><b>{fmt(lots.data?.reduce((s, u) => s + Number(u.unit_count), 0))}</b><span>tCO₂e trong các lô NFT đang giữ</span></div>
        <div className="stat"><b>{fmt(certs.data?.reduce((s, c) => s + Number(c.amount), 0))}</b><span>tCO₂e đã hủy</span></div>
      </div>
      <p><button className="ghost" onClick={() => setTick((x) => x + 1)}>Làm mới</button></p>

      <h2>Lô tín chỉ (NFT ERC-721) đang giữ</h2>
      <Status {...lots} />
      {lots.data?.map((u) => (
        <div key={u.id} className="panel stack" style={{ maxWidth: "none" }}>
          <p style={{ margin: 0 }}>
            <b>Lô #{u.token_id}</b> · {u.registry_project_id} · vintage {u.vintage_year} · sê-ri {u.unit_block_start}–{u.unit_block_end} ·{" "}
            <b>{fmt(u.unit_count)} tCO₂e</b>
          </p>
          <div className="row">
            <ActionButton
              label="Nạp vào pool → nhận PCC"
              run={() =>
                sendTx(({ nft, signer }) =>
                  signer.getAddress().then((a) => nft["safeTransferFrom(address,address,uint256)"](a, deployment.CarbonPool, u.token_id))
                , `Đã nạp lô #${u.token_id}, nhận ${fmt(u.unit_count)} PCC`).then(done)
              }
            />
          </div>
          <RetireForm
            max={Number(u.unit_count)}
            onRetire={(a, b, r) => sendTx(({ nft }) => nft.retire(u.token_id, a, b, r), "Đã hủy tín chỉ").then(done)}
          />
        </div>
      ))}
      {lots.data && !lots.data.length && <p className="muted">Không có lô nào.</p>}

      <h2>Chuyển token PCC</h2>
      <div className="row panel">
        <input placeholder="Địa chỉ ví nhận (0x…)" value={to} onChange={(e) => setTo(e.target.value)} style={{ minWidth: 320 }} />
        <input type="number" min="1" placeholder="Số lượng" value={amt} onChange={(e) => setAmt(e.target.value)} />
        <ActionButton
          label="Chuyển"
          disabled={!isAddress(to) || !(Number(amt) > 0)}
          run={() => sendTx(({ pool }) => pool.transfer(to, amt), `Đã chuyển ${fmt(amt)} PCC`).then(done)}
        />
      </div>

      <h2>Các lô trong pool (hủy hoặc đổi lại bằng PCC)</h2>
      <Status {...pooled} />
      {pooled.data?.map((u) => (
        <div key={u.id} className="panel stack" style={{ maxWidth: "none" }}>
          <p style={{ margin: 0 }}>
            <b>Lô #{u.token_id}</b> · {u.registry_project_id} · vintage {u.vintage_year} · còn {fmt(u.unit_count)} tCO₂e (sê-ri{" "}
            {u.unit_block_start}–{u.unit_block_end})
          </p>
          <RetireForm
            max={Number(u.unit_count)}
            onRetire={(a, b, r) => sendTx(({ pool }) => pool.retire(u.token_id, a, b, r), "Đã đốt PCC và hủy tín chỉ").then(done)}
          />
          <div className="row">
            <ActionButton
              label={`Đổi lại cả lô (đốt ${fmt(u.unit_count)} PCC)`}
              className="ghost"
              run={() => sendTx(({ pool }) => pool.redeem(u.token_id), `Đã rút lô #${u.token_id} về ví`).then(done)}
            />
          </div>
        </div>
      ))}
      {pooled.data && !pooled.data.length && <p className="muted">Pool đang trống.</p>}

      <h2>Chứng nhận hủy của tôi</h2>
      <ul>
        {certs.data?.map((c) => (
          <li key={c.certificate_id}>
            <Link href={`/certificates/${c.certificate_id}`}>#{c.certificate_id}</Link>: {fmt(c.amount)} tCO₂e ({c.registry_project_id},
            sê-ri {c.serial_from}–{c.serial_to}) cho {c.beneficiary}, {date(c.retired_at)}
          </li>
        ))}
      </ul>
    </>
  );
}
