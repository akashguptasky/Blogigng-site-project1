
const blogModel = require('../Model/blogsModel')
const authorModel = require('../Model/authorModel')
const mongoose = require("mongoose")
const { query } = require('express');
const jwt = require('jsonwebtoken')
let ObjectId = require('mongoose').Types.ObjectId

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody)
}


// ========================= check that any key value is empty or whitespace / not by using isValid function================================
// =========================================================================================================================================

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}


// ================================================ ** Write logic Create Blog api **===================================================


let createBlog = async function (req, res) {
    try {

        let data = req.body;
        let authorId = data.authorId

        //  checking that required key is present or not
        if (!data.title) return res.status(400).send({ status: false, msg: "Title tag is required" })
        if (!data.body) return res.status(400).send({ status: false, msg: "body tag is required" })
        if (!data.category) return res.status(400).send({ status: false, msg: "category tag is required" })
        if (!data.authorId) return res.status(400).send({ status: false, msg: "authorId tag is required" })

        // here we are checking that if any field is empty or send data with space 
        if (!isValid(data.title)) return res.status(400).send({ status: false, msg: "title is not empty" })
        if (!isValid(data.body)) return res.status(400).send({ status: false, msg: "body is not empty" })
        if (!isValid(data.category)) return res.status(400).send({ status: false, msg: "category is not empty" })
        if (!isValid(data.authorId)) return res.status(400).send({ status: false, msg: " authorId is not empty" })

        // Author id format is valid or not
        if (!mongoose.Types.ObjectId.isValid(authorId)) return res.status(400).send({ status: false, mess: "Please enter a valid id " })

        // this authorId is present in our db or not
        let isExistsAuthorId = await authorModel.findById(authorId)

        // create blog with real author id 
        let token = req.headers["x-api-key"];
        let decodedToken = jwt.verify(token, "project1")

        let logginUserAuthorId = decodedToken.authorId
        if (logginUserAuthorId != authorId) return res.status(403).send({ status: false, msg: "You are not autherized to create blog with another id" })
        // send the error mess if authorId is not present in db
        if (!isExistsAuthorId) return res.status(400).send({ status: false, msg: "Author doesn't exists" })

        // everyting is fine then create data in database and send the responce with satatus 201
        let newBlogObject = await blogModel.create(data)
        res.status(201).send({ status: true, data: newBlogObject })

    } catch (error) {
        res.status(500).send({ status: false, msg:error.message })
    }
};



// ================================================ ** Write logic Get Blogs API **===================================================

const getBlogs = async function (req, res) {
    try {
        let query = req.query;
        let filter = {
            isdeleted: false,
            isPublished: true,
            ...query
        };

        if(query.authorId || query.authorId=='')
        {
            if (!mongoose.Types.ObjectId.isValid(query.authorId) || query.authorId.toString()=='') return res.status(404).send({ status: false, msg: "Please provide a Valid authorId" })

        }
       if(query.tags=='') return res.status(400).send({status:false,msg:"Tags field should not be empty"})
       if(query.category=='' ) return res.status(400).send({status:false,msg:"category field should not be empty"})
       if(query.subcategory=='' ) return res.status(400).send({status:false,msg:"subcategory field should not be empty"})

        if(query.blogId || query.blogId=='') return res.status(400).send({status:false,msg:"You can't get any blog by using blogId"})
        if(query.title || query.title=='') return res.status(400).send({status:false,msg:"You can't get any blog by using title"})

        if (isValidRequestBody(query)) {
            //Extract params
            const { authorId, category, subcategory, tags } = query // Object destructing

            if (isValid(category)) {
                filter['category'] = category.trim()
            }

            if (filter.authorId) {
                let id = filter.authorId.toString();
                if (!isValid(id)) return res.status(400).send({ status: false, msg: "authorId should not be empty" })
            }
            if (isValid(authorId)) {
                filter['authorId'] = authorId
            }


            if (isValid(tags)) {
                const tagsArr = tags.trim().split(',').map(tag => tag.trim());
                filter['tags'] = { $in: tagsArr }
            }
            if (isValid(subcategory)) {
                const subcatArr = subcategory.trim().split(',').map(subcat => subcat.trim());
                filter['subcategory'] = { $in: subcatArr }
            }
        }

        let getSpecificBlogs = await blogModel.find(filter);
        if (getSpecificBlogs.length == 0) {
            return res.status(404).send({ status: false, data: "No blogs found" });
        }
        else {
            return res.status(200).send({ status: true, data: getSpecificBlogs });
        }
    }
    catch (error) {
        res.status(500).send({ status: false, err: error.message });

    }
}

// ================================================ ** Write logic Update Blog  Api **===================================================


