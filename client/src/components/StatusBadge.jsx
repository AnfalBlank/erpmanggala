const statusColors = {
  Planning: 'bg-blue-100 text-blue-700', Sent: 'bg-blue-100 text-blue-700', Draft: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700', Ordered: 'bg-yellow-100 text-yellow-700', Partial: 'bg-yellow-100 text-yellow-700',
  Running: 'bg-green-100 text-green-700', Aktif: 'bg-green-100 text-green-700', Paid: 'bg-green-100 text-green-700',
  Received: 'bg-green-100 text-green-700', Approved: 'bg-green-100 text-green-700', Hadir: 'bg-green-100 text-green-700',
  Done: 'bg-gray-100 text-gray-600', Cancelled: 'bg-gray-100 text-gray-600', Rejected: 'bg-red-100 text-red-600',
  Izin: 'bg-yellow-100 text-yellow-700', Sakit: 'bg-orange-100 text-orange-700',
};

export default function StatusBadge({ status }) {
  const color = statusColors[status] || 'bg-gray-100 text-gray-600';
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{status}</span>;
}
