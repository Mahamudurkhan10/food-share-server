const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config()
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
//  middle ware 
app.use(cors({
     origin: ['http://localhost:5173'],
     credentials: true
}));
app.use(express.json())
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@atlascluster.6gwdl3v.mongodb.net/?retryWrites=true&w=majority&appName=AtlasCluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
     serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
     }
});
const logger = async (req, res, next) => {
     console.log('called', req.host, req.originalUrl);
     next()
}
const verifyToken = async (req, res, next) => {
     const token = req.cookies?.token;
     console.log('value of token middleware ', token);
     if (!token) {
          return res.status(403).send({ message: 'forbidden' })
     }
     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
          if (err) {
               console.log(err);
               return res.status(401).send({ message: 'un authorized' })

          }
          console.log('value in the token', decoded);
          req.user = decoded;
          next()
     })

}

async function run() {
     try {
          // Connect the client to the server	(optional starting in v4.7)
          //     await client.connect();
          const foodCollection = client.db('FoodShare').collection('allfoods');
          const newFoodCollection = client.db('FoodShare').collection('newFoods');
          app.get('/foods', async (req, res) => {
               const food = foodCollection.find();
               const result = await food.toArray();
               res.send(result)
          })
          // app.get('/foods', logger,verifyToken, async(req,res)=>{
          //      console.log(req.query.email)

          //      console.log('tok tok token',req.cookies.token);
          //      console.log('user in the valid token', req.user);
          //      // if(req.query.email !== req.user){
          //      //      return res.status(403).send({message:'forbidden access'})
          //      // }
          //      let query = {};               
          //      if(req.query?.email){
          //           query = {email: req.query.email}
          //      }
          //      const result = await foodCollection.find(query).toArray()
          //      res.send(result)
          // })
          app.post('/foods', async (req, res) => {
               const newFood = req.body;
               const result = await foodCollection.insertOne(newFood)
               res.send(result)
          })
          // jwt section
          app.post('/jwt', logger, async (req, res) => {
               const user = req.body;

               const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
               console.log('user for token', user);
               res
                    .cookie('token', token, {
                         httpOnly: true,
                         secure: false,

                    })
                    .send({ success: true })
          })
          app.get('/userOut', async (req, res) => {
               const user = req.body;

               console.log('login out ', user);

               res.clearCookie('token', { maxAge: 0 }).send({ success: true })
          })

          app.post('/newFoods', async (req, res) => {
               const newFood = req.body;
               const result = await newFoodCollection.insertOne(newFood)
               res.send(result)
          })
          app.get('/newFoods', async (req, res) => {
               const food = newFoodCollection.find();
               const result = await food.toArray();
               res.send(result)
          })
          app.get('/myFoods/:email',verifyToken, async (req, res) => {
               console.log(req.params.email);
               console.log('tok tok token', req.cookies.token);
               console.log('user in the valid token', req.user);
               if(req.params.email !== req.user?.email){
                   return res.status(403).send({message:'forbidden access'})
               }  
               const result = await newFoodCollection.find({ email: req.params.email }).toArray();
               res.send(result)
          })
          app.get('/food/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: new ObjectId(id) }
               const result = await foodCollection.findOne(query);
               res.send(result)
          })

          app.get('/myfood/:email', verifyToken, async (req, res) => {
               console.log(req.params.email);
               console.log('tok tok token', req.cookies.token);
               console.log('user in the valid token', req.user);
                if(req.params.email !== req.user?.email){
                    return res.status(403).send({message:'forbidden access'})
                }  
               const result = await foodCollection.find({ email: req.params.email }).toArray();
               res.send(result)
          })
          app.delete('/foods/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: new ObjectId(id) }
               const result = await foodCollection.deleteOne(query)
               res.send(result)
          })
          app.get('/foods/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: new ObjectId(id) }
               const result = await foodCollection.findOne(query);
               res.send(result)
          })

          app.put('/foods/:id', async (req, res) => {
               const id = req.params.id
               const filter = { _id: new ObjectId(id) }
               const options = { upsert: true };
               const updatedFood = req.body;
               const updated = {
                    $set: {
                         food_image: updatedFood.food_image,
                         food_name: updatedFood.food_name,
                         donator_name: updatedFood.donator_name,
                         donator_image: updatedFood.donator_image,
                         email: updatedFood.email,
                         additional_notes: updatedFood.additional_notes,
                         expired_date: updatedFood.expired_date,
                         pickup_location: updatedFood.pickup_location,
                         food_quantity: updatedFood.food_quantity,
                         foodStatus: updatedFood.foodStatus
                    }

               }
               const result = await foodCollection.updateOne(filter, updated, options)
               res.send(result)
          })

          // Send a ping to confirm a successful connection
          await client.db("admin").command({ ping: 1 });
          console.log("Pinged your deployment. You successfully connected to MongoDB!");
     } finally {
          // Ensures that the client will close when you finish/error
          //     await client.close();
     }
}
run().catch(console.dir);


app.get('/', (req, res) => {
     res.send('Food server in running')
})
app.listen(port, () => {
     console.log(`food server running on port : ${port}`);
})