# Dockerfile for Next.js application
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and lock file
COPY package.json .

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
