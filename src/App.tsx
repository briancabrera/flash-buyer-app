import type React from "react"
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react"
import { IonReactRouter } from "@ionic/react-router"
import { Redirect, Route } from "react-router-dom"
import Home from "./pages/Home/Home"
import FloatingLightningBolts from "./components/FloatingLightningBolts/FloatingLightningBolts"
import { fadeAnimation } from "./animations/fadeAnimation"
import FacialRecognition from "./pages/FacialRecognition/FacialRecognition"
import SelectPaymentMethod from "./pages/SelectPaymentMethod/SelectPaymentMethod"
import ConfirmPayment from "./pages/ConfirmPayment/ConfirmPayment"
import PaymentPin from "./pages/PaymentPin/PaymentPin"
import { PaymentProvider } from "./context/PaymentContext"

setupIonicReact({
  animated: true,
  mode: "ios",
  swipeBackEnabled: false,
  navAnimation: fadeAnimation
})

const App: React.FC = () => {
  return (
    <IonApp>
      <PaymentProvider>
        <FloatingLightningBolts />
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/home">
              <Home />
            </Route>
            <Route exact path="/payment-pin">
              <PaymentPin />
            </Route>
            <Route exact path="/facial-recognition">
              <FacialRecognition />
            </Route>
            <Route exact path="/select-payment-method">
              <SelectPaymentMethod />
            </Route>
            <Route exact path="/confirm-payment">
              <ConfirmPayment />
            </Route>
            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
          </IonRouterOutlet>
        </IonReactRouter>
      </PaymentProvider>
    </IonApp>
  )
}

export default App

