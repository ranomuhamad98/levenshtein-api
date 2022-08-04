const sharp = require('sharp');
const { fromPath } = require( "pdf2pic");
const fs = require('fs');
const pdf = require('pdf-page-counter');
var path = require('path');

const pdfConverter  = require('pdf-poppler');



class ImageProcessor
{
    /*
    To crop image.
    Parameter:
    - originalImage: the original image to be cropped.
    - outputImage: the name of the cropped file name
    - opt: Parameter for cropping { width, height, top, left }
    */
    static async crop(originalImage, outputImage, opt)
    {
        let promise = new Promise((resolve, reject)=>{
            sharp(originalImage).extract(opt).toFile(outputImage)
            .then(function(new_file_info) {
                //console.log("Image cropped and saved");
            })
            .catch(function(err) {
                //console.log("An error occured");
            });
        })
    }

    static async pdf2images(pdfPath)
    {
        let promise = new Promise((resolve, reject)=>{
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
            
        })
        return promise;
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