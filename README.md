# AI DOM Tutor - Admin Panel

A comprehensive admin panel for managing your AI-powered browser tutoring assistant. Built with Next.js, Supabase, and modern web technologies.

## Features

- **User Authentication**: Secure login/registration with Supabase Auth
- **Language Management**: Configure multiple languages with TTS voice settings
- **AI Provider Integration**: Connect to OpenAI, Anthropic, and other AI services
- **Real-time Preview**: Test your AI tutor configuration in real-time
- **Configuration Export/Import**: Backup and restore your complete setup
- **Responsive Design**: Beautiful, production-ready interface

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ai-dom-tutor-admin
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

4. Fill in your Supabase credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set up Database

Run the database migrations in your Supabase SQL editor:

1. Go to your Supabase dashboard → SQL Editor
2. Run each migration file in order:
   - `supabase/migrations/create_languages_table.sql`
   - `supabase/migrations/create_ai_providers_table.sql`
   - `supabase/migrations/create_user_settings_table.sql`

### 4. Deploy Edge Functions

Deploy the Supabase Edge Functions:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy generate-instruction
supabase functions deploy export-config
supabase functions deploy import-config
supabase functions deploy public-config
```

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to access the admin panel.

## Demo Mode

If Supabase is not configured, the application runs in demo mode with:
- **Email**: demo@example.com
- **Password**: demo123

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel pages
│   │   ├── dashboard/     # Main dashboard
│   │   ├── languages/     # Language management
│   │   ├── ai-providers/  # AI provider configuration
│   │   ├── preview/       # Testing interface
│   │   └── settings/      # User settings
├── components/            # Reusable UI components
├── contexts/             # React contexts (Auth, etc.)
├── lib/                  # Utilities and API client
├── supabase/            # Database migrations and functions
│   ├── migrations/      # SQL migration files
│   └── functions/       # Edge functions
└── types/               # TypeScript type definitions
```

## API Endpoints

The application uses Supabase for backend services:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout

### Languages
- `GET /languages` - List user's languages
- `POST /languages` - Create new language
- `PUT /languages/:id` - Update language
- `DELETE /languages/:id` - Delete language

### AI Providers
- `GET /ai-providers` - List user's AI providers
- `POST /ai-providers` - Create new AI provider
- `PUT /ai-providers/:id` - Update AI provider
- `DELETE /ai-providers/:id` - Delete AI provider

### Edge Functions
- `POST /functions/v1/generate-instruction` - Generate AI instruction
- `GET /functions/v1/export-config` - Export configuration
- `POST /functions/v1/import-config` - Import configuration
- `GET /functions/v1/public-config` - Get public configuration

## Database Schema

### Languages Table
- `id` - Unique identifier
- `code` - Language code (en, es, fr, etc.)
- `label` - Display name
- `tts_voice_tag` - Text-to-speech voice identifier
- `is_default` - Default language flag
- `user_id` - Owner reference

### AI Providers Table
- `id` - Unique identifier
- `name` - Provider name (OpenAI, Anthropic, etc.)
- `api_url` - API endpoint URL
- `model` - Model identifier
- `api_key_encrypted` - Encrypted API key
- `languages_supported` - Supported language codes
- `user_id` - Owner reference

### User Settings Table
- `id` - Unique identifier
- `user_id` - User reference
- `default_language_id` - Default language reference
- `active_provider_id` - Active AI provider reference
- `settings_json` - Additional settings

## Security

- **Row Level Security (RLS)**: All tables use RLS to ensure users can only access their own data
- **API Key Encryption**: AI provider API keys are encrypted before storage
- **Authentication Required**: All endpoints require valid Supabase authentication
- **CORS Protection**: Edge functions include proper CORS headers

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms

The application can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the demo mode for examples