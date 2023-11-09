const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;

// middleware 
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://online-study-83f14.web.app',
        'https://online-study-83f14.firebaseapp.com'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ktmmaha.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middlewares... 
const logger = (req, res, next) => {
    console.log('log: info', req.method, req.url);
    next()
}

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    jwt.verify(token, process.env.TOKEN_SCRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next()
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();


        const featuresCollection = client.db('onlineStudy').collection('features');
        const assignmentCollection = client.db('onlineStudy').collection('assignments');
        const submitionCollection = client.db('onlineStudy').collection('submits');


        // auth related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log('user for token', user)
            const token = jwt.sign(user, process.env.TOKEN_SCRET, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: false,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true })
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('loging Out', user)
            res.clearCookie('token', {
                maxAge: 0,
                sameSite: "none",
                secure: true
            }).send({ success: true });
        })


        // submited related  
        app.post('/submits', async (req, res) => {
            const submit = req.body;
            console.log(submit);
            const result = await submitionCollection.insertOne(submit);
            res.send(result);
        })


        app.get('/submits/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await submitionCollection.findOne(query);
            res.send(result);
        })

        // features related api
        app.get('/features', async (req, res) => {
            const cursor = featuresCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // create Assignment related .. 

        app.get('/assignment', async (req, res) => {
            const result = await assignmentCollection.find().toArray();
            res.send(result);
        })

        // update assignment
        app.get('/assignment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await assignmentCollection.findOne(query);
            res.send(result);
        })

        app.put('/assignment/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateAssignment = req.body;
            const update = {
                $set: {
                    title: updateAssignment.title,
                    category: updateAssignment.category,
                    photo: updateAssignment.photo,
                    mark: updateAssignment.mark,
                    description: updateAssignment.description,
                    date: updateAssignment.date,
                    thumbnail: updateAssignment.thumbnail
                }
            }

            const result = await assignmentCollection.updateOne(filter, update, options)
            res.send(result)
        })

        app.get('/assignments', logger, verifyToken, async (req, res) => {
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ massage: 'forbidden access' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const cursor = assignmentCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await assignmentCollection.findOne(query);
            res.send(result);
        })


        app.post('/assignments', async (req, res) => {
            const assignmente = req.body;
            console.log(assignmente);
            const result = await assignmentCollection.insertOne(assignmente);
            res.send(result);
        })

        app.delete('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await assignmentCollection.deleteOne(query);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Online Study server running')
})

app.listen(port, () => {
    console.log(`Online sever running on port ${port}`)
})