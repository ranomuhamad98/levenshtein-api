const { Sequelize, Model, DataTypes } = require('sequelize');
const { Op } = require("sequelize");

const CommonLogic = require("./commonlogic");
const HttpClient = require("../utils/HttpClient");
const PageTemplateModel = require('../models/pagetemplatemodel');

class DocumentLogic extends CommonLogic {

    static getModel()
    {
        const model = require("../models/document_model");
        return model;
    }

    static getPk(){
        return "id";
    }

    static getWhere(search)
    {
        let where = {
            filename : {
                [Op.like] : "%" + search + "%"
            } 
        }
        return where;
    }

    static getOrder()
    {
        let order = [['updatedAt', 'DESC']];
        return order;
    }

    static async create(o)
    {
        try {
            const CurrentModel = this.getModel();
            console.log("o.filename")
            console.log(o.filename)
            let f = await CurrentModel.findAll({ where: { filename :  { [Op.like] : o.filename } }})
            console.log("f")
            console.log(f)
            if(f.length == 0)
                return await super.create(o);
            else 
            {
                o.upload_date = Date.now();
                console.log("here is")
                return await super.update(f[0].id, o)
            }
        }
        catch (e)
        {
            console.log(e)
            throw e;
        }

    }

    static async delete(id)
    {
        try {
            let pk = this.getPk();
            const CurrentModel = this.getModel();
            let where = {};
            where[pk] = id;
            let document = await CurrentModel.findOne({where: where})
            if(document != null)
            {
                let documentFilename = document.filename;
                documentFilename = documentFilename.replace("gs://", "")
                let documentFilenames = documentFilename.split("/");
                let bucetName = documentFilenames[0];
                let documentPath =  documentFilename.replace(bucetName + "/", "")
                let project = process.env.GCP_PROJECT;
                //let url =  process.env.UPLOADER_API + "/upload/gcs-delete/" + project + "/" + bucetName + "/" + encodeURIComponent(documentPath)
                let url =  process.env.UPLOADER_API + "/gcs/delete?path=" + project + ":" + bucetName + "/" + encodeURIComponent(documentPath)

                console.log('delete url')
                console.log(url)
                HttpClient.get(url).then((response)=>{
                    console.log(response)
                }).catch((e)=>{
                    console.log(e)
                })
    
                let pageDoc = document.filename.replace('gs://', 'https://storage.googleapis.com/')
                let pageTemplates = await PageTemplateModel.findAll({ where: { document: { [Op.iLike] : pageDoc } } })
    
                pageTemplates.map((pg)=>{
                    let img = pg.pageImageUrl
                    img = img.replace("https://storage.googleapis.com/", "")
                    let tmp = img.split("/")
                    let bucket = tmp[0];
                    let path = img.replace(bucket + "/", "")
                    //url =  process.env.UPLOADER_API + "/upload/gcs-delete/" + project + "/" + bucket + "/" + encodeURIComponent(path);
                    url =  process.env.UPLOADER_API + "/gcs/delete?path=" + project + ":" + bucket + "/" + encodeURIComponent(path);

                    console.log("delete page template image")
                    console.log(url)
                    HttpClient.get(url).then((response)=>{
                        console.log(response)
                    }).catch((e)=>{
                        console.log(e)
                    })
    
                })
    
                console.log('pageTemplate delete')
                await PageTemplateModel.destroy({ where: { document: { [Op.iLike] : pageDoc } } })

                console.log("document delete")
                await super.delete(id)

                return { success: true, payload: {}  }
            }
            else 
                return { success: false, message: 'No such document' }
            
        } catch (error) {
            console.log('delete document error')
            console.log(error)
            throw error   
        }
        
    }

    static async updateDateByDocumentName(document)
    {

        try
        {        
            const CurrentModel = this.getModel();
            let f = await CurrentModel.findAll({ where: { filename :  { [Op.like] : document } }})
            if(f.length == 0)
            {
                return { success: false, message: "No document"}
            }
            else 
            {
                f = f[0]
                f = JSON.parse(JSON.stringify(f))
                let dt = new Date().toISOString();
                f.updatedAt = dt;
                //console.log("date")
                //console.log(dt)
                //console.log(f.id)
                //console.log(CurrentModel)   
                let result = await CurrentModel.update(f, { where:{ id: f.id } })
                //console.log(f)
                //console.log(result)
                return { success: true, payload: f}
            }
        }
        catch(e)
        {
            console.log(e)
            throw e;
        }
    }

    static getDefaultWhere()
    {
        if(this.session.username != null)
        {
            return { 
                upload_by: {
                    [Op.iLike] : this.session.username
                }
            }
        }
        else
            return null;

    }
}

module.exports = DocumentLogic;