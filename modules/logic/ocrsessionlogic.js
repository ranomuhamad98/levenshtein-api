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
const UsersModel = require('../models/users_model');
const TemplateModel = require('../models/templatemodel');




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


            //console.log("ocrResults")
            //console.log(ocrResults)

            let allArrayResults = await OcrSessionLogic.getResultsArray(ocrResults, document);

            //console.log("allArrayResults")
            //console.log(allArrayResults)

            let formArrays = allArrayResults[0];
            let tableArrays = allArrayResults[1];
            let formCsv = convertArrayToCSV(formArrays, { separator: "," })

            //console.log("formCsv")
            //console.log(formCsv)

            //console.log("formCsv")
            //console.log(formCsv)

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
                
                //let upload_url = process.env.UPLOADER_API + "/upload/gcs/" + process.env.GCP_PROJECT;
                //upload_url += "/" + process.env.GCP_PROCESSING_BUCKET + "/";

                let upload_url = process.env.UPLOADER_API + "/gcs/upload?path=" + process.env.DOWNLOAD_OCR_PROCESSING_PROJECT;
                upload_url += ":" + process.env.DOWNLOAD_OCR_PROCESSING_BUCKET + "/";


                let uploadedFolder = process.env.DOWNLOAD_OCR_PROCESSING_FOLDER;
                uploadedFolder = encodeURIComponent(uploadedFolder)
                //upload_url += uploadedFolder;
                upload_url += uploadedFolder + "/";


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
                    //newOutputfile = "gs://" + process.env.DOWNLOAD_OCR_RESULT_BUCKET + "/" + process.env.DOWNLOAD_OCR_RESULT_FOLDER + "/" + newOutputfile;

                    resolve({ project: process.env.DOWNLOAD_OCR_RESULT_PROJECT, bucket: process.env.DOWNLOAD_OCR_RESULT_BUCKET, path: process.env.DOWNLOAD_OCR_RESULT_FOLDER + "/" + newOutputfile})
                    
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

    static getFormRowHeaders(ocrResults)
    {
        let rowFormHeader = [];
        let setHeader = false;
        rowFormHeader.push("TEMPLATE");
        rowFormHeader.push("NAMA_FILE");
        rowFormHeader.push("PAGE_NO");
        ocrResults.map((ocrResult)=>{

            let formResult = ocrResult.allResults.formOcrResult.positions;

            //console.log("formResult=======")
            //console.log(formResult)
            if(formResult != null && formResult.length > 0 && setHeader == false)
            {
                setHeader = true;
                formResult.map((formOcr)=>{
                    rowFormHeader.push(formOcr.fieldname.trim().replace(/\n/gi, ""));
                })
            }

        });

        return rowFormHeader;

    }

    static async getResultsArray(ocrResults, document)
    {

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

        let rowFormHeader = this.getFormRowHeaders(ocrResults);
        //console.log("rowFormHeader")
        //console.log(rowFormHeader)
        rowForms.push(rowFormHeader);

        let page= 1;
        let idx = 1;
        let tableHeaderDone = false;
        let tableHeaders = [];


        //Ocr result per page
        await Promise.all( 
            ocrResults.map(async (ocrResult)=>{
                //console.log("ocrResult")
                //console.log(ocrResult)

                let formResult = ocrResult.allResults.formOcrResult.positions;
                let tableResult = ocrResult.allResults.tableOcrResult;
                page = ocrResult.page;

                let templateTitle = "";

                let templateId = ocrResult.templateId;

                try{

                    let template = await TemplateModel.findOne({ 
                        where: {
                            id: templateId
                        }
                    })
                    templateTitle = template.title;
                }
                catch(e)
                {

                }


                //console.log("TABLERESULT")
                //console.log(tableResult)

                if(tableResult != null && tableResult.length > 0)
                {
                    //newTable consists all tables in one page
                    let o = OcrSessionLogic.getTableArray(tableResult, ocrResult.page, document, !tableHeaderDone, templateTitle, tableHeaders)
                    let newTable = o.tables;
                    tableHeaders = o.headers;
                    if(tableHeaderDone == false)
                        tableHeaderDone = true;
                    tables.push(newTable)
                }

                let rowForm = [];

                if(formResult != null && formResult.length > 0)
                {
                    rowForm.push(templateTitle)
                    rowForm.push(document)
                    rowForm.push(ocrResult.page)

                    formResult.map((formOcr)=>{

                        if(formOcr.text != null)
                        {
                            rowForm.push(formOcr.text.trim().replace(/\n/gi, ""))
                        }
                    })

                    rowForms.push(rowForm)

                }
                
                idx++;

                //page++;
            })
        );

        //console.log("TABLES")
        //console.log(JSON.stringify(tables))

        //console.log("ROWFORMS")
        //console.log(rowForms)
        let tablesByIndexes = OcrSessionLogic.mergeTableArraysByIndex(tables)

        return [ rowForms, tablesByIndexes]
    }

    static mergeTableArraysByIndex(allTables)
    {
        if(allTables != null && allTables.length >0)
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
                    if(arr != null)
                    {
                        arr = arr.concat(tablePerIndex.arrays)
                        tablesByIndexes[tableidx] = arr;
                    }
                    tableidx++;
                })
            })
    
            return tablesByIndexes
        }

        return [];

    }

    static getTableArray(tableResults, page, document, idx, templateTitle, headers)
    {
        let tables = [];
        let tableIdx = 0;
        tableResults.map((tableResult)=>{

            if(tableResult.result != null)
            {
                let result = tableResult.result.positions;
                let newTable = [];
                let headerRow = [];

                //Set table's array's header
                if(idx == true)
                {
                    headers = result[0]
                    headerRow.push("TEMPLATE")
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
                        newRow.push(templateTitle)
                        newRow.push(document)

                        headers.map((header)=>{

                            for(let idx=0; idx < resultRow.length; idx++)
                            {
                                let cell = resultRow[idx];
                                if(cell.fieldname != null && cell.fieldname.toLowerCase() == header.fieldname.toLowerCase())
                                {
                                    newRow.push(cell.text);
                                    break;
                                }
                            }
                        })


                        newRow.push(page)
                        newTable.push(newRow);
                    }

                })

                tables.push({ tableIDX: tableIdx, arrays: newTable })
            }
            tableIdx++;
        })

        return { tables: tables, headers: headers } ;
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


    static getModelIncludes()
    {
        if(this.session.user.userRole == "SUPER_ADMIN")
            return [ {model: UsersModel, as: "user"} ];
        else if(this.session.user.userRole == "ADMIN")
            return [ {model: UsersModel, as: "user", where: { userRole: { [Op.notLike]: "SUPER_ADMIN" } } } ];
        else
            return [ {model: UsersModel, as: "user", where: { email: { [Op.iLike]: this.session.user.email } } } ];

    }
    
}

module.exports = OcrSessionLogic;