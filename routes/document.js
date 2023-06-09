const CrudRouter = require("./crudrouter");


class DocumentRouter extends CrudRouter{

    static getRouter(logic)
    {
        let router = super.getRouter(logic);
        router.get("/setsession", (req, res)=>{
            req.session.organization_code = "DEVOTEAM";
            res.send(req.session);
        })

        router.get("/update-date/:document", (req, res)=>{
            let document = req.params.document;
            logic.updateDateByDocumentName(document).then((response)=>{
                res.send(response);
            }).catch((e)=>{
                res.send({success: false, error: e, message: e.message});
            })
        })

        

        return router;
    }

    static init(req, res)
    {
        if(req.session.organization_code == null)
            req.session.organization_code = "DEVOTEAM";

        let username = req.query.username;
        req.session.username = username;

        if(req.headers.user != null)
        {
            req.session.user  = JSON.parse(req.headers.user);
        }
        
    }
}

module.exports = DocumentRouter;