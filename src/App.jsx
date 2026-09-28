import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MobileActionBar from './components/MobileActionBar'
import ScrollManager from './components/ScrollManager'
import Home from './pages/Home'
import Book from './pages/Book'
import Checkout from './pages/Checkout'
import Confirmation from './pages/Confirmation'
import NotFound from './pages/NotFound'

export default function App() {
  const { pathname } = useLocation()
  const flow = ['/book', '/checkout', '/confirmation'].includes(pathname)
  return (
    <>
      <ScrollManager />
      <Navbar />
      <main className={flow ? 'main main--flow' : 'main'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<Book />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!flow && <Footer />}
      <MobileActionBar />
    </>
  )
}
