# Datheon Full Stack Web Development Internship

Four responsive browser applications built with HTML, CSS, and vanilla JavaScript. Each project is self-contained and can run as a static site without an application server or build step.

## Projects

| Folder | Project | Highlights |
| --- | --- | --- |
| `01-portfolio/` | Developer portfolio | Responsive sections, theme toggle, project detail dialogs |
| `02-task-manager/` | Daymark task manager | CRUD, categories, due dates, filters, search, drag reordering, localStorage |
| `03-weather-dashboard/` | Skyline weather | OpenWeatherMap current conditions, five-day forecast, loading and error states |
| `04-storefront/` | FORME storefront | FakeStoreAPI catalog, filters, persistent cart, tax/shipping, demo checkout |

## Run

Open any project's `index.html` in a modern browser. Weather and storefront need an internet connection for their APIs. To configure weather, copy `03-weather-dashboard/config.example.js` to `config.js` and enter an OpenWeatherMap API key. `config.js` is excluded from Git so the key is not committed.

The portfolio contains sample identity, project, and contact details. Replace these with your own before presenting it. Its resume link expects a `resume.pdf` in the portfolio folder.

## Notes

- Task data and shopping cart data are stored in the browser's localStorage.
- The storefront's checkout is simulated and does not collect payment.
- Static app assets are located alongside each project's `index.html`.
