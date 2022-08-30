const { Model, DataTypes } = require('sequelize');

class UsersModel extends Model {
    static initialize(sequelize, force=false)
    { 
        super.init({
            email: DataTypes.STRING,
            userPassword: DataTypes.STRING,
            userRole: DataTypes.STRING,
            organization_code: DataTypes.STRING,
            firstname: DataTypes.STRING,
            lastname: DataTypes.STRING,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE
        }, 
        { sequelize, modelName: 'users', tableName: 'users', force: force });
    }
}

module.exports = UsersModel;