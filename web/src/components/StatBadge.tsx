interface Props { label: string; value: string | number }
export default function StatBadge({ label, value }: Props){
  return (
    <div className="px-2 py-1 bg-gray-200 rounded text-sm">
      <span className="font-medium mr-1">{label}:</span>{value}
    </div>
  );
}
