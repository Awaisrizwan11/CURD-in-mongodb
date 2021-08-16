require('express-async-errors')
const winston = require('winston')
require('winston-mongodb')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const _ = require('lodash')
const Joi = require('joi');
const express = require('express');
const app = express();
require('./prod')(app)


winston.add(new winston.transports.File({
    filename: 'logfile.log'
}))
winston.add(new winston.transports.MongoDB({
    db: 'mongodb://localhost/logindb'
}))

app.use(express.json())

mongoose.connect('mongodb://localhost/logindb', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(() => console.log('Database connected'))
    .catch(err => console.log('Error', err))

const User = mongoose.model('User', new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    },


}))


app.get('/get', async (req, res) => {
    const users = await User.find().sort('name');
    res.send(users);
});

app.post('/post', async (req, res) => {
    const {
        error
    } = schema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    console.log(error)
    let user = await User.findOne({
        email: req.body.email
    });
    if (user) return res.status(400).send('User already registed.');



    user = new User(_.pick(req.body, ['name', 'email', 'password']));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();
    res.send(_.pick(req.body, ['name', 'email', 'password']))
});

app.put('/put/:id', async (req, res) => {
    const {
        error
    } = schema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const users = await User.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    }, {
        new: true
    });

    if (!users) return res.status(404).send('The user with the given ID was not found.');

    res.send(users);
});

app.delete('/delete/:id', async (req, res) => {
    const users = await User.findByIdAndRemove(req.params.id);

    if (!users) return res.status(404).send('The user with the given ID was not found.');

    res.send(users);
});

app.get('/:id', async (req, res) => {
    const users = await User.findById(req.params.id);

    if (!users) return res.status(404).send('The user with the given ID was not found.');

    res.send(users);
});


const schema = Joi.object({
    name: Joi.string().min(5).max(50).required(),
    email: Joi.string().min(5).max(50).required(),
    password: Joi.string().min(5).max(50).required()
});



app.listen(9000, () => {
    console.log('running...')
});