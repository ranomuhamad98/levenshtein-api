class IndexRouter {

    static getRouter(logic)
    {
        var express = require('express');
        var router = express.Router();
        router.logic = logic;
        let me = this;
        
        router.get("", (req, res)=>{
            let data =
            {
                OCR_API: process.env.OCR_API
            }

            res.send(data);
        })

        return router;
    }


}

module.exports = IndexRouter;