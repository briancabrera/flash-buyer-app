import type React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSpinner,
  IonText,
} from "@ionic/react"
import { clearTerminalToken, getTerminalToken, setTerminalToken } from "../lib/terminalTokenStore"
import { invalidateTerminalTokenCache } from "../lib/api"

type Props = { children: React.ReactNode }

export function TerminalProvisioningGate({ children }: Props) {
  const [loading, setLoading] = useState(true)
  const [hasToken, setHasToken] = useState(false)
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const tok = await getTerminalToken()
        if (cancelled) return
        setHasToken(!!tok)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const canSave = useMemo(() => input.trim().length > 0 && !saving, [input, saving])

  const onSave = async () => {
    const tok = input.trim()
    if (!tok) {
      setError("Ingresá el token del terminal.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await setTerminalToken(tok)
      invalidateTerminalTokenCache()
      setHasToken(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el token.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <IonPage>
        <IonContent fullscreen>
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <IonSpinner name="crescent" />
            <IonText>Loading…</IonText>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  if (hasToken) return <>{children}</>

  return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 18px" }}>
          <div style={{ marginTop: 24, marginBottom: 14 }}>
            <IonText>
              <h2 style={{ margin: 0, fontWeight: 800 }}>Terminal Token</h2>
            </IonText>
            <IonText color="medium">
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                Pegá el token del terminal (Bearer). Se guarda en este dispositivo y se usará para todas las llamadas POS.
              </p>
            </IonText>
          </div>

          <IonItem>
            <IonLabel position="stacked">Token</IonLabel>
            <IonInput
              value={input}
              placeholder="pegá el token…"
              inputmode="text"
              autocapitalize="off"
              autocorrect="off"
              spellcheck={false}
              onIonInput={(e) => setInput(String(e.detail.value ?? ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") void onSave()
              }}
            />
          </IonItem>

          {error && (
            <div style={{ marginTop: 12 }}>
              <IonText color="danger">{error}</IonText>
            </div>
          )}

          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            <IonButton expand="block" disabled={!canSave} onClick={() => void onSave()}>
              {saving ? "Saving…" : "Save & Continue"}
            </IonButton>
            <IonButton
              expand="block"
              fill="outline"
              disabled={saving}
              onClick={() => {
                setInput("")
                setError(null)
              }}
            >
              Clear
            </IonButton>
          </div>

          <div style={{ marginTop: 18 }}>
            <IonButton
              size="small"
              fill="clear"
              color="medium"
              onClick={() => {
                // Defensive: allow ops/dev to ensure a clean slate even if some storage is stuck.
                void clearTerminalToken().finally(() => {
                  invalidateTerminalTokenCache()
                  setInput("")
                  setHasToken(false)
                })
              }}
            >
              Unpair terminal (clear stored token)
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}

