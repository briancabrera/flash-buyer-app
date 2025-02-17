import { type Animation, createAnimation } from "@ionic/react"

export const fadeAnimation = (baseEl: HTMLElement, opts?: any): Animation => {
  const { enteringEl, leavingEl } = opts

  const enteringAnimation = createAnimation().addElement(enteringEl).fromTo("opacity", "0", "1").duration(300)

  const leavingAnimation = createAnimation().addElement(leavingEl).fromTo("opacity", "1", "0").duration(300)

  return createAnimation().addAnimation(enteringAnimation).addAnimation(leavingAnimation)
}

