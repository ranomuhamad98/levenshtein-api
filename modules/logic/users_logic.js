const { Sequelize, Model, DataTypes } = require('sequelize');
const { Op } = require("sequelize");
const General = require("../utils/General")
var moment = require("moment")

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

    static stillLogin(user)
    {
        let timeZone = General.getTimeZone();
        let lastLogin = moment(user.lastLogin).add(timeZone, "hours");
        let now = Date.now();

        console.log("lastLogin: " + moment(lastLogin).format("YYYY-MM-DD HH:mm:ss"))
        console.log("Now : " +  moment(now).format("YYYY-MM-DD HH:mm:ss"))
        var diff = (new Date(now).getTime() - new Date(lastLogin).getTime()) / 1000;


        //let diff = General.getTimeDifference( user.lastLogin, now, "s" );
        console.log("Diff")
        console.log(diff)

        if( user.isLogin && diff <= process.env.LOGIN_IDLE_SECONDS)
        {
            return true;
        }
        else
            return false;
    }

    static shouldILogout(user, sessionID)
    {
        let promise  = new Promise(async(resolve, reject)=>{
            try{
                let model = UsersLogic.getModel();
                let user = await model.findOne({
                    where:  {
                        [Op.and]:
                        [
                            {email: email},
                            {loginSessionID: sessionID}
                        ]
                    }
                });

                if(user != null)
                {
                    let isLogin = this.stillLogin(user);
                    if(isLogin == false)
                        resolve(true);
                    else
                        resolve(false)
                }
                else
                {
                    reject({ message: "No such user and such sessionID" })
                }
            }
            catch(e)
            {
                reject(e)
            }
        });
        
        return promise;
    }

    static logout(email, sessionID)
    {
        let promise  = new Promise(async (resolve, reject)=>{
            try{
                let model = UsersLogic.getModel();
                let user = await model.findOne({
                    where:  {
                        [Op.and]:
                        [
                            {email: email},
                            {loginSessionID: sessionID}
                        ]
                    }
                });

                if(user != null)
                {
                    await model.update({ isLogin: 0 }, { where: { id: user.id } })
                    resolve("Ok")
                }
                else
                {
                    reject({ message: "No such user and such sessionID" })
                }

            }
            catch(e)
            {
                reject(e)
            }
        });
        
        return promise;
    }

    static login(email, password)
    {
        let promise = new Promise((resolve, reject)=>{
            let model = UsersLogic.getModel()
            model.findAll({ where:{ [Op.and] :[  {email: { [Op.like]: email }}, { userPassword: {[Op.like]: password } }] } }).then(async(users)=>{
                if(users.length > 0)
                {   
                    let user = users[0];
                    let isStillLogin = this.stillLogin(user);
                    //console.log("isStillLogin")
                    //console.log(isStillLogin)

                    if(isStillLogin == false)
                    {
                        let dt = General.getCurrentDate("YYYY-MM-DD HH:mm:ss");

                        console.log(dt)

                        let sessionID = General.randomString(10)
    
                        await model.update({ isLogin: 1, lastLogin: dt, loginSessionID: sessionID  },  {
                            where: {
                                id: user.id
                            }
                        })
                        resolve( { id: user.id, email: user.email, firstname: user.firstname, lastname: user.lastname, role: user.userRole, lastLogin: dt, sessionID: sessionID, idleTimeout: process.env.LOGIN_IDLE_SECONDS } );
                    }
                    else
                    {
                        reject({  message: "Can not login, the user: '" + user.email + "' is still logging in."})
                    }
                }
                else 
                    reject({ message: "No such user, or password is invalid" })
            }).catch(e=>{
                console.log("errrrorrr")
                console.log(e)
                reject(e);
            })
        })

        return promise;
    }
}

module.exports = UsersLogic;