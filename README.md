# MotionMingle

A comprehensive productivity and task management application built with modern web technologies.

## 🚀 Features

- **Task Management**: Create, organize, and track tasks with priority levels and due dates
- **Calendar Integration**: Schedule events and sync with Google Calendar
- **Project Organization**: Group tasks and events into projects for better organization  
- **Time Tracking**: Built-in Pomodoro timer and time logging functionality
- **AI Assistant**: Smart suggestions and natural language task creation
- **File Management**: Upload and organize project-related documents
- **Notes System**: Take and organize notes with project linking
- **Real-time Sync**: Live updates across all features
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Database + Authentication + Storage)
- **State Management**: React Context + Custom Hooks
- **Testing**: Vitest + Playwright
- **AI Integration**: Google Gemini API
- **Calendar Sync**: Google Calendar API

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd motionmingle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with the following variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🧪 Testing

- **Unit Tests**: `npm run test:unit`
- **Integration Tests**: `npm run test:integration`  
- **E2E Tests**: `npm test`
- **Build**: `npm run build`

## 📁 Project Structure

```
src/
├── backend/           # Backend services and database layer
│   ├── database/      # Supabase client and types
│   └── api/services/  # Business logic services
├── frontend/          # Frontend application code
│   ├── components/    # Reusable UI components
│   ├── features/      # Feature-specific components
│   ├── pages/         # Top-level page components
│   ├── hooks/         # Custom React hooks
│   └── utils/         # Utility functions
└── tests/            # Test files (unit, integration, e2e)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

