const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

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