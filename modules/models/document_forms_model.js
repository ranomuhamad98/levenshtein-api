const { Model, DataTypes } = require('sequelize');

class DocumentFormsModel extends Model {
    static initialize(sequelize, force=false)
    { 
        super.init({
            formID: DataTypes.STRING,
            form_json: DataTypes.STRING,
            document_id: DataTypes.INTEGER,
            page: DataTypes.STRING,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE
        }, 
        { sequelize, modelName: 'document_forms', tableName: 'document_forms', force: force });
    }
}

module.exports = DocumentFormsModel;