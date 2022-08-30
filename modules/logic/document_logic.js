const { Sequelize, Model, DataTypes } = require('sequelize');
const { Op } = require("sequelize");

const CommonLogic = require("./commonlogic");

class DocumentLogic extends CommonLogic {

    static getModel()
    {
        const model = require("../models/document_model");
        return model;
    }

    static getPk(){
        return "id";
    }

    static getWhere(search)
    {
        let where = {
            filename : {
                [Op.like] : "%" + search + "%"
            } 
        }
        return where;
    }

    static getOrder()
    {
        let order = [['updatedAt', 'DESC']];
        return order;
    }

    static async create(o)
    {
        try {
            const CurrentModel = this.getModel();
            console.log("o.filename")
            console.log(o.filename)
            let f = await CurrentModel.findAll({ where: { filename :  { [Op.like] : o.filename } }})
            console.log("f")
            console.log(f)
            if(f.length == 0)
                return await super.create(o);
            else 
            {
                o.upload_date = Date.now();
                console.log("here is")
                return await super.update(f[0].id, o)
            }
        }
        catch (e)
        {
            console.log(e)
            throw e;
        }

    }

    static async updateDateByDocumentName(document)
    {

        try
        {        
            const CurrentModel = this.getModel();
            let f = await CurrentModel.findAll({ where: { filename :  { [Op.like] : document } }})
            if(f.length == 0)
            {
                return { success: false, message: "No document"}
            }
            else 
            {
                f = f[0]
                f = JSON.parse(JSON.stringify(f))
                let dt = new Date().toISOString();
                f.updatedAt = dt;
                //console.log("date")
                //console.log(dt)
                //console.log(f.id)
                //console.log(CurrentModel)   
                let result = await CurrentModel.update(f, { where:{ id: f.id } })
                //console.log(f)
                //console.log(result)
                return { success: true, payload: f}
            }
        }
        catch(e)
        {
            console.log(e)
            throw e;
        }
    }
}

module.exports = DocumentLogic;