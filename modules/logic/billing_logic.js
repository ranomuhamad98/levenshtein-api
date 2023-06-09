const { Sequelize, Model, DataTypes } = require('sequelize');
const { Op } = require("sequelize");

const CommonLogic = require("./commonlogic");
const OcrSessionModel = require("../models/ocrsessionmodel");
const DocumentModel = require("../models/document_model")
const Base64 = require("../utils/Base64"); 
const UsersModel = require("../models/users_model")

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
        let me = this;
        console.log("=============")
        console.log(date1)
        
        date2 = new Date(date2);
        date2.setDate(date2.getDate() + 1);
        console.log(date2)
        console.log("=============")

        let promise = new Promise((resolve, reject)=>{

            let where = {
                [Op.and] :
                [
                    {payable: 1},
                    {sessionStartDate: {
                        [Op.between] : [ new Date(date1), new Date(date2)]
                    }}
                ]
            };


            OcrSessionModel.findAll({
                where: where,
                include: [ {model: UsersModel, as: "user"} ]
            }).then((ocrSessions)=>{

                //ocrSessions = JSON.stringify(ocrSessions)
                //ocrSessions = JSON.parse(ocrSessions)


                let ocrSessionResults = [];
                ocrSessions.map((ocrSession)=>{
                    if( me.session.user.userRole == "SUPER_ADMIN" || (me.session.user.userRole  != "SUPER_ADMIN" && ocrSession.user.userRole != "SUPER_ADMIN"))
                    {
                        ocrSessionResults.push(ocrSession);
                    }
                });


                //console.log(ocrSessionResults)

                let model = BillingSettingLogic.getModel();
                model.findAll().then((settings)=>{
                    let costPerPage = BillingSettingLogic.getValueFromSetting(settings, "COST_PER_PAGE");
                    let info = BillingSettingLogic.getCostInfo(costPerPage, ocrSessionResults);
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
        //let documents = await DocumentModel.findAll();

        let items = [];
        let totalCost = 0;
        ocrSessions.map((ocrSession)=>{
            let o = {}
            let ocrResult = Base64.decode(ocrSession.ocrResult);
            ocrResult = JSON.parse(ocrResult);

            o.sessionID = ocrSession.sessionID;
            o.sessionDate = ocrSession.sessionStartDate;
            o.executedBy = ocrSession.executedBy;
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