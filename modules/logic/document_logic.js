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
        let order = [['upload_date', 'DESC']];
        return order;
    }
}

module.exports = DocumentLogic;