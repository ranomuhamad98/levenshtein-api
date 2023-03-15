const { Sequelize, Model, DataTypes } = require('sequelize');
const { Op } = require("sequelize");
var fs = require('fs');
var httpclient = require("../utils/HttpClient")



const CommonLogic = require("./commonlogic");
const General = require("../utils/General")
const FileUtil = require("../utils/File")
const ParserLogic = require("./parser_logic")
const Base64 = require("../utils/Base64")

const { convertArrayToCSV } = require('convert-array-to-csv');
const { resolve } = require('path');




class OcrSessionLogic extends CommonLogic {

    static getModel()
    {
        const model = require("../models/ocrsessionmodel");
        return model;
    }

    static getPk(){
        return "id";
    }

    static getWhere(search)
    {
        let where = {
            document : {
                [Op.like] : "%" + search + "%"
            } 
        }
        return where;
    }

    static getOrder()
    {
        let order = [['createdAt', 'DESC']];
        return order;
    }

    static initCreate(o)
    {
        let sessionID = General.randomString(10)
        o.sessionID = "ocr-session-" + sessionID;
        o.payable = 1;
        return o;
    }


    static async runOneOcrSession(sessionid, page)
    {
        let promise = new Promise(async (resolve, reject)=>{

            let model =  this.getModel();
            let ocrSession = await model.findOne({where: { sessionID: sessionid }})
    
            if(ocrSession != null)
            {
                let document = ocrSession.document;
                document = document.replace("gs://", "https://storage.googleapis.com/")
                let templateId = ocrSession.templateId;
                //model.update({runningStatus: 1}, { where: { sessionID: sessionid } })
                ParserLogic.parseOnePdf(document,  page).then((results)=>{
    
                    if(results.success)
                    {
                        let sResult = JSON.stringify(results.payload);
                        //sResult = btoa(sResult);
                        sResult = Base64.encode(sResult)
                        //console.log(sResult)

                        if(results.payload.length > 0)
                        {
                            let res  = results.payload[0]

                            //get original ocr result
                            let originalOcrResult  =  ocrSession.ocrResult;
                            originalOcrResult  = Base64.decode(originalOcrResult)
                            originalOcrResult = JSON.parse(originalOcrResult)

                            //find the will be updated original ocr result by page
                            //and update it.
                            let idx = 0;
                            let updateIdx = 0;
                            originalOcrResult.map((ocrRes)=>{
                                if(ocrRes.page == res.page)
                                {
                                    //originalOcrResult[idx] = res;
                                    //console.log("updating page " + ocrRes.page)
                                    //console.log(res)
                                    updateIdx = idx;
                                }
                                idx++;
                            })

                            originalOcrResult[updateIdx] = res;
                            console.log("updating page " + originalOcrResult[updateIdx].page)
                            console.log(originalOcrResult[updateIdx])

                            //Convert back originalOCrResult to base64 encoded
                            originalOcrResult = JSON.stringify(originalOcrResult)
                            originalOcrResult = Base64.encode(originalOcrResult)

                            //Save it to database
                            model.update({runningStatus: 2, sessionEndDate: Date.now(), ocrResult: originalOcrResult}, { where: { id: ocrSession.id } })

                            resolve(results.payload)
                            console.log("Done ocr success")
                        }
                        else 
                        {
                            reject({ message: "OCR for page " + page + " of session " + sessionid + " Failed" })
                        }
                        //model.update({runningStatus: 2, sessionEndDate: Date.now(), ocrResult: sResult}, { where: { id: ocrSession.id } })
                        
                    }
                    else
                    {
                        reject(results)
                        console.log("Done ocr fail")
                        //model.update({runningStatus: 3, sessionEndDate: Date.now()}, { where: { id: ocrSession.id } })
    
                    }
                }).catch((err)=>{
                    let sError = JSON.stringify(err);
                    console.log("runOneOcrSession()")
                    console.log(err)
                    reject(err)
                    //model.update({runningStatus: 3, sessionEndDate: Date.now(), error: err.message}, { where: { id: ocrSession.id } })
                })
            }
        })

        return promise;
    }

