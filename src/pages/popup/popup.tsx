/**
 * Popup for quick-saving current tab
 * Shown when clicking the extension icon
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../index.css';

function Popup() {
  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold">Quick Save</h2>
      <p className="text-sm text-muted-foreground">
        Popup functionality coming soon...
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('popup-root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
