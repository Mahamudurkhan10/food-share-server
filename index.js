const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;
//  middle ware 
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@atlascluster.6gwdl3v.mongodb.net/?retryWrites=true&w=majority&appName=AtlasCluster`;

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
          //     await client.connect();
          const foodCollection = client.db('FoodShare').collection('allfoods');
          app.get('/foods', async (req, res) => {
               const food = foodCollection.find();
               const result = await food.toArray();
               res.send(result)
          })
          app.post('/foods', async (req, res) => {
               const newFood = req.body;
               const result = await foodCollection.insertOne(newFood)
               res.send(result)
          })
          app.get('/food/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: new ObjectId(id) }
               const result = await foodCollection.findOne(query);
               res.send(result)
          })

          app.get('/myfood/:email', async (req, res) => {
               console.log(req.params.email);
               const result = await foodCollection.find({ email: req.params.email }).toArray();
               res.send(result) 
          })
          app.delete('/foods/:id',async(req,res)=>{
               const id = req.params.id;
               const query = {_id : new ObjectId(id)}
               const result = await foodCollection.deleteOne(query)
               res.send(result)
             })
             
             app.put('/foods/:id',async(req,res)=>{
               const id = req.params.id
               const filter = {_id: new ObjectId(id)}
               const options = {upsert: true};
               const updatedFood = req.body;
               const updated = {
                 $set: {
                   food_image: updatedFood.food_image,
                   food_name: updatedFood.food_name,
                   donator_name: updatedFood.donator_name,
                   donator_image:updatedFood.donator_image,
                   email: updatedFood.  email,
                   additional_notes: updatedFood.additional_notes,
                   expired_date: updatedFood.expired_date,
                   pickup_location: updatedFood. pickup_location,
                   food_quantity: updatedFood.food_quantity,
                   foodStatus: updatedFood.foodStatus
                 }
         
               }
               const result = await foodCollection.updateOne(filter,updated,options) 
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