    static async runAllOcrSessions()
    {
        let model =  this.getModel();
        let ocrSessions = await model.findAll({where: { runningStatus: 0 }})

        ocrSessions.map((session)=>{
            let document = session.document;
            document = document.replace("gs://", "https://storage.googleapis.com/")
            let templateId = session.templateId;
            model.update({runningStatus: 1}, { where: { id: session.id } })
            ParserLogic.parseAllPdf(document,  templateId).then((results)=>{

                if(results.success)
                {
                    let sResult = JSON.stringify(results.payload);
                    //sResult = btoa(sResult);
                    sResult = Base64.encode(sResult)
                    //console.log(sResult)

                    console.log("Done ocr success")
                    model.update({runningStatus: 2, sessionEndDate: Date.now(), ocrResult: sResult}, { where: { id: session.id } })
                    
                }
                else
                {
                    console.log("Done ocr fail")
                    model.update({runningStatus: 3, sessionEndDate: Date.now()}, { where: { id: session.id } })

                }
            }).catch((err)=>{
                let sError = JSON.stringify(err);
                console.log("runAllOcrSessions()")
                console.log(err)
                model.update({runningStatus: 3, sessionEndDate: Date.now(), error: err.message}, { where: { id: session.id } })
            })
        })
    }

    static async downloadOcrResult(sessionId)
    {
        let promise = new Promise(async (resolve, reject)=>{
            let model =  this.getModel();
            let ocrSession = await model.findOne({where: { id: sessionId }})
            let sessionID = ocrSession.sessionID;
            let ocrResults = ocrSession.ocrResult; 
            ocrResults = atob(ocrResults)
            ocrResults = JSON.parse(ocrResults)

            let document = ocrSession.document;

            let tmpFiles = [];


            let allArrayResults = OcrSessionLogic.getResultsArray(ocrResults, document);
            let formArrays = allArrayResults[0];
            let tableArrays = allArrayResults[1];
            let formCsv = convertArrayToCSV(formArrays, { separator: "," })



            let savedFolder  = "/tmp/" + sessionID;
            if(fs.existsSync(savedFolder) == false)
                fs.mkdirSync(savedFolder);
            let formCsvFile = savedFolder + "/forms.csv"
            fs.writeFileSync(formCsvFile, formCsv)
            tmpFiles.push(formCsvFile)


            //console.log(formCsv)
            let tableIdx = 1;
            tableArrays.map((tableArray)=>{

                let tableCsv = convertArrayToCSV(tableArray, { separator: "," })
                let tableCsvFile = savedFolder + "/table_" + tableIdx + ".csv"
                fs.writeFileSync(tableCsvFile, tableCsv)
                tmpFiles.push(tableCsvFile)


                tableIdx++;
            })

            let ss = savedFolder.replace("/tmp/", "");
            let outputFile = "/tmp/" + ss + ".zip";

            FileUtil.zipDirectory(savedFolder, outputFile).then(()=>{
                
                let upload_url = process.env.UPLOADER_API + "/upload/gcs/" + process.env.GCP_PROJECT;
                upload_url += "/" + process.env.GCP_PROCESSING_BUCKET + "/";


                let uploadedFolder = "ocrzipfile"
                uploadedFolder = encodeURIComponent(uploadedFolder)
                upload_url += uploadedFolder;

                console.log("upload_url")
                console.log(upload_url)

                console.log("outputfile")
                console.log(outputFile)

                httpclient.upload(upload_url, outputFile).then((response)=>{

                    console.log("upload file")
                    console.log(response)
                    //fs.unlinkSync(outputFile);
                    tmpFiles.map((file)=>{
                        fs.unlinkSync(file)
                    })

                    setTimeout(function(){
                        try
                        {
                            fs.unlinkSync(outputFile);
                        }
                        catch(e)
                        {

                        }
                    }, 1000)

                    let outputFileExt = process.env.OCR_RESULT_EXTENSION

                    let newOutputfile = outputFile.replace("/tmp/", "")
                    newOutputfile = newOutputfile.replace(".zip", "." + outputFileExt)
                    newOutputfile = "gs://" + process.env.GCP_UPLOAD_BUCKET + "/after_process_zip/" + newOutputfile;

                    resolve({ uri: newOutputfile, project: process.env.GCP_PROJECT})
                    
                }).catch((e)=>{
                    console.log("error upload")
                    console.log(e)
                })


            }).catch((e)=> {
                console.log("error")

                console.log(e)
                reject(e)
            })



        })

        return promise;
    }

