const { Model, DataTypes } = require('sequelize');

class DocumentTablesModel extends Model {
    static initialize(sequelize, force=false)
    { 
        super.init({
            tableID: DataTypes.STRING,
            table_json_layout: DataTypes.STRING,
            document_id: DataTypes.INTEGER,
            table_json_value: DataTypes.STRING,
            page: DataTypes.STRING,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE
        }, 
        { sequelize, modelName: 'document_tables', tableName: 'document_tables', force: force });
    }
}

module.exports = DocumentTablesModel;