import { DuitMark } from './DuitMark'

type Props = {
  fadingOut?: boolean
  onFadedOut?: () => void
}

export function BootScreen({ fadingOut = false, onFadedOut }: Props) {
  return (
    <div
      className={`boot-shell${fadingOut ? ' is-out' : ''}`}
      aria-busy={!fadingOut}
      aria-hidden={fadingOut}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'opacity' && fadingOut) onFadedOut?.()
      }}
    >
      <div className="boot-shell__brand">
        <DuitMark size="lg" animate={false} className="duit-mark--boot" />
        <h1>düit</h1>
      </div>
    </div>
  )
}
