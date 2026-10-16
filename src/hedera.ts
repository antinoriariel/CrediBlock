// Adaptador fino a Hedera testnet. Sin credenciales (o sin red) devuelve null y la demo sigue simulada.
// shortcut: la clave va en el bundle del cliente, solo válido para testnet de demo; mover a un backend si sale de ahí.
import type { Client } from '@hashgraph/sdk'

type Sdk = typeof import('@hashgraph/sdk')
type Conn = { sdk: Sdk; client: Client }

const ACCOUNT = import.meta.env.VITE_HEDERA_ACCOUNT_ID as string | undefined
const KEY = import.meta.env.VITE_HEDERA_PRIVATE_KEY as string | undefined

let ready: Promise<Conn> | undefined
const connect = () =>
  (ready ??= import('@hashgraph/sdk').then((sdk) => ({
    sdk,
    client: sdk.Client.forTestnet().setOperator(ACCOUNT!, sdk.PrivateKey.fromStringDer(KEY!)),
  })))

const explorer = (path: string) => `https://hashscan.io/testnet/${path}`

async function run(fn: (c: Conn) => Promise<string>) {
  if (!ACCOUNT || !KEY) return null
  try {
    return await fn(await connect())
  } catch (e) {
    console.warn('Hedera no disponible, se sigue con datos simulados', e)
    return null
  }
}

export const mintParticipation = (lender: string, amount: number) =>
  run(async ({ sdk, client }) => {
    const tx = await new sdk.TokenCreateTransaction()
      .setTokenName(`CrediBlock ${lender}`)
      .setTokenSymbol('CRB')
      .setDecimals(0)
      .setInitialSupply(Math.round(amount))
      .setTreasuryAccountId(ACCOUNT!)
      .execute(client)
    const id = (await tx.getReceipt(client)).tokenId!
    return explorer(`token/${id}`)
  })

let topic: string | undefined
export const logHistory = (message: string) =>
  run(async ({ sdk, client }) => {
    if (!topic) {
      const t = await new sdk.TopicCreateTransaction().setTopicMemo('CrediBlock Historial').execute(client)
      topic = (await t.getReceipt(client)).topicId!.toString()
    }
    const m = await new sdk.TopicMessageSubmitTransaction().setTopicId(topic).setMessage(message).execute(client)
    await m.getReceipt(client)
    return explorer(`topic/${topic}`)
  })
