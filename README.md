# FinPilot — AI-Powered Financial Intelligence

FinPilot is a full-stack financial intelligence application designed to help users understand their financial habits, assess their risk tolerance, and explore investment markets through personalized recommendations.

The platform combines an interactive dashboard, expense tracking, risk assessment, market comparison, and an AI-powered chatbot in one interface.

## Features

- **Financial Dashboard:** View financial summaries, charts, and insights.
- **Expense Tracker:** Record expenses across eight categories and visualize spending patterns.
- **Risk Assessment:** Evaluate risk tolerance through an interactive questionnaire.
- **Investment Recommendations:** Rank Stocks, Crypto, and Forex using a five-factor recommendation engine.
- **Market Comparison:** Compare markets using visualizations and a feature matrix.
- **AI Chatbot:** Interact with a chatbot powered by the Anthropic Claude API when configured.
- **Authentication:** Register and log in using the available local authentication flow or the optional backend.
- **Profile Management:** View account settings and financial information.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Routing | React Router DOM |
| Charts | Recharts |
| Animations | Framer Motion |
| Notifications | React Hot Toast |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose (optional) |
| Authentication | JWT (backend authentication) |
| AI Integration | Anthropic Claude API (optional) |
| Machine Learning | See the `ml/` directory for the included model artifacts and related files |

## Project Structure

```text
FinPilot/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── .env.example
├── ml/
├── docs/
├── docker-compose.yml
├── package.json
├── package-lock.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- Git
- MongoDB, if you want to use the database-backed functionality
- An Anthropic API key, if you want to enable the Claude-powered chatbot

### 1. Clone the repository

```bash
git clone https://github.com/sid0389/FinPilot.git
cd FinPilot
```

### 2. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

For the frontend-only demo, the README's existing demo credentials are:

- **Email:** `demo@finpilot.app`
- **Password:** `123456789`

### 3. Configure and run the backend

Open a second terminal from the project root:

```bash
cd backend
```

Create a local `.env` file from the example:

```bash
# macOS/Linux
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Configure the required values in `backend/.env`, then install dependencies and start the server:

```bash
npm install
npm run dev
```

Use the port configured by your backend. If it runs on port `5000`, the API base URL will typically be `http://localhost:5000/api`.

### 4. Configure the frontend API URL

If the frontend needs to communicate with the backend, create `frontend/.env` from `frontend/.env.example` and configure:

```env
VITE_API_URL=http://localhost:5000/api
```

Make sure this URL matches the port on which your backend actually runs. Restart the Vite development server after changing environment variables.

## Environment Variables

Configure these values in your local environment files as applicable. The following are examples; check the `.env.example` files and backend code for the exact requirements.

### Backend

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Frontend

```env
VITE_API_URL=http://localhost:5000/api
```

**Security:** Never commit real API keys, database credentials, JWT secrets, or populated `.env` files to GitHub. Keep secrets in your local environment and use the provided example files as templates.

## Optional Integrations

### MongoDB Atlas

1. Create a MongoDB Atlas account.
2. Create a cluster and database user.
3. Configure the required network access.
4. Add your connection string to `MONGODB_URI` in `backend/.env`.

The original project configuration describes a frontend fallback using local storage. Check the relevant application flows to determine which features work without a database.

### Anthropic Claude API

1. Create an API key through the Anthropic Console.
2. Add it to `ANTHROPIC_API_KEY` in `backend/.env`.
3. Start or restart the backend.

The project includes fallback chatbot responses when the API is not configured, according to the existing project documentation.

## Screenshots

Add screenshots of the actual application here to help visitors understand the interface.

Suggested screenshots:
- Landing page
- Financial dashboard
- Expense tracker
- Risk assessment
- Investment recommendation results

Example Markdown for adding a screenshot:

```markdown
![FinPilot Dashboard](docs/screenshots/dashboard.png)
```

Place the corresponding image at `docs/screenshots/dashboard.png`, or update the path to match your actual screenshot.

## Future Improvements

Potential improvements include:
- More comprehensive financial analytics
- Additional investment-market comparison metrics
- Expanded automated testing
- Improved deployment and monitoring
- More detailed model evaluation and documentation

## Disclaimer

FinPilot is an educational project and does not provide professional financial advice. Its recommendations should not be treated as a guarantee of investment performance. Consult a qualified, SEBI-registered investment adviser before making real investment decisions.

## Author

**Siddharth Prajapati**

- GitHub: [@sid0389](https://github.com/sid0389)
- Project Repository: [FinPilot](https://github.com/sid0389/FinPilot)
g