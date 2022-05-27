const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');

const app = express();

const port = process.env.PORT || 5000;

// use middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gfl5mwm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
    try {
        await client.connect();
        const productCollection = client.db('SuperrTools').collection('products');
        const userCollection = client.db('SuperrTools').collection('users');

        app.get('/tools', async (req, res) => {
            const pageNo = parseInt(req.query.page);
            const productsQuantityToShow = parseInt(req.query.quantity);
            const tools = await productCollection.find().skip(pageNo*productCollection).limit(productsQuantityToShow).toArray();

            res.send(tools);
        });

        app.put('/user', async (req, res) => {
            const email = req.body.email;
            const filter = {user: email};
            const options = {upsert: true};
            const updateDoc = {
                $set: {
                    user: email
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);

            const accessToken = jwt.sign({user: email}, process.env.SECRET_ACCESS_TOKEN, {expiresIn: '1day'});
            result.accessToken = accessToken;

            res.send(result);
        })

        app.get('/check-mongo-connection', (req, res) => {
            res.send('MongoDB connected successfully, YAY!');
        })
    }
    finally {

    }
};
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Manufacturer Website server is successfully running...')
});

app.listen(port, () => {
    console.log(`Manufacturer website is running on port`, port);
})