const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = process.env.PORT || 3000;
const mongoURL = 'mongodb+srv://admin:admin@cluster0.arjtg6l.mongodb.net/?retryWrites=true&w=majority'; // replace with your own MongoDB URL

const router = express.Router();

// Connect to MongoDB and start the server
MongoClient.connect(mongoURL, (err, client) => {
  if (err) throw err;

  const db = client.db('mydatabase'); // replace with your own database name
  console.log(`Connected to MongoDB `);

  // Define routes and start the server
  router.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API!' });
  });

  router.route('/users')
    .get((req, res) => {
      db.collection('users').find().toArray((err, docs) => {
        if (err) throw err;
        res.json(docs);
      });
    })
    .post((req, res) => {
      db.collection('users').insertOne(req.body, (err, result) => {
        if (err) throw err;
        res.json({ message: 'User created!', user: result.ops[0] });
      });
    });

  router.route('/users/:id')
    .get((req, res) => {
      const id = req.params.id;
      db.collection('users').findOne({ _id: new ObjectId(id) }, (err, doc) => {
        if (err) throw err;
        res.json(doc);
      });
    })
    .put((req, res) => {
      const id = req.params.id;
      db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: req.body }, (err, result) => {
        if (err) throw err;
        res.json({ message: `User with ID ${id} updated!` });
      });
    })
    .delete((req, res) => {
      const id = req.params.id;
      db.collection('users').deleteOne({ _id: new ObjectId(id) }, (err, result) => {
        if (err) throw err;
        res.json({ message: `User with ID ${id} deleted!` });
      });
    });

  app.use('/api', router);

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
