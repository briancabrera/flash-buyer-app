import type React from "react"
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react"
import { IonReactRouter } from "@ionic/react-router"
import { Redirect, Route } from "react-router-dom"
import Home from "./pages/Home/Home"
import ChargePayment from "./pages/ChargePayment/ChargePayment"
import ConfirmPayment from "./pages/ConfirmPayment/ConfirmPayment"
import FloatingLightningBolts from "./components/FloatingLightningBolts/FloatingLightningBolts"
import Transactions from "./pages/Transactions/Transactions"

setupIonicReact();

const App: React.FC = () => {
  return (
    <IonApp>
      <FloatingLightningBolts />
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/home">
            <Home />
          </Route>
          <Route exact path="/charge">
            <ChargePayment />
          </Route>
          <Route exact path="/confirm">
            <ConfirmPayment />
          </Route>
          <Route exact path="/transactions">
            <Transactions />
          </Route>
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  )
}

export default App

