var fs = require('fs');
var request = require('request');
var progress = require('request-progress');

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
}

module.exports = HttpClient;