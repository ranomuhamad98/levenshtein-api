const { Sequelize, Model, DataTypes } = require('sequelize');
const { Op } = require("sequelize");

const CommonLogic = require("./commonlogic");
const PageTemplateModel = require("../models/pagetemplatemodel")

class PageTemplateLogic extends CommonLogic {

    static getModel()
    {
        const model = require("../models/pagetemplatemodel");
        return model;
    }

    static getPk(){
        return "id";
    }

    static getWhere(search)
    {
        let where = {
            page : search
        }
        return where;
    }

    static getOrder()
    {
        let order = [['createdAt', 'DESC']];
        return order;
    }

    static async createUpdate(pageTemplate)
    {
        try {
            let where = { }
            let ands = []
            ands.push({ document: { [Op.iLike]: "" + pageTemplate.document + "" }})
            ands.push({ page: pageTemplate.page})
            where = { where: { [Op.and] : ands   } }
    
            let newPageTemplate = pageTemplate;
    
            let dbPageTemplate = await PageTemplateModel.findOne(where)   
            if(dbPageTemplate != null)
            {
                await PageTemplateModel.update(pageTemplate, { where: { id: dbPageTemplate.id } })
            }
            else 
            {
                newPageTemplate = await PageTemplateModel.create(pageTemplate)
    
            }

            console.log("success")
            return { success: true, payload: newPageTemplate};
        }
        catch (err)
        {
            throw {success: false, error: err, message: err.message}
        }
    }

    static async findByDocumentAndPage(document, page)
    {
        try {
            let where = { }
            let ands = []
            ands.push({ document: { [Op.iLike]: "" + document + "" }})
            ands.push({ page: page})
            where = { where: { [Op.and] : ands   } }
            let dbPageTemplate = await PageTemplateModel.findOne(where)
            if(dbPageTemplate == null)
                return { success: false, error: null, message: "No template for the page"}
            else 
                return {success: true, payload: dbPageTemplate}
    

        }
        catch (err)
        {
            throw {success: false, error: err, message: err.message}
        }
    }

    static async findByDocument(document)
    {
        try 
        {
            let where = { }
            where = { where: { document : { [Op.iLike] : document }  } }
            let dbPageTemplate = await PageTemplateModel.findAndCountAll(where)
            if(dbPageTemplate == null)
                return { success: false, error: null, message: "No template for the document"}
            else 
                return {success: true, payload: dbPageTemplate}

        }
        catch (err)
        {
            throw {success: false, error: err, message: err.message}
        }
    }
}

module.exports = PageTemplateLogic;