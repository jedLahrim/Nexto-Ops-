# Base image
FROM node:23.5.0

# Create app directory
WORKDIR /app

ARG PORT=3000
ENV PORT=$PORT

# A wildcard is used to ensure both package.assets AND package-lock.assets are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000

# Creates a "dist" folder with the production build
RUN npm run build

# Start the server using the production build
CMD ["npm", "run", "start:prod"]
