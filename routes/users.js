const { response } = require("express");
const CrudRouter = require("./crudrouter");

class UsersRouter extends CrudRouter{

    static getRouter(logic)
    {
        let router = super.getRouter(logic);
        router.post("/login", (req, res)=>{
            let email = req.body.email;
            let password = req.body.userPassword;
            logic.login(email, password).then((response)=>{
                res.send({success: true, payload: response})
            }).catch((err)=>{
                console.log("Error")
                console.log(err)
                res.send({success: false, error: err, message: err.message})
            })
        });

        router.get("/should-i-logout", (req, res)=>{
            //req.session.user = null;
            let email = req.query.user;
            let sessionID = req.query.sessionID;
            logic.shouldILogout(email, sessionID).then((payload)=>{
                res.send({success: true, payload: payload})
            }).catch((err)=>{
                console.log("Error")
                console.log(err)
                res.send({success: false, error: err, message: err.message})
            })
        });

        router.get("/signout", (req, res)=>{
            
            //req.session.user = null;
            let email = req.query.user;
            let sessionID = req.query.sessionID;
            logic.logout(email, sessionID).then((payload)=>{
                res.send({success: true, payload: payload})
            }).catch((err)=>{
                console.log("Error")
                console.log(err)
                res.send({success: false, error: err, message: err.message})
            })
        });

        return router;
    }
}

module.exports = UsersRouter;