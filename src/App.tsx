import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './routes/Home'
import { Lesson } from './routes/Lesson'
import { Analysis } from './routes/Analysis'
import { CurriculumReference } from './routes/CurriculumReference'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'lesson/:slug', element: <Lesson /> },
      { path: 'analysis', element: <Analysis /> },
      { path: 'reference', element: <CurriculumReference /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
