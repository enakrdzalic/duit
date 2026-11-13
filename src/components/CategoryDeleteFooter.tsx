import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

type Props = {
  categoryId: string
}

export function CategoryDeleteFooter({ categoryId }: Props) {
  const { deleteCategory } = useApp()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    setConfirming(false)
  }, [categoryId])

  return (
    <footer className="folder-footer">
      {confirming ? (
        <div className="folder-footer__confirm">
          <span>Are you sure?</span>
          <button
            type="button"
            className="folder-footer__yes"
            onClick={() => {
              deleteCategory(categoryId)
              setConfirming(false)
              navigate('/', { replace: true })
            }}
          >
            Yes, delete
          </button>
          <button
            type="button"
            className="folder-footer__cancel"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="folder-footer__delete"
          onClick={() => setConfirming(true)}
        >
          delete
        </button>
      )}
    </footer>
  )
}