const updateBlog = async function (req, res) {
    try {

        let authorTokenId = req.authorId
        //getting blog Object id from params
        let blogId = req.params.blogId

        if (!ObjectId.isValid(blogId)) {
            return res.status(400).send({ status: false, msg: "Please provide a valid Blog id" })
        }
        // return res.send({status:false,msg:"Please provide a valid params id"})
        // This blogId is present in db or not
        let blog = await blogModel.findById(blogId);

        if (blog.authorId.toString() !== authorTokenId) return res.status(403).send({ status: false, msg: "you are not autharise for Update anoter person data" })
        //if not present then send error mess
        if (!blog || blog.isDeleted == true) {
            return res.status(404).send({ status: false, msg: "No such blog exists" });
        };

        // getting all the requested data form body for updatation
        let blogData = req.body;


        //check that if this field is available then it's contains right data/ value/content or not
        if (blogData.title) {
            if (!isValid(blogData.title)) return res.status(400).send({ status: false, msg: "title field should not empty" })
        }
        if (blogData.category) {
            if (!isValid(blogData.category)) return res.status(400).send({ status: false, msg: "category field should not empty" })
        }
        if (blogData.tags) {
            if (!isValid(blogData.tags)) return res.status(400).send({ status: false, msg: "tags field should not empty" })
        }
        if (blogData.subcategory) {
            if (!isValid(blogData.subcategory)) return res.status(400).send({ status: false, msg: "subcategory field should not empty" })
        }

        //if everything is fine then update it with new data and time and return updated data in responce with 200 status
        let updateBlog = await blogModel.findOneAndUpdate({ _id: blogId }, {
            $set: { "title": req.body.title, "body": req.body.body, "category": req.body.category, "isPublished": true, "publishedAt": new Date() },
            $push: { "tags": req.body.tags, "subcategory": req.body.subcategory }
        }, { new: true })
        return res.status(200).send({ status: true, data: updateBlog });

    } catch (err) {
        return res.status(500).send({ status: false, msg: "Not Available" })
    }
};




// ================================================ ** Write logic DeleteByID API ** ===================================================

const deleteById = async function (req, res) {

    let blog = req.params.blogId
    let authorTokenId = req.authorId

    if (blog == undefined) {
        return res.status(400).send({ status: false, msg: "blogId must be present in order to delete it" })
    }

    if (!mongoose.Types.ObjectId.isValid(blog)) {
        return res.status(400).send({ status: false, msg: "Please provide a Valid blogId" })
    }
    let fullObject = await blogModel.findById(blog)

    if (!fullObject) return res.status(400).send({ status: false, msg: "This blog id is not available in database" })
    //autheri.. logic
    if (fullObject.authorId.toString() !== authorTokenId) return res.status(403).send({ status: false, msg: "you are not autharise for Update anoter person data" })


// fullObject.isPublished != false &&

    if (fullObject.isDeleted == false) {
        let newData = await blogModel.updateOne({ _id: blog }, { $set: { "isDeleted": true ,"isPublished":false} })
        res.status(200).send({status:true,msg:"Blog deleted successfully"})
    }

    else {
        res.status(400).send({ status: false, msg: "This data is not publised " })
    }
};


// ================================================ ** Write logic for Delete Blog by query params api **=========================================




const deleteBlog = async function(req,res)
{
    try{

        const filterQuery = {isDeleted:false, deletedAt: null}
        const queryParams = req.query
        const authorIdFromToken = req.authorId
        if(!isValidRequestBody(queryParams)) return res.status(400).send({status:false,msg:`No query params recieved. Aborting delted operation`})
        
        const {authorId, category, tags, subcategory, isPublished} = queryParams
        if(isValid(authorId) && mongoose.isValidObjectId(authorId)){
            filterQuery['authorId'] = authorId
        }
        if(isValid(category)){
            filterQuery['isPublished'] = isPublished
        }
        if(isValid(tags)){
           const tagsArr = tags.trim().split(',').map(tag => tag.trim());
           filterQuery['tags'] = {$all: tagsArr}
        }
        if(isValid(subcategory)){
            const subcatArr = subcategory.trim().split(',').map(subcat => subcat.trim());
            filterQuery['subcategory'] = {$all: subcatArr}
        }

        const blogs = await blogModel.find(filterQuery);

        if(Array.isArray(blogs) && blogs.length===0) return res.status(404).send({status:false, msg: 'No matching blogs found'})

        const idsOfBlogsToDelete = blogs.map(blog => {
            if(blog.authorId.toString()=== authorIdFromToken) return blog._id
        })
        if(idsOfBlogsToDelete.length===0){
            return res.status(400).send({status:false, message: 'No blogs found'})
        }

        await blogModel.updateMany({_id: {$in: idsOfBlogsToDelete}}, {$set: {isDeleted: true, deletedAt: new Date()}})
        res.status(200).send({status: true, message: 'Blogs deleted successfully'})
        
    }catch(error){
        res.status(500).send({status:false,msg:error.message})
    }
}






// ================================================ ** Exprots all modules here **===================================================

module.exports = {
    getBlogs, createBlog, updateBlog, deleteById, deleteBlog
}

