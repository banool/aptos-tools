import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createHashHistory, createRouter } from '@tanstack/react-router';
import { AptosProvider } from './contexts/AptosContext';
import './styles/index.css';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create hash history for GitHub Pages compatibility
const hashHistory = createHashHistory();

// Create a new router instance with hash history
const router = createRouter({ 
  routeTree,
  history: hashHistory,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AptosProvider>
      <RouterProvider router={router} />
    </AptosProvider>
  </React.StrictMode>,
);
