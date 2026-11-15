type Props = {
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
  className?: string
}

export function DuitMark({ size = 'md', animate = true, className }: Props) {
  const classes = [
    'duit-mark',
    `duit-mark--${size}`,
    animate ? 'duit-mark--live' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} aria-hidden>
      <i />
      <i />
      <i />
    </span>
  )
}
