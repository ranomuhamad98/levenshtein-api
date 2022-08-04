const { Sequelize, Model, DataTypes } = require('sequelize');
const { Op } = require("sequelize");

const CommonLogic = require("./commonlogic");
const General = require("../utils/General")
const ParserLogic = require("./parser_logic")


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
                model.update({runningStatus: 3, sessionEndDate: Date.now()}, { where: { id: session.id } })
            }).catch((err)=>{
                model.update({runningStatus: 4, sessionEndDate: Date.now()}, { where: { id: session.id } })
            })
        })
    }
}

module.exports = OcrSessionLogic;