const { Model, DataTypes } = require('sequelize');

class DocumentFormTemplatesModel extends Model {
    static initialize(sequelize, force=false)
    { 
        super.init({
            templateID: DataTypes.STRING,
            form_json_layout: DataTypes.STRING,
            organization_code: DataTypes.STRING,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE
        }, 
        { sequelize, modelName: 'document_form_templates', tableName: 'document_form_templates', force: force });
    }
}

module.exports = DocumentFormTemplatesModel;