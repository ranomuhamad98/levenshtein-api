const CrudRouter = require("./crudrouter");


class BillingSettingRouter extends CrudRouter{

    static getRouter(logic)
    {
        let router = super.getRouter(logic);


        router.get("/info", (req, res)=>{
            let date1 = req.query.date1;
            let date2 = req.query.date2;
            BillingSettingRouter.init(req, res)
            logic.session = req.session;

            console.log(req.session.user)

            logic.getBillingInfo(date1, date2).then((response)=>{
                res.send(response);
            }).catch((e)=>{
                res.send(e);
            })
        })

        return router;
    }

    static init(req, res)
    {
        if(req.headers.user != null)
        {
            console.log("heu")
            console.log(req.headers.user)
            req.session.user  = JSON.parse(req.headers.user);
        }
    }


}

module.exports = BillingSettingRouter;