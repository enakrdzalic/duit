# düit

Local-first todo app: an open list on the left, a rolling **days** archive on the right. Check a todo (or drag it onto a day) and it lands there — past days check automatically; today/future stay open until you check them.

Live at https://enakrdzalic.github.io/duit/

## Features

- Open list with priority block, due dates, recurring todos, and `#` commands
- Days panel (future ↑ / today / past) with drag-and-drop
- Category folders with colors; same list + days UI per category
- Reorder todos by drag; data stays in the browser

## Stack

- **React 19** + **TypeScript**
- **Vite 8**
- **React Router** (home + `/c/:categoryId`)
- **CSS** (no UI framework)
- **localStorage** (`duit-v1`) — no backend or account

## Run

```bash
npm install
npm run dev
```

```bash
npm run build    # production build
npm run preview  # preview the build
```
