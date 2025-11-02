# Paper Portal Frontend

A modern React frontend for the Paper Portal system with sleek design, dark/light mode, and smooth animations.

## Features

- 🎨 Sleek, modern UI with Tailwind CSS
- 🌙 Dark/Light mode toggle
- ✨ Smooth animations with Framer Motion
- 📱 Mobile-first responsive design
- 🔐 JWT-based authentication
- 👨‍🎓 Student dashboard for paper uploads
- 👨‍💼 Admin dashboard for paper management
- 📊 Real-time statistics and filtering

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 20+ (Vite requires Node 20.19+ or 22.12+)
- The Paper Portal backend running on `http://localhost:8000`

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Login.tsx       # Login form
│   │   ├── Register.tsx    # Registration form
│   │   ├── StudentDashboard.tsx  # Student interface
│   │   ├── AdminDashboard.tsx    # Admin interface
│   │   └── ThemeToggle.tsx # Dark/light mode toggle
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx # Authentication state
│   │   └── ThemeContext.tsx # Theme state
│   ├── App.tsx            # Main app component with routing
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles and Tailwind imports
├── public/                # Static assets
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
└── package.json          # Dependencies and scripts
```

## Usage

### Authentication

- **Login**: Use admin or student credentials
- **Register**: Create new student accounts
- **Logout**: Clear session and return to login

### Student Features

- Upload papers with course selection
- View uploaded papers with status
- Filter papers by course, type, year, semester
- Download approved papers

### Admin Features

- Dashboard with statistics overview
- Review pending paper submissions
- Approve or reject papers with reasons
- Manage courses (create, edit, delete)
- View all users and papers

## API Integration

The frontend connects to the FastAPI backend at `http://localhost:8000`. Make sure the backend is running before using the frontend.

### Default Credentials

**Admin:**
- Email: `admin@university.edu`
- Password: `admin123`

**Student:**
- Email: `student@university.edu`
- Password: `student123`

## Customization

### Theme Colors

Update colors in `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: {
        500: '#3b82f6', // Blue
        600: '#2563eb',
        700: '#1d4ed8',
      },
      // ... other colors
    },
  },
}
```

### Animations

Modify animations in `tailwind.config.js` or add custom Framer Motion animations in components.

### API Base URL

Update the API base URL in the context files if needed:

```typescript
const API_BASE_URL = 'http://localhost:8000'; // Change if needed
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Troubleshooting

### Node Version Issues

If you see errors about Node version, upgrade to Node.js 20+:

```bash
# Using nvm
nvm install 20
nvm use 20

# Or download from nodejs.org
```

### Backend Connection Issues

- Ensure the backend is running on `http://localhost:8000`
- Check CORS settings in the backend
- Verify API endpoints match

### Build Issues

- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## Contributing

1. Follow the existing code style
2. Use TypeScript for type safety
3. Add animations with Framer Motion
4. Ensure mobile responsiveness
5. Test with both light and dark themes

## License

MIT License
