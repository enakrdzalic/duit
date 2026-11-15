import { useEffect, useRef } from 'react'

type Props = {
  body: string
  onChange: (body: string) => void
  onClose: () => void
  onRemove: () => void
  /** Focus the textarea on open (new notes only — not when reopening existing). */
  autoFocus?: boolean
}

export function StickyNote({
  body,
  onChange,
  onClose,
  onRemove,
  autoFocus = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!autoFocus) return
    // Avoid popping the keyboard / zooming the page on phones.
    const finePointer = window.matchMedia('(pointer: fine)').matches
    if (finePointer) textareaRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="sticky-note"
      role="dialog"
      aria-label="Sticky note"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="sticky-note__bar">
        <span className="sticky-note__title">note</span>
        <div className="sticky-note__actions">
          <button
            type="button"
            className="sticky-note__remove"
            onClick={onRemove}
            title="Remove note"
          >
            Remove
          </button>
          <button
            type="button"
            className="sticky-note__close"
            aria-label="Close note"
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className="sticky-note__body"
        value={body}
        placeholder="Jot something down…"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
