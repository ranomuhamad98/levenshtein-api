const CrudRouter = require("./crudrouter");

class PageTemplatesRouter extends CrudRouter{

    static getRouter(logic)
    {
        let  router = super.getRouter(logic);
        router.post("/create-update", (req, res)=>{
            let pageTemplate = req.body;
            logic.createUpdate(pageTemplate).then((response)=>{
                res.send(response)
            }).catch(err =>{
                console.log("Error: create-update")
                console.log(err)
                res.send(err)
            })
        })

        router.get("/get-by-document-page/:document/:page", (req, res)=>{
            let document = req.params.document;
            let page = req.params.page;

            logic.findByDocumentAndPage(document, page).then((response)=>{
                res.send(response)
            }).catch(err =>{
                console.log("Error: create-update")
                console.log(err)
                res.send(err)
            })
        })

        return router;
    }
}

module.exports = PageTemplatesRouter;