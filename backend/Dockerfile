# Use the lightweight Alpine version of Node.js 22
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# Install dependencies strictly from the lockfile for consistent production builds
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose the port your backend runs on
EXPOSE 5001

# Start the application
CMD ["npm", "start"]