var httpclient = require("../utils/HttpClient")
var General = require("../utils/General.js");
var path = require('path')
const fs = require('fs');
const ImageProcessor = require("../utils/ImageProcessor");
const TemplateModel = require("../models/templatemodel");
const PageTemplateModel = require("../models/pagetemplatemodel");
const { Op } = require("sequelize");


class ParserLogic 
{
    static worker = null;

    static parseAllPdf(pdfUrl)
    {
        //ParserLogic.language = General.randomString(10)
        ParserLogic.language = 'eng';
        //fs.copyFileSync("eng.traineddata", ParserLogic.language + ".traineddata")

        console.log('parseAllPdf')
        let promise = new Promise(async (resolve, reject)=>{

                console.log("getPageTemplates")
                ParserLogic.getPageInfoFromPageTemplates(pdfUrl).then((pageInfos)=>{

                    let images = []
                    pageInfos.map((pageInfo)=>{
                        images.push({ page: pageInfo.page, image: pageInfo.pageImageUrl })
                    })

                    console.log("ocrImages2s...")
                    ParserLogic.ocrImages2(images, 0, pageInfos, [], function(results){
                        
                        console.log("ocrImages2 done. With result: ")
                        console.log(JSON.stringify(results))
                        resolve({ success: true, payload: results})

                    }, function(err){
                        reject(err)
                    })
                        


                }).catch((err)=>{
                    reject(err)
                })               

        })
        return promise;
    }

    static parseOnePdf(pdfUrl, page)
    {
        //ParserLogic.language = General.randomString(10)
        ParserLogic.language = 'eng';
        //fs.copyFileSync("eng.traineddata", ParserLogic.language + ".traineddata")

        console.log('parseAllPdf')
        let promise = new Promise(async (resolve, reject)=>{

                console.log("getPageTemplates")
                ParserLogic.getPageInfoFromPageTemplates(pdfUrl).then((pageInfos)=>{

                    let images = []
                    pageInfos.map((pageInfo)=>{
                        if(pageInfo.page == page)
                            images.push({ page: pageInfo.page, image: pageInfo.pageImageUrl })
                    })

                    console.log("ocrImages2s...")
                    ParserLogic.ocrImages2(images, 0, pageInfos, [], function(results){
                        
                        console.log("ocrImages2 done. With result: ")
                        console.log(JSON.stringify(results))
                        resolve({ success: true, payload: results})

                    }, function(err){
                        reject(err)
                    })
                        


                }).catch((err)=>{
                    reject(err)
                })               

        })
        return promise;
    }


    static parseAllPdfOld(pdfUrl)
    {
        //ParserLogic.language = General.randomString(10)
        ParserLogic.language = 'eng';
        //fs.copyFileSync("eng.traineddata", ParserLogic.language + ".traineddata")

        console.log('parseAllPdf')
        let promise = new Promise(async (resolve, reject)=>{

                console.log("getPageTemplates")
                ParserLogic.getPageInfoFromPageTemplates(pdfUrl).then((pageInfos)=>{

                    console.log("convert2images...")
                    ParserLogic.convert2images(pdfUrl, pageInfos).then((images)=>{

                        console.log(images)
                        //resolve({ success: true, payload: images})
    
                        console.log("ocrImages2s...")
                        ParserLogic.ocrImages2(images, 0, pageInfos, [], function(results){
                            
                            console.log("ocrImages2 done")
                            resolve({ success: true, payload: results})

                        }, function(err){
                            reject(err)
                        })
                        
                    }).catch((err)=>{
                        reject(err)
                    })

                }).catch((err)=>{
                    reject(err)
                })               

        })
        return promise;
    }

    static getPageInfoFromPageTemplates(document)
    {
        let promise = new Promise((resolve, reject)=>{

            PageTemplateModel.findAll({ where: { document: { [Op.iLike]: document } } }).then((results)=>{

                let infos = []
                results.map((item)=>{
                    let tableTemplate = item.tableTemplate;
                    tableTemplate = atob(tableTemplate);
                    tableTemplate = JSON.parse(tableTemplate)

                    let infoItem = { page: item.page, width: tableTemplate.imageWidth, height: tableTemplate.imageHeight }
                    infoItem.guidelineInfo = tableTemplate.boxes;
                    infoItem.pageImageUrl = item.pageImageUrl;
                    infos.push(infoItem);
                })

                resolve(infos)

            }).catch((err) => {
                reject(err)
            })

        })

        return promise;
    }


