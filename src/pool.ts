export const YIELD_RATE = 0.03 // FCI simulado, mensual
export const INTEREST_RATE = 0.1 // sobre el principal, plano
export const INSTALLMENTS = 3
export const INITIAL_LIMIT = 1000
export const LIMIT_STEP = 500

export type HistoryEntry = { month: number; loanId: number; type: 'paid' | 'default' }
export type Loan = {
  id: number
  borrower: string
  principal: number
  paid: number
  status: 'active' | 'closed' | 'defaulted'
}
export type Pool = {
  month: number
  capital: Record<string, number>
  earnings: Record<string, number>
  yieldAvailable: number
  losses: number
  loans: Loan[]
  limits: Record<string, number>
  blocked: Record<string, boolean>
  history: Record<string, HistoryEntry[]>
}

export const newPool = (): Pool => ({
  month: 0, capital: {}, earnings: {}, yieldAvailable: 0, losses: 0,
  loans: [], limits: {}, blocked: {}, history: {},
})

export const totalCapital = (p: Pool) => Object.values(p.capital).reduce((a, b) => a + b, 0)
export const limitOf = (p: Pool, b: string) => (p.blocked[b] ? 0 : p.limits[b] ?? INITIAL_LIMIT)
export const installmentOf = (l: Loan) => (l.principal * (1 + INTEREST_RATE)) / INSTALLMENTS

const positive = (n: number) => {
  if (!(n > 0)) throw new Error('El monto debe ser positivo')
}

export function deposit(s: Pool, lender: string, amount: number): Pool {
  positive(amount)
  const p = structuredClone(s)
  p.capital[lender] = (p.capital[lender] ?? 0) + amount
  return p
}

export function withdraw(s: Pool, lender: string, amount: number): Pool {
  positive(amount)
  if (amount > (s.capital[lender] ?? 0)) throw new Error('Capital insuficiente')
  const p = structuredClone(s)
  p.capital[lender] -= amount
  return p
}

export function requestLoan(s: Pool, borrower: string, amount: number): Pool {
  positive(amount)
  if (s.blocked[borrower]) throw new Error('Prestatario bloqueado por Mora')
  if (s.loans.some((l) => l.borrower === borrower && l.status === 'active')) throw new Error('Ya tiene un Préstamo activo')
  if (amount > limitOf(s, borrower)) throw new Error('Supera el Límite')
  if (amount > s.yieldAvailable) throw new Error('Rendimiento insuficiente: Préstamos frenados')
  const p = structuredClone(s)
  p.yieldAvailable -= amount
  p.loans.push({ id: p.loans.length + 1, borrower, principal: amount, paid: 0, status: 'active' })
  return p
}

export function payInstallment(s: Pool, loanId: number): Pool {
  const p = structuredClone(s)
  const loan = p.loans.find((l) => l.id === loanId)
  if (!loan || loan.status !== 'active') throw new Error('Préstamo no activo')
  const interest = (loan.principal * INTEREST_RATE) / INSTALLMENTS
  p.yieldAvailable += loan.principal / INSTALLMENTS + interest / 2
  const total = totalCapital(p)
  for (const [lender, c] of Object.entries(p.capital)) {
    p.earnings[lender] = (p.earnings[lender] ?? 0) + (interest / 2) * (total ? c / total : 0)
  }
  if (!total) p.yieldAvailable += interest / 2
  loan.paid++
  if (loan.paid === INSTALLMENTS) loan.status = 'closed'
  p.limits[loan.borrower] = limitOf(p, loan.borrower) + LIMIT_STEP
  ;(p.history[loan.borrower] ??= []).push({ month: p.month, loanId, type: 'paid' })
  return p
}

export function advanceMonth(s: Pool): Pool {
  const p = structuredClone(s)
  p.month++
  p.yieldAvailable += totalCapital(p) * YIELD_RATE
  return p
}

// La pérdida ya salió del Rendimiento al prestar: el Capital no se toca.
export function markDefault(s: Pool, loanId: number): Pool {
  const p = structuredClone(s)
  const loan = p.loans.find((l) => l.id === loanId)
  if (!loan || loan.status !== 'active') throw new Error('Préstamo no activo')
  loan.status = 'defaulted'
  p.losses += loan.principal * (1 - loan.paid / INSTALLMENTS)
  p.blocked[loan.borrower] = true
  ;(p.history[loan.borrower] ??= []).push({ month: p.month, loanId, type: 'default' })
  return p
}
