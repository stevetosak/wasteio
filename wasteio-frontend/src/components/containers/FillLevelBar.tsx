function barColor(level: number) {
  if (level >= 80) return 'bg-red-500'
  if (level >= 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

function textColor(level: number) {
  if (level >= 80) return 'text-red-600'
  if (level >= 50) return 'text-yellow-600'
  return 'text-gray-700'
}

export default function FillLevelBar({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor(level)}`}
          style={{ width: `${level}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-9 text-right ${textColor(level)}`}>
        {level}%
      </span>
    </div>
  )
}