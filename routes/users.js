const CrudRouter = require("./crudrouter");

class UsersRouter extends CrudRouter{

    static getRouter(logic)
    {
        let router = super.getRouter(logic);
        router.post("/login", (req, res)=>{
            let email = req.body.email;
            let password = req.body.userPassword;
            logic.login(email, password).then((response)=>{
                res.send(response)
            }).catch((err)=>{
                console.log("Error")
                console.log(err)
                res.send({success: false, error: err, message: err.message})
            })
            
        });

        router.get("/signout", (req, res)=>{
            
            //req.session.user = null;
            res.send({success: true})
            
            
        });

        return router;
    }
}

module.exports = UsersRouter;