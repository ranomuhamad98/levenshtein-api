const DocumentModel  = require( './modules/models/document_model')
const DocumentTablesModel  = require( './modules/models/document_tables_model')
const DocumentTableTemplatesModel  = require( './modules/models/document_table_templates_model')
const DocumentFormTemplatesModel  = require( './modules/models/document_form_templates_model')
const DocumentFormsModel  = require( './modules/models/document_forms_model')
const OrganizationModel  = require( './modules/models/organization_model')
const UsersModel  = require( './modules/models/users_model')


const { Sequelize, Model, DataTypes } = require('sequelize');
const process = require('process');


const sequelize = new Sequelize(process.env.DBNAME, process.env.DBUSER, process.env.DBPASSWORD, {
    host: process.env.DBHOST,
    dialect: process.env.DBENGINE ,
    logging: false
});


class Initialization {
    static async initializeDatabase(){

        let force = false;

        console.log("Database info:")
        console.log(process.env.DBHOST)
        console.log(process.env.DBNAME)
        console.log(process.env.DBUSER)
        console.log(process.env.DBENGINE)

        DocumentModel.initialize(sequelize, force);
        DocumentTablesModel.initialize(sequelize, force);
        DocumentTableTemplatesModel.initialize(sequelize, force);
        DocumentFormsModel.initialize(sequelize, force);
        OrganizationModel.initialize(sequelize, force);
        UsersModel.initialize(sequelize, force);
        DocumentFormTemplatesModel.initialize(sequelize, force);

        await sequelize.sync();
    }
}

module.exports = Initialization



