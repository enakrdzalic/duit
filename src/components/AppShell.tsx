import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { colorById, DEFAULT_FOLDER } from '../colors'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { CategoryBar } from './CategoryBar'
import { DaysPanel } from './DaysPanel'
import {
  DeleteCategoryModal,
  type DeleteTodoMode,
} from './DeleteCategoryModal'
import { DuitMark } from './DuitMark'
import { TodoColumn } from './TodoColumn'

export function AppShell() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const { getCategory, deleteCategory } = useApp()
  const { signOut, user } = useAuth()
  const category = categoryId ? getCategory(categoryId) : undefined
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setConfirmDelete(false)
  }, [categoryId])

  // If the URL points at a removed category, keep the shell mounted and
  // quietly rewrite to home (avoids a blank-frame flash from <Navigate>).
  useEffect(() => {
    if (categoryId && !category) {
      navigate('/', { replace: true })
    }
  }, [categoryId, category, navigate])

  const activeCategoryId = category ? (categoryId ?? null) : null
  const title = category ? category.name : 'tasks'
  const palette = category ? colorById(category.colorId) : DEFAULT_FOLDER

  function handleConfirmDelete(mode: DeleteTodoMode) {
    if (!categoryId) return
    setConfirmDelete(false)
    deleteCategory(categoryId, {
      deleteOpenTodos: mode === 'delete',
    })
    navigate('/', { replace: true })
  }

  return (
    <div className="app-shell">
      <div className="sparkle sparkle--a" aria-hidden>
        ✦
      </div>
      <div className="sparkle sparkle--b" aria-hidden>
        ✦
      </div>
      <div className="sparkle sparkle--c" aria-hidden>
        ★
      </div>

      <header className="brand-bar">
        <Link to="/" className="brand">
          <DuitMark size="lg" />
          <h1>düit</h1>
        </Link>
        <div className="brand-bar__right">
          {user ? (
            <button
              type="button"
              className="auth-signout"
              onClick={() => void signOut()}
              title={user.email ?? 'sign out'}
            >
              Sign out
            </button>
          ) : (
            <Link to="/login" className="sync-cta">
              Sign in to sync across devices
            </Link>
          )}
        </div>
      </header>

      <div
        className="folder"
        style={
          {
            '--folder': palette.folder,
            '--folder-deep': palette.tab,
            '--folder-highlight': palette.highlight,
            '--folder-tab-active': palette.folder,
          } as CSSProperties
        }
      >
        <CategoryBar />
        <div className="folder__body">
          <div className="app-main">
            <TodoColumn
              categoryId={activeCategoryId}
              title={title}
              onRequestDelete={
                category ? () => setConfirmDelete(true) : undefined
              }
            />
            <DaysPanel categoryId={activeCategoryId} />
          </div>
        </div>
      </div>

      {confirmDelete && category && (
        <DeleteCategoryModal
          categoryName={category.name}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
