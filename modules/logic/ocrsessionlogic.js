const { Sequelize, Model, DataTypes } = require('sequelize');
const { Op } = require("sequelize");
var fs = require('fs');


const CommonLogic = require("./commonlogic");
const General = require("../utils/General")
const FileUtil = require("../utils/File")
const ParserLogic = require("./parser_logic")

const { convertArrayToCSV } = require('convert-array-to-csv');




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
        return o;
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
                    sResult = btoa(sResult);
                    model.update({runningStatus: 2, sessionEndDate: Date.now(), ocrResult: sResult}, { where: { id: session.id } })
                    
                }
                else
                {
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
            let ocrResults = ocrSession.ocrResult; 
            ocrResults = atob(ocrResults)
            ocrResults = JSON.parse(ocrResults)


            let allArrayResults = OcrSessionLogic.getResultsArray(ocrResults);
            let formArrays = allArrayResults[0];
            let tableArrays = allArrayResults[1];
            let formCsv = convertArrayToCSV(formArrays, { separator: "," })



            let savedFolder  = "/tmp/ocrsession_" + General.randomString(10);
            fs.mkdirSync(savedFolder);
            let formCsvFile = savedFolder + "/forms.csv"
            fs.writeFileSync(formCsvFile, formCsv)


            //console.log(formCsv)
            let tableIdx = 1;
            tableArrays.map((tableArray)=>{



                let tableCsv = convertArrayToCSV(tableArray, { separator: "," })
                let tableCsvFile = savedFolder + "/table_" + tableIdx + ".csv"
                fs.writeFileSync(tableCsvFile, tableCsv)


                tableIdx++;
            })

            let ss = savedFolder.replace("/tmp/", "");
            let outputFile = "/tmp/" + ss + ".zip";


            FileUtil.zipDirectory(savedFolder, outputFile).then(()=>{
                resolve(outputFile);
            }).catch((e)=> {
                console.log("error")

                console.log(e)
                reject(e)
            })



        })

        return promise;
    }

    static getResultsArray(ocrResults)
    {
        let rowForms = []
        let tables = []
        let row = [];
        row.push("Column")
        row.push("Value")
        row.push("Page")

        rowForms.push(row);

        let page= 1;

        //Ocr result per page
        ocrResults.map((ocrResult)=>{
            
            let formResult = ocrResult.allResults.formOcrResult.positions;
            let tableResult = ocrResult.allResults.tableOcrResult;

            
            formResult.map((formOcr)=>{
                let rowForm = [];
                rowForm.push(formOcr.fieldname.trim().replace(/\n/gi, ""))
                rowForm.push(formOcr.text.trim().replace(/\n/gi, ""))
                rowForm.push(page)
                rowForms.push(rowForm)
            })
            

            //newTable consists all tables in one page
            let newTable = OcrSessionLogic.getTableArray(tableResult, page)
            tables.push(newTable)

            page++;
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

    static getTableArray(tableResults, page)
    {
        let tables = [];
        let tableIdx = 0;
        tableResults.map((tableResult)=>{
            let result = tableResult.result.positions;

            let headers = result[0];
            let newTable = [];
            let headerRow = [];

            //Set table's array's header
            if(tableIdx == 0)
            {
                headers.map((header)=>{
                    headerRow.push(header.fieldname)
                })
                headerRow.push("Page")
                newTable.push(headerRow)
            }


            //Fill table's array content
            result.map((resultRow)=>{
                let newRow = [];
                resultRow.map((cell)=>{
                    newRow.push(cell.text)
                })
                newRow.push(page)
                newTable.push(newRow);
            })

            tables.push({ tableIDX: tableIdx, arrays: newTable })
            tableIdx++;
        })

        return tables;
    }

    
}

module.exports = OcrSessionLogic;