    static async ocrImages2(images, idx, pageInfos, results, callback, callbackError)
    {
        if(idx < images.length)
        {
        //if(idx < 2)
        //{
            let guidelineInfo =  null;
            pageInfos.map((item)=>{
                if(item.page == images[idx].page)
                    guidelineInfo = item.guidelineInfo;
            })

            //console.log("ocrImages2 : guidelineinfo for  " + images[idx].page)
            //console.log(guidelineInfo);

            let [ formRectangles, tableRectangles ] = ParserLogic.createRectangles(guidelineInfo);

            let upload_url = process.env.UPLOADER_API + "/upload/gcs/" + process.env.GCP_PROJECT;
            upload_url += "/" + process.env.GCP_UPLOAD_BUCKET + "/" + process.env.GCP_UPLOAD_FOLDER;

            let fname= images[idx].image;
            fname = fname.replace("gs://", "https://storage.googleapis.com/")

            let imgFile = encodeURIComponent(fname)
            let ocrurl = process.env.OCR_API + '/imageboxes2text?url=' + imgFile; 

            let param = { positions: formRectangles };
            
            ParserLogic.remoteOcrEffort = 0;
            console.log("------> ocrImages2 : remoteOcr for form in page : " + images[idx].page)
            console.log(ocrurl);
            //console.log(JSON.stringify(param))
            ParserLogic.remoteOcr(ocrurl, param, function(formOcrResult){

                console.log("------> Done ocrImages2 : remoteOcr for form in page : " + images[idx].page)
                console.log("------> Starting ocrImages2 : remoteOcr for tables in page : " + images[idx].page)

                ParserLogic.ocrTable(imgFile, tableRectangles, 0, [], [], function (allTableOcrResults, ocrTableErrors){
                    let allResults = { formOcrResult: formOcrResult.payload, tableOcrResult: allTableOcrResults, ocrTableErrors: ocrTableErrors }
                    results.push({ page: images[idx].page, allResults: allResults })

                    ParserLogic.ocrImages2(images, idx + 1, pageInfos, results, callback, callbackError)
                })
            }, function(err)
            {
                console.log("------> Error ocrImages2 : remoteOcr for form in page : " + images[idx].page)
                console.log("------> Starting ocrImages2 : remoteOcr for tables in page : " + images[idx].page)

                ParserLogic.ocrTable(imgFile, tableRectangles, 0, [], [], function (allTableOcrResults, ocrTableErrors){
                    let allResults = { formOcrResult: null, tableOcrResult: allTableOcrResults, ocrTableErrors: ocrTableErrors }
                    results.push({ page: images[idx].page, allResults: allResults })

                    ParserLogic.ocrImages2(images, idx + 1, pageInfos, results, callback, callbackError)
                })

            })



        }
        else 
        {
            if(callback != null)
                callback(results);
        }

    }

