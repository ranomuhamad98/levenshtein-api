FROM node:16
# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
#COPY .env ./

RUN apt-get update -y
RUN apt-get install ghostscript -y
RUN apt-get install graphicsmagick -y
RUN npm install pm2 -g

ENV GCP_PROCESSING_BUCKET levenshtein-upload-bucket-triggerfunction


RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .


EXPOSE 8080
CMD [ "node", "app.js" ]
#CMD [ "pm2-runtime", "start", "process.config.js" ]
