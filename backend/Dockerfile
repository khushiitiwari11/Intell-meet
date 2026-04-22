# Use the official, lightweight Node.js 22 image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies for production
RUN npm install --production

# Copy the rest of your backend code
COPY . .

# Expose the port your Express server uses
EXPOSE 5001

# The command to start your server
CMD ["node", "server.js"]