const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("monkey")
    const productsCollection = database.collection("products");
    const ordersCollection = database.collection("orders");

    app.get('/api/products', async (req, res) => {
      const result = await productsCollection.find().toArray()
      res.send(result);
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
        transactionId : data.transactionId
      }
      
      const isExist = await ordersCollection.findOne(existQuery);

      if (isExist) {
        return res.json({ meg: 'order is already in pending' });
      }
      console.log(data);
      const result = await ordersCollection.insertOne(data)
      res.send(result)
    })

    // get featured products
    app.get('/api/featuredProduct',async(req,res)=>{
      const result=await productsCollection.find().limit(4).toArray()
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