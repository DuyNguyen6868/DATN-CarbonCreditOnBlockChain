"use client";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { txUrl } from "@/lib/chain";
import { useLoad, Status, fmt } from "@/components/ui";

export default function CertificatePage() {
  const { id } = useParams();
  const c = useLoad(() => api(`/retirements/${id}`), [id]);
  if (!c.data) return <Status {...c} />;
  const d = c.data;
  return (
    <div className="cert">
      <h1>Chứng nhận hủy tín chỉ carbon #{d.certificate_id}</h1>
      <dl>
        <dt>Người thụ hưởng</dt><dd><b>{d.beneficiary}</b></dd>
        <dt>Số lượng</dt><dd>{fmt(d.amount)} tCO₂e</dd>
        <dt>Dãy sê-ri đã hủy</dt><dd>{d.serial_from} – {d.serial_to}</dd>
        <dt>Dự án</dt><dd>{d.registry_project_id} – {d.project_name}</dd>
        <dt>Vintage</dt><dd>{d.vintage_year}</dd>
        <dt>Phương pháp luận</dt><dd>{d.methodology || "—"}</dd>
        <dt>Lý do</dt><dd>{d.reason || "—"}</dd>
        <dt>Ví thực hiện hủy</dt><dd><code>{d.retiree_address}</code></dd>
        <dt>Thời điểm</dt><dd>{new Date(d.retired_at).toLocaleString("vi-VN")}</dd>
        <dt>Lô NFT</dt><dd>#{d.token_id}</dd>
        <dt>Mã băm báo cáo thẩm định</dt><dd><code>{d.document_hash}</code></dd>
        <dt>Giao dịch</dt>
        <dd>{txUrl(d.tx_hash) ? <a href={txUrl(d.tx_hash)} target="_blank" rel="noreferrer">{d.tx_hash}</a> : <code>{d.tx_hash}</code>}</dd>
      </dl>
      <p className="muted">
        Chứng nhận được tạo từ sự kiện CreditRetired trên hợp đồng; có thể đối chiếu trực tiếp bằng hàm getCertificate({d.certificate_id}).
      </p>
    </div>
  );
}
