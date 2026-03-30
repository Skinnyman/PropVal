# PropVal GH

PropVal is a modern, full-stack real estate property valuation and moderation platform designed for Valuers and Admins in Ghana. It provides intuitive tools for submitting, moderating, visualizing, and analyzing property data across various regions.

## 🌟 Key Features

### For Valuers
- **Property Submission:** Submit detailed property records with location (GPS verified), market data, and multiple images.
- **Image Gallery & Cloudinary Integration:** Fast and reliable image uploads automatically optimized and hosted on Cloudinary in a dedicated user folder.
- **Valuation Workspace & PDF Generation:** A dedicated workspace to generate comprehensive property valuation reports and instantly download them as structured PDFs.
- **Interactive Mapbox Integration:** View comparable properties on an interactive map. Features include cluster mapping, category filtering (e.g., Residential, Commercial), and a "Get Directions" capability with real-time live GPS tracking.
- **Real-time Notifications:** Receive instant toast notifications and dashboard alerts when a property submission is approved or rejected by an admin.

### For Admins
- **Admin Dashboard:** High-level system analytics, active vs. pending properties, average yield calculations, and system activity logs.
- **Property Moderation:** Dedicated moderation tab to review, approve, or reject property submissions from Valuers.
- **Secure Registration:** Secure Admin registration using unique system initialization secret keys.

## 🛠 Tech Stack

**Frontend:**
- React 19 / React Router v7
- Tailwind CSS v4 for modern, responsive, glass-morphic UI styling
- Mapbox GL JS for interactive map tracking and rendering
- Lucide React for consistent iconography
- Axios for API requests

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose for database modeling
- JSON Web Tokens (JWT) & bcryptjs for secure authentication and authorization
- Multer & Cloudinary for secure file storage and image optimization
- Express Rate Limit and Helmet for API security

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB instance (local or Atlas)
- Mapbox Access Token
- Cloudinary Account credentials

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/PropVal.git
cd PropVal
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ADMIN_SECRET_KEY=your_secret_key_for_admin_registration

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the backend server:
```bash
npm start
```

### 3. Frontend Setup
Open a new terminal and navigate to the client folder:
```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAPBOX_TOKEN=your_mapbox_public_token
```

Start the React application:
```bash
npm start
```

## 🗺 Application Architecture

- `client/src/pages/PropertyExplorer.js`: The central hub for filtering, searching, and visualizing properties on the interactive Mapbox module.
- `client/src/pages/PropertyDetails.js`: In-depth property statistics, dynamic Cloudinary image galleries, and live GPS route tracking.
- `server/routes/properties.js`: Handles securely uploading images through Cloudinary algorithms and storing the exact payload schema references in MongoDB.

## 🔒 Security
- All sensitive API routes are protected by a role-based JWT `auth` middleware.
- Admin signup strictly requires a server-side `ADMIN_SECRET_KEY`.
- The Express server acts as a shield utilizing `helmet` headers and NoSQL injection sanitization.

## 📄 License
This project is proprietary and confidential.
