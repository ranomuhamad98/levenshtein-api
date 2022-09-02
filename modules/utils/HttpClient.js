var fs = require('fs');
var request = require('request');
var progress = require('request-progress');
const axios = require('axios').default;
const FormData = require('form-data'); // npm install --save form-data


class HttpClient 
{
    /*
    To download image from url to local storage.
    Parameter:
    - uri: the uri of the file to download
    - filename: the name of the downloaded file name
    - onProgress: callback for downloading progress
    */
    static async download(uri, filename, onProgress)
    {
        if(onProgress == null)
            onProgress = function() {}

        let promise = new Promise((resolve, reject)=>{
            progress(request(uri))
            .on('progress', onProgress)
            .on('error', function(error){
                reject(error)
            })
            .on('end', function(){
                resolve();
            })
            .pipe(fs.createWriteStream(filename))
        })

        return promise;
    
    }

    static async post(url, param)
    {
        let promise = new Promise((resolve, reject)=>{
            axios.post(url, param)
            .then(function (response) {
                resolve(response.data);
            })
            .catch(function (error) {
                reject(error);
            });
        });

        return promise;
    }

    static async get(url)
    {
        let promise = new Promise((resolve, reject)=>{
            axios.get(url)
            .then(function (response) {
                resolve(response.data);
            })
            .catch(function (error) {
                reject(error);
            });
        });

        return promise;
    }

    static async upload(url, filepath)
    {
        let promise = new Promise((resolve, reject)=>{
            var formData = new FormData();

            let fname = filepath.split('/');
            fname = fname[fname.length - 1]

            formData.append("file", fs.readFileSync( filepath), fname);
            axios.post(url, formData, {
                headers: {
                    ...formData.getHeaders(),
                }
            }).then((response)=>{
                console.log("response")
                console.log(response.data)
                resolve(response.data)

            }).catch(function (error){
                console.log("error")
                console.log(error)
                reject(error);
            })
        });

        return promise;

    }
}

module.exports = HttpClient;