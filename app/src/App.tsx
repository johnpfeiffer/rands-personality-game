import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import HomePage from './views/HomePage'
import SurveyPage from './views/SurveyPage'
import ResultPage from './views/ResultPage'

const theme = createTheme({
  palette: { mode: 'light' },
  typography: { fontFamily: '"Georgia", serif' },
})

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
