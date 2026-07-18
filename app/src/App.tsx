import { RouterProvider, createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import HomePage from './views/HomePage'
import SurveyPage from './views/SurveyPage'
import ResultPage from './views/ResultPage'

export type AppContext = { app: string }

function AppLayout() {
  const { app = '' } = useParams()
  return <Outlet context={{ app } satisfies AppContext} />
}

const theme = createTheme({ palette: { mode: 'light' } })

const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    children: [
      {
        path: ':app',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: 'survey',
            element: <SurveyPage />,
          },
          {
            path: 'result/:id',
            element: <ResultPage />,
          },
        ],
      },
      {
        index: true,
        element: <Navigate to="/rands" replace />,
      },
    ],
  },
])

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
