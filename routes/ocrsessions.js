const CrudRouter = require("./crudrouter");

class OcrSessionRouter extends CrudRouter{


    static getRouter(logic)
    {
        let router = super.getRouter(logic);
        router.get("/download-ocr-result/:ocrsessionid", (req, res)=>{
            let id = req.params.ocrsessionid
            logic.downloadOcrResult(id).then((response)=>{
                //res.send({ success: true });
                res.sendFile(response)
            }).catch((err)=>{
                res.send({success: false, error: err, message: err.message})
            })
            
        })

        router.get("/run-ocr-sessions", (req, res)=>{
            logic.runAllOcrSessions();
            res.send({ success: true });
        })

        router.get("/hello", (req, res)=>{
            res.send({ success: true });
        })

        return router;
    }
}

module.exports = OcrSessionRouter;