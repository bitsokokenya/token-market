############################################################
# Dockerfile to build datex server container
# Based on Node.js LTS version
############################################################
# Author: Bitsoko Services
# Contact: support@bitsoko.org
# Created: 2024
# Version: 1.0.0
#
# Usage Instructions:
# 1. Build the image:
#    docker build -t tokenmarket .
#
# 2. Run in production mode:
#    docker run -p 1234:1234 -e NODE_ENV=production tokenmarket
#
# 3. Run in development mode:
#    docker run -p 1234:1234 -v $(pwd):/app --name tokenmarket -e NODE_ENV=development tokenmarket
#
# 4. Run with environment variables:
#    docker run -p 1234:1234 -e NODE_ENV=production -e API_KEY=your_key tokenmarket
#
# Use Node.js LTS as base image
FROM node:18-slim

# Install git and other required packages
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install global dependencies if needed
RUN yarn global add typescript ts-node

# Clone the repository
RUN git clone https://github.com/bitsokokenya/token-market.git .

# Verify installation
RUN yarn --version && node --version

# Install dependencies
RUN yarn install
# Build the application for production
#RUN yarn build

# Expose port 3000 for the application
EXPOSE 1234

# Create an entrypoint script
RUN echo '#!/bin/sh\n\
cd /app\n\
git pull\n\
if [ "$NODE_ENV" = "production" ]; then\n\
    echo "Running in production mode..."\n\
    yarn start\n\
else\n\
    echo "Running in development mode..."\n\
    yarn dev\n\
fi' > /entrypoint.sh && \
chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]

