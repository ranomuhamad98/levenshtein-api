var httpclient = require("../utils/HttpClient")
var General = require("../utils/General.js");
var path = require('path')
const fs = require('fs');
const ImageProcessor = require("../utils/ImageProcessor");
const TemplateModel = require("../models/templatemodel");



class ParserLogic 
{
    static worker = null;

    static parseAllPdf(pdfUrl, templateid)
    {
        //ParserLogic.language = General.randomString(10)
        ParserLogic.language = 'eng';
        //fs.copyFileSync("eng.traineddata", ParserLogic.language + ".traineddata")

        console.log('parseAllPdf')
        let promise = new Promise(async (resolve, reject)=>{

            let templates = await TemplateModel.findAll({ where: { id: templateid } })

            if(templates.length > 0)
            {
                let template = templates[0];
                let sTemplate = template.tableTemplate;
                sTemplate = atob(sTemplate);
                
                let guidelineInfo = JSON.parse(sTemplate);


                let totalForm = 0;
                let totalTable = 0;
                guidelineInfo.map((info)=>{
                    if(info.type == "form")
                        totalForm++;
                    if(info.type == "table")
                        totalTable++;
                })
                
                ParserLogic.convert2images(pdfUrl).then((images)=>{

                    ParserLogic.ocrImages2(images, 0, guidelineInfo, totalForm, totalTable, [], function(results){
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

    static async ocrImages2(images, idx, guidelineInfo, totalForm, totalTable, results, callback)
    {
        if(idx < images.length)
        {
            let [ formRectangles, tableRectangles ] = ParserLogic.createRectangles(guidelineInfo);


            let upload_url = process.env.UPLOADER_API + "/upload/gcs/" + process.env.GCP_PROJECT;
            upload_url += "/" + process.env.GCP_UPLOAD_BUCKET + "/" + process.env.GCP_UPLOAD_FOLDER;

            let fname= images[idx].image;

            httpclient.upload(upload_url, fname).then((response)=>{

                let imgFile = response.payload;
                imgFile = imgFile.replace('gs://', 'https://storage.googleapis.com/')

                imgFile = encodeURIComponent(imgFile)
                let ocrurl = process.env.OCR_API + '/imageboxes2text?url=' + imgFile; 


                let param = { positions: formRectangles };

                
                ParserLogic.remoteOcrEffort = 0;
                ParserLogic.remoteOcr(ocrurl, param, function(formOcrResult){

                    ParserLogic.ocrTable(imgFile, tableRectangles, 0, [], function (allTableOcrResults){
                        let allResults = { formOcrResult: formOcrResult.payload, tableOcrResult: allTableOcrResults }
                        results.push({ page: idx + 1, allResults: allResults })

                        ParserLogic.ocrImages2(images, idx + 1, guidelineInfo, totalForm, totalTable, results, callback)
                    })
                }, null)

                //console.log("Done remote ocr")

            }).catch((err)=>{
                //console.log(err)
                console.log("error");
            })


        }
        else 
        {
            if(callback != null)
                callback(results);
        }

    }

    static ocrTable(imageFile, tableRectangles, idx, results, callback)
    {
        
        if(idx < tableRectangles.length)
        {
            let ocrurl = process.env.OCR_API + '/image2dboxes2text?url=' + imageFile; 

            let tableRectangle = tableRectangles[idx];

            let param = { positions: tableRectangle.tableRectangles };

            ParserLogic.remoteOcr(ocrurl, param, function(tableOcrResult){

                results.push({ tableID: tableRectangle.tableID, result: tableOcrResult.payload } )

                ParserLogic.ocrTable(imageFile, tableRectangles, idx + 1, results, callback)

            }, null)

        }
        else 
        {
            if(callback != null)
                callback(results);
        }
    }

    static remoteOcr(ocrurl, param, callback, callbackError)
    {
        ParserLogic.remoteOcrAgain(ocrurl, param, function(response2){

            if(callback != null)
                callback({ success: true, payload: response2 })

        }, function(err){
            ParserLogic.remoteOcrEffort++;

            if(ParserLogic.remoteOcrEffort < 10)
            {
                ParserLogic.remoteOcr(ocrurl, param, callback, callbackError)
            }
            else 
            {
                if(callbackError != null)
                    callbackError();
            }
            
        }) 
    }

    static remoteOcrAgain(ocrurl, param, callback, callbackError)
    {
        httpclient.post(ocrurl, param).then((response2)=>{

            if(callback != null)
                callback(response2)

        }).catch((err)=>{
            console.log('err')
            if(callbackError != null)
                callbackError(err)
        })
    }

    static createRectangles(guidelineInfo)
    {
        let formRectangles = [];
        let tableRectangles = [];

        guidelineInfo.map((info, idx)=>{

            let rect = {}
            if(info.type == "form")
            {
                rect = {x: info.tablePosX, y: info.tablePosY, w: info.width, h: info.height, fieldname: info.fieldname, tableID: info.tableId }
                formRectangles.push(rect)
            }
            else if(info.type == "table")
            {
                let headers = info.headers;
                let rowHeight = info.rows[0][0].height;
                let initialY = info.rows[0][0].y;

                let rectangleRows = [];
                let maxRows = 40;

                for(let i=0; i < maxRows; i++)
                {
                    let newRow = [];
                    for(let j = 0; j < headers.length; j++)
                    {
                        let header = headers[j];
                        let newCell = { x: header.x, y: initialY + (rowHeight * i) , w:header.width, h: rowHeight, row: i, col: j }
                        newCell.fieldname = header.fieldname;
                        newRow.push(newCell);
                    }
                    rectangleRows.push(newRow);
                }

                tableRectangles.push({ tableID: info.tableId, tableRectangles: rectangleRows});
            }
            
        })

        return [ formRectangles, tableRectangles ]
    }


    static async convert2images(pdfUrl)
    {

        let promise = new Promise((resolve, reject)=>{
            let tmpDownloadedPdf = '/tmp/' + General.randomString(10) + ".pdf";

            httpclient.download(pdfUrl, tmpDownloadedPdf ).then(()=>{
                
                ImageProcessor.pdf2images(tmpDownloadedPdf).then((images)=>{

                    resolve(images);
                })
                

                //resolve(tmpDownloadedPdf)
            })
        })

        return promise;
    }
}

module.exports = ParserLogic;