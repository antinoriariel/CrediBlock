import { useState } from 'react'
import * as P from './pool'
import { logHistory, mintParticipation } from './hedera'

const ars = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const LENDER = 'ana'
const BORROWER = 'bo'
const screens = ['1. Depósito', '2. Pool', '3. Solicitud', '4. Cuotas', '5. Historial y Límite', '6. Resumen']

export function App() {
  const [pool, setPool] = useState(P.newPool)
  const [tab, setTab] = useState(0)
  const [amount, setAmount] = useState(1000)
  const [error, setError] = useState('')
  const [links, setLinks] = useState<string[]>([])
  const [chain, setChain] = useState<'simulado' | 'testnet'>('simulado')

  const act = (fn: (s: P.Pool) => P.Pool, onChain?: () => Promise<string | null>) => {
    try {
      setPool(fn(pool))
      setError('')
    } catch (e) {
      return setError((e as Error).message)
    }
    onChain?.().then((link) => {
      if (link) {
        setChain('testnet')
        setLinks((l) => [link, ...l])
      }
    })
  }
  const active = pool.loans.find((l) => l.status === 'active')
  const lastLoan = pool.loans.at(-1)

  return (
    <main>
      <h1>CrediBlock</h1>
      <p className="note">Mock · Hedera: <b>{chain}</b> · Ana (Prestamista) y Bo (Prestatario)</p>
      <nav>
        {screens.map((s, i) => (
          <button key={s} className={i === tab ? 'on' : ''} onClick={() => setTab(i)}>{s}</button>
        ))}
      </nav>
      {error && <p className="err">{error}</p>}

      {tab === 0 && (
        <div className="card">
          <h2>Prestamista: depositar Capital</h2>
          <p className="note">Tu Capital queda en el FCI y nunca se presta. Podés retirarlo íntegro cuando quieras.</p>
          <input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} />{' '}
          <button className="primary" onClick={() => act((s) => P.deposit(s, LENDER, amount), () => mintParticipation(LENDER, amount))}>Depositar</button>{' '}
          <button onClick={() => act((s) => P.withdraw(s, LENDER, amount))}>Retirar</button>
          <p>Capital de Ana: <b>{ars(pool.capital[LENDER] ?? 0)}</b> · Interés cobrado: <b>{ars(pool.earnings[LENDER] ?? 0)}</b></p>
        </div>
      )}

      {tab === 1 && <PoolStats pool={pool} />}

      {tab === 2 && (
        <div className="card">
          <h2>Prestatario: solicitar Préstamo</h2>
          <p>Tu Límite: <b>{ars(P.limitOf(pool, BORROWER))}</b> · Rendimiento disponible: <b>{ars(pool.yieldAvailable)}</b></p>
          <input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} />{' '}
          <button className="primary" onClick={() => act((s) => P.requestLoan(s, BORROWER, amount))}>Pedir</button>
          <p className="note">Costo total: {ars(amount * (1 + P.INTEREST_RATE))} en {P.INSTALLMENTS} cuotas de {ars((amount * (1 + P.INTEREST_RATE)) / P.INSTALLMENTS)}.</p>
        </div>
      )}

      {tab === 3 && (
        <div className="card">
          <h2>Préstamo y cuotas</h2>
          {active ? (
            <>
              <p>Préstamo #{active.id}: {ars(active.principal)} · cuotas pagadas {active.paid}/{P.INSTALLMENTS} · cuota {ars(P.installmentOf(active))}</p>
              <button className="primary" onClick={() => act((s) => P.payInstallment(s, active.id), () => logHistory(`paid loan=${active.id} cuota=${active.paid + 1} month=${pool.month}`))}>Pagar cuota</button>{' '}
              <button className="danger" onClick={() => act((s) => P.markDefault(s, active.id), () => logHistory(`default loan=${active.id} month=${pool.month}`))}>Simular Mora</button>
              <p className="note">Una Mora se descuenta del Rendimiento, bloquea al Prestatario y su Límite pasa a cero. El Capital no se toca.</p>
            </>
          ) : (
            <p>Sin Préstamo activo{lastLoan ? ` (último: ${lastLoan.status})` : ''}.</p>
          )}
        </div>
      )}

      {tab === 4 && (
        <div className="card">
          <h2>Historial y Límite de Bo</h2>
          <p>Límite: <b>{ars(P.limitOf(pool, BORROWER))}</b> {pool.blocked[BORROWER] && <span className="err">(bloqueado por Mora)</span>}</p>
          <ul>
            {(pool.history[BORROWER] ?? []).map((h, i) => (
              <li key={i}>Mes {h.month}: {h.type === 'paid' ? 'cuota pagada' : 'MORA'} (Préstamo #{h.loanId})</li>
            ))}
          </ul>
          {links.map((l) => <div key={l}><a href={l} target="_blank">{l}</a></div>)}
          {!links.length && <p className="note">Sin registros en testnet (configurá .env para activarlos).</p>}
        </div>
      )}

      {tab === 5 && (
        <>
          <PoolStats pool={pool} />
          <button className="primary" onClick={() => act(P.advanceMonth)}>Simular un mes</button>{' '}
          <button onClick={() => { setPool(P.newPool()); setLinks([]); setChain('simulado'); setError('') }}>Reiniciar demo</button>
        </>
      )}
    </main>
  )
}

function PoolStats({ pool }: { pool: P.Pool }) {
  const stats: [string, string][] = [
    ['Mes', String(pool.month)],
    ['Capital (intocable)', ars(P.totalCapital(pool))],
    ['Rendimiento disponible', ars(pool.yieldAvailable)],
    ['Préstamos activos', String(pool.loans.filter((l) => l.status === 'active').length)],
    ['Pérdida por Mora', ars(pool.losses)],
  ]
  return (
    <div className="card stats">
      {stats.map(([k, v]) => <div className="stat" key={k}>{k}<b>{v}</b></div>)}
      {pool.yieldAvailable < 1 && P.totalCapital(pool) > 0 && <p className="note">Rendimiento agotado: Préstamos nuevos frenados.</p>}
    </div>
  )
}
