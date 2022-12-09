const CrudRouter = require("./crudrouter");


class BillingSettingRouter extends CrudRouter{

    static getRouter(logic)
    {
        let router = super.getRouter(logic);


        router.get("/info", (req, res)=>{
            let date1 = req.query.date1;
            let date2 = req.query.date2;

            logic.getBillingInfo(date1, date2).then((response)=>{
                res.send(response);
            }).catch((e)=>{
                res.send(e);
            })
        })

        return router;
    }


}

module.exports = BillingSettingRouter;