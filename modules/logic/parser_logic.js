const tesseract = require("node-tesseract-ocr")
var httpclient = require("../utils/HttpClient")
const { createWorker } = require( 'tesseract.js');
var General = require("../utils/General.js");
var path = require('path')
const fs = require('fs');
const ImageProcessor = require("../utils/ImageProcessor");
const TemplateModel = require("../models/templatemodel");


class ParserLogic 
{
    static worker = null;

    static parseAllPdfOld(pdfUrl, guidelineInfo)
    {
        console.log('parseAll')
        let promise = new Promise(async (resolve, reject)=>{
            
            let totalForm = 0;
            guidelineInfo.map((info)=>{
                if(info.type == "form")
                    totalForm++;
            })

            ParserLogic.convert2images(pdfUrl).then((images)=>{
                ParserLogic.ocrImages(images, 0, guidelineInfo, totalForm, [], function(results){
                    resolve(results)
                })
            })
        })
        return promise;
    }

    static parseAllPdf(pdfUrl, templateid)
    {
        console.log('parseAllPdf')
        let promise = new Promise(async (resolve, reject)=>{

            let templates = await TemplateModel.findAll({ where: { id: templateid } })

            if(templates.length > 0)
            {
                let template = templates[0];
                let sTemplate = template.tableTemplate;
                sTemplate = atob(sTemplate);
                
                let guidelineInfo = JSON.parse(sTemplate);
                console.log(guidelineInfo)


                let totalForm = 0;
                guidelineInfo.map((info)=>{
                    if(info.type == "form")
                        totalForm++;
                })
                
                ParserLogic.convert2images(pdfUrl).then((images)=>{
                    console.log('images')
                    console.log(images)
                    ParserLogic.ocrImages(images, 0, guidelineInfo, totalForm, [], function(results){

                        console.log("---------results--------")
                        console.log(results)
                        resolve({ success: true, payload: results})
                    })
                })
            }
            else 
            {
                resolve({success: false, message: "No such template"})
            }
            

        })
        return promise;
    }

    static ocrImages(images, idx, guidelineInfo, totalForm, results, callback)
    {
        if(idx < images.length)
        {
            let tmpfile = images[idx].image;
            guidelineInfo.map( (info)=>{
                //console.log("info")
                //console.log(info)

                if(info.type == "form")
                {
                    console.log("process form")
                    console.log(info)
                    ParserLogic.parseForm(tmpfile, info).then((result)=>{
                        info.text = result.payload;
                        results.push(info);
                        
                        if(results.length >= totalForm)
                        {
                            //fs.unlink(tmpfile, function(err){})
                            results.push({ page: images[idx].page, image: tmpfile, results: results});
                            ParserLogic.ocrImages(images, idx + 1, guidelineInfo, totalForm, results, callback)
                        }
                            
                    }).catch((err)=>{
                        console.log("process form error")
                        console.log(err)
                    })
                    
                }
            })

        }
        else
        {
            if(callback != null)
                callback(results)
        }
    }




    static async parseForm(imagePath, form)
    {
        let promise = new Promise( (resolve, reject)=>{
            let rectangle = { top: form.tablePosY, left: form.tablePosX, width: form.width, height: form.height }
            ParserLogic.parse(imagePath, rectangle).then((result)=>{
                console.log("Result in parseForm")
                console.log(result);
                resolve(result)
            }).catch((err)=>{
                reject(err)
            })
        })
        return promise;
    }

    /*
    Get text from image.
    - imagePath: the image to be ocred. It can be local or a http file.
    */
    static async parse(imagePath, rectangle=null, done=true)
    {
        let promise = new Promise(async (resolve, reject)=>{
            
            try {
                let dt1 = Date.now();
            
                //if(worker == null)
                //{
                    const worker = createWorker();
                    await worker.load();
                    await worker.loadLanguage('eng');
                    await worker.initialize('eng');

                //}

                let res = null;
                
                if(rectangle != null)
                    res = await worker.recognize(imagePath, { rectangle: rectangle });
                else
                    res = await worker.recognize(imagePath);

                console.log(res.data.text);

                //if(worker != null && done)
                    await worker.terminate();

                let dt2 = Date.now();

                console.log(dt2 - dt1)
                resolve({success: true, payload: res.data.text})

            }
            catch (err) 
            {
                reject(err);
            }           
            

        })
        return promise;
    }

    static async convert2images(pdfUrl)
    {
        console.log("pdfUrl")
        console.log(pdfUrl)
        let promise = new Promise((resolve, reject)=>{
            let tmpDownloadedPdf = '/tmp/' + General.randomString(10) + ".pdf";
            console.log("tmpDownloadedPdf")
            console.log(tmpDownloadedPdf)
            httpclient.download(pdfUrl, tmpDownloadedPdf ).then(()=>{
                
                ImageProcessor.pdf2images(tmpDownloadedPdf).then((images)=>{
                    console.log("images")
                    console.log(images)
                    resolve(images);
                })
                

                //resolve(tmpDownloadedPdf)
            })
        })

        return promise;
    }
}

module.exports = ParserLogic;