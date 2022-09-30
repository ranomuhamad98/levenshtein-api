export GOOGLE_APPLICATION_CREDENTIALS=/Users/mhuda/Works/Credentials/lv-tennant-spindo-owner.json
export APPLICATION_PORT=8181
rm .env
cp .env-spindo .env
rm Dockerfile
cp Dockerfile-spindo Dockerfile
node app.js
