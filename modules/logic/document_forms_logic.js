const { Sequelize, Model, DataTypes } = require('sequelize');
const { Op } = require("sequelize");

const CrudLogic = require("./crudlogic");

class DocumentFormsLogic extends CrudLogic {

    static getModel()
    {
        const Model = require("../models/document_forms_model");
        return Model;
    }

    static getWhere(search)
    {
        let where = {
            formID : {
                [Op.like] : "%" + search + "%"
            } 
        }
        return where;
    }

}

module.exports = DocumentFormsLogic;