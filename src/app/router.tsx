import { createBrowserRouter } from 'react-router'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { LoginPage } from '@/pages/login/LoginPage'
import { RegisterPage } from '@/pages/register/RegisterPage'
import { HomePage } from '@/pages/home/HomePage'
import { ConversationPage } from '@/pages/conversation/ConversationPage'
import { RoomPage } from '@/pages/room/RoomPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { ErrorPage } from '@/pages/error/ErrorPage'

export const router = createBrowserRouter([
  {
    // Raiz sem caminho: só existe para o errorElement valer para todas as telas
    errorElement: <ErrorPage />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/dm/:friendId', element: <ConversationPage /> },
          { path: '/room/:roomId', element: <RoomPage /> },
        ],
      },
      // Qualquer outro endereço. Fora dos layouts: aparece logado ou não
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
