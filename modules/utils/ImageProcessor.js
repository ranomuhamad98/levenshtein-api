//https://www.npmjs.com/package/pdf2pic
const { fromPath } = require( "pdf2pic");
const fs = require('fs');
//const pdf = require('pdf-page-counter');
var path = require('path');
const pdf = require('pdf-parse');

//This cannot run on linux
//const pdfConverter  = require('pdf-poppler');



class ImageProcessor    
{
    

    static async pdf2images(pdfPath, w, h)
    {
        let promise = new Promise((resolve, reject)=>{

            /*
            let dataBuffer = fs.readFileSync(pdfPath);
            
            pdfConverter.info(pdfPath).then(function(data) {
                // number of pages
                let totalPages = data.pages;
                console.log("totalPages")
                console.log(totalPages)
                ImageProcessor.pdf2images_process(pdfPath, totalPages).then((files)=>{
                    resolve(files);
                })
             
            });

            */

            console.log("pdf2Images")


            let totalPages = 1000;
            ImageProcessor.pdf2image(pdfPath, w, h, 1, totalPages, [], function(resultImages){
                console.log("resultImages")
                console.log(resultImages)
                resolve(resultImages)
            })

            
        })
        return promise;
    }

    static async pdf2image(pdfPath, w, h, idx, totalPages, resultimages, callback )
    {
        console.log('pdf2image.size')
        console.log(w)
        console.log(h)
        if(idx <= totalPages)
        {
            console.log("pdf2image " + idx)
            let basename = path.basename(pdfPath)
            let outputfname = basename + ".page-";

            let saveFolder = "/tmp"

            let options =
            {
                quality: 1000,
                density: 1000,
                width: 600,
                height: 600,
                saveFilename: outputfname,
                savePath: saveFolder,
                format: "png",
            }

            if( w != null)
                options.width = w;

            if( h != null)
                options.height = h;

            console.log("options")
            console.log(options)
            
            const storeAsImage = fromPath(pdfPath, options);
            storeAsImage(idx).then((result)=>{
                console.log("result")
                console.log(result)

                resultimages.push({ page: idx, image: saveFolder + "/" + result.name})
                ImageProcessor.pdf2image(pdfPath,  w, h, idx + 1, totalPages, resultimages, callback)
            }).catch((err)=>{
                console.log("error storeAsImage")
                console.log(err)

                if(callback != null)
                    callback(resultimages)
            })
        }
        else 
        {
            if(callback != null)
                callback(resultimages)
        }

    }

    static async pdf2images_process(pdfPath, totalPages)
    {
        let promise = new Promise((resolve, reject)=>{

            ImageProcessor.pdf2image_process(pdfPath, 0, totalPages, [], function(files){
                resolve(files)
            })
            
        })
        return promise;        
    }

    static async pdf2image_process(pdfPath, idx, totalPages, files, callback)
    {
        if(idx < totalPages)
        {
            let basename = path.basename(pdfPath)
            let outputfname = basename + ".page";

            let option = {
                format : 'png',
                out_dir : '/tmp',
                out_prefix : outputfname,
                page : idx,
                scale: 2048
            }

            pdfConverter.convert(pdfPath, option)
            .then(() => {
                console.log("Page " + idx + " is now converted as image");
                files.push({ page: (idx+1), image: "/tmp/" + outputfname + "-" + (idx + 1) + ".png"})
                ImageProcessor.pdf2image_process(pdfPath, idx + 1, totalPages, files, callback)
            })
            .catch(err => {
                console.log('an error has occurred in the pdf converter ' + err)
            })
            
        }
        else
        {
            if(callback != null)
                callback(files);
        }
    }
}

module.exports = ImageProcessor;