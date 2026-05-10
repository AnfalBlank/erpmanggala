const statusMap = {
  Planning: 'status-planning',
  Running: 'status-running',
  Done: 'status-done',
  Draft: 'status-draft',
  Sent: 'status-sent',
  Paid: 'status-paid',
  Cancelled: 'status-cancelled',
  Pending: 'status-pending',
  Approved: 'status-approved',
  Rejected: 'status-rejected',
  Hadir: 'status-hadir',
  Terlambat: 'status-terlambat',
  Aktif: 'status-aktif',
  Nonaktif: 'status-nonaktif',
  Izin: 'status-pending',
  Sakit: 'status-pending',
  Alpha: 'status-cancelled',
  Ordered: 'status-sent',
  Partial: 'status-pending',
  Received: 'status-approved',
  Converted: 'status-done',
  Lunas: 'status-paid',
};

const dotMap = {
  Running: 'bg-emerald-500',
  Aktif: 'bg-emerald-500',
  Paid: 'bg-emerald-500',
  Approved: 'bg-emerald-500',
  Hadir: 'bg-emerald-500',
  Pending: 'bg-amber-500',
  Draft: 'bg-gray-400',
  Cancelled: 'bg-red-500',
  Rejected: 'bg-red-500',
};

export default function StatusBadge({ status }) {
  if (!status) return <span className="badge status-done">-</span>;
  const cls = statusMap[status] || 'status-done';
  const dot = dotMap[status];
  return (
    <span className={`badge ${cls}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />}
      {status}
    </span>
  );
}
