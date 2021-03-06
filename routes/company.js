const express = require('express')
const route = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const multer = require('multer')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const welcomeEmail = require('../middleware/emails/subscription')
const goodbyeEmail = require('../middleware/emails/unsubscription')
const Company = require('../models/company')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads/company-profil')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + file.originalname)
    }
})
const fileFilter = (req, file, cb ) => {
      if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg'){
        cb(null, true)
      } else {
          cb(null, false)
      }
}
const upload = multer({ 
        storage : storage, 
        limits : { fileSize : 1024 * 1024 * 5 },
        fileFilter : fileFilter
})

route.get('/', async(req, res, next) => {

    try {
            const company = await Company.find() .select(' _id company createdAt phone email picture')
            
            if(company.length < 1) {
                res.status(404).json({message : "No Companies found"})
            } else {
                res.status(200).json({ 
                    message : "companyS LISTS", 
                    company
                })
            }
           
    }catch(error){
            res.status(500).json({
                message : "AN ERROR OCCURED",
                error : error.message})
        }
})
route.get('/:companyId', async(req, res, next) => {
    try {
            const company = await Company.findById({_id : req.params.companyId})
        
            if(company){
                res.status(200).json({
                    message : "COMPANY SUCCESSFULLY FETCHED",
                    company })
            }else {
                res.status(404).json({
                    message : "No Valid entry found for provided Id"
                })
            } 
    }catch(error){
            res.status(500).json({
                message : "AN ERROR OCCURED",
                error : error.message})
    }
})
route.post('/signup', async(req, res, next) => {

    let { company, password, country, createdAt, email, phone, address, about, skills,portfolio,socialmedialink , total_number_employee} = req.body
    const  _id = new mongoose.Types.ObjectId() 

    try{
           const existingCompany = await  Company.find({email : email})
            if(existingCompany.length >= 1){
                return res.status(409).json({
                    message : "EMAIL EXISTS"
                })
            }else{
                const hashedPassword = await bcrypt.hash(password, 10)

                const newCompany = new Company({
                    _id , company,
                    picture : "",
                    country,createdAt,company,email,phone,address,about,
                    registered : moment().format("MMM Do YY"),
                    info: { 
                        overview : "", 
                        awards : []
                    },
                    skills,
                    portfolio,
                    socialmedialink,
                    total_number_employee,
                    password : hashedPassword
                })
                const createdCompany = await newCompany.save()
                welcomeEmail.welcomeEmail(createdCompany.email)
                res.json({
                    message : "COMPANY CREATED",
                    createdCompany,
                    request : {
                        type : 'GET',
                        url : `localhost:8080/company/${createdCompany._id}`
                    } 
                })
            }
    }catch(error){
            res.status(500).json({
                message : "AN ERROR OCCURED",
                error : error.message
             });
        }
})
route.post('/login', async (req, res, next ) => {
    try {
            const company = await Company.find({email : req.body.email})
            let companyPassword = company[0].password
            if(company.length < 1){
                    res.status(404).json({
                        message : " INVALID EMAIL OR PASSWORD "
                    })
            }else{
                    const result = await bcrypt.compare(req.body.password, companyPassword)

                    if(result){
                        const token = jwt.sign({
                            email : company.email,
                            id : company._id
                        }, 'thisisasecretkey', {
                            expiresIn : "5h"
                        })
                        res.status(200).json({
                            message : "SUCCESSFULLY LOGGED IN",
                            company, 
                            token })
                    }else{
                        res.status(400).json({
                            message : "AUTHENTICATION FAILED !"})
                    }
                            
                }
        
    }catch(error){
        res.status(500).json({
            message : "AN ERROR OCCURED",
            error : error.message})
    
    }
})
route.patch('/picture/:companyId', upload.single('picture'), async (req, res, next) => {
    
    const companyId = req.params.companyId

    try {
            const company = await Company.updateOne({_id : companyId}, { picture: req.file.path });
            res.status(200).json({
                messgae : "COMPANY IMAGE SUCCESSFULLY UPDATED",
                path : req.file.path,
                request : {
                    type : 'GET',
                    url : `localhost:8080/company/${company._id}`}
            })
            
    }catch(error){
            res.status(500).json({
                message : "AN ERROR OCCURED",
                error : error.message })
            }

})
route.patch('/:companyId', async(req, res, next ) => {

    const companyId = req.params.companyId
    const props = req.body

    try {
            const company = await Company.update({_id : companyId}, props)

            res.status(200).json({
                messgae : "COMPANY SUCCESSFULLY UPDATED",
                company,
                request : {
                    type : 'GET',
                    url : `localhost:8080/company/${company._id}`
                }
            })
    }catch(error){
            res.status(500).json({
                message : "AN ERROR OCCURED",
                error : error})
           }
})
route.delete('/:companyId',async (req, res, next) => {

    const companyId = req.params.companyId
    

    try {
        console.log(companyId)
            const result = await Company.deleteOne({_id : companyId})
            // goodbyeEmail.goodbyeEmail(createdCompany.email)
            res.status(200).json({
                message : "COMPANY SUCCESSFULLY DELETED",
                result,
                request : {
                    type : 'CREATE COMPANY',
                    url : `localhost:8080/company/`
                }
            })
    }catch(error){
            res.status(500).json({
                message : "AN ERROR OCCURED",
                error : error.message })
            }
})



module.exports = route 