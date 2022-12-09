const { Model, DataTypes } = require('sequelize');

class BillingSettingModel extends Model {
    static initialize(sequelize, force=false)
    { 
        super.init({
            settingName: DataTypes.STRING,
            settingValue: DataTypes.STRING,
            tag: DataTypes.STRING
        }, 
        { sequelize, modelName: 'billingsetting', tableName: 'billingsetting', force: force });
    }
}

module.exports = BillingSettingModel;