const { Model, DataTypes } = require('sequelize');

class OcrSessionModel extends Model {
    static initialize(sequelize, force=false)
    { 
        super.init({
            sessionStartDate: DataTypes.DATE,
            sessionEndDate: DataTypes.DATE,
            document: DataTypes.STRING,
            templateId: DataTypes.INTEGER,
            runningStatus: DataTypes.INTEGER,
            ocrResult: DataTypes.TEXT,
            sessionID: DataTypes.STRING
        }, 
        { sequelize, modelName: 'ocrsession', tableName: 'ocrsession', force: force });
    }
}

module.exports = OcrSessionModel;