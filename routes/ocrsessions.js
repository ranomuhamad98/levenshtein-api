const CrudRouter = require("./crudrouter");

class OcrSessionRouter extends CrudRouter{

    
    static getRouter(logic)
    {
        let router = super.getRouter(logic);
        router.get("/run-ocr-sessions", (req, res)=>{
            logic.runAllOcrSessions();
            res.send({ success: true });
        })

        return router;
    }
}

module.exports = OcrSessionRouter;