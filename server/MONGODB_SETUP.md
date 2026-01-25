# MongoDB Setup Guide

## Installation

### Windows
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Install MongoDB
3. MongoDB will start automatically as a Windows service

### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

## Configuration

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Set MongoDB connection (optional):**
   - Default: `mongodb://localhost:27017/sunny_beach`
   - Create `.env` file if you want to customize:
     ```
     MONGODB_URI=mongodb://localhost:27017/sunny_beach
     PORT=3001
     JWT_SECRET=your-secret-jwt-key-change-this-in-production
     ```

3. **Start the server:**
   ```bash
   npm start
   ```

## Verify MongoDB is Running

- Check if MongoDB is running: Open MongoDB Compass or run `mongosh` in terminal
- Default connection: `mongodb://localhost:27017`

## Database Structure

MongoDB will automatically create collections when first document is inserted:
- `users` - User accounts
- `reservations` - Table reservations
- Other collections will be created as needed

No manual database creation needed! 🎉
