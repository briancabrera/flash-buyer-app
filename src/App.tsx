import type React from "react"
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react"
import { IonReactRouter } from "@ionic/react-router"
import { Redirect, Route } from "react-router-dom"
import Home from "./pages/Home/Home"
import FloatingLightningBolts from "./components/FloatingLightningBolts/FloatingLightningBolts"
import { fadeAnimation } from "./animations/fadeAnimation"
import FacialRecognition from "./pages/FacialRecognition/FacialRecognition"
import { isPosBuyerEnabled } from "./services/featureFlags"
import PosBuyer from "./pages/PosBuyer/PosBuyer"
import Settings from "./pages/Settings/Settings"
import { TerminalProvisioningGate } from "./components/TerminalProvisioningGate"

setupIonicReact({
  animated: true,
  mode: "ios",
  swipeBackEnabled: false,
  navAnimation: fadeAnimation
})

const App: React.FC = () => {
  const posEnabled = isPosBuyerEnabled()
  return (
    <IonApp>
      <TerminalProvisioningGate>
        <FloatingLightningBolts />
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/home">
              <Home />
            </Route>
            <Route exact path="/settings">
              <Settings />
            </Route>
            <Route exact path="/facial-recognition">
              <FacialRecognition />
            </Route>
            {posEnabled ? (
              <Route exact path="/pos">
                <PosBuyer />
              </Route>
            ) : null}
            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
          </IonRouterOutlet>
        </IonReactRouter>
      </TerminalProvisioningGate>
    </IonApp>
  )
}

export default App

