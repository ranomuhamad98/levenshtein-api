const { Model, DataTypes } = require('sequelize');

class DocumentModel extends Model {
    static initialize(sequelize, force=false)
    { 
        super.init({
            filename: DataTypes.STRING,
            description: DataTypes.STRING,
            upload_date: DataTypes.DATE,
            upload_by: DataTypes.STRING,
            organization_code: DataTypes.STRING,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE
        }, 
        { sequelize, modelName: 'document', tableName: 'document', force: force });
    }
}

module.exports = DocumentModel;