import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './routes/Home'
import { Lesson } from './routes/Lesson'
import { Analysis } from './routes/Analysis'
import { Play } from './routes/Play'
import { LiveGame } from './routes/LiveGame'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'lesson/:slug', element: <Lesson /> },
        { path: 'analysis', element: <Analysis /> },
        { path: 'play', element: <Play /> },
        { path: 'play/:code', element: <LiveGame /> },
      ],
    },
  ],
  // The site is served from a subpath on GitHub project pages. BASE_URL is "/"
  // everywhere else, which is what the router wants anyway.
  { basename: import.meta.env.BASE_URL },
)

export function App() {
  return <RouterProvider router={router} />
}
