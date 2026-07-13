import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './routes/Home'
import { Lesson } from './routes/Lesson'
import { Analysis } from './routes/Analysis'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'lesson/:slug', element: <Lesson /> },
      { path: 'analysis', element: <Analysis /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
