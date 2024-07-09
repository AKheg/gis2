const express = require("express")
const router = express.Router()
const fs = require("fs")
const multer = require("multer")
require('dotenv').config()
const graves = process.env.DATA

let docName
let imgName

  router.get("/", function (req,res,next) {
    if (req.user) {
        if (req.method === "POST") {
          console.log(req.data.name)
        }
        res.render("admin", {
          username: req.user.username,
          graves: req.gravesData,
        });
      } else {
        res.redirect("/");
      }
  })

  router.get("/edit/:id", function (req,res,next) {
    if (!req.user) {
      res.redirect('/')
    }
  })
  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.mimetype === 'application/pdf') {
        cb(null, 'public/pdf')
      } else if (file.mimetype.match(/^image/)) {
        cb(null, 'public/images')
      } else {
        console.log(file.mimetype)
        cb({error : 'Mime type not supported'})
      }
    },
    filename: function(req,file,cb) {
      if (file.mimetype === 'application/pdf') {
        docName = Buffer.from(file.originalname, 'latin1').toString('utf8')
        cb(null, docName)
      } else if (file.mimetype.match(/^image/)) {
        imgName = Buffer.from(file.originalname, 'latin1').toString('utf8')
        cb(null, imgName)
      }
    }
  })
  
  const upload = multer({
    storage,
    limits: {
     filesize: 50000000 // ~ 50mb
    }
  })
  
  router.post("/edit/:id", upload.any(), function (req,res,next) {
      console.log("editing from" + req.user)
      let content = JSON.parse(fs.readFileSync(graves), 'utf8')
      let featureId = req.params.id
      let featureProp = content.features[featureId - 1].properties
      featureProp.extra = req.body.extra
      featureProp.name = req.body.name
      featureProp.born = req.body.yearb
      featureProp.died = req.body.years
      featureProp.pic = imgName
      featureProp.doc = docName
      if (typeof req.body.coordinates !== 'undefined' && req.body.coordinates) {
        content.features[featureId - 1].geometry.coordinates = req.body.coordinates
      }
      fs.writeFileSync(graves, JSON.stringify(content))
      imgName = ""
      docName = ""
      //res.send("Feature was updated successfully")
      res.redirect('/')
  })
  
  let coords
  router.post("/create", upload.any(), function (req,res,next) {
    let content = JSON.parse(fs.readFileSync(graves), 'utf8')
    let featureId = content.features.length + 1
    if (typeof req.body.coordinates !== 'undefined' && req.body.coordinates) {
      //coords = req.body.coordinates
      //console.log(content.features)
      //content.features[featureId - 1].geometry.coordinates = req.body.coordinates
      coords = req.body.coordinates

    } else {
        content.features.push({"type":"Feature","properties":{"id":featureId,"pic":imgName,"doc":docName,"extra":req.body.extra2,"name": req.body.name2,"born":req.body.yearb2,"died":req.body.years2},"geometry":{"type":"Polygon","coordinates":coords}});
        fs.writeFileSync(graves, JSON.stringify(content))
        imgName = ""
        docName = ""
        res.redirect('/')
        coords = []
    }
  })

  router.post("/delete/:id", function (req,res,next) {
      let content = JSON.parse(fs.readFileSync(graves), 'utf8')
      let featureId = req.params.id
      content.features.splice(parseInt(featureId) - 1, 1)
      fs.writeFileSync(graves, JSON.stringify(content))
      res.redirect('/')
  })

  module.exports = router;