import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import 'mapbox-gl/dist/mapbox-gl.css';
import './index.css';
import { router, queryClient } from './App';
import { AuthProvider } from './context/AuthProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { disableReactDevTools } from '@fvilers/disable-react-devtools';

if (import.meta.env.PROD) disableReactDevTools();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen />
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>,
)
