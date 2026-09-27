import { Link } from 'react-router'

export function HomePage() {
  return (
    <div>
      <h1>Home</h1>
      <Link to="/login">Login</Link>
    </div>
  )
}
