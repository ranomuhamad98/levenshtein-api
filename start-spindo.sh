gcloud config configurations activate lvsaas
rm .env
cp .env-spindo .env
rm Dockerfile
cp Dockerfile-spindo Dockerfile
node app.js
