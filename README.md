# noso Company

A modern full-stack web application built with **FastAPI** (Python) backend and **React + TypeScript** frontend with Vite.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [MongoDB Installation](#mongodb-installation)
  - [Windows](#windows)
  - [macOS](#macos)
  - [Linux (Ubuntu/Debian)](#linux-ubuntudebian)
  - [Linux (CentOS/RHEL)](#linux-centosrhel)
- [Project Setup](#project-setup)
  - [Clone the Repository](#clone-the-repository)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [Tech Stack](#tech-stack)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

Before you begin, ensure you have the following installed on your system:

| Tool | Version | Download Link |
|------|---------|---------------|
| **Node.js** | v18.x or higher | [nodejs.org](https://nodejs.org/) |
| **npm** | v9.x or higher | Comes with Node.js |
| **Python** | v3.10 or higher | [python.org](https://www.python.org/downloads/) |
| **pip** | Latest | Comes with Python |
| **MongoDB** | v6.x or higher | See installation guide below |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

---

## 🍃 MongoDB Installation

MongoDB is required as the database for this project. Follow the instructions for your operating system.

### Windows

#### Option 1: MongoDB Installer (Recommended)

1. **Download MongoDB Community Server**
   - Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Select **Windows**, choose the **MSI** package
   - Download and run the installer

2. **Run the Installer**
   ```
   - Choose "Complete" installation
   - ✅ Check "Install MongoDB as a Service"
   - ✅ Check "Install MongoDB Compass" (GUI tool, optional)
   - Click Install
   ```

3. **Add MongoDB to PATH** (if not done automatically)
   ```powershell
   # Add to System Environment Variables
   # Default path: C:\Program Files\MongoDB\Server\6.0\bin
   ```

4. **Verify Installation**
   ```powershell
   mongod --version
   mongosh --version
   ```

5. **Start MongoDB Service**
   ```powershell
   # MongoDB runs as a Windows service automatically
   # To start/stop manually:
   net start MongoDB
   net stop MongoDB
   ```

#### Option 2: Using Chocolatey

```powershell
# Install Chocolatey first (if not installed)
# Run PowerShell as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install MongoDB
choco install mongodb
```

---

### macOS

#### Option 1: Homebrew (Recommended)

1. **Install Homebrew** (if not installed)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Add MongoDB Tap**
   ```bash
   brew tap mongodb/brew
   ```

3. **Install MongoDB Community Edition**
   ```bash
   brew install mongodb-community@7.0
   ```

4. **Start MongoDB**
   ```bash
   # Start as a background service
   brew services start mongodb-community@7.0
   
   # Or run manually in foreground
   mongod --config /usr/local/etc/mongod.conf --fork
   ```

5. **Verify Installation**
   ```bash
   mongod --version
   mongosh --version
   ```

6. **Stop MongoDB**
   ```bash
   brew services stop mongodb-community@7.0
   ```

#### Option 2: Manual Download

1. Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Extract and move to `/usr/local/mongodb`
3. Add to PATH in `~/.zshrc` or `~/.bash_profile`:
   ```bash
   export PATH="/usr/local/mongodb/bin:$PATH"
   ```

---

### Linux (Ubuntu/Debian)

1. **Import MongoDB Public GPG Key**
   ```bash
   curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
      sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
      --dearmor
   ```

2. **Create List File**
   
   For **Ubuntu 22.04 (Jammy)**:
   ```bash
   echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   ```
   
   For **Ubuntu 20.04 (Focal)**:
   ```bash
   echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   ```

3. **Update and Install MongoDB**
   ```bash
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   ```

4. **Start MongoDB**
   ```bash
   # Start the service
   sudo systemctl start mongod
   
   # Enable auto-start on boot
   sudo systemctl enable mongod
   
   # Check status
   sudo systemctl status mongod
   ```

5. **Verify Installation**
   ```bash
   mongod --version
   mongosh
   ```

---

### Linux (CentOS/RHEL)

1. **Create Repo File**
   ```bash
   sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo << 'EOF'
   [mongodb-org-7.0]
   name=MongoDB Repository
   baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/7.0/x86_64/
   gpgcheck=1
   enabled=1
   gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
   EOF
   ```

2. **Install MongoDB**
   ```bash
   sudo yum install -y mongodb-org
   ```

3. **Start MongoDB**
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   sudo systemctl status mongod
   ```

4. **Verify Installation**
   ```bash
   mongod --version
   mongosh
   ```

---

## 🚀 Project Setup

### Clone the Repository

```bash
git clone https://github.com/TechyNilesh/noso-Company.git
cd noso-Company
```

---

### Backend Setup

1. **Navigate to Backend Directory**
   ```bash
   cd backend
   ```

2. **Create Virtual Environment**
   
   **macOS/Linux:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   python -m venv venv
   venv\Scripts\activate.bat
   ```
   
   **Windows (PowerShell):**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**
   ```bash
   # Create .env file (if not exists)
   cp .env.example .env
   
   # Or create manually with required variables
   ```
   
   Edit the `.env` file and update the following:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/
   DB_NAME=noso_company
   
   # Security (Generate a new secret key for production)
   SECRET_KEY=your-secure-secret-key-here
   
   # Optional: Stripe keys (for payment integration)
   STRIPE_SECRET_KEY=sk_test_your_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key
   ```

5. **Verify MongoDB Connection**
   ```bash
   # Ensure MongoDB is running
   mongosh
   # Should connect to mongodb://localhost:27017
   ```

---

### Frontend Setup

1. **Navigate to Frontend Directory**
   ```bash
   cd frontend
   # Or from project root:
   cd ../frontend
   ```

2. **Install Node Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   # Create .env file (if not exists)
   cp .env.example .env
   ```
   
   Edit the `.env` file:
   ```env
   VITE_ENV=development
   VITE_API_URL=http://localhost:8080/api
   VITE_FRONTEND_URL=http://localhost:5173
   ```

---

## ▶️ Running the Application

### Start All Services

You'll need **3 terminal windows** to run the full application:

#### Terminal 1: MongoDB

```bash
# If not running as a service:
mongod

# If using Homebrew (macOS):
brew services start mongodb-community@7.0

# If using systemd (Linux):
sudo systemctl start mongod
```

#### Terminal 2: Backend (FastAPI)

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app:app --reload --host 0.0.0.0 --port 8080
```

The backend API will be available at: **http://localhost:8080**

API Documentation: **http://localhost:8080/docs**

#### Terminal 3: Frontend (Vite + React)

```bash
cd frontend
npm run dev
```

The frontend will be available at: **http://localhost:5173**

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `ENV` | Environment mode | `development` |
| `DEBUG` | Enable debug mode | `True` |
| `SECRET_KEY` | JWT secret key | - |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/` |
| `DB_NAME` | Database name | `noso_company` |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | - |
| `CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:3000", "http://localhost:5173"]` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_ENV` | Environment mode | `development` |
| `VITE_API_URL` | Backend API URL | `http://localhost:8080/api` |
| `VITE_FRONTEND_URL` | Frontend URL | `http://localhost:5173` |

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **MongoDB** - NoSQL database
- **PyMongo** - MongoDB driver for Python
- **Pydantic** - Data validation
- **Python-Jose** - JWT authentication
- **Stripe** - Payment processing

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **React Router** - Client-side routing
- **Zustand** - State management
- **Tailwind CSS** - Utility-first CSS
- **Axios** - HTTP client
- **Lucide React** - Icons

---

## ❓ Troubleshooting

### MongoDB Connection Issues

**Error: `MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017`**

- Ensure MongoDB is running:
  ```bash
  # Linux
  sudo systemctl status mongod
  
  # macOS
  brew services list
  
  # Windows - Check Services or run:
  net start MongoDB
  ```

**Error: `Permission denied` on Linux**

```bash
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown mongodb:mongodb /tmp/mongodb-27017.sock
sudo systemctl restart mongod
```

### Python Virtual Environment Issues

**Error: `python: command not found`**

- Use `python3` instead of `python`
- Or create an alias: `alias python=python3`

**Error: `pip: command not found`**

```bash
# Use pip3
pip3 install -r requirements.txt

# Or upgrade pip
python3 -m pip install --upgrade pip
```

### Node.js / npm Issues

**Error: `EACCES permission denied`**

```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

**Error: `node: command not found`**

- Ensure Node.js is installed and in PATH
- Try reinstalling Node.js using a version manager like [nvm](https://github.com/nvm-sh/nvm)

### Port Already in Use

```bash
# Find process using port 8080 (backend)
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Find process using port 5173 (frontend)
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

---

## 📝 Available Scripts

### Backend

```bash
# Start development server
uvicorn app:app --reload --host 0.0.0.0 --port 8080

# Start production server
uvicorn app:app --host 0.0.0.0 --port 8080 --workers 4
```

### Frontend

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 📄 License

This project is private and proprietary to noso Company.

---

## 👥 Contributors

- noso Company Development Team

---

<p align="center">
  Made with ❤️ by noso Company
</p>
