const Joi = require('joi');
const fs = require('fs'); //file system built-in module [by using this we save photo in disc]
const Blog = require('../models/blog');
const { BACKEND_SERVER_PATH } = require('../config/index');
const BlogDTO = require('../dto (Data transfer object)/blog');
const BlogDetailsDTO = require('../dto (Data transfer object)/blog-details');
const Comment = require('../models/comment');

// regex-regular expression
const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;

// blogController object
const blogController = {
    // Methods
    async create(req, res, next) {
        // 1- validate req body
        // client side -> base64 encoded string form -> decode in backend -> store -> save photo's path in db
        const createBlogSchema = Joi.object({
            title: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(), // regex-mongodb ki id ke pattren ke sath match krda expression hoga  
            content: Joi.string().required(),
            photo: Joi.string().required(),
        });
        const { error } = createBlogSchema.validate(req.body); // sara data body me ajaye ga
        if (error) {
            return next(error);
        }
        const { title, author, content, photo } = req.body; // destruct from req body
        // HANDLE PHOTO WITH SOME STEPS
        // read as buffer in Nodejs (built-in) through we handle binary data stremes
        const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''), 'base64')

        // allot arandom name
        const imagePath = `${Date.now()}-${author}.png`;

        // save locally
        // 2- handle photo storage, naming
        try {
            fs.writeFileSync(`storage/${imagePath}`, buffer);
        }
        catch (error) {
            return next(error);
        }
        // save blog in db
        // 3- add to db
        let newBlog;
        try {
            newBlog = new Blog({
                title,
                author,
                content,
                photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`
            });
            await newBlog.save();
        }
        catch (error) {
            return next(error);
        }
        // 4- return response
        const blogDto = new BlogDTO(newBlog);
        return res.status(201).json({ blog: blogDto });
    },

    // getAll -> send all blog info
    async getAll(req, res, next) {

        // no validation because we don't send any data in th req body
        try {
            // run find method on blog model & pass empty filter in it
            // than we get all the data in the collection 
            const blogs = await Blog.find({});

            // for in DTO form, use FOR LOOP
            // Array -> blogDto
            const blogsDto = [];

            for (let i = 0; i < blogs.length; i++) {
                const dto = new BlogDTO(blogs[i]);
                blogsDto.push(dto);
            }
            //" blogsDto array" send into "blogs object"
            return res.status(200).json({ blogs: blogsDto });
        }
        catch (error) {
            return next(error);
        }
    },

    async getById(req, res, next) {
        // validate ID
        // send response
        const getByIdSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required()
        });

        // data send in req's params not in body 
        const { error } = getByIdSchema.validate(req.params);

        if (error) {
            return next(error);
        }

        let blog;

        const { id } = req.params;

        try {
            blog = await Blog.findOne({ _id: id }).populate('author');
        }
        catch (error) {
            return next(error);
        }
        // const blogDto = new BlogDTO(blog);
        // return res.status(200).json({ blog: blogDto });

        const blogDto = new BlogDetailsDTO(blog);
        return res.status(200).json({ blog: blogDto });

        // return res.status(200).json({ blog: blog});
    },

    async update(req, res, next) {
        // validate 
        // 
        const updateBlogSchema = Joi.object({
            title: Joi.string().required(),
            content: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(),
            blogId: Joi.string().regex(mongodbIdPattern).required(),
            photo: Joi.string()
        });
        const { error } = updateBlogSchema.validate(req.body);

        const { title, content, author, blogId, photo } = req.body;
        // delete previous photo
        // save new photo

        let blog;
        try {
            blog = await Blog.findOne({ _id: blogId });
        }
        catch (error) {
            return next(error);
        }
        if (photo) {
            let previousPhoto = blog.photoPath;

            previousPhoto = previousPhoto.split('/').at(-1);

            // delete photo
            fs.unlinkSync(`storage/${previousPhoto}`);

            // read as buffer 
            const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''), 'base64')

            // allot arandom name
            const imagePath = `${Date.now()}-${author}.png`;

            // save locally
            try {
                fs.writeFileSync(`storage/${imagePath}`, buffer);
            }
            catch (error) {
                return next(error);
            }
            await Blog.updateOne({ _id: blogId },
                { title, content, photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}` }
            );
        }
        else {
            await Blog.updateOne({ _id: blogId }, { title, content });
        }
        return res.status(200).json({ message: 'blog updated!' });
    },
    async delete(req, res, next) {
        // valodate id
        // delete blog
        // delete comments on this blog

        const deleteBlogSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required()
        });
        const { error } = deleteBlogSchema.validate(req.params);

        const { id } = req.params;
        try {
            // delete blog
            await Blog.deleteOne({ _id: id })

            // delete comments
            await Comment.deleteMany({ blog: id })
        }
        catch (error) {
            return next(error);
        }
        return res.status(200).json({ message: ' blog deleted!' });
    },
}
module.exports = blogController;