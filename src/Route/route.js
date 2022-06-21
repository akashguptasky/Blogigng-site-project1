const express = require('express')
const authorController = require('../Controller/authorController');
const blogController = require('../Controller/blogController');
// const blogMiddleware = require('../Middleware/blogMiddlware')
const router = express.Router();


// Author API's == Create an author - atleast 5 authors
router.post('/authors',authorController.createAuthor)




// Blog API's
// router.post('/blogs',blogController.createBlog)






module.exports= router;