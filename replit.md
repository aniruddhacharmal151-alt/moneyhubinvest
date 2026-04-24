# Investment Platform

Static frontend (HTML/CSS/JS) using Supabase as the backend.

## Structure
- `index.html` — main app UI
- `css/style.css` — styles
- `js/` — client-side modules (auth, ui, wallet, deposit, withdraw)
- `supabase/` — SQL schema for Supabase
- `server.js` — minimal Node static server (serves on 0.0.0.0:5000)

## Run
The "Static Site" workflow runs `node server.js` on port 5000.

## Deployment
Configured as autoscale running `node server.js`.
