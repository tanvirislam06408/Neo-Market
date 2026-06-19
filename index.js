const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
require('dotenv').config()


const app = express();

const port = process.env.PORT || 5000

// middleware
app.use(express.json());
app.use(cors());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PSS}@cluster0.mndvni1.mongodb.net/?appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});





const JWKS = createRemoteJWKSet(new URL(`${process.env.NEXT_CLIENT_SITE}/api/auth/jwks`))

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    res.status(401).send({ message: 'unauthorize' })
  }
  const token = authHeader.split(" ")[1]
  if (!token) {
    res.status(401).send({ message: 'unauthorize' })
  }

 try{
  const {payload}=await jwtVerify(token,JWKS);
  console.log(payload);
  next()
  
 }
 catch(err){
  console.log(err);
   res.status(401).send({ message: 'unauthorize' })
 }



}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("monkey")
    const productsCollection = database.collection("products");
    const ordersCollection = database.collection("orders");
    const wishListCollection = database.collection("wish-list");



    app.get('/api/products', async (req, res) => {

      const query = {

      }
      if (req.query.category) {
        query.category = req.query.category
      }

      const { page = 1, limit = 8 } = req.query;
      const skip = (Number(page) - 1) * Number(limit)
      const result = await productsCollection.find(query).skip(skip).limit(Number(limit)).toArray()
      const totalData = await productsCollection.countDocuments();
      const totalPage = Math.ceil(totalData / Number(limit))

      res.send({ products: result, page: Number(page), totalPage });
    })

    // get single product by id

    app.get('/api/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      }
      const result = await productsCollection.findOne(query);
      res.send(result)

    })

    // buying infos and metadata
    app.post('/api/order', async (req, res) => {
      const data = req.body;
      const existQuery = {
        transactionId: data.transactionId
      }

      const isExist = await ordersCollection.findOne(existQuery);

      if (isExist) {
        return res.json({ meg: 'order is already in pending' });
      }

      const updatedData = {
        ...data,
        createdAt: new Date()
      }
      const result = await ordersCollection.insertOne(updatedData)
      res.send(result)
    })


    // post data in wishlist
    app.post('/api/wish-list', async (req, res) => {
      const data = req.body;
      const id = data._id

      const existQuery = {
        _id: id
      }

      const isExist = await wishListCollection.findOne(existQuery);


      if (isExist) {
        return res.json({ meg: 'Product is already in WishList' });
      }
      const result = await wishListCollection.insertOne(data);
      res.send(result);
    })


    // get wish-list data
    app.get('/api/wish-list', async (req, res) => {
      const query = {

      }
      if (req.query) {
        query.userId = req.query.userId
      }
      const result = await wishListCollection.find(query).toArray();
      res.send(result);

    })

    // get featured products
    app.get('/api/featuredProduct', async (req, res) => {
      const result = await productsCollection.find().limit(4).toArray()
      res.send(result);
    })



    // get orders data

    app.get('/api/orders', verifyToken, async (req, res) => {
      const query = {

      }

      const userId = req?.query?.userId
      if (req.query.userId) {
        query['buyerInfo.user'] = userId
      }
      const result = await ordersCollection.find(query).toArray()
      res.send(result);
    })

    app.delete('/api/orders', async (req, res) => {
      const query = {

      }

      const productId = req?.query?.productId

      if (req.query.productId) {
        query._id = new ObjectId(productId)
      }
      console.log('quear', query);

      const result = await ordersCollection.deleteOne(query);
      res.send(result)

    })





    // delete wishlist items

    app.delete('/api/wish-list', async (req, res) => {
      const id = req.query?._id
      const query = {
        _id: id
      }

      const result = await wishListCollection.deleteOne(query);
      res.send(result);
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
  res.send('server is getting colder')
})


app.listen(port, () => {
  console.log(`server is running on ${port}`);

})