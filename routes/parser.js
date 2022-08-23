class ParserRouter {

    static getConfig()
    {
        return {};
    }

    static getRouter(logic)
    {
        var express = require('express');
        var router = express.Router();
        const path = require('path');
        router.logic = logic;
        let me = this;

        router.get('/ocr/:image', (req, res)=>{
            let image = req.params.image;
            logic.parse(image).then((response)=>{
                res.send(response);
            }).catch((error)=>{
                res.send(error)
            })
        });

        router.get('/ocr/:image/:top/:left/:width/:height', (req, res)=>{
            let image = req.params.image;
            let rectangle = { top: req.params.top, left: req.params.left, width: req.params.width, height: req.params.height }
            console.log('Rectangle')
            console.log(rectangle)
            
            logic.parse(image, rectangle).then((response)=>{
                res.send(response);
            }).catch((error)=>{
                res.send(error)
            })
        });


        router.post('/ocr-all/:image', (req, res)=>{
            let image = req.params.image;
            let ocrInfo = req.body;
            console.log("ocrInfo")
            console.log(ocrInfo)

            logic.parseAll(image, ocrInfo).then((response)=>{
                res.send(response);
            }).catch((error)=>{
                console.log("Error")
                console.log(error)
                res.send(error)
            })
        });

        router.get('/ocr-pdf/:pdfPath', (req, res)=>{
            let pdfPath = req.params.pdfPath;
            //let ocrInfo = req.body;
            //console.log("ocrInfo")
            //console.log(ocrInfo)

            logic.convert2images(pdfPath).then((response)=>{
                console.log("response")
                console.log(response)
                res.send(response);
            }).catch((error)=>{
                console.log("Error")
                console.log(error)
                res.send(error)
            })
        });

        router.get('/ocr-pdf-all/:pdf', (req, res)=>{
            let pdf = req.params.pdf;

            logic.parseAllPdf(pdf).then((response)=>{
                
                res.send(response);
            }).catch((error)=>{
                console.log("Error")
                console.log(error)
                res.send(error)
            })
        });

        return router;
    }
}

module.exports = ParserRouter;