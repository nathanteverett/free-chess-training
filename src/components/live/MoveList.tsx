export function MoveList({ moves }: { moves: string[] }) {
  const pairs: [string, string?][] = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1]])
  }

  return (
    <div className="h-32 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-3 text-sm tabular-nums dark:border-neutral-800 dark:bg-neutral-900">
      {moves.length === 0 ? (
        <p className="text-neutral-500">No moves yet.</p>
      ) : (
        <ol className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
          {pairs.map(([white, black], index) => (
            <li key={index} className="flex gap-2">
              <span className="w-6 text-right text-neutral-500">{index + 1}.</span>
              <span className="w-14">{white}</span>
              <span className="w-14">{black ?? ''}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
