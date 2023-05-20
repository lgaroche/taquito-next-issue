import { useState, useEffect, useCallback } from "react"

import { TezosToolkit, ContractAbstraction, Wallet } from "@taquito/taquito"
import { BeaconWallet } from "@taquito/beacon-wallet"
import { AccountInfo, NetworkType, ColorMode } from "@airgap/beacon-types"

export default function Home() {
  const [Tezos, setTezos] = useState<TezosToolkit>()
  const [wallet, setWallet] = useState<BeaconWallet>()
  const [account, setAccount] = useState<AccountInfo>()
  const [contract, setContract] = useState<ContractAbstraction<Wallet>>()
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<string>("")
  const [value, setValue] = useState<number>()

  useEffect(() => {
    const Tezos = new TezosToolkit("https://ghostnet.smartpy.io")
    setTezos(Tezos)
  }, [])

  useEffect(() => {
    if (Tezos) {
      const wallet = new BeaconWallet({
        name: "Taquito Boilerplate",
        colorMode: ColorMode.DARK,
      })
      setWallet(wallet)
      Tezos.setWalletProvider(wallet)
      wallet.client.getActiveAccount().then(setAccount)
    }
  }, [Tezos])

  const connect = useCallback(async () => {
    if (wallet) {
      await wallet.requestPermissions({
        network: {
          type: NetworkType.GHOSTNET,
          rpcUrl: "https://ghostnet.smartpy.io",
        },
      })
      setAccount(await wallet.client.getActiveAccount())
    }
  }, [wallet])

  const disconnect = useCallback(async () => {
    if (wallet) {
      await wallet.client.removeAllAccounts()
      setAccount(undefined)
    }
  }, [wallet])

  useEffect(() => {
    if (Tezos) {
      Tezos.wallet.at("KT1QMGSLynvwwSfGbaiJ8gzWHibTCweCGcu8").then(setContract)
    }
  }, [Tezos, account])

  const update = useCallback(async () => {
    if (contract) {
      const storage: any = await contract.storage()
      setValue(storage.toNumber())
    }
  }, [contract])

  useEffect(() => {
    update()
  }, [update])

  const increment = useCallback(async () => {
    if (Tezos && account && contract) {
      setLoading(true)
      setResult("")
      try {
        const operation = await contract.methods.increment(1).send()
        setResult(`Waiting for ${operation.opHash}`)
        await operation.confirmation(1)
        console.log(operation)
        setResult(`Operation ${operation.opHash}: ${await operation.status()}`)
        update()
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false)
      }
    }
  }, [Tezos, account, contract, update])

  const decrement = useCallback(async () => {
    if (Tezos && account && contract) {
      setLoading(true)
      setResult("")
      try {
        const operation = await contract.methods.decrement(1).send()
        setResult(`Waiting for ${operation.opHash}`)
        await operation.confirmation(1)
        console.log(operation)
        setResult(`Operation ${operation.opHash}: ${await operation.status()}`)
        update()
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false)
      }
    }
  }, [Tezos, account, contract, update])

  return (
    <main>
      <h1>Counter test</h1>
      <section>
        {account ? (
          <button onClick={disconnect}>disconnect</button>
        ) : (
          <button onClick={connect}>connect</button>
        )}
        <code>{account?.address}</code>
      </section>
      <section>
        <code>value: {value}</code>
        <button
          role="button"
          onClick={increment}
          disabled={loading || !account}
        >
          {loading ? "Loading..." : "increment"}
        </button>
        <button
          role="button"
          onClick={decrement}
          disabled={loading || !account}
        >
          {loading ? "Loading..." : "decrement"}
        </button>
        <button onClick={update}>update</button>
        <div>
          <code>{result}</code>
        </div>
      </section>
    </main>
  )
}
