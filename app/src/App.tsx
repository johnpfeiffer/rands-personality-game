import { RouterProvider, createBrowserRouter, Outlet } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import HomePage from './views/HomePage'
import SurveyPage from './views/SurveyPage'
import ResultPage from './views/ResultPage'

const theme = createTheme({
  palette: { mode: 'light' },
  typography: { fontFamily: '"Georgia", serif' },
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    children: [
      {
        path: ':app',
        element: <HomePage />,
      },
      {
        path: ':app/survey',
        element: <SurveyPage />,
      },
      {
        path: ':app/result/:id',
        element: <ResultPage />,
      },
      {
        index: true,
        element: <HomePage />,
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
