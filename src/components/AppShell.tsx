import type { CSSProperties } from 'react'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { colorById, DEFAULT_FOLDER } from '../colors'
import { useApp } from '../context/AppContext'
import { CategoryBar } from './CategoryBar'
import { CategoryDeleteFooter } from './CategoryDeleteFooter'
import { DaysPanel } from './DaysPanel'
import { DuitMark } from './DuitMark'
import { TodoColumn } from './TodoColumn'

export function AppShell() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const { getCategory } = useApp()
  const category = categoryId ? getCategory(categoryId) : undefined

  // If the URL points at a removed category, keep the shell mounted and
  // quietly rewrite to home (avoids a blank-frame flash from <Navigate>).
  useEffect(() => {
    if (categoryId && !category) {
      navigate('/', { replace: true })
    }
  }, [categoryId, category, navigate])

  const activeCategoryId = category ? (categoryId ?? null) : null
  const title = category ? category.name : 'todo'
  const palette = category ? colorById(category.colorId) : DEFAULT_FOLDER

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
        <p className="brand-bar__tag">do it · then archive it</p>
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
            <TodoColumn categoryId={activeCategoryId} title={title} />
            <DaysPanel categoryId={activeCategoryId} />
          </div>
          {category && activeCategoryId ? (
            <CategoryDeleteFooter categoryId={activeCategoryId} />
          ) : (
            <div className="folder-footer folder-footer--spacer" aria-hidden />
          )}
        </div>
      </div>
    </div>
  )
}
