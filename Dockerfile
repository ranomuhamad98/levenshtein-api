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


RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

ENV APPLICATION_PORT 8080 
ENV GCP_PROJECT "levenshtein-dev"
ENV GCP_UPLOAD_BUCKET "levenshtein-upload-bucket"
ENV GCP_UPLOAD_FOLDER "images"
ENV DBHOST "34.101.122.219"
ENV DBNAME "levenshtein-api"
ENV DBUSER "nodeuser"
ENV DBPASSWORD "RotiKeju98*"
ENV DBENGINE "postgresql"
ENV UPLOADER_API "https://gcsfileuploader-v2-dot-levenshtein-dev.et.r.appspot.com"
#ENV OCR_API "https://tesseract-ocr-service-owlowcpkna-et.a.run.app"


EXPOSE 8080
CMD [ "node", "app.js" ]
#CMD [ "pm2-runtime", "start", "process.config.js" ]
