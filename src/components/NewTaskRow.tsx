import { useState, type KeyboardEvent } from 'react'

type Props = {
  onSubmit: (text: string) => void
  placeholder?: string
}

export function NewTaskRow({ onSubmit, placeholder = 'new todo…' }: Props) {
  const [text, setText] = useState('')

  const commit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setText('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    }
  }

  return (
    <div className="task-row task-row--new">
      <span className="task-row__check task-row__check--ghost" aria-hidden />
      <input
        className="task-row__input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        aria-label="Add new todo"
      />
    </div>
  )
}
