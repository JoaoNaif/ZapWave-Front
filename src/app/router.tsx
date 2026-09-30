import { createBrowserRouter } from 'react-router'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { LoginPage } from '@/pages/login/LoginPage'
import { RegisterPage } from '@/pages/register/RegisterPage'
import { HomePage } from '@/pages/home/HomePage'
import { ConversationPage } from '@/pages/conversation/ConversationPage'
import { RoomPage } from '@/pages/room/RoomPage'

export const router = createBrowserRouter([
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
])
