const { Model, DataTypes } = require('sequelize');

class DocumentTableTemplatesModel extends Model {
    static initialize(sequelize, force=false)
    { 
        super.init({
            templateID: DataTypes.STRING,
            table_json_layout: DataTypes.STRING,
            organization_code: DataTypes.STRING,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE
        }, 
        { sequelize, modelName: 'document_table_templates', tableName: 'document_table_templates', force: force });
    }
}

module.exports = DocumentTableTemplatesModel;