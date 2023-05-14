const { Sequelize, Model, DataTypes } = require('sequelize');
const { Op } = require("sequelize");

const CrudLogic = require("./crudlogic");

class UsersLogic extends CrudLogic {

    static getModel()
    {
        const model = require("../models/users_model");
        return model;
    }

    static getPk(){
        return "id";
    }

    static getWhere(search)
    {
        let where = {
            firstName : {
                [Op.like] : "%" + search + "%"
            } 
        }
        return where;
    }

    static getOrder()
    {
        let order = [['createdAt', 'DESC']];
        return order;
    }

    static login(email, password)
    {
        let promise = new Promise((resolve, reject)=>{
            let model = UsersLogic.getModel()
            model.findAll({ where:{ [Op.and] :[  {email: { [Op.like]: email }}, { userPassword: {[Op.like]: password } }] } }).then((users)=>{
                if(users.length > 0)
                {   
                    let user = users[0];
                    resolve( { success: true, payload : { id: user.id, email: user.email, firstname: user.firstname, lastname: user.lastname, role: user.userRole } })
                }
                else 
                    resolve({ success: false, message: "No such user" })
            }).catch(e=>{
                console.log("errrrorrr")
                console.log(e)
                resolve({success: false, error:e, message: e.message})
            })
        })

        return promise;
    }
}

module.exports = UsersLogic;