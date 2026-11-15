import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type DeleteTodoMode = 'keep' | 'delete'

type Props = {
  categoryName: string
  onConfirm: (mode: DeleteTodoMode) => void
  onCancel: () => void
}

export function DeleteCategoryModal({
  categoryName,
  onConfirm,
  onCancel,
}: Props) {
  const [mode, setMode] = useState<DeleteTodoMode>('keep')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return createPortal(
    <div className="cat-delete-overlay" role="presentation" onClick={onCancel}>
      <div
        className="cat-delete-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cat-delete-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="cat-delete-title">Delete category?</h2>
        <p className="cat-delete-sheet__copy">
          Remove <strong>{categoryName}</strong> from your folder.
        </p>

        <div
          className="cat-delete-toggle"
          role="radiogroup"
          aria-label="What to do with open tasks"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'keep'}
            className={`cat-delete-toggle__option${mode === 'keep' ? ' is-active' : ''}`}
            onClick={() => setMode('keep')}
          >
            <span className="cat-delete-toggle__label">Keep tasks</span>
            <span className="cat-delete-toggle__hint">
              Delete the category and unlabel its tasks.
            </span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'delete'}
            className={`cat-delete-toggle__option${mode === 'delete' ? ' is-active' : ''}`}
            onClick={() => setMode('delete')}
          >
            <span className="cat-delete-toggle__label">Delete all tasks</span>
            <span className="cat-delete-toggle__hint">
              Delete everything, including tasks.
            </span>
          </button>
        </div>

        <div className="cat-delete-sheet__actions">
          <button
            type="button"
            className="cat-delete-sheet__cancel"
            onClick={onCancel}
          >
            Never mind
          </button>
          <button
            type="button"
            className="cat-delete-sheet__confirm"
            onClick={() => onConfirm(mode)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
