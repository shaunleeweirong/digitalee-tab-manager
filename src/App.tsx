/**
 * Root App component
 * Renders home screen with toast notifications
 */

import HomePage from '@/pages/HomePage';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <HomePage />
      <Toaster 
        position="bottom-right"
        theme="system"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          }
        }}
      />
    </>
  );
}

export default App;
