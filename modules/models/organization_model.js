const { Model, DataTypes } = require('sequelize');

class OrganizationModel extends Model {
    static initialize(sequelize, force=false)
    { 
        super.init({
            organization_code: DataTypes.STRING,
            name: DataTypes.STRING,
            description: DataTypes.INTEGER,
            member_date: DataTypes.DATE,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE
        }, 
        { sequelize, modelName: 'organization', tableName: 'organization', force: force });
    }
}

module.exports = OrganizationModel;