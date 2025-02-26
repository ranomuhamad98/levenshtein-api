const CrudRouter = require("./crudrouter");

class OcrSessionRouter extends CrudRouter{


    static getRouter(logic)
    {
        let router = super.getRouter(logic);

        /*
        * Router untuk download hasil OCR
        * Parameter: 
        * - ocrsessionid, id dari sessi ocr
        * Return:
        * - File excel hasil ocr
        */
        router.get("/download-ocr-result/:ocrsessionid", (req, res)=>{
            let id = req.params.ocrsessionid
            logic.downloadOcrResult(id).then((response)=>{
                //res.send({ success: true });
                res.send({ success: true, payload: response })
            }).catch((err)=>{
                res.send({success: false, error: err, message: err.message})
            })
            
        })

        router.get("/run-ocr-sessions", (req, res)=>{
            logic.runAllOcrSessions();
            res.send({ success: true });
        })

        router.get("/run-ocr-session/:sessionid/:page", (req, res)=>{
            let sessionid = req.params.sessionid;
            let page = req.params.page;

            logic.runOneOcrSession(sessionid, page).then((payload)=>{
                res.send({ success: true, payload: payload });
            }).catch((err)=>{
                res.send({ success: false, error: err })
            })
            
        })

        router.get("/hello", (req, res)=>{
            res.send({ success: true });
        })
 
        return router;
    }

    static init(req, res)
    {
        if(req.headers.user != null)
        {
            req.session.user  = JSON.parse(req.headers.user);
        }
    }
}

module.exports = OcrSessionRouter;