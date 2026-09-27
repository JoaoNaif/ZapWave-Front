import { Link } from 'react-router'

export function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      <Link to="/register">Criar conta</Link> | <Link to="/">Home</Link>
    </div>
  )
}
