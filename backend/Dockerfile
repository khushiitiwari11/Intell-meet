# 1. Use the official Node.js image as the base
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /usr/src/app

# 3. Copy package.json and install dependencies
# We do this before copying the rest of the code to leverage Docker cache
COPY package*.json ./
RUN npm install --production

# 4. Copy the rest of your backend code
COPY . .

# 5. Expose the port your Express server uses
EXPOSE 5001

# 6. The command to start your server
CMD ["node", "server.js"]