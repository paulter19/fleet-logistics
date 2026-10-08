export function exportToCSV<T>(
  filename: string,
  data: T[],
  columns: { key: keyof T | ((row: T) => string | number | null | undefined); label: string }[],
) {
  if (!data || data.length === 0) return

  const headers = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',')
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = typeof col.key === 'function' ? col.key(row) : (row as Record<string, unknown>)[col.key as string]
        if (val === null || val === undefined) return '""'
        const str = String(val).replace(/"/g, '""')
        return `"${str}"`
      })
      .join(','),
  )

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `${filename.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
