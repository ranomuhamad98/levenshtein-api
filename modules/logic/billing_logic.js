const { Sequelize, Model, DataTypes } = require('sequelize');
const { Op } = require("sequelize");

const CommonLogic = require("./commonlogic");
const OcrSessionModel = require("../models/ocrsessionmodel");
const Base64 = require("../utils/Base64"); 

class BillingSettingLogic extends CommonLogic {

    static getModel()
    {
        const model = require("../models/billingsettingmodel");
        return model;
    }

    static getPk(){
        return "id";
    }

    static getWhere(search)
    {
        let where = {
            settingName : {
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



    static getBillingInfo(date1, date2)
    {
        let promise = new Promise((resolve, reject)=>{

            OcrSessionModel.findAll({
                where: {
                    [Op.and] :
                    [
                        {payable: 1},
                        {sessionStartDate: {
                            [Op.between] : [ new Date(date1), new Date(date2) ]
                        }}
                    ]
                }
            }).then((ocrSessions)=>{

                //console.log(ocrSessions)

                let model = BillingSettingLogic.getModel();
                model.findAll().then((settings)=>{
                    let costPerPage = BillingSettingLogic.getValueFromSetting(settings, "COST_PER_PAGE");
                    
                    let info = BillingSettingLogic.getCostInfo(costPerPage, ocrSessions);
                    resolve({ success: true, payload: info });
                })
                
            }).catch((err)=>{
                console.log("error")
                console.log(err)
                reject({ success: false, error: err });
            })

        })

        return promise;
    }

    static getValueFromSetting(settings, key)
    {
        let value = null;
        settings.map((setting)=>{
            //console.log(setting.settingName.toLowerCase() + " ++ " + key.toLowerCase())
            if(setting.settingName.toLowerCase() == key.toLowerCase())
            {
                //console.log("ere" )
                value = setting.settingValue;
            }
        })

        return value;
    }

    static getCostInfo(costPerPage, ocrSessions)
    {
        let items = [];
        let totalCost = 0;
        ocrSessions.map((ocrSession)=>{
            let o = {}
            let ocrResult = Base64.decode(ocrSession.ocrResult);
            ocrResult = JSON.parse(ocrResult);

            o.sessionID = ocrSession.sessionID;
            o.sessionDate = ocrSession.sessionStartDate;
            o.document = ocrSession.document;
            o.totalPage = BillingSettingLogic.getTotalPageFromOcrResult(ocrResult)
            o.totalCost = o.totalPage * costPerPage;
            items.push(o);
            totalCost += o.totalCost;
        })

        return  { totalCost: totalCost, items: items }

    }

    static getTotalPageFromOcrResult(ocrResult)
    {
        let totalPage = 0;
        ocrResult.map((result)=>{
            if(result.allResults.formOcrResult != null && result.allResults.tableOcrResult != null)
            {
                totalPage++;
            }
        })

        return totalPage;
    }

}

module.exports = BillingSettingLogic;