    static async ocrImages2Old(images, idx, pageInfos, results, callback, callbackError)
    {
        if(idx < images.length)
        {
            let guidelineInfo =  null;
            pageInfos.map((item)=>{
                if(item.page == images[idx].page)
                    guidelineInfo = item.guidelineInfo;
            })

            console.log("ocrImages2 : guidelineinfo for  " + images[idx].page)
            console.log(guidelineInfo);

            let [ formRectangles, tableRectangles ] = ParserLogic.createRectangles(guidelineInfo);

            let upload_url = process.env.UPLOADER_API + "/upload/gcs/" + process.env.GCP_PROJECT;
            upload_url += "/" + process.env.GCP_UPLOAD_BUCKET + "/" + process.env.GCP_UPLOAD_FOLDER;

            let fname= images[idx].image;

            console.log('ocrImages2: uploading image to be processed ocr-service page : ' + images[idx].page)
            httpclient.upload(upload_url, fname).then((response)=>{

                let imgFile = response.payload;
                imgFile = imgFile.replace('gs://', 'https://storage.googleapis.com/')
                console.log("ocrImages2 : uploaded result : " + imgFile)

                imgFile = encodeURIComponent(imgFile)
                let ocrurl = process.env.OCR_API + '/imageboxes2text?url=' + imgFile; 


                let param = { positions: formRectangles };

                
                ParserLogic.remoteOcrEffort = 0;
                console.log("ocrImages2 : remoteOcr")
                console.log(ocrurl);
                
                ParserLogic.remoteOcr(ocrurl, param, function(formOcrResult){

                    ParserLogic.ocrTable(imgFile, tableRectangles, 0, [],[], function (allTableOcrResults){
                        let allResults = { formOcrResult: formOcrResult.payload, tableOcrResult: allTableOcrResults }
                        results.push({ page: idx + 1, allResults: allResults })

                        ParserLogic.ocrImages2(images, idx + 1, pageInfos, results, callback, callbackError)
                    })
                }, function(err)
                {
                    ParserLogic.ocrTable(imgFile, tableRectangles, 0, [],[], function (allTableOcrResults){
                        let allResults = { formOcrResult: null, tableOcrResult: allTableOcrResults }
                        results.push({ page: idx + 1, allResults: allResults })

                        ParserLogic.ocrImages2(images, idx + 1, pageInfos, results, callback, callbackError)
                    })

                })

                //console.log("Done remote ocr")

            }).catch((err)=>{
                //console.log(err)
                console.log("ocrImages2.error : upload image for ocr seervice");
                i(callbackError != null)
                    callbackError({ success: false, error: err, message : "ocrImages2.error : upload image for ocr seervice"})
            })


        }
        else 
        {
            if(callback != null)
                callback(results);
        }

    }

    static ocrTable(imageFile, tableRectangles, idx, results, errors, callback, callbackError)
    {
        
        if(idx < tableRectangles.length)
        {
            let ocrurl = process.env.OCR_API + '/image2dboxes2text?url=' + imageFile; 
            let tableRectangle = tableRectangles[idx];
            let param = { positions: tableRectangle.tableRectangles };

            console.log("================= ocrTable ========================")
            console.log(ocrurl)
            //console.log(JSON.stringify(param))
            //console.log("================= end of ocrTable ========================")

            ParserLogic.remoteOcr(ocrurl, param, function(tableOcrResult){
                console.log("=================done ocrTable ========================")

                results.push({ tableID: tableRectangle.tableID, result: tableOcrResult.payload } )
                ParserLogic.ocrTable(imageFile, tableRectangles, idx + 1, results, errors, callback, callbackError)

            }, function(err){

                console.log("=================error ocrTable ========================")
                console.log(err)
                errors.push({ tableID: tableRectangle.tableID, result: {}, error: err } )
                ParserLogic.ocrTable(imageFile, tableRectangles, idx + 1, results, errors, callback, callbackError)

            })

        }
        else 
        {
            if(callback != null)
                callback(results, errors);
        }
    }

    static remoteOcrTemp(ocrurl, param, callback, callbackError)
    {
        if(callback != null)
            callback()
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
            console.log('remoteOcrAgain.err')
            console.log(err)
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

    static async getPageGuidelineInfo(document, page)
    {
        let pageTemplate = await PageTemplateModel.findOne({ where: { [Op.and]: [
            { document: { [Op.iLike] : document }},
            {  page: page}
        ] }})

        if(pageTemplate != null)
            return pageTemplate.tableTemplate;
        else 
            return null;
    }


    static async convert2images(pdfUrl, pageInfos)
    {

        let promise = new Promise((resolve, reject)=>{
            let tmpDownloadedPdf = '/tmp/' + General.randomString(10) + ".pdf";

            httpclient.download(pdfUrl, tmpDownloadedPdf ).then(()=>{
                
                console.log("calling ImageProcessor.pdf2imageWithPageInfo")
                ImageProcessor.pdf2imagesWithPageInfos(tmpDownloadedPdf, pageInfos).then((images)=>{

                    resolve(images);

                }).catch(err=>{
                    reject(err)
                })

            }).catch((err)=>{
                reject(err);
            })
        })

        return promise;
    }
}

module.exports = ParserLogic;