    static getResultsArray(ocrResults, document)
    {
        let rowFormHeader = [];
        rowFormHeader.push("NAMA_FILE");
        rowFormHeader.push("PAGE_NO");

        let rowForms = []
        let tables = []
        let row = [];
        let counter = 0;
        //let firstFormOcrResult = ocrResults[0].allResults.formOcrResult.positions;
        //row.push("NAMA_FILE")

        //row.push("Column")
        //row.push("Value")
        //row.push("PAGE_NO")

        //rowForms.push(row);

        let page= 1;
        let idx = 1;

        //Ocr result per page
        ocrResults.map((ocrResult)=>{
            
            let formResult = ocrResult.allResults.formOcrResult.positions;
            let tableResult = ocrResult.allResults.tableOcrResult;

            page = ocrResult.page;

            let rowForm = [];
            rowForm.push(document)
            rowForm.push(page)

            formResult.map((formOcr)=>{
                rowFormHeader.push(formOcr.fieldname.trim().replace(/\n/gi, ""));
                rowForm.push(formOcr.text.trim().replace(/\n/gi, ""))
            })

            if(counter == 0)
            {
                rowForms.push(rowFormHeader);
                rowFormHeader = [];
                counter++;
            }

            rowForms.push(rowForm)

            //newTable consists all tables in one page
            let newTable = OcrSessionLogic.getTableArray(tableResult, page, document, idx)
            tables.push(newTable)

            idx++;

            //page++;
        })


        let tablesByIndexes = OcrSessionLogic.mergeTableArraysByIndex(tables)

        return [ rowForms, tablesByIndexes]
    }

    static mergeTableArraysByIndex(allTables)
    {
        
        let totalTablePerPage = allTables[0].length;
        let tablesByIndexes = []

        for(let i = 0; i < totalTablePerPage; i++)
        {
            tablesByIndexes.push([])
        }

        allTables.map((tablesPerPage)=>{

            let tableidx = 0;
            tablesPerPage.map((tablePerIndex)=>{
                let arr = tablesByIndexes[tableidx]
                arr = arr.concat(tablePerIndex.arrays)
                tablesByIndexes[tableidx] = arr;
                tableidx++;
            })
        })

        return tablesByIndexes
    }

    static getTableArray(tableResults, page, document, idx)
    {
        let tables = [];
        let tableIdx = 0;
        tableResults.map((tableResult)=>{

            if(tableResult.result != null)
            {
                let result = tableResult.result.positions;

                let headers = result[0];
                let newTable = [];
                let headerRow = [];

                //Set table's array's header
                if(idx == 1)
                {
                    headerRow.push("NAMA_FILE")
                    headers.map((header)=>{
                        headerRow.push(header.fieldname)
                    })
                    headerRow.push("PAGE_NO")
                    newTable.push(headerRow)
                }

                //Fill table's array content
                result.map((resultRow)=>{

                    //Check if the row cells all empty
                    let isEmptyLine = OcrSessionLogic.checkIfRowIsEmpty(resultRow)

                    //If not empty put them as result
                    if(isEmptyLine == false)
                    {
                        let newRow = [];
                        newRow.push(document)
                        resultRow.map((cell)=>{
                            newRow.push(cell.text);
                        })
                        newRow.push(page)
                        newTable.push(newRow);
                    }

                })

                tables.push({ tableIDX: tableIdx, arrays: newTable })
            }
            tableIdx++;
        })

        return tables;
    }

    static checkIfRowIsEmpty(resultRow)
    {
        let notEmpty = false;
        resultRow.map((cell)=>{
            if(cell.text != null && cell.text.trim().replace(" ", "").length > 0)
            {
                notEmpty = true;
            }
        })

        return !notEmpty;
    }

    
}

module.exports = OcrSessionLogic;