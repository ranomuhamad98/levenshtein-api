const { Model, DataTypes } = require('sequelize');

class PageTemplateModel extends Model {
    static initialize(sequelize, force=false)
    { 
        super.init({
            templateId: DataTypes.STRING,
            page: DataTypes.INTEGER,
            description: DataTypes.STRING,
            tableTemplate: DataTypes.TEXT,
            document: DataTypes.TEXT,
            pageImageUrl: DataTypes.TEXT
        }, 
        { sequelize, modelName: 'pagetemplate', tableName: 'pagetemplate', force: force });
    }
}

module.exports = PageTemplateModel;