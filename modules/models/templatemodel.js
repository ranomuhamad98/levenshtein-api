const { Model, DataTypes } = require('sequelize');

class TemplateModel extends Model {
    static initialize(sequelize, force=false)
    { 
        super.init({
            title: DataTypes.STRING,
            description: DataTypes.STRING,
            tableTemplate: DataTypes.TEXT,
            formTemplate: DataTypes.TEXT,
        }, 
        { sequelize, modelName: 'template', tableName: 'template', force: force });
    }
}

module.exports = TemplateModel;