import { RouterProvider, createBrowserRouter, Outlet } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import HomePage from './views/HomePage'
import SurveyPage from './views/SurveyPage'
import ResultPage from './views/ResultPage'

const theme = createTheme({
  palette: { mode: 'light' },
  typography: {
    fontFamily: 'system-ui, -apple-system, Helvetica, Arial, sans-serif',
    fontSize: 16,
    h1: { fontFamily: '"Sentinel B", Georgia, serif' },
    h2: { fontFamily: '"Sentinel B", Georgia, serif' },
    h3: { fontFamily: '"Sentinel B", Georgia, serif' },
    h4: { fontFamily: '"Sentinel B", Georgia, serif' },
    h5: { fontFamily: '"Sentinel B", Georgia, serif' },
    h6: { fontFamily: '"Sentinel B", Georgia, serif' },
    button: { fontSize: '1rem' },
  },
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
