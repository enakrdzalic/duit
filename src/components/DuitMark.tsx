type Props = {
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

export function DuitMark({ size = 'md', animate = true }: Props) {
  return (
    <span
      className={`duit-mark duit-mark--${size}${animate ? ' duit-mark--live' : ''}`}
      aria-hidden
    >
      <i />
      <i />
      <i />
    </span>
  )
}
