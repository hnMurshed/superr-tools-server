const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const app = express();

const port = process.env.PORT || 5000;

// use middleware

// app.use(cors({origin: 'https://superr-tools.web.app'}));
// app.use(cors());
app.use(
    cors({
      origin: true,
      optionsSuccessStatus: 200,
      credentials: true,
    })
  );
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gfl5mwm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
    try {
        await client.connect();
        const productCollection = client.db('SuperrTools').collection('products');
        const userCollection = client.db('SuperrTools').collection('users');
        const orderCollection = client.db('SuperrTools').collection('orders');
        const userProfileCollection = client.db('SuperrTools').collection('userProfiles');
        const reviewCollection = client.db('SuperrTools').collection('reviews');

        // verify access token
        const verifyToken = (req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).send({ message: 'Unauthorized' });
              };
        
            const acceesToken = authHeader.split(' ')[1];
            jwt.verify(acceesToken, process.env.SECRET_ACCESS_TOKEN, function (err, decoded) {
            if (err) {
                return res.status(403).send({ message: 'Fobidden access' });
            };
            req.decoded = decoded;
    
            next();
            });
        };

        // check the requester if admin or not
        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.user;
            const requesterAcount = await userCollection.findOne({ user: requester });
      
            if (requesterAcount.role === 'admin') {
              next();
            }
            else {
              res.status(403).send({ message: 'Fobidden' });
            }
          };

        app.get('/tools', async (req, res) => {
            const pageNo = parseInt(req.query.page);
            const productsQuantityToShow = parseInt(req.query.quantity);
            const tools = await productCollection.find().skip(pageNo*productCollection).limit(productsQuantityToShow).toArray();

            res.send(tools);
        });

        app.post('/addproduct', verifyToken, verifyAdmin, async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        });

        app.delete('/deleteproduct/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const result = await productCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/tool/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const tool = await productCollection.findOne(query);
            res.send(tool);
        });

        // updating item stock
        app.put('/tool/:id', async (req, res) => {
            const id = req.params.id;
            const updatedStock = req.query.updatedStock;
            console.log(id, updatedStock);
            const filter = {_id: ObjectId(id)};
            const updateDoc = {
                $set: {
                    stock: updatedStock
                }
            }
            const result = await productCollection.updateOne(filter, updateDoc);

            res.send(result);
        })

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
        });

        // update user role
        app.put('/update-user-role', verifyToken, verifyAdmin, async (req, res) => {
            const user = req.body.user;
            const isAdmin = req.body.isAdmin;
            
            const filter = {user: user};
            const options = {upsert: true};
            const updateDoc = {
                $set: {
                    role: isAdmin ? 'admin' : 'user'
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);

            res.send(result);
        })

        // get all user
        app.get('/users', async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        })

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        // get order based on user
        app.get('/orders', verifyToken, async (req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        });
        // get all orders
        app.get('/allorders', verifyToken, verifyAdmin, async (req, res) => {
            const orders = await orderCollection.find().toArray();
            res.send(orders);
        });

        // cancel order
        app.delete('/cancelorder/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const result = await orderCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/checkadmin', async (req, res) => {
            const email = req.headers.email;
            const user = await userCollection.findOne({ user: email });
            const isAdmin = user?.role === 'admin';
            res.send({ admin: isAdmin });
          });

        app.put('/user-profile', verifyToken, async (req, res) => {
            const user = req.decoded.user;
            const profile = req.body;
            console.log(user);
            console.log('profile', profile);
            const filter = {user: user};
            const options = {upsert: true};
            const updateDoc = {
                $set: {
                    user: user,
                    profile: profile
                }
            }
            const result = await userProfileCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        // get user profile
        app.get('/user-profile', verifyToken, async (req, res) => {
            const user = req.decoded.user;
            console.log('from inside get user profile', user);
            const query = {user: user};
            const profile = await userProfileCollection.findOne(query);

            res.send(profile);
        });

        // posting a review
        app.post('/postreview', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        // getting all reviews
        app.get('/getreviews', async (req, res) => {
            const reviews = await reviewCollection.find().toArray();
            res.send(reviews);
        })


        // checking connection
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