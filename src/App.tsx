import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AppProvider } from './context/AppContext'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/duit">
        <Routes>
          <Route path="/" element={<AppShell />} />
          <Route path="/c/:categoryId" element={<AppShell />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
