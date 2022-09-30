const CrudRouter = require("./crudrouter");

class UsersRouter extends CrudRouter{

    static getRouter(logic)
    {
        let router = super.getRouter(logic);
        router.post("/login", (req, res)=>{
            let email = req.body.email;
            let password = req.body.userPassword;

            console.log("login: " + email + ", " + password)

            logic.login(email, password).then((response)=>{
                //res.send({ success: true });
                res.send(response)
            }).catch((err)=>{
                res.send({success: false, error: err, message: err.message})
            })
            
        })

        return router;
    }
}

module.exports = UsersRouter;