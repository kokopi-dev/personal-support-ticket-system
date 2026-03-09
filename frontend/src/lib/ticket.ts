export interface ParsedDescription {
  txnId: string | null      // e.g. "TXN-48291"
  txnLine: string | null    // e.g. "TXN-48291 — Pro Plan — Monthly $12.00 on Mar 1, 2026"
  body: string              // the user-written description, without the prefix
}

export function parseDescription(description: string): ParsedDescription {
  const match = description.match(/^\[Transaction: ([^ ]+)([^\]]*)\]\n?\n?(.*)$/s)
  if (!match) return { txnId: null, txnLine: null, body: description }

  const txnId = match[1].trim()
  const txnLine = (txnId + match[2]).trim()
  const body = match[3].trim()

  return { txnId, txnLine, body